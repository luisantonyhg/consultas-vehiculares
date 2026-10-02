import { createWorker, PSM } from 'tesseract.js';

let workerPromise: ReturnType<typeof createWorker> | null = null;
let activeWorker: Awaited<ReturnType<typeof createWorker>> | null = null;
let workerGeneration = 0;
let diagnosticHandler: ((event: { status: string; progress?: number }) => void) | null = null;

export function setPlateOcrDiagnosticHandler(handler: ((event: { status: string; progress?: number }) => void) | null) {
  diagnosticHandler = handler;
}

export function getPlateOcrWorker() {
  if (!workerPromise) {
    const generation = workerGeneration;
    workerPromise = createWorker('eng', undefined, {
      logger: (event) => {
        diagnosticHandler?.({ status: event.status, progress: event.progress });
        if (event.status === 'loading language traineddata') {
          const status = document.getElementById('scanner-status-text');
          if (status) status.textContent = 'Preparando lectura local de placa…';
        }
      },
    }).then(async (worker) => {
      if (generation !== workerGeneration) {
        await worker.terminate();
        throw new Error('OCR_WORKER_CANCELLED');
      }
      activeWorker = worker;
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- ',
        // El detector ya separa la placa del fondo. El OCR recibe la banda de
        // caracteres de la placa, no el rótulo superior "PERÚ".
        tessedit_pageseg_mode: PSM.SINGLE_LINE,
        user_defined_dpi: '180',
      });
      return worker;
    }).catch((error) => {
      if (generation === workerGeneration) workerPromise = null;
      throw error;
    });
  }
  return workerPromise;
}

/** Finaliza el worker cuando un reconocimiento queda colgado o se cierra el escáner. */
export async function terminatePlateOcrWorker() {
  workerGeneration++;
  const worker = activeWorker;
  activeWorker = null;
  workerPromise = null;
  if (worker) {
    try {
      await worker.terminate();
    } catch {
      // El escáner debe poder cerrarse aunque el worker ya haya terminado.
    }
  }
}

/**
 * Camera OCR sees a bounded guide with several lines of surrounding page text;
 * unlike a YOLO crop, it must ask Tesseract to find sparse text blocks.
 */
export async function setPlateOcrMode(mode: 'plate-line' | 'guide-text') {
  const worker = await getPlateOcrWorker();
  await worker.setParameters({
    tessedit_pageseg_mode: mode === 'guide-text' ? PSM.SPARSE_TEXT : PSM.SINGLE_LINE,
  });
}

export function extractPeruvianPlate(rawText: string): string | null {
  const text = rawText.toUpperCase();
  const candidates: string[] = text.match(/[A-Z0-9]{2,3}[-\s]?[A-Z0-9]{3,4}/g) || [];
  const lines = text.split(/[\r\n]+/).map((line) => line.replace(/[^A-Z0-9]/g, ''));
  for (const line of lines) {
    if (line.length >= 6 && line.length <= 8) candidates.push(line);
  }

  for (const raw of candidates) {
    const value = raw.replace(/[^A-Z0-9]/g, '');
    if (/^PNP\d{3,4}$/.test(value)) return value;
    if (value.length !== 6) continue;
    const layouts = [
      'LLLDDD', 'LDLDDD', 'LLDDDD', 'LDDDDD',
    ];
    for (const layout of layouts) {
      let normalized = '';
      let valid = true;
      for (let index = 0; index < 6; index++) {
        const char = value[index];
        if (layout[index] === 'L') {
          const mapped = ({ '0': 'O', '1': 'I', '2': 'Z', '5': 'S', '6': 'G', '8': 'B' } as Record<string, string>)[char] || char;
          if (!/[A-Z]/.test(mapped)) { valid = false; break; }
          normalized += mapped;
        } else {
          const mapped = ({ O: '0', Q: '0', D: '0', I: '1', L: '1', Z: '2', S: '5', B: '8', G: '6' } as Record<string, string>)[char] || char;
          if (!/\d/.test(mapped)) { valid = false; break; }
          normalized += mapped;
        }
      }
      if (valid && /^(?:[A-Z]{3}\d{3}|[A-Z]\d[A-Z]\d{3}|[A-Z]{2}\d{4}|[A-Z]\d\d{4})$/.test(normalized)) return normalized;
    }
  }
  return null;
}

type OcrLine = {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
};

/** Selects a plate-like OCR line near the center of the camera guide. */
export function extractPeruvianPlateFromLines(
  lines: OcrLine[] | null | undefined,
  width: number,
  height: number,
): { plate: string; confidence: number; line: string; bbox: OcrLine['bbox'] } | null {
  if (!lines?.length || width <= 0 || height <= 0) return null;
  const candidates = lines.flatMap((line) => {
    const plate = extractPeruvianPlate(line.text);
    if (!plate) return [];
    const boxWidth = line.bbox.x1 - line.bbox.x0;
    const boxHeight = line.bbox.y1 - line.bbox.y0;
    if (boxWidth <= 0 || boxHeight <= 0) return [];
    const centerX = (line.bbox.x0 + line.bbox.x1) / 2 / width;
    const centerY = (line.bbox.y0 + line.bbox.y1) / 2 / height;
    const aspect = boxWidth / boxHeight;
    // Plate characters form a wide line and should be near the user's target.
    if (aspect < 1.45 || boxWidth / width < 0.16 || centerX < 0.08 || centerX > 0.92 || centerY < 0.12 || centerY > 0.88) return [];
    const confidence = Number.isFinite(line.confidence) ? line.confidence : 0;
    const centerPenalty = Math.abs(centerX - 0.5) * 18 + Math.abs(centerY - 0.5) * 10;
    return [{ plate, confidence, line: line.text, bbox: line.bbox, score: confidence - centerPenalty + Math.min(12, boxWidth / width * 12) }];
  });
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  return best ? { plate: best.plate, confidence: best.confidence, line: best.line, bbox: best.bbox } : null;
}
