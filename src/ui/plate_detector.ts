import * as ort from 'onnxruntime-web';

const MODEL_URL = `${import.meta.env.BASE_URL}models/placa_peru_yolo11-v1.onnx`;
const INPUT_SIZE = 640;
const CONFIDENCE_THRESHOLD = 0.20;
const NMS_IOU_THRESHOLD = 0.45;

export interface PlateBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export type DetectorReporter = (stage: string, detail: string, level?: 'INFO' | 'WARN' | 'ERROR') => void;

let sessionPromise: Promise<ort.InferenceSession> | null = null;
let sessionInput = '';
let sessionOutput = '';

function createSession(report: DetectorReporter): Promise<ort.InferenceSession> {
  if (sessionPromise) return sessionPromise;

  sessionPromise = (async () => {
    const startedAt = performance.now();
    report('modelo', `Descargando detector local (38 MB) desde ${MODEL_URL}; el navegador podrá reutilizar su caché.`);
    const response = await fetch(MODEL_URL, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`Descarga del modelo HTTP ${response.status}.`);
    const expectedBytes = Number(response.headers.get('content-length')) || 0;
    const reader = response.body?.getReader();
    let model: ArrayBuffer;
    if (reader && expectedBytes > 0) {
      const bytes = new Uint8Array(expectedBytes);
      let received = 0;
      let lastReported = -10;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes.set(value, received);
        received += value.length;
        const percent = Math.floor(received * 100 / expectedBytes);
        if (percent >= lastReported + 10) {
          lastReported = percent;
          report('modelo_descarga', `Descarga del modelo: ${percent}%.`);
        }
      }
      model = bytes.buffer;
    } else {
      const chunks: Uint8Array[] = [];
      let totalBytes = 0;
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          totalBytes += value.length;
        }
      } else {
        const buffer = await response.arrayBuffer();
        chunks.push(new Uint8Array(buffer));
        totalBytes = buffer.byteLength;
      }
      const bytes = new Uint8Array(totalBytes);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
      }
      model = bytes.buffer;
    }
    report('modelo', `Modelo listo: ${(model.byteLength / 1_000_000).toFixed(1)} MB en ${(performance.now() - startedAt).toFixed(0)} ms.`);

    ort.env.wasm.numThreads = 1;
    ort.env.wasm.proxy = false;
    const hasWebGpu = typeof navigator !== 'undefined' && 'gpu' in navigator;
    if (hasWebGpu) {
      try {
        const gpuSession = await ort.InferenceSession.create(model, {
          executionProviders: ['webgpu'],
          graphOptimizationLevel: 'all',
        });
        sessionInput = gpuSession.inputNames[0];
        sessionOutput = gpuSession.outputNames[0];
        report('modelo', `Detector ejecutándose en WebGPU; inicialización ${(performance.now() - startedAt).toFixed(0)} ms.`);
        return gpuSession;
      } catch (error) {
        report('modelo_webgpu', `WebGPU no disponible para este modelo (${error instanceof Error ? error.message : String(error)}); se usará WASM.`, 'WARN');
      }
    }

    const cpuSession = await ort.InferenceSession.create(model, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });
    sessionInput = cpuSession.inputNames[0];
    sessionOutput = cpuSession.outputNames[0];
    report('modelo', `Detector ejecutándose en WASM local; inicialización ${(performance.now() - startedAt).toFixed(0)} ms.`);
    return cpuSession;
  })().catch((error) => {
    sessionPromise = null;
    throw error;
  });

  return sessionPromise;
}

