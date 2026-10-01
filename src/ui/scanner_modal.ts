// ====================================================
// MODAL DE ESCANEO DE CÁMARA PROFESIONAL (PLACA Y DNI)
// En escritorio YOLO11 ubica la placa; en móvil, OCR procesa la guía para
// evitar cargar un modelo de 38 MB y degradar la cámara del teléfono.
// El backend queda de respaldo y el lector PDF417 atiende DNI.
// ====================================================
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

let plateOcrModulePromise: Promise<typeof import('./plate_ocr')> | null = null;
function loadPlateOcr() {
    plateOcrModulePromise ??= import('./plate_ocr');
    return plateOcrModulePromise;
}

let plateDetectorModulePromise: Promise<typeof import('./plate_detector')> | null = null;
function loadPlateDetector() {
    plateDetectorModulePromise ??= import('./plate_detector');
    return plateDetectorModulePromise;
}

export interface ScannerOptions {
    mode: 'placa' | 'dni';
    onSuccess: (code: string) => void;
    onError?: (err: string) => void;
}

let activeStream: MediaStream | null = null;
let activeHtml5QrCode: Html5Qrcode | null = null;
let activeCallback: ((val: string) => void) | null = null;
let availableVideoDevices: MediaDeviceInfo[] = [];
let scanTimer: any = null;
let torchOn = false;
let plateAccepted = false;

// Igual que móvil: confirma con dos lecturas cercanas y procesa localmente.
const VOTE_RING_SIZE = 3;
const VOTES_NEEDED = 2;
const PLATE_OCR_HIGH_CONFIDENCE = 82;
const PLATE_SCAN_INTERVAL_MS = 300;
// En frío el log de producción midió ~38s para modelo + runtime WASM/WebGPU.
// El respaldo único del servidor comienza antes, mientras el motor local calienta.
const PLATE_SCAN_MAX_DURATION_MS = 60000;
const PLATE_SCAN_BACKEND_WARMUP_MS = 4500;
const PLATE_SCAN_MAX_EDGE = 960;
const MOBILE_OCR_FRAME_GAP_MS = 650;
let voteRing: string[] = [];
let isProcessingFrame = false;
// Invalidates callbacks from an earlier open/close cycle so stale frames cannot
// draw into a new scan or schedule another loop after the camera was reopened.
let scannerRunId = 0;
let scannerDebugStartedAt = 0;
let scannerDebugEvents: string[] = [];

function resetScannerDebug() {
    scannerDebugStartedAt = performance.now();
    scannerDebugEvents = [];
    const output = document.getElementById('scanner-debug-output');
    if (output) output.textContent = '';
    const count = document.getElementById('scanner-debug-count');
    if (count) count.textContent = '0';
}

function scannerDebug(stage: string, detail: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
    const elapsed = Math.max(0, performance.now() - scannerDebugStartedAt);
    const line = `+${(elapsed / 1000).toFixed(2)}s [${level}] ${stage}: ${detail}`;
    scannerDebugEvents.push(line);
    if (scannerDebugEvents.length > 240) scannerDebugEvents.shift();
    const output = document.getElementById('scanner-debug-output');
    if (output) {
        output.textContent = scannerDebugEvents.slice(-90).join('\n');
        output.scrollTop = output.scrollHeight;
    }
    const count = document.getElementById('scanner-debug-count');
    if (count) count.textContent = String(scannerDebugEvents.length);
}

async function copyScannerDebug() {
    const button = document.getElementById('scanner-debug-copy');
    try {
        await navigator.clipboard.writeText(scannerDebugEvents.join('\n'));
        if (button) button.textContent = 'Copiado';
        scannerDebug('diagnóstico', 'Registro copiado al portapapeles.');
    } catch (error) {
        if (button) button.textContent = 'No se pudo copiar';
        scannerDebug('portapapeles', error instanceof Error ? error.message : 'Permiso de copia denegado.', 'WARN');
    }
    setTimeout(() => { if (button) button.textContent = 'Copiar'; }, 1800);
}

function canvasJpeg(canvas: HTMLCanvasElement, maxEdge = PLATE_SCAN_MAX_EDGE): string {
    const scale = Math.min(1, maxEdge / Math.max(canvas.width, canvas.height));
    if (scale < 1) {
        const resized = document.createElement('canvas');
        resized.width = Math.max(1, Math.round(canvas.width * scale));
        resized.height = Math.max(1, Math.round(canvas.height * scale));
        resized.getContext('2d')?.drawImage(canvas, 0, 0, resized.width, resized.height);
        return resized.toDataURL('image/jpeg', 0.68);
    }
    return canvas.toDataURL('image/jpeg', 0.68);
}

/** Convierte el marco visible a coordenadas del video fuente (incluye object-fit: cover). */
function getGuideCrop(video: HTMLVideoElement, guide: HTMLElement): { x: number; y: number; width: number; height: number } | null {
    const videoRect = video.getBoundingClientRect();
    const guideRect = guide.getBoundingClientRect();
    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;
    if (!sourceWidth || !sourceHeight || !videoRect.width || !videoRect.height) return null;

    const scale = Math.max(videoRect.width / sourceWidth, videoRect.height / sourceHeight);
    const renderedWidth = sourceWidth * scale;
    const renderedHeight = sourceHeight * scale;
    const offsetX = (videoRect.width - renderedWidth) / 2;
    const offsetY = (videoRect.height - renderedHeight) / 2;
    const left = (guideRect.left - videoRect.left - offsetX) / scale;
    const top = (guideRect.top - videoRect.top - offsetY) / scale;
    const width = guideRect.width / scale;
    const height = guideRect.height / scale;

    // Margen para movimiento de manos y pequeñas diferencias de alineación.
    const padX = width * 0.28;
    const padY = height * 0.42;
    const x = Math.max(0, Math.floor(left - padX));
    const y = Math.max(0, Math.floor(top - padY));
    const right = Math.min(sourceWidth, Math.ceil(left + width + padX));
    const bottom = Math.min(sourceHeight, Math.ceil(top + height + padY));
    if (right - x < 80 || bottom - y < 40) return null;
    return { x, y, width: right - x, height: bottom - y };
}

async function imageFileToJpeg(file: File): Promise<string> {
    const bitmap = await createImageBitmap(file);
    try {
        const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.68);
    } finally {
        bitmap.close();
    }
}

function backendUrl(): string {
    const configured = (import.meta as unknown as { env?: Record<string, string> }).env?.PUBLIC_BACKEND_URL;
    if (configured) return configured.replace(/\/$/, '');
    if (typeof location !== 'undefined' && /localhost|127\.0\.0\.1/.test(location.hostname)) {
        return 'http://localhost:8000/api/v1';
    }
    return 'https://backend-consultarvehiculos-production.up.railway.app/api/v1';
}

