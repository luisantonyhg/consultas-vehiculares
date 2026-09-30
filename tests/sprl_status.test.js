import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { buildSPRLStatusBadge } from '../src/services/api.js';

const apiSource = fs.readFileSync(new URL('../src/services/api.js', import.meta.url), 'utf8');
const controllerSource = fs.readFileSync(new URL('../src/scripts/consulta/consulta-controller.ts', import.meta.url), 'utf8');

test('SPRL debug steps from API are not echoed to the browser console', () => {
  assert.doesNotMatch(apiSource, /debugSteps\.forEach\(step => console\.log/);
});

test('consulta diagnostics classify known Lunas failures without changing its result', () => {
  assert.match(controllerSource, /result\?\.code === 'LUNAS_CAPTCHA_ERROR' \? 'captcha_error'/);
  assert.match(controllerSource, /result\?\.code === 'LUNAS_TIMEOUT' \? 'timeout'/);
  assert.match(controllerSource, /result\?\.success === false \? 'error' : 'unknown'/);
});

test('SPRL parcial con asientos nunca afirma que no existen gravámenes', () => {
  const badge = buildSPRLStatusBadge({
    status: 'PARTIAL_RESULT',
    gravamenes: { status: 'NOT_VERIFIED' },
    verification: { encumbrances_history: 'NOT_VERIFIED' },
    resumen: { total_asientos: 8, gravamenes_vigentes: null },
  });

  assert.match(badge, /GRAVÁMENES PENDIENTES/);
  assert.match(badge, /bg-amber-500/);
  assert.doesNotMatch(badge, /SIN GRAVÁMENES VERIFICADO/);
});

test('SPRL solo afirma ausencia de gravámenes con verificación explícita', () => {
  const badge = buildSPRLStatusBadge({
    status: 'OK',
    gravamenes: { status: 'VERIFIED_NONE' },
    resumen: { total_asientos: 3, gravamenes_vigentes: 0 },
  });

  assert.match(badge, /SIN GRAVÁMENES VERIFICADO/);
  assert.match(badge, /bg-emerald-500/);
});

test('SPRL marca como alerta un gravamen activo', () => {
  const badge = buildSPRLStatusBadge({
    status: 'OK',
    gravamenes: { status: 'FOUND' },
    resumen: { gravamenes_vigentes: 1 },
  });

  assert.match(badge, /CON GRAVÁMENES/);
  assert.match(badge, /bg-rose-600/);
});