function makeInput(source: HTMLCanvasElement) {
  const scale = Math.min(INPUT_SIZE / source.width, INPUT_SIZE / source.height);
  const drawWidth = Math.max(1, Math.round(source.width * scale));
  const drawHeight = Math.max(1, Math.round(source.height * scale));
  const padX = Math.floor((INPUT_SIZE - drawWidth) / 2);
  const padY = Math.floor((INPUT_SIZE - drawHeight) / 2);
  const canvas = document.createElement('canvas');
  canvas.width = INPUT_SIZE;
  canvas.height = INPUT_SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('No se pudo preparar el frame para el detector.');
  context.fillStyle = 'rgb(114,114,114)';
  context.fillRect(0, 0, INPUT_SIZE, INPUT_SIZE);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, padX, padY, drawWidth, drawHeight);

  const rgba = context.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE).data;
  const tensor = new Float32Array(3 * INPUT_SIZE * INPUT_SIZE);
  const plane = INPUT_SIZE * INPUT_SIZE;
  for (let pixel = 0; pixel < plane; pixel++) {
    const rgbaIndex = pixel * 4;
    tensor[pixel] = rgba[rgbaIndex] / 255;
    tensor[plane + pixel] = rgba[rgbaIndex + 1] / 255;
    tensor[plane * 2 + pixel] = rgba[rgbaIndex + 2] / 255;
  }
  return { tensor, scale, padX, padY };
}

function intersectionOverUnion(a: PlateBox, b: PlateBox): number {
  const left = Math.max(a.x, b.x);
  const top = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  const intersection = Math.max(0, right - left) * Math.max(0, bottom - top);
  const union = a.width * a.height + b.width * b.height - intersection;
  return union > 0 ? intersection / union : 0;
}

function decodeBox(output: ort.Tensor, source: HTMLCanvasElement, scale: number, padX: number, padY: number): PlateBox | null {
  const dims = output.dims;
  if (dims.length !== 3 || dims[0] !== 1 || dims[1] !== 5) {
    throw new Error(`Salida ONNX inesperada: [${dims.join(',')}], se esperaba [1,5,N].`);
  }
  const data = output.data as Float32Array;
  const anchorCount = dims[2];
  const candidates: PlateBox[] = [];

  for (let index = 0; index < anchorCount; index++) {
    const confidence = data[anchorCount * 4 + index];
    if (confidence < CONFIDENCE_THRESHOLD) continue;
    const centerX = data[index];
    const centerY = data[anchorCount + index];
    const boxWidth = data[anchorCount * 2 + index];
    const boxHeight = data[anchorCount * 3 + index];
    const x = Math.max(0, Math.min(source.width, (centerX - boxWidth / 2 - padX) / scale));
    const y = Math.max(0, Math.min(source.height, (centerY - boxHeight / 2 - padY) / scale));
    const right = Math.max(x, Math.min(source.width, (centerX + boxWidth / 2 - padX) / scale));
    const bottom = Math.max(y, Math.min(source.height, (centerY + boxHeight / 2 - padY) / scale));
    if (right - x < 12 || bottom - y < 6) continue;
    candidates.push({ x, y, width: right - x, height: bottom - y, confidence });
  }

  candidates.sort((a, b) => b.confidence - a.confidence);
  const selected: PlateBox[] = [];
  for (const candidate of candidates) {
    if (selected.every((kept) => intersectionOverUnion(candidate, kept) <= NMS_IOU_THRESHOLD)) selected.push(candidate);
  }
  return selected[0] || null;
}

export async function loadPlateDetector(report: DetectorReporter): Promise<void> {
  await createSession(report);
}

export async function detectPlate(source: HTMLCanvasElement): Promise<PlateBox | null> {
  const session = await createSession(() => {});
  const { tensor, scale, padX, padY } = makeInput(source);
  const outputs = await session.run({ [sessionInput]: new ort.Tensor('float32', tensor, [1, 3, INPUT_SIZE, INPUT_SIZE]) });
  const output = outputs[sessionOutput];
  if (!output) throw new Error('El modelo no devolvió su salida de detección.');
  return decodeBox(output, source, scale, padX, padY);
}

export async function disposePlateDetector(): Promise<void> {
  const pendingSession = sessionPromise;
  sessionPromise = null;
  sessionInput = '';
  sessionOutput = '';
  if (pendingSession) {
    try {
      await (await pendingSession).release();
    } catch {
      // Cerrar el modal no debe dejar recursos de cámara abiertos si ORT ya liberó el contexto.
    }
  }
}
