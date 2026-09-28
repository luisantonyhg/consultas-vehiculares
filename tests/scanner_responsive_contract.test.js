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

test('el escaneo de placa confirma rápido, limita solicitudes y se detiene al recibir 429', () => {
  assert.match(scanner, /const VOTE_RING_SIZE = 3/);
  assert.match(scanner, /const VOTES_NEEDED = 2/);
  assert.match(scanner, /const PLATE_SCAN_INTERVAL_MS = 450/);
  assert.match(scanner, /const PLATE_SCAN_MAX_ATTEMPTS = 8/);
  assert.match(scanner, /res\?\.status === 429/);
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
  assert.match(scanner, /ctx\.drawImage\(video, crop\.x, crop\.y, crop\.width, crop\.height/);
});
