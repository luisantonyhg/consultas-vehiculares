import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const scanner = readFileSync(new URL('../src/ui/scanner_modal.ts', import.meta.url), 'utf8');

test('el visor placa/DNI usa alto flexible y deja espacio a los controles en móvil', () => {
  assert.match(scanner, /scanner-viewport flex-1 min-h-0/);
  assert.match(scanner, /scanner-camera relative flex-1 min-h-\[180px\]/);
  assert.doesNotMatch(scanner, /min-h-\[330px\]/);
  assert.match(scanner, /@media \(max-height: 620px\)/);
  assert.match(scanner, /@media \(max-height: 500px\)/);
  assert.match(scanner, /pb-\[max\(0\.75rem,env\(safe-area-inset-bottom\)\)\]/);
});

test('el marco de lectura se adapta independientemente para placa y DNI', () => {
  assert.match(scanner, /w-\[84%\] max-w-\[340px\] h-\[clamp\(96px,20vh,140px\)\]/);
  assert.match(scanner, /w-\[86%\] max-w-\[360px\] h-\[clamp\(110px,22vh,160px\)\]/);
  assert.match(scanner, /PDF417/);
});

test('el escáner prioriza detección automática y deja una sola acción de archivo a ancho completo', () => {
  assert.doesNotMatch(scanner, /scanner-capture-btn|Captura manual instantánea/);
  assert.doesNotMatch(scanner, /window\.prompt\(/);
  assert.match(scanner, /scanner-action w-full/);
  assert.match(scanner, /Tomar foto \/ Archivo/);
  assert.match(scanner, /detectaremos automáticamente/);
});

test('el modelo local detecta la placa antes de OCR y conserva el respaldo con timeout', () => {
  assert.match(scanner, /const VOTE_RING_SIZE = 3/);
  assert.match(scanner, /const VOTES_NEEDED = 2/);
  assert.match(scanner, /const PLATE_SCAN_INTERVAL_MS = 300/);
  assert.match(scanner, /const PLATE_SCAN_MAX_DURATION_MS = 30000/);
  assert.match(scanner, /const PLATE_SCAN_BACKEND_WARMUP_MS = 4500/);
  assert.match(scanner, /Sin placa confirmada tras/);
  assert.match(scanner, /loadPlateDetector\(\)/);
  assert.match(scanner, /if \(detectorReady && detectorModule && detectorCtx\)/);
  assert.match(scanner, /paintPlateDetection\(video, left, top, roiWidth, roiHeight, box\.confidence\)/);
  assert.ok(scanner.indexOf('paintPlateDetection(video, left, top, roiWidth, roiHeight, box.confidence)') < scanner.indexOf('recognizeWithDeadline(() => localWorker!.recognize(ocrCanvas)'));
  assert.match(scanner, /invalidPlateOcrFrames % 3 === 0/);
  assert.match(scanner, /localWorker!\.recognize\(detectorCanvas\)/);
  assert.match(scanner, /id="scanner-detection-box"/);
  assert.match(scanner, /if \(runId !== scannerRunId\) return/);
  assert.ok(scanner.indexOf('await detectorModule.detectPlate(detectorCanvas)') < scanner.indexOf('recognizeWithDeadline(() => localWorker!.recognize(ocrCanvas)'));
  assert.match(scanner, /márgenes=12% lados,22% arriba,10% abajo/);
  assert.match(scanner, /confianza YOLO=/);
  assert.match(scanner, /region_only: false/);
  assert.match(scanner, /MOBILE_BACKEND_WARMUP_MS = 2500/);
  assert.match(scanner, /captura=frame_completo/);
  assert.match(scanner, /mobileOcrMode && !latestFullFrame/);
  assert.match(scanner, /PLATE_OCR_CALL_TIMEOUT_MS = 5500/);
  assert.match(scanner, /scan_timeout/);
  assert.match(scanner, /scan=\$\{scannerDebugId\}/);
  assert.match(scanner, /terminatePlateOcrWorker\(\)/);
  assert.match(scanner, /if \(scanDeadlineTimer\) clearTimeout\(scanDeadlineTimer\)/);
  assert.match(scanner, /Buscando placa con el modelo local/);
  assert.match(scanner, /AbortSignal\.timeout\(8000\)/);
  assert.match(scanner, /res\.status/);
  assert.match(scanner, /focusMode: 'continuous'/);
});

test('el escáner web solicita cámara trasera y guía el reverso del DNI', () => {
  assert.match(scanner, /facingMode: \{ exact: 'environment' \}/);
  assert.doesNotMatch(scanner, /video:\s*true/);
  assert.match(scanner, /PDF417 al reverso del DNI/);
  assert.match(scanner, /No se ofrece cambio a cámara frontal/);
});

test('la zona que se envía al OCR se calcula desde el marco visible y object-cover', () => {
  assert.match(scanner, /function getGuideCrop\(/);
  assert.match(scanner, /video\.getBoundingClientRect\(\)/);
  assert.match(scanner, /guide\.getBoundingClientRect\(\)/);
  assert.match(scanner, /object-fit: cover|object-cover/);
  assert.match(scanner, /ctx\.drawImage\(video, capture\.x, capture\.y, capture\.width, capture\.height/);
});

test('el modal muestra diagnóstico OCR/cámara/backend en vivo y permite copiarlo', () => {
  assert.match(scanner, /id="scanner-debug-panel"/);
  assert.match(scanner, /id="scanner-debug-output" role="log" aria-live="polite"/);
  assert.match(scanner, /id="scanner-debug-copy"/);
  assert.match(scanner, /navigator\.clipboard\.writeText\(scannerDebugEvents\.join\('\\n'\)\)/);
  assert.match(scanner, /setPlateOcrDiagnosticHandler/);
  assert.match(scanner, /debug_trace: true/);
  assert.match(scanner, /scannerDebug\('backend_http'/);
  assert.match(scanner, /scannerDebug\(`backend\.\$\{item\.stage/);
  assert.match(scanner, /scannerDebugEvents\.length > 240/);
  assert.doesNotMatch(scanner, /scannerDebug\([^\n]*image_base64/);
});