export async function openScannerModal(options: ScannerOptions) {
    const focusedInput = document.activeElement;
    if (focusedInput instanceof HTMLInputElement) focusedInput.blur();
    activeCallback = options.onSuccess;
    voteRing = [];
    plateAccepted = false;
    isProcessingFrame = false;
    torchOn = false;

    let modal = document.getElementById('camera-scanner-modal');
    if (!modal) {
        modal = createScannerModalElement();
        document.body.appendChild(modal);
    }
    resetScannerDebug();
    document.getElementById('scanner-debug-panel')?.classList.toggle('hidden', options.mode !== 'placa');
    if (options.mode === 'placa') scannerDebug('inicio', 'Diagnóstico en vivo activado para el escaneo web.');

    const titleEl = document.getElementById('scanner-modal-title');
    const descEl = document.getElementById('scanner-modal-desc');
    const guideFrame = document.getElementById('scanner-guide-frame');
    const statusEl = document.getElementById('scanner-status-text');
    const candidateBadge = document.getElementById('scanner-candidate-badge');

    if (candidateBadge) {
        candidateBadge.classList.add('hidden');
        candidateBadge.textContent = '';
    }
    document.getElementById('scanner-detection-box')?.classList.add('hidden');

    if (options.mode === 'placa') {
        if (titleEl) titleEl.textContent = 'Escanear Placa Vehicular';
        if (descEl) descEl.textContent = 'Ubica la placa dentro del marco (detección automática)';
        if (guideFrame) {
            guideFrame.className = 'w-[84%] max-w-[340px] h-[clamp(96px,20vh,140px)] relative transition-all duration-300';
        }
        if (statusEl) statusEl.textContent = 'Enfoca la placa; la detectaremos automáticamente...';
    } else {
        if (titleEl) titleEl.textContent = 'Escanear DNI (Código de Barras)';
        if (descEl) descEl.textContent = 'Apunta al código de barras PDF417 al reverso del DNI';
        if (guideFrame) {
            guideFrame.className = 'w-[86%] max-w-[360px] h-[clamp(110px,22vh,160px)] relative transition-all duration-300';
        }
        if (statusEl) statusEl.textContent = 'Alinea el código de barras PDF417 para lectura instantánea...';
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';

    await startUniversalCamera(options);
}

async function startUniversalCamera(options: ScannerOptions) {
    const video = document.getElementById('scanner-video-preview') as HTMLVideoElement;
    const statusEl = document.getElementById('scanner-status-text');
    const switchCamBtn = document.getElementById('scanner-switch-cam-btn');
    const torchBtn = document.getElementById('scanner-torch-btn');

    stopAllCameraResources();

    // Descargar e inicializar el modelo mientras se solicita permiso y arranca
    // la cámara, para que ese trabajo no empiece después del primer frame.
    if (options.mode === 'placa' && !isMobilePlateScanner()) {
        const warmupRunId = scannerRunId;
        void loadPlateDetector().then((module) => {
            if (warmupRunId !== scannerRunId) return;
            return module.loadPlateDetector((stage, detail, level) => scannerDebug(stage, detail, level));
        }).catch((error) => {
            if (warmupRunId === scannerRunId) {
                scannerDebug('plate_model_warmup', `${error?.name || 'Error'}: ${error?.message || 'El precalentamiento falló; se reintentará durante el escaneo.'}`, 'WARN');
            }
        });
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        scannerDebug('cámara', 'El navegador no expone mediaDevices/getUserMedia.', 'ERROR');
        if (statusEl) {
            statusEl.innerHTML = `
                <div class="text-amber-800 font-bold text-center">
                    Cámara en vivo no disponible.<br>
                    <span class="text-slate-500 font-normal text-[11px]">Usa el botón "Tomar Foto / Archivo" para abrir la cámara de tu celular.</span>
                </div>
            `;
        }
        return;
    }

    try {
        const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
        availableVideoDevices = devices.filter(d => d.kind === 'videoinput');
        switchCamBtn?.classList.add('hidden');
    } catch (error) {
        scannerDebug('cámara', `enumerateDevices: ${(error as Error)?.message || 'No se pudieron consultar los dispositivos.'}`, 'WARN');
    }

    let stream: MediaStream | null = null;
    let streamError: any = null;

    // Estrategia de cámara: preferir trasera en móviles, aceptar cualquier
    // cámara disponible en escritorio para que webcams funcionen.
    const cameraStrategies: MediaStreamConstraints[] = [
        // 1. Trasera estricta (móviles)
        { video: { facingMode: { exact: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        // 2. Trasera preferida (fallback)
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        // 3. Cualquier cámara disponible (desktop/webcam)
        { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        // 4. Último fallback conservando la preferencia por cámara trasera.
        { video: { facingMode: { ideal: 'environment' } }, audio: false },
    ];

    for (const constraints of cameraStrategies) {
        try {
            scannerDebug('cámara', `Solicitando cámara ${JSON.stringify(constraints.video)}.`);
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            // Si logramos obtener un stream, verificar si hay cámara trasera
            // identificada para preferirla sobre una frontal.
            const probeTrack = stream.getVideoTracks()[0];
            const settings = probeTrack?.getSettings?.();
            if (settings?.facingMode !== 'environment') {
                availableVideoDevices = (await navigator.mediaDevices.enumerateDevices().catch(() => []))
                    .filter(d => d.kind === 'videoinput');
                const rearCamera = availableVideoDevices.find(d =>
                    /back|rear|environment|trasera|posterior|principal/i.test(d.label)
                );
                if (rearCamera && rearCamera.deviceId !== probeTrack?.getSettings?.()?.deviceId) {
                    stream.getTracks().forEach(track => track.stop());
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({
                            video: { deviceId: { exact: rearCamera.deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } },
                            audio: false
                        });
                    } catch {
                        // Si falla con la trasera, re-obtener con la estrategia actual
                        stream = await navigator.mediaDevices.getUserMedia(constraints);
                    }
                }
            }
            scannerDebug('cámara', `Stream activo; resolución ${probeTrack?.getSettings?.().width || '¿?'}×${probeTrack?.getSettings?.().height || '¿?'}; facingMode=${probeTrack?.getSettings?.().facingMode || 'no informado'}.`);
            break; // Stream obtenido exitosamente
        } catch (err) {
            streamError = err;
            stream = null;
            scannerDebug('cámara', `${(err as Error)?.name || 'Error'}: ${(err as Error)?.message || 'No se pudo abrir con esta configuración.'}`, 'WARN');
        }
    }

    const noCamPlaceholder = document.getElementById('scanner-no-cam-placeholder');

    if (!stream) {
        console.warn('[SCANNER] No se pudo obtener stream:', streamError);
        if (noCamPlaceholder) noCamPlaceholder.classList.remove('hidden');
        if (statusEl) {
            const isDenied = streamError?.name === 'NotAllowedError' || streamError?.name === 'PermissionDeniedError';
            statusEl.innerHTML = isDenied
                ? '<span class="text-rose-600 font-bold">Permiso de cámara denegado. Habilítalo en el navegador o usa "Tomar Foto" abajo.</span>'
                : '<span class="text-amber-800 font-bold">Sin cámara en vivo. Usa el botón "Tomar Foto / Archivo" abajo.</span>';
        }
        scannerDebug('cámara', 'No se pudo iniciar ningún stream de video.', 'ERROR');
        return;
    }

    if (noCamPlaceholder) noCamPlaceholder.classList.add('hidden');

    activeStream = stream;
    if (video) {
        video.srcObject = stream;
        video.classList.remove('hidden');
        try {
            await video.play();
        } catch {}
    }

    // Verificar si el dispositivo soporta linterna (Torch)
    const track = stream.getVideoTracks()[0];
    const capabilities = (track as any).getCapabilities?.() || {};
    // En móviles activa el enfoque continuo si el navegador expone el control.
    if (Array.isArray(capabilities.focusMode) && capabilities.focusMode.includes('continuous')) {
        void track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as any] }).catch(() => {});
    }
    const torchWrap = document.getElementById('scanner-torch-wrap');
    if (capabilities.torch && torchWrap) {
        torchWrap.classList.remove('hidden');
        torchWrap.classList.add('flex');
    } else if (torchWrap) {
        torchWrap.classList.add('hidden');
        torchWrap.classList.remove('flex');
    }

    // Esperar a que el video tenga al menos un frame decodificado antes de
    // arrancar la detección; evita que los primeros intentos obtengan un
    // canvas vacío y se desperdicien.
    if (video && video.readyState < 2) {
        scannerDebug('video', `Esperando primer frame decodificado (readyState=${video.readyState}).`);
        await new Promise<void>((resolve) => {
            const onReady = () => { video.removeEventListener('loadeddata', onReady); resolve(); };
            video.addEventListener('loadeddata', onReady);
            // Seguro: si en 3s no dispara, seguimos de todas formas
            setTimeout(resolve, 3000);
        });
    }
    scannerDebug('video', `Video listo: ${video?.videoWidth || 0}×${video?.videoHeight || 0}; readyState=${video?.readyState ?? 'sin video'}.`);

    // Iniciar el motor de detección según el modo
    if (options.mode === 'placa') {
        startContinuousPlateDetection(video, options);
    } else {
        startContinuousDniBarcodeScanner(video, options);
    }
}

// ----------------------------------------------------
// MOTOR DE ESCANEO CONTINUO DE PLACAS
// ----------------------------------------------------
function startContinuousPlateDetection(video: HTMLVideoElement, options: ScannerOptions) {
    const statusEl = document.getElementById('scanner-status-text');
    const candidateBadge = document.getElementById('scanner-candidate-badge');
    const guideFrame = document.getElementById('scanner-guide-frame');

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const detectorCanvas = document.createElement('canvas');
    const detectorCtx = detectorCanvas.getContext('2d', { willReadFrequently: true });
    const ocrCanvas = document.createElement('canvas');
    const ocrCtx = ocrCanvas.getContext('2d', { willReadFrequently: true });
    const scanStartedAt = performance.now();
    const runId = scannerRunId;
    const mobileOcrMode = isMobilePlateScanner();
    const frameGapMs = mobileOcrMode ? MOBILE_OCR_FRAME_GAP_MS : PLATE_SCAN_INTERVAL_MS;
    let lastDetectionAt = 0;
    let invalidPlateOcrFrames = 0;
    let attempts = 0;
    let localWorker: { recognize(image: HTMLCanvasElement): Promise<{ data: { text: string; confidence?: number; lines?: Array<{ text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }> } }> } | null = null;
    let localWorkerError = false;
    let detectorModule: typeof import('./plate_detector') | null = null;
    let detectorReady = false;
    let detectorError = false;
    let fallbackRequested = false;
    let latestFullFrame = '';
    if (mobileOcrMode) {
        detectorReady = true;
        scannerDebug('estrategia', 'Navegador móvil: OCR local sobre la guía; se omite YOLO/WebGPU de 38 MB.');
        if (statusEl) statusEl.textContent = 'Preparando lectura local de placa…';
    } else {
        scannerDebug('plate_model', 'Cargando detector de placas local para navegador.');
        void loadPlateDetector().then(async (module) => {
            if (runId !== scannerRunId) return;
            detectorModule = module;
            await module.loadPlateDetector((stage, detail, level) => scannerDebug(stage, detail, level));
            if (runId !== scannerRunId) return;
            detectorReady = true;
            if (statusEl) statusEl.textContent = 'Buscando placa con el modelo local…';
        }).catch((error) => {
            if (runId !== scannerRunId) return;
            detectorError = true;
            scannerDebug('plate_model', `${error?.name || 'Error'}: ${error?.message || 'No se pudo cargar el modelo local.'}`, 'ERROR');
            if (statusEl) statusEl.textContent = 'No se pudo iniciar el detector local. Revisa el diagnóstico.';
            console.warn('[SCANNER] local plate detector unavailable:', error);
        });
    }

    scannerDebug('ocr_local', mobileOcrMode ? 'OCR local procesará la guía central; no se carga un detector remoto/local pesado.' : 'OCR listo en espera; solo procesará una región cuando el modelo encuentre la placa.');
    void loadPlateOcr().then(async ({ getPlateOcrWorker, setPlateOcrDiagnosticHandler }) => {
        scannerDebug('ocr_local', 'Módulo de OCR descargado/importado.');
        setPlateOcrDiagnosticHandler((event) => {
            const pct = event.progress != null && Number.isFinite(event.progress) ? ` (${Math.round(event.progress * 100)}%)` : '';
            scannerDebug('tesseract', `${event.status}${pct}`);
            if (statusEl && /loading|initializ/i.test(event.status)) {
                statusEl.textContent = `Preparando lectura local: ${event.status}${pct}…`;
            }
        });
        scannerDebug('ocr_local', 'Inicializando worker de idioma inglés para caracteres de placa.');
        const worker = await getPlateOcrWorker();
        if (mobileOcrMode) {
            const { setPlateOcrMode } = await loadPlateOcr();
            await setPlateOcrMode('guide-text');
        }
        return worker;
    }).then(async (worker) => {
        if (runId !== scannerRunId) return;
        localWorker = worker;
        scannerDebug('ocr_local', 'Worker Tesseract listo para reconocer frames.');
        if (statusEl) statusEl.textContent = 'Leyendo placa automáticamente…';
    }).catch((error) => {
        if (runId !== scannerRunId) return;
        localWorkerError = true;
        scannerDebug('ocr_local', `${error?.name || 'Error'}: ${error?.message || 'No se pudo inicializar Tesseract; se intentará backend.'}`, 'ERROR');
        console.warn('[SCANNER] local OCR unavailable; using backend fallback:', error);
    });

    const requestBackendFallback = (image: string) => {
        if (runId !== scannerRunId || fallbackRequested) return;
        if (!image) {
            scannerDebug('backend_fallback', 'No se envía petición: aún no hay un frame completo capturado.', 'WARN');
            return;
        }
        fallbackRequested = true;
        const backend = `${backendUrl()}/plate/scan`;
        const backendStartedAt = performance.now();
        scannerDebug('backend_fallback', `POST ${backend}; imagen JPEG ${Math.round(image.length * 0.75 / 1024)} KB; timeout=8000ms; region_only=false.`);
        if (statusEl) statusEl.textContent = 'Afinando lectura de placa…';
        void fetch(backend, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_base64: image, region_only: false, debug_trace: true }),
            signal: AbortSignal.timeout(8000),
        }).then(async (res) => {
            const responseMs = Math.round(performance.now() - backendStartedAt);
            const data = await res.json().catch(() => ({}));
            scannerDebug('backend_http', `HTTP ${res.status}; X-Provider-Status=${res.headers.get('X-Provider-Status') || 'sin cabecera'}; ${responseMs}ms; success=${Boolean(data?.success)}${data?.reason ? `; reason=${data.reason}` : ''}${data?.detail ? `; detail=${data.detail}` : ''}`, res.ok ? 'INFO' : 'ERROR');
            for (const item of (Array.isArray(data?.backend_trace) ? data.backend_trace : [])) {
                scannerDebug(`backend.${item.stage || 'stage'}`, `${item.duration_ms ?? '?'}ms${item.elapsed_ms != null ? `; acumulado=${item.elapsed_ms}ms` : ''}; ${item.detail || ''}`);
            }
            if (!res.ok) {
                if (statusEl) statusEl.textContent = `El respaldo del servidor respondió HTTP ${res.status}. Revisa el diagnóstico.`;
                return;
            }
            const { extractPeruvianPlate } = await loadPlateOcr();
            const plate = data?.success ? extractPeruvianPlate(data.plate || '') : null;
            scannerDebug('backend_result', `Placa válida=${Boolean(plate)}; confianza=${data?.confidence ?? 'n/d'}; procesamiento backend=${data?.elapsed_ms ?? 'n/d'}ms; total backend=${data?.backend_total_ms ?? 'n/d'}ms.`);
            if (plate && scanTimer != null) registerPlateVote(plate, options, candidateBadge, guideFrame, statusEl, true);
            else if (statusEl) statusEl.textContent = 'El backend no encontró una placa válida en este frame. Revisa el diagnóstico.';
        }).catch((error) => {
            const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
            scannerDebug('backend_network', `${timedOut ? 'Timeout' : error?.name || 'Error'}: ${error?.message || 'No hubo respuesta del backend.'}; ${(performance.now() - backendStartedAt).toFixed(0)}ms.`, 'ERROR');
            if (statusEl) statusEl.textContent = timedOut ? 'El respaldo del servidor superó 8 segundos. Revisa el diagnóstico.' : 'No hubo conexión con el respaldo del servidor. Revisa el diagnóstico.';
            console.warn('[SCANNER] backend fallback failed:', error);
        });
    };

    // La primera carga del modelo web puede tardar decenas de segundos en móvil.
    // Tras 4.5s hacemos una sola lectura remota del último frame completo; el
    // detector local sigue calentándose en paralelo y no se envían frames repetidos.
    const backendWarmupTimer = mobileOcrMode ? 0 : window.setTimeout(() => {
        if (runId === scannerRunId && !plateAccepted && !detectorReady && !detectorError && latestFullFrame) {
            scannerDebug('respaldo', `Detector local sigue inicializando tras ${PLATE_SCAN_BACKEND_WARMUP_MS}ms; se envía un único frame al backend mientras continúa la carga local.`, 'WARN');
            requestBackendFallback(latestFullFrame);
        }
    }, PLATE_SCAN_BACKEND_WARMUP_MS);

    async function scanFrame() {
        if (runId !== scannerRunId) return;
        if (plateAccepted) {
            scanTimer = null;
            return;
        }
        if (!video || video.readyState < 2 || isProcessingFrame) {
            // No está listo; reintentar en el siguiente tick sin gastar un intento
            if (attempts === 0 && video?.readyState != null) scannerDebug('video_frame', `Esperando frame utilizable; readyState=${video.readyState}.`);
            if (scanTimer != null) scanTimer = setTimeout(scanFrame, frameGapMs);
            return;
        }
        const elapsed = performance.now() - scanStartedAt;
        if (elapsed >= PLATE_SCAN_MAX_DURATION_MS) {
            scanTimer = null;
            window.clearTimeout(backendWarmupTimer);
            if (statusEl) statusEl.textContent = 'No logramos leerla. Acerca la placa al marco, mejora la luz o usa "Tomar Foto / Archivo".';
            scannerDebug('resultado', `Tiempo máximo ${PLATE_SCAN_MAX_DURATION_MS}ms agotado; frames procesados=${attempts}; detecciones delegadas al servidor=${fallbackRequested}.`, 'ERROR');
            void detectorModule?.disposePlateDetector();
            return;
        }
        isProcessingFrame = true;
        attempts++;
        if (statusEl && !detectorReady && !detectorError) statusEl.textContent = 'Preparando detector local de placa…';

        try {
            // El modelo busca en la región de la guía ampliada para tolerar
            // movimiento; el OCR no se ejecuta hasta tener una caja de placa.
            let crop = guideFrame ? getGuideCrop(video, guideFrame) : null;

            // Fallback: si el guide frame no está listo (layout aún no resuelto),
            // enviar la región central del video para no desperdiciar el intento.
            if (!crop) {
                const vw = video.videoWidth || 640;
                const vh = video.videoHeight || 480;
                const cw = Math.round(vw * 0.82);
                const ch = Math.round(vh * 0.45);
                crop = { x: Math.round((vw - cw) / 2), y: Math.round((vh - ch) / 2), width: cw, height: ch };
            }

            const useFullFrame = !mobileOcrMode && attempts % 3 === 0;
            const sourceWidth = video.videoWidth || 640;
            const sourceHeight = video.videoHeight || 480;
            const capture = useFullFrame
                ? { x: 0, y: 0, width: sourceWidth, height: sourceHeight }
                : crop;
            if (attempts === 1 || attempts % 10 === 0) {
                scannerDebug('frame', `#${attempts}; fuente=${sourceWidth}×${sourceHeight}; búsqueda=${mobileOcrMode ? 'OCR local en guía' : 'modelo local en guía'}; zona=${crop.x},${crop.y},${crop.width}×${crop.height}; detector_listo=${detectorReady}; OCR_listo=${Boolean(localWorker)}.`);
            }
            canvas.width = capture.width;
            canvas.height = capture.height;
            if (ctx && !mobileOcrMode) {
                ctx.drawImage(video, capture.x, capture.y, capture.width, capture.height, 0, 0, capture.width, capture.height);
                if (useFullFrame) {
                    latestFullFrame = canvasJpeg(canvas);
                    if (attempts === 3) scannerDebug('frame', `Primer frame completo listo para respaldo; JPEG ${Math.round(latestFullFrame.length * 0.75 / 1024)} KB.`);
                }
            }
            if (mobileOcrMode && detectorReady && localWorker && detectorCtx) {
                detectorCanvas.width = crop.width;
                detectorCanvas.height = crop.height;
                detectorCtx.drawImage(video, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
                const recognizeStartedAt = performance.now();
                const { extractPeruvianPlateFromLines } = await loadPlateOcr();
                const result = await localWorker.recognize(detectorCanvas);
                if (runId !== scannerRunId) return;
                const candidate = extractPeruvianPlateFromLines(result.data.lines, crop.width, crop.height);
                const detected = candidate?.plate || null;
                scannerDebug('ocr_guia', `#${attempts}; área=${crop.width}×${crop.height}; OCR=${(performance.now() - recognizeStartedAt).toFixed(0)}ms; líneas=${result.data.lines?.length ?? 0}; candidato=${detected ? `${detected} (${candidate?.confidence.toFixed(0)}%)` : 'ninguno'}.`);
                if (detected) {
                    const bounds = candidate!.bbox;
                    paintPlateDetection(video, crop.x + bounds.x0, crop.y + bounds.y0, bounds.x1 - bounds.x0, bounds.y1 - bounds.y0, Math.max(0, Math.min(1, candidate!.confidence / 100)));
                    if (candidate!.confidence < 18) {
                        scannerDebug('ocr_candidato_bajo', `OCR reconoció ${detected}, pero la confianza ${candidate!.confidence.toFixed(0)}% es baja; se exige otra lectura coincidente.` , 'WARN');
                    }
                    if (statusEl) statusEl.textContent = 'Texto de placa localizado. Confirmando lectura…';
                    registerPlateVote(detected, options, candidateBadge, guideFrame, statusEl, false, false);
                }
            } else if (ctx && !mobileOcrMode) {
                if (detectorReady && detectorModule && detectorCtx) {
                    detectorCanvas.width = crop.width;
                    detectorCanvas.height = crop.height;
                    detectorCtx.drawImage(video, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
                    const detectionStartedAt = performance.now();
                    let box: Awaited<ReturnType<typeof detectorModule.detectPlate>>;
                    try {
                        box = await detectorModule.detectPlate(detectorCanvas);
                    } catch (error) {
                        if (runId !== scannerRunId) return;
                        detectorReady = false;
                        detectorError = true;
                        scannerDebug('plate_inference_error', `${(error as Error)?.name || 'Error'}: ${(error as Error)?.message || 'Falló la inferencia local.'}`, 'ERROR');
                        throw error;
                    }
                    if (runId !== scannerRunId) return;
                    const detectorMs = performance.now() - detectionStartedAt;
                    if (!box) {
                        scannerDebug('plate_detect', `#${attempts}; sin placa en la guía; modelo=${detectorMs.toFixed(0)}ms.`);
                        if (lastDetectionAt && performance.now() - lastDetectionAt > 1800) {
                            document.getElementById('scanner-detection-box')?.classList.add('hidden');
                        }
                    } else {
                        // YOLO puede cortar los bordes o el inicio de una fila:
                        // añadimos más margen arriba y poco margen a los lados.
                        const marginX = box.width * 0.12;
                        const marginTop = box.height * 0.22;
                        const marginBottom = box.height * 0.10;
                        const left = Math.max(0, Math.floor(crop.x + box.x - marginX));
                        const top = Math.max(0, Math.floor(crop.y + box.y - marginTop));
                        const right = Math.min(sourceWidth, Math.ceil(crop.x + box.x + box.width + marginX));
                        const bottom = Math.min(sourceHeight, Math.ceil(crop.y + box.y + box.height + marginBottom));
                        const roiWidth = Math.max(1, right - left);
                        const roiHeight = Math.max(1, bottom - top);
                        lastDetectionAt = performance.now();
                        paintPlateDetection(video, left, top, roiWidth, roiHeight, box.confidence);
                        scannerDebug('plate_detect', `#${attempts}; placa localizada; confianza=${(box.confidence * 100).toFixed(1)}%; inferencia=${detectorMs.toFixed(0)}ms; caja=${left},${top},${roiWidth}×${roiHeight}; márgenes=12% lados,22% arriba,10% abajo.`);
                        if (!localWorker) {
                            if (statusEl) statusEl.textContent = 'Placa detectada; preparando lectura de caracteres…';
                            return;
                        }
                        ocrCanvas.width = roiWidth;
                        ocrCanvas.height = roiHeight;
                        ocrCtx?.drawImage(video, left, top, roiWidth, roiHeight, 0, 0, roiWidth, roiHeight);
                        const recognizeStartedAt = performance.now();
                        let result: Awaited<ReturnType<typeof localWorker.recognize>>;
                        try {
                            result = await localWorker.recognize(ocrCanvas);
                        } catch (error) {
                            localWorkerError = true;
                            scannerDebug('ocr_inference_error', `${(error as Error)?.name || 'Error'}: ${(error as Error)?.message || 'Falló el OCR de la región detectada.'}`, 'ERROR');
                            throw error;
                        }
                        if (runId !== scannerRunId) return;
                        const { extractPeruvianPlate } = await loadPlateOcr();
                        let detected = extractPeruvianPlate(result.data.text);
                        let confidence = Number(result.data.confidence);
                        scannerDebug('ocr_frame', `#${attempts}; OCR ${((performance.now() - recognizeStartedAt)).toFixed(0)}ms; confianza=${Number.isFinite(confidence) ? confidence.toFixed(0) : 'n/d'}; solo_roi=${roiWidth}×${roiHeight}; placa válida=${Boolean(detected)}.`);
                        // Igual que el flujo móvil: si el recorte YOLO no produce
                        // una lectura válida, probar ocasionalmente el área guía
                        // completa. Sigue siendo una región acotada y exige la
                        // misma validación/votación antes de autocompletar.
                        if (!detected) {
                            invalidPlateOcrFrames++;
                            if (invalidPlateOcrFrames % 3 === 0) {
                                const fallbackStartedAt = performance.now();
                                try {
                                    const guideResult = await localWorker.recognize(detectorCanvas);
                                    detected = extractPeruvianPlate(guideResult.data.text);
                                    confidence = Number(guideResult.data.confidence);
                                    scannerDebug('ocr_guide_fallback', `#${attempts}; OCR del área guía ${((performance.now() - fallbackStartedAt)).toFixed(0)}ms; confianza=${Number.isFinite(confidence) ? confidence.toFixed(0) : 'n/d'}; placa válida=${Boolean(detected)}.`);
                                } catch (error) {
                                    localWorkerError = true;
                                    scannerDebug('ocr_guide_fallback_error', `${(error as Error)?.name || 'Error'}: ${(error as Error)?.message || 'Falló el OCR del área guía.'}`, 'ERROR');
                                }
                            }
                        } else {
                            invalidPlateOcrFrames = 0;
                        }
                        if (detected) {
                            if (statusEl) statusEl.textContent = 'Placa localizada. Validando lectura…';
                            const immediate = Number.isFinite(confidence) && confidence >= PLATE_OCR_HIGH_CONFIDENCE && box.confidence >= 0.55;
                            scannerDebug('ocr_candidate', `Formato peruano válido; confianza YOLO=${(box.confidence * 100).toFixed(1)}%; confianza OCR=${Number.isFinite(confidence) ? confidence.toFixed(0) : 'n/d'}; ${immediate ? 'autocompleta en esta lectura.' : 'requiere coincidencia en otra lectura.'}`);
                            registerPlateVote(detected, options, candidateBadge, guideFrame, statusEl, false, immediate);
                        }
                    }
                } else if (detectorError) {
                    if (statusEl) statusEl.textContent = 'Detector local no disponible; preparando respaldo…';
                } else if (statusEl) {
                    statusEl.textContent = 'Buscando la placa con el modelo local…';
                }
            }
        } catch (e) {
            if (runId === scannerRunId) {
                scannerDebug('frame_error', `${(e as Error)?.name || 'Error'}: ${(e as Error)?.message || 'Falló captura u OCR en este frame.'}`, 'WARN');
                console.warn('[SCANNER] frame error:', e);
            }
        } finally {
            if (runId === scannerRunId) {
                isProcessingFrame = false;
                if (!fallbackRequested && (detectorError || localWorkerError) && latestFullFrame) {
                    scannerDebug('respaldo', detectorError ? 'El detector local falló; se activa respaldo backend.' : 'El OCR local falló; se activa respaldo backend.', 'WARN');
                    requestBackendFallback(latestFullFrame);
                }
                // No repetir un OCR móvil que ya falló: evita consumir batería
                // sin posibilidad de producir una lectura.
                if (mobileOcrMode && localWorkerError) {
                    scanTimer = null;
                    if (statusEl) statusEl.textContent = 'No se pudo iniciar el OCR local. Usa Tomar foto / Archivo y revisa el diagnóstico.';
                    scannerDebug('ocr_mobile_stopped', 'Se detiene el ciclo móvil tras un error de OCR para no repetir trabajo inútil.', 'ERROR');
                }
                // Programar siguiente frame solo si el timer sigue activo
                if (scanTimer != null) scanTimer = setTimeout(scanFrame, frameGapMs);
                else {
                    window.clearTimeout(backendWarmupTimer);
                    void detectorModule?.disposePlateDetector();
                }
            }
        }
    }

    // Usar setTimeout encadenado en vez de setInterval para evitar solapamiento
    // de requests asíncronos y respetar la duración real de cada inferencia.
    scanTimer = setTimeout(scanFrame, 200);
}

function registerPlateVote(
    plate: string, 
    options: ScannerOptions,
    candidateBadge: HTMLElement | null,
    guideFrame: HTMLElement | null,
    statusEl: HTMLElement | null,
    backendVerified = false,
    highConfidence = false
) {
    if (plateAccepted) return;
    voteRing.push(plate);
    while (voteRing.length > VOTE_RING_SIZE) {
        voteRing.shift();
    }
    const count = backendVerified || highConfidence ? VOTES_NEEDED : voteRing.filter(p => p === plate).length;

    if (candidateBadge) {
        candidateBadge.classList.remove('hidden');
        candidateBadge.innerHTML = `
            <div class="inline-flex items-center gap-2 bg-black/90 border border-amber-400/90 text-amber-300 px-3.5 py-1.5 rounded-xl shadow-lg">
                <i class="fas fa-car text-xs"></i>
                <span class="font-archivo text-sm font-black tracking-wider text-white">${plate}</span>
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300">${count}/${VOTES_NEEDED}</span>
            </div>
        `;
    }

    if (count >= VOTES_NEEDED) {
        plateAccepted = true;
        // La placa ya pasó la normalización OCR y la validación peruana.
        if (guideFrame) {
            guideFrame.className = 'w-[82%] max-w-[300px] h-[120px] relative transition-all duration-300 scale-105';
            // Turn corners emerald for confirmed state
            guideFrame.querySelectorAll('.scanner-corner-pulse > div').forEach((el: Element) => {
                (el as HTMLElement).style.background = '#10b981';
            });
            guideFrame.style.filter = 'drop-shadow(0 0 25px rgba(16,185,129,0.7))';
        }
        if (statusEl) {
            statusEl.innerHTML = `<span class="text-emerald-400 font-extrabold text-sm"><i class="fas fa-circle-check mr-1.5"></i>¡Placa ${plate} confirmada!</span>`;
        }
        try { (navigator as any).vibrate?.([100, 50, 100]); } catch {}

        setTimeout(() => {
            closeScannerModal();
            if (activeCallback) activeCallback(plate);
        }, 350);
    }
}

// ----------------------------------------------------
// MOTOR DE ESCANEO DE CÓDIGO DE BARRAS DNI (PDF417)
// ----------------------------------------------------
function startContinuousDniBarcodeScanner(video: HTMLVideoElement, options: ScannerOptions) {
    const statusEl = document.getElementById('scanner-status-text');
    const guideFrame = document.getElementById('scanner-guide-frame');

    // Opción 1: BarcodeDetector nativo (Ultra rápido y preciso para PDF417 en Chrome/Android)
    const BarcodeDetectorClass = (window as any).BarcodeDetector;
    if (typeof BarcodeDetectorClass === 'function') {
        try {
            const barcodeDetector = new BarcodeDetectorClass({
                formats: ['pdf417', 'code_128', 'code_39', 'qr_code']
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            scanTimer = setInterval(async () => {
                if (!video || video.readyState < 2 || isProcessingFrame) return;
                isProcessingFrame = true;
                try {
                    // Escanear exclusivamente la región correspondiente al marco guía del DNI
                    const vw = video.videoWidth || 1280;
                    const vh = video.videoHeight || 720;
                    const cropW = Math.round(vw * 0.85);
                    const cropH = Math.round(vh * 0.35);
                    const cropX = Math.round((vw - cropW) / 2);
                    const cropY = Math.round((vh - cropH) / 2);

                    canvas.width = cropW;
                    canvas.height = cropH;
                    if (ctx) {
                        ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
                        const barcodes = await barcodeDetector.detect(canvas);
                        if (barcodes && barcodes.length > 0) {
                            for (const b of barcodes) {
                                const raw = b.rawValue || '';
                                const dniMatch = raw.match(/\b(\d{8})\b/);
                                const clean = dniMatch ? dniMatch[1] : raw.replace(/\D/g, '').slice(0, 8);
                                if (clean && clean.length === 8) {
                                    onDniDetected(clean, options, guideFrame, statusEl);
                                    return;
                                }
                            }
                        }
                    }
                } catch {} finally {
                    isProcessingFrame = false;
                }
            }, 200);
            return;
        } catch (e) {
            console.warn('[SCANNER] Fallback a Html5Qrcode:', e);
        }
    }

    // Opción 2: Html5Qrcode tuned para PDF417
    try {
        const readerId = 'scanner-reader-container';
        activeHtml5QrCode = new Html5Qrcode(readerId, {
            formatsToSupport: [
                Html5QrcodeSupportedFormats.PDF_417,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.CODE_39
            ],
            verbose: false
        });

        const rearCamera = availableVideoDevices.find(d => /back|rear|environment|trasera|posterior|principal/i.test(d.label));
        const config = rearCamera ? { deviceId: { exact: rearCamera.deviceId } } : { facingMode: 'environment' };

        activeHtml5QrCode.start(
            config as any,
            { fps: 15, qrbox: { width: 300, height: 110 } },
            (decodedText) => {
                const dniMatch = decodedText.match(/\b(\d{8})\b/);
                const clean = dniMatch ? dniMatch[1] : decodedText.replace(/\D/g, '').slice(0, 8);
                if (clean && clean.length === 8) {
                    onDniDetected(clean, options, guideFrame, statusEl);
                }
            },
            () => {}
        ).catch(() => {});
    } catch {}
}

function onDniDetected(
    dni: string, 
    options: ScannerOptions,
    guideFrame: HTMLElement | null,
    statusEl: HTMLElement | null
) {
    if (guideFrame) {
        guideFrame.className = 'w-[85%] max-w-[320px] h-[130px] relative transition-all duration-300 scale-105';
        guideFrame.style.filter = 'drop-shadow(0 0 25px rgba(16,185,129,0.7))';
    }
    if (statusEl) {
        statusEl.innerHTML = `<span class="text-emerald-400 font-extrabold text-sm"><i class="fas fa-circle-check mr-1.5"></i>¡DNI ${dni} detectado!</span>`;
    }
    try { (navigator as any).vibrate?.([80, 40, 80]); } catch {}

    setTimeout(() => {
        closeScannerModal();
        if (activeCallback) activeCallback(dni);
    }, 300);
}

export function closeScannerModal() {
    const modal = document.getElementById('camera-scanner-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    document.body.style.overflow = '';
    stopAllCameraResources();
}

function stopAllCameraResources() {
    scannerRunId++;
    if (scanTimer) {
        clearTimeout(scanTimer);
        scanTimer = null;
    }
    if (activeHtml5QrCode) {
        try {
            activeHtml5QrCode.stop().catch(() => {});
            activeHtml5QrCode.clear();
        } catch {}
        activeHtml5QrCode = null;
    }
    if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
        activeStream = null;
    }
    if (!isProcessingFrame) void plateDetectorModulePromise?.then(({ disposePlateDetector }) => disposePlateDetector());
}

function isMobilePlateScanner(): boolean {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const userAgentData = (navigator as (Navigator & { userAgentData?: { mobile?: boolean } }) | undefined)?.userAgentData;
    return Boolean(userAgentData?.mobile) || /Android|iPhone|iPad|iPod/i.test(userAgent);
}

/** Dibuja la caja localizada encima del video sin esperar otra lectura OCR. */
function paintPlateDetection(video: HTMLVideoElement, x: number, y: number, width: number, height: number, confidence: number) {
    const overlay = document.getElementById('scanner-detection-box') as HTMLDivElement | null;
    const label = document.getElementById('scanner-detection-label');
    const camera = video.parentElement;
    if (!overlay || !camera || !video.videoWidth || !video.videoHeight) return;

    const videoRect = video.getBoundingClientRect();
    const cameraRect = camera.getBoundingClientRect();
    const scale = Math.max(videoRect.width / video.videoWidth, videoRect.height / video.videoHeight);
    const renderedWidth = video.videoWidth * scale;
    const renderedHeight = video.videoHeight * scale;
    const offsetX = (videoRect.width - renderedWidth) / 2;
    const offsetY = (videoRect.height - renderedHeight) / 2;
    const left = videoRect.left - cameraRect.left + offsetX + x * scale;
    const top = videoRect.top - cameraRect.top + offsetY + y * scale;
    overlay.style.left = `${left}px`;
    overlay.style.top = `${top}px`;
    overlay.style.width = `${width * scale}px`;
    overlay.style.height = `${height * scale}px`;
    overlay.classList.remove('hidden');
    if (label) label.textContent = `PLACA ${Math.round(confidence * 100)}%`;
}

function toggleTorch() {
    if (!activeStream) return;
    const track = activeStream.getVideoTracks()[0];
    if (!track) return;
    torchOn = !torchOn;
    try {
        (track as any).applyConstraints({ advanced: [{ torch: torchOn }] });
        const icon = document.querySelector('#scanner-torch-btn i');
        if (icon) {
            icon.className = torchOn ? 'fas fa-bolt text-lg text-[#b58a25]' : 'fas fa-bolt text-lg text-slate-800';
        }
    } catch {}
}

function createScannerModalElement(): HTMLElement {
    const modal = document.createElement('div');
    modal.id = 'camera-scanner-modal';
    modal.className = 'fixed inset-0 z-[99999] hidden items-center justify-center bg-slate-900/45 backdrop-blur-sm transition-all font-poppins';

    // Inject scanner-specific CSS animations
    if (!document.getElementById('scanner-anim-styles')) {
        const style = document.createElement('style');
        style.id = 'scanner-anim-styles';
        style.textContent = `
            @keyframes scanLine {
                0% { top: 8%; opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { top: 88%; opacity: 0; }
            }
            @keyframes cornerPulse {
                0%, 100% { opacity: 0.75; filter: drop-shadow(0 0 4px rgba(212,175,55,0.45)); }
                50% { opacity: 1; filter: drop-shadow(0 0 14px rgba(212,175,55,0.85)); }
            }
            @keyframes crosshairBlink {
                0%, 100% { opacity: 0.4; }
                50% { opacity: 1; }
            }
            @keyframes slideUp {
                0% { transform: translateY(30px); opacity: 0; }
                100% { transform: translateY(0); opacity: 1; }
            }
            @keyframes scannerFadeIn {
                0% { opacity: 0; transform: scale(0.95); }
                100% { opacity: 1; transform: scale(1); }
            }
            .scanner-scan-line {
                animation: scanLine 2.5s ease-in-out infinite;
            }
            .scanner-corner-pulse {
                animation: cornerPulse 2s ease-in-out infinite;
            }
            .scanner-crosshair-blink {
                animation: crosshairBlink 1.5s ease-in-out infinite;
            }
            .scanner-slide-up {
                animation: slideUp 0.4s ease-out both;
            }
            .scanner-fade-in {
                animation: scannerFadeIn 0.35s ease-out both;
            }
            @media (max-height: 620px) {
                #camera-scanner-modal .scanner-header { padding-top: 6px; padding-bottom: 6px; }
                #camera-scanner-modal .scanner-footer { gap: 8px; padding-top: 8px; }
                #camera-scanner-modal .scanner-action { min-height: 58px; padding-top: 8px; padding-bottom: 8px; }
                #camera-scanner-modal .scanner-info { padding-top: 7px; padding-bottom: 7px; }
                #camera-scanner-modal #scanner-debug-output { max-height: 12vh; min-height: 46px; }
            }
            @media (max-height: 500px) {
                #camera-scanner-modal .scanner-info { display: none; }
                #camera-scanner-modal .scanner-viewport { padding-top: 4px; padding-bottom: 4px; }
                #camera-scanner-modal .scanner-camera { min-height: 140px; }
                #camera-scanner-modal #scanner-debug-output { max-height: 10vh; min-height: 38px; }
            }
        `;
        document.head.appendChild(style);
    }

    modal.innerHTML = `
        <div class="relative w-full max-w-md mx-auto flex flex-col h-full min-h-0 max-h-[100dvh] sm:max-h-[94dvh] sm:rounded-[28px] overflow-hidden bg-[#fffdf8] sm:border sm:border-amber-200/60 sm:shadow-[0_20px_60px_rgba(120,70,10,0.18)] scanner-fade-in">

            <!-- ═══════ HEADER CLARO ═══════ -->
            <div class="scanner-header flex items-center justify-between px-3 sm:px-4 py-2.5 bg-white border-b border-amber-100 shrink-0">
                <div class="flex items-center gap-2.5 min-w-0 flex-1">
                    <button type="button" id="scanner-close-btn" class="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer shrink-0">
                        <i class="fas fa-chevron-left text-sm"></i>
                    </button>
                    <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#f6e4ad] via-[#d4af37] to-[#a87912] flex items-center justify-center text-white shrink-0 shadow-[0_4px_14px_rgba(212,175,55,0.38)]">
                        <i class="fas fa-qrcode text-base"></i>
                    </div>
                    <div class="min-w-0">
                        <h3 id="scanner-modal-title" class="text-[14px] sm:text-[15px] font-black tracking-tight text-slate-900 leading-tight truncate">Escanear placa vehicular</h3>
                        <p id="scanner-modal-desc" class="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-tight mt-0.5 line-clamp-2">Ubica la placa dentro del marco para detección automática</p>
                    </div>
                </div>
                <div class="flex items-center gap-1.5 shrink-0 ml-2">
                    <button type="button" id="scanner-switch-cam-btn" title="Cambiar Cámara" class="hidden w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer">
                        <i class="fas fa-arrows-rotate text-sm"></i>
                    </button>
                    <button type="button" id="scanner-help-btn" title="Ayuda" class="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer">
                        <i class="fas fa-question text-sm"></i>
                    </button>
                </div>
            </div>

            <!-- ═══════ CAMERA VIEWPORT ═══════ -->
            <div class="scanner-viewport flex-1 min-h-0 flex flex-col px-2 pt-2 pb-2">
            <div class="scanner-camera relative flex-1 min-h-[180px] sm:min-h-[260px] bg-slate-900 flex items-center justify-center overflow-hidden rounded-[22px] sm:rounded-[26px] shadow-[0_10px_30px_rgba(15,23,42,0.18)]">
                <!-- Video Elements -->
                <div id="scanner-reader-container" class="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none z-0"></div>
                <video id="scanner-video-preview" class="absolute inset-0 w-full h-full object-cover z-0" autoplay playsinline muted></video>
                <div id="scanner-detection-box" class="hidden absolute z-[25] pointer-events-none rounded-md border-[3px] border-emerald-300 bg-emerald-300/10 shadow-[0_0_18px_rgba(52,211,153,0.8)]">
                    <span id="scanner-detection-label" class="absolute -top-6 left-0 rounded-t-md bg-emerald-300 px-2 py-1 text-[10px] font-black tracking-wide text-slate-950">PLACA</span>
                </div>

                <!-- No Camera Placeholder -->
                <div id="scanner-no-cam-placeholder" class="hidden absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-100 z-10">
                    <div class="w-16 h-16 rounded-2xl bg-[#fbf6e7] border border-[#ead28b] flex items-center justify-center text-[#b58a25] mb-3 scanner-corner-pulse">
                        <i class="fas fa-video-slash text-2xl"></i>
                    </div>
                    <p class="text-sm font-bold text-slate-800 mb-1">Cámara en vivo no disponible</p>
                    <p class="text-[11px] text-slate-500 max-w-[280px] leading-relaxed">
                        En celulares activa el permiso de cámara.<br>En computadora usa <span class="text-amber-800 font-semibold">"Tomar foto / Archivo"</span> abajo.
                    </p>
                </div>

                <!-- ═══ MARCO DE LECTURA DORADO ═══ -->
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <div id="scanner-guide-frame" class="w-[82%] max-w-[300px] h-[120px] relative transition-all duration-300">
                        <!-- Corner brackets with glow -->
                        <div class="scanner-corner-pulse absolute -top-1 -left-1 w-9 h-9">
                        <div class="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[#f6e4ad] via-[#d4af37] to-[#d4af37]/50 rounded-full"></div>
                            <div class="absolute top-0 left-0 h-full w-[4px] bg-gradient-to-b from-[#f6e4ad] via-[#d4af37] to-[#d4af37]/50 rounded-full"></div>
                        </div>
                        <div class="scanner-corner-pulse absolute -top-1 -right-1 w-9 h-9" style="animation-delay: 0.5s;">
                            <div class="absolute top-0 right-0 w-full h-[4px] bg-gradient-to-l from-[#f6e4ad] via-[#d4af37] to-[#d4af37]/50 rounded-full"></div>
                            <div class="absolute top-0 right-0 h-full w-[4px] bg-gradient-to-b from-[#f6e4ad] via-[#d4af37] to-[#d4af37]/50 rounded-full"></div>
                        </div>
                        <div class="scanner-corner-pulse absolute -bottom-1 -left-1 w-9 h-9" style="animation-delay: 1s;">
                            <div class="absolute bottom-0 left-0 w-full h-[4px] bg-gradient-to-r from-[#f6e4ad] via-[#d4af37] to-[#d4af37]/50 rounded-full"></div>
                            <div class="absolute bottom-0 left-0 h-full w-[4px] bg-gradient-to-t from-[#f6e4ad] via-[#d4af37] to-[#d4af37]/50 rounded-full"></div>
                        </div>
                        <div class="scanner-corner-pulse absolute -bottom-1 -right-1 w-9 h-9" style="animation-delay: 1.5s;">
                            <div class="absolute bottom-0 right-0 w-full h-[4px] bg-gradient-to-l from-[#f6e4ad] via-[#d4af37] to-[#d4af37]/50 rounded-full"></div>
                            <div class="absolute bottom-0 right-0 h-full w-[4px] bg-gradient-to-t from-[#f6e4ad] via-[#d4af37] to-[#d4af37]/50 rounded-full"></div>
                        </div>

                        <!-- Center crosshair marks -->
                        <div class="scanner-crosshair-blink absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                            <div class="absolute -top-5 left-1/2 -translate-x-1/2 w-[2px] h-3 bg-[#f0d47f] rounded"></div>
                            <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 w-[2px] h-3 bg-[#f0d47f] rounded"></div>
                            <div class="absolute top-1/2 -left-5 -translate-y-1/2 h-[2px] w-3 bg-[#f0d47f] rounded"></div>
                            <div class="absolute top-1/2 -right-5 -translate-y-1/2 h-[2px] w-3 bg-[#f0d47f] rounded"></div>
                        </div>

                        <!-- Inner subtle border -->
                        <div class="absolute inset-2 border border-[#f0d47f]/40 rounded-xl pointer-events-none"></div>

                        <!-- Scanning laser line -->
                        <div class="scanner-scan-line absolute left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-[#f0d47f] to-transparent shadow-[0_0_12px_rgba(212,175,55,0.72)] rounded-full"></div>
                    </div>
                </div>

                <!-- Candidate badge (vote ring display) -->
                <div id="scanner-candidate-badge" class="absolute bottom-[74px] inset-x-0 mx-auto w-fit z-30 pointer-events-none hidden"></div>

                <!-- Flash & Gallery overlay buttons on viewfinder -->
                <div class="absolute bottom-3 left-0 right-0 px-6 flex items-start justify-between z-30 pointer-events-none">
                    <div id="scanner-torch-wrap" class="hidden flex-col items-center gap-1 pointer-events-auto">
                        <button type="button" id="scanner-torch-btn" title="Flash / Linterna" class="w-14 h-14 rounded-full bg-white/95 hover:bg-white text-slate-800 flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer shadow-[0_6px_18px_rgba(0,0,0,0.25)]">
                            <i class="fas fa-bolt text-lg"></i>
                        </button>
                        <span class="text-[10px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">Flash</span>
                    </div>
                    <div class="flex-1"></div>
                    <label class="flex flex-col items-center gap-1 cursor-pointer pointer-events-auto" title="Abrir Galería">
                        <span class="w-14 h-14 rounded-full bg-white/95 hover:bg-white text-slate-800 flex items-center justify-center transition-all duration-200 active:scale-90 shadow-[0_6px_18px_rgba(0,0,0,0.25)]">
                            <i class="fas fa-image text-lg"></i>
                        </span>
                        <span class="text-[10px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">Galería</span>
                        <input type="file" id="scanner-file-fallback" accept="image/*" class="hidden" />
                    </label>
                </div>
            </div>
            </div>

            <!-- ═══════ FOOTER ACTIONS ═══════ -->
            <div class="scanner-footer px-3 sm:px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-[#fffdf8] flex flex-col gap-2.5 shrink-0 scanner-slide-up">
                <!-- Info banner -->
                <div class="scanner-info flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-100 rounded-2xl border border-slate-200/70">
                    <div class="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                        <i class="fas fa-info text-white text-[10px]"></i>
                    </div>
                    <p id="scanner-status-text" class="text-[11px] sm:text-xs text-slate-600 font-medium leading-snug">Enfoca la placa; la detectaremos automáticamente.</p>
                </div>

                <!-- Diagnóstico en vivo: únicamente registra etapas y tiempos, nunca la imagen enviada. -->
                <section id="scanner-debug-panel" class="hidden rounded-xl border border-slate-300 bg-slate-950 text-slate-100 overflow-hidden" aria-label="Diagnóstico del escáner de placa">
                    <div class="flex items-center justify-between gap-2 px-3 py-2 bg-slate-900">
                        <div class="min-w-0">
                            <p class="text-[10px] font-bold tracking-wide">DIAGNÓSTICO EN VIVO <span id="scanner-debug-count" class="text-amber-300">0</span></p>
                            <p class="text-[9px] text-slate-400">OCR local · cámara · respaldo backend</p>
                        </div>
                        <button type="button" id="scanner-debug-copy" class="shrink-0 rounded-lg bg-amber-300 px-3 py-1.5 text-[10px] font-bold text-slate-950 active:scale-95">Copiar</button>
                    </div>
                    <pre id="scanner-debug-output" role="log" aria-live="polite" class="max-h-[18vh] min-h-[64px] overflow-y-auto whitespace-pre-wrap break-words px-3 py-2 font-mono text-[9px] leading-relaxed text-emerald-200"></pre>
                </section>

                <!-- Action buttons -->
                <div class="flex items-stretch gap-2.5 w-full">
                    <label class="scanner-action w-full min-h-[68px] py-3 px-3 sm:px-4 rounded-2xl bg-white hover:bg-[#fffdf5] text-slate-800 font-bold text-xs sm:text-[13px] border border-[#ead28b] flex items-center justify-center gap-2.5 active:scale-[0.97] cursor-pointer transition-all duration-200 shadow-sm">
                        <div class="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                            <i class="fas fa-image text-sm text-white"></i>
                        </div>
                        <div class="text-left">
                            <span class="block text-xs sm:text-[13px] font-bold leading-tight">Tomar foto / Archivo</span>
                            <span class="block text-[9px] font-medium text-slate-500 leading-tight">Desde galería</span>
                        </div>
                        <input type="file" id="scanner-file-fallback-bottom" accept="image/*" capture="environment" class="hidden" />
                    </label>
                </div>
            </div>
        </div>
    `;

    modal.querySelector('#scanner-close-btn')?.addEventListener('click', closeScannerModal);
    modal.querySelector('#scanner-debug-copy')?.addEventListener('click', () => { void copyScannerDebug(); });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeScannerModal();
    });

    modal.querySelector('#scanner-torch-btn')?.addEventListener('click', toggleTorch);
    modal.querySelector('#scanner-help-btn')?.addEventListener('click', () => {
        const statusEl = document.getElementById('scanner-status-text');
        const title = document.getElementById('scanner-modal-title')?.textContent || '';
        const isPlaca = title.toLowerCase().includes('placa');
        if (statusEl) {
            statusEl.textContent = isPlaca
                ? 'Tip: ubica la placa dentro del marco naranja, evita reflejos y mantén el teléfono firme.'
                : 'Tip: apunta al código de barras PDF417 al reverso del DNI, con buena luz y sin sombras.';
        }
    });

    // No se ofrece cambio a cámara frontal: placa y código DNI requieren la trasera.
    modal.querySelector('#scanner-switch-cam-btn')?.classList.add('hidden');

    // Fallback de archivo / cámara nativa
    const fileFallback = modal.querySelector('#scanner-file-fallback') as HTMLInputElement;
    fileFallback?.addEventListener('change', async () => {
        const file = fileFallback.files?.[0];
        if (!file) return;

        const title = document.getElementById('scanner-modal-title')?.textContent || '';
        const isPlaca = title.toLowerCase().includes('placa');

        if (isPlaca) {
            scannerDebug('galería', `Archivo seleccionado; ${(file.size / 1024).toFixed(0)} KB; tipo=${file.type || 'desconocido'}.`);
            if (file.size > 12 * 1024 * 1024) {
                window.alert('La imagen supera 12 MB. Elige una foto más ligera.');
                scannerDebug('galería', 'Archivo rechazado: supera el máximo de 12 MB.', 'ERROR');
                fileFallback.value = '';
                return;
            }
            try {
                const convertStartedAt = performance.now();
                const b64 = await imageFileToJpeg(file);
                scannerDebug('galería', `Convertido a JPEG en ${(performance.now() - convertStartedAt).toFixed(0)}ms; ${Math.round(b64.length * 0.75 / 1024)} KB.`);
                try {
                    const { getPlateOcrWorker, extractPeruvianPlate } = await loadPlateOcr();
                    scannerDebug('galería_ocr', 'Esperando worker local de Tesseract.');
                    const worker = await getPlateOcrWorker();
                    const recognizeStartedAt = performance.now();
                    const localResult = await worker.recognize(b64);
                    const localPlate = extractPeruvianPlate(localResult.data.text);
                    scannerDebug('galería_ocr', `Reconocimiento en ${(performance.now() - recognizeStartedAt).toFixed(0)}ms; placa válida=${Boolean(localPlate)}.`);
                    if (localPlate) {
                        closeScannerModal();
                        if (activeCallback) activeCallback(localPlate);
                        return;
                    }
                } catch (error) {
                    scannerDebug('galería_ocr', `${(error as Error)?.name || 'Error'}: ${(error as Error)?.message || 'OCR local no disponible.'}; se usa backend.`, 'WARN');
                    console.warn('[SCANNER] local photo OCR unavailable; using backend:', error);
                }
                const backendStartedAt = performance.now();
                scannerDebug('galería_backend', `POST ${backendUrl()}/plate/scan; imagen JPEG ${Math.round(b64.length * 0.75 / 1024)} KB.`);
                const res = await fetch(`${backendUrl()}/plate/scan`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image_base64: b64, debug_trace: true }),
                    signal: AbortSignal.timeout(8000)
                }).catch((error) => {
                    scannerDebug('galería_backend_network', `${(error as Error)?.name || 'Error'}: ${(error as Error)?.message || 'Falló fetch/timeout.'}`, 'ERROR');
                    return null;
                });

                if (res) {
                    const data = await res.json();
                    scannerDebug('galería_backend_http', `HTTP ${res.status}; ${(performance.now() - backendStartedAt).toFixed(0)}ms; success=${Boolean(data?.success)}${data?.detail ? `; ${data.detail}` : ''}`, res.ok ? 'INFO' : 'ERROR');
                    for (const item of (Array.isArray(data?.backend_trace) ? data.backend_trace : [])) {
                        scannerDebug(`backend.${item.stage || 'stage'}`, `${item.duration_ms ?? '?'}ms; ${item.detail || ''}`);
                    }
                    const { extractPeruvianPlate } = await loadPlateOcr();
                    const plate = data.success ? extractPeruvianPlate(data.plate || '') : null;
                    scannerDebug('galería_backend_result', `Placa válida=${Boolean(plate)}; procesamiento=${data?.elapsed_ms ?? 'n/d'}ms.`);
                    if (plate) {
                        closeScannerModal();
                        if (activeCallback) activeCallback(plate);
                        return;
                    }
                } else {
                    scannerDebug('galería_backend_network', `Sin respuesta; ${(performance.now() - backendStartedAt).toFixed(0)}ms hasta fallo/timeout.`, 'ERROR');
                }
            } catch (error) {
                // El OCR puede no estar disponible; se conserva confirmación manual.
                scannerDebug('galería_error', `${(error as Error)?.name || 'Error'}: ${(error as Error)?.message || 'Falló la lectura de la imagen.'}`, 'ERROR');
            }
            const status = document.getElementById('scanner-status-text');
            if (status) status.textContent = 'No pudimos leer la placa de esa foto. Prueba otra imagen más nítida o vuelve a enfocar.';
            fileFallback.value = '';
        } else {
            const tempScanner = new Html5Qrcode('scanner-reader-container', {
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.PDF_417,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39
                ],
                verbose: false
            });

            tempScanner.scanFile(file, true).then((decodedText) => {
                const dniMatch = decodedText.match(/\b(\d{8})\b/);
                const val = dniMatch ? dniMatch[1] : decodedText.replace(/\D/g, '').slice(0, 8);
                closeScannerModal();
                if (activeCallback && val) activeCallback(val);
            }).catch(() => {
                const status = document.getElementById('scanner-status-text');
                if (status) status.textContent = 'No encontramos un código PDF417 legible. Prueba una foto clara del reverso del DNI.';
                fileFallback.value = '';
            });
        }
    });

    // Bottom file fallback (in footer) mirrors the same logic
    const fileFallbackBottom = modal.querySelector('#scanner-file-fallback-bottom') as HTMLInputElement;
    fileFallbackBottom?.addEventListener('change', async () => {
        const file = fileFallbackBottom.files?.[0];
        if (!file) return;
        // Delegate to the same handler as the top gallery input
        const topInput = modal.querySelector('#scanner-file-fallback') as HTMLInputElement;
        if (topInput) {
            const dt = new DataTransfer();
            dt.items.add(file);
            topInput.files = dt.files;
            topInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });

    return modal;
}
