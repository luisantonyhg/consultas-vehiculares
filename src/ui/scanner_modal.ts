// ====================================================
// MODAL DE ESCANEO DE CÁMARA PROFESIONAL (PLACA Y DNI)
// Misma lógica de escáner que Mobile: Votación 3/4, Detección Continua,
// Backend YOLO11 + Tesseract para Placas y Lector de Código de Barras PDF417 para DNI.
// ====================================================
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

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

// Confirmación conservadora para evitar completar con una lectura aislada.
const VOTE_RING_SIZE = 3;
const VOTES_NEEDED = 2;
// No se solapan peticiones y el tope de intentos queda bajo el rate limit.
const PLATE_SCAN_INTERVAL_MS = 450;
const PLATE_SCAN_MAX_ATTEMPTS = 8;
const PLATE_SCAN_MAX_EDGE = 960;
let voteRing: string[] = [];
let isProcessingFrame = false;

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

function isPeruvianPlate(value: string): boolean {
    const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return /^(?:[A-Z]{3}\d{3}|[A-Z]\d[A-Z]\d{3}|[A-Z]{2}\d{4}|PNP\d{3,4})$/.test(normalized);
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
    isProcessingFrame = false;
    torchOn = false;

    let modal = document.getElementById('camera-scanner-modal');
    if (!modal) {
        modal = createScannerModalElement();
        document.body.appendChild(modal);
    }

    const titleEl = document.getElementById('scanner-modal-title');
    const descEl = document.getElementById('scanner-modal-desc');
    const guideFrame = document.getElementById('scanner-guide-frame');
    const statusEl = document.getElementById('scanner-status-text');
    const candidateBadge = document.getElementById('scanner-candidate-badge');

    if (candidateBadge) {
        candidateBadge.classList.add('hidden');
        candidateBadge.textContent = '';
    }

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

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
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
    } catch {}

    let stream: MediaStream | null = null;
    let streamError: any = null;

    // Solicita explícitamente la cámara trasera principal, nunca la selfie.
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
        });
    } catch (errA) {
        streamError = errA;
        // Fallback para navegadores sin facingMode exact: preferir trasera y
        // si fuera frontal, reintentar con una trasera identificada.
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } },
                audio: false
            });
            const probeTrack = stream.getVideoTracks()[0];
            const settings = probeTrack?.getSettings?.();
            availableVideoDevices = (await navigator.mediaDevices.enumerateDevices().catch(() => []))
                .filter(d => d.kind === 'videoinput');
            const rearCamera = availableVideoDevices.find(d => /back|rear|environment|trasera|posterior|principal/i.test(d.label));
            if (settings?.facingMode !== 'environment' && rearCamera) {
                stream.getTracks().forEach(track => track.stop());
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { deviceId: { exact: rearCamera.deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: false
                });
            } else if (settings?.facingMode !== 'environment') {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
                streamError = new Error('No se identificó una cámara trasera');
            }
        } catch (errB) {
            stream?.getTracks().forEach(track => track.stop());
            stream = null;
            streamError = errB;
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
    const torchWrap = document.getElementById('scanner-torch-wrap');
    if (capabilities.torch && torchWrap) {
        torchWrap.classList.remove('hidden');
        torchWrap.classList.add('flex');
    } else if (torchWrap) {
        torchWrap.classList.add('hidden');
        torchWrap.classList.remove('flex');
    }

    // Iniciar el motor de detección según el modo
    if (options.mode === 'placa') {
        startContinuousPlateDetection(video, options);
    } else {
        startContinuousDniBarcodeScanner(video, options);
    }
}

// ----------------------------------------------------
// MOTOR DE ESCANEO CONTINUO DE PLACAS (VOTACIÓN 3/4)
// ----------------------------------------------------
function startContinuousPlateDetection(video: HTMLVideoElement, options: ScannerOptions) {
    const statusEl = document.getElementById('scanner-status-text');
    const candidateBadge = document.getElementById('scanner-candidate-badge');
    const guideFrame = document.getElementById('scanner-guide-frame');

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let attempts = 0;

    scanTimer = setInterval(async () => {
        if (attempts >= PLATE_SCAN_MAX_ATTEMPTS) {
            if (scanTimer) clearInterval(scanTimer);
            scanTimer = null;
            if (statusEl) statusEl.textContent = 'Aún no detectamos la placa. Acércala al marco o prueba con una foto.';
            return;
        }
        if (!video || video.readyState < 2 || isProcessingFrame) return;
        isProcessingFrame = true;
        attempts++;

        try {
            // Recortar exactamente lo que se ve dentro del marco; object-cover
            // en móviles recorta la fuente de video y el centro fijo no coincide.
            const crop = guideFrame ? getGuideCrop(video, guideFrame) : null;
            if (!crop) return;

            canvas.width = crop.width;
            canvas.height = crop.height;
            if (ctx) {
                ctx.drawImage(video, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
                const b64 = canvasJpeg(canvas);

                // Llamar al backend YOLO11 + Tesseract
                const res = await fetch(`${backendUrl()}/plate/scan`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image_base64: b64 }),
                    signal: AbortSignal.timeout(5000)
                }).catch(() => null);

                if (res?.status === 429) {
                    if (scanTimer) clearInterval(scanTimer);
                    scanTimer = null;
                    if (statusEl) statusEl.textContent = 'Límite temporal de escaneo alcanzado. Espera un momento antes de volver a intentar.';
                    return;
                }
                if (res && res.ok) {
                    const data = await res.json();
                    if (data.success && data.plate) {
                        const detected = data.plate.toUpperCase();
                        if (!isPeruvianPlate(detected)) return;
                        registerPlateVote(detected, options, candidateBadge, guideFrame, statusEl);
                    }
                }
            }
        } catch (e) {
            // Error en un frame es normal
        } finally {
            isProcessingFrame = false;
        }
    }, PLATE_SCAN_INTERVAL_MS);
}

function registerPlateVote(
    plate: string, 
    options: ScannerOptions,
    candidateBadge: HTMLElement | null,
    guideFrame: HTMLElement | null,
    statusEl: HTMLElement | null
) {
    voteRing.push(plate);
    while (voteRing.length > VOTE_RING_SIZE) {
        voteRing.shift();
    }
    const count = voteRing.filter(p => p === plate).length;

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
        // Confirmado: dos de las últimas tres lecturas coinciden.
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
    if (scanTimer) {
        clearInterval(scanTimer);
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
            }
            @media (max-height: 500px) {
                #camera-scanner-modal .scanner-info { display: none; }
                #camera-scanner-modal .scanner-viewport { padding-top: 4px; padding-bottom: 4px; }
                #camera-scanner-modal .scanner-camera { min-height: 140px; }
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
            if (file.size > 12 * 1024 * 1024) {
                window.alert('La imagen supera 12 MB. Elige una foto más ligera.');
                fileFallback.value = '';
                return;
            }
            try {
                const b64 = await imageFileToJpeg(file);
                const res = await fetch(`${backendUrl()}/plate/scan`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image_base64: b64 }),
                    signal: AbortSignal.timeout(8000)
                }).catch(() => null);

                if (res && res.ok) {
                    const data = await res.json();
                    if (data.success && data.plate && isPeruvianPlate(data.plate)) {
                        closeScannerModal();
                        if (activeCallback) activeCallback(data.plate);
                        return;
                    }
                }
            } catch {
                // El OCR puede no estar disponible; se conserva confirmación manual.
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
