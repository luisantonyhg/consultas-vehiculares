import test from 'node:test';
import assert from 'node:assert/strict';

import { buildSPRLStatusBadge } from '../src/services/api.js';

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
