import { createWorker, PSM } from 'tesseract.js';

let workerPromise: ReturnType<typeof createWorker> | null = null;

export function getPlateOcrWorker() {
  if (!workerPromise) {
    workerPromise = createWorker('eng', undefined, {
      logger: (event) => {
        if (event.status === 'loading language traineddata') {
          const status = document.getElementById('scanner-status-text');
          if (status) status.textContent = 'Preparando lectura local de placa…';
        }
      },
    }).then(async (worker) => {
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- ',
        tessedit_pageseg_mode: PSM.SPARSE_TEXT,
        user_defined_dpi: '300',
      });
      return worker;
    }).catch((error) => {
      workerPromise = null;
      throw error;
    });
  }
  return workerPromise;
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
