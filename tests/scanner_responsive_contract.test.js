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
