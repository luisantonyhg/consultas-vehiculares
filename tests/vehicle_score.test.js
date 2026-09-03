import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateVehicleScore } from '../src/services/vehicle_score.js';

test('un SOAT detallado evita una alerta falsa si la consulta simple vino vacía', () => {
  const result = calculateVehicleScore({
    soat: { success: true, data: [] },
    soat_detallado: { success: true, certificados: [{ estado: 'VIGENTE' }] },
  });
  assert.equal(result.score, 100);
  assert.equal(result.alerts.length, 0);
});

test('las fuentes caídas reducen confianza sin inventar hallazgos', () => {
  const result = calculateVehicleScore({
    soat: { success: false },
    citv: { success: false },
    sigm: { success: false },
  });
  assert.equal(result.score, 70);
  assert.equal(result.failed, 3);
  assert.equal(result.alerts.length, 0);
});

test('garantía, captura y siniestro producen un índice rojo y explicable', () => {
  const result = calculateVehicleScore({
    sigm: { success: true, tiene_garantias: true },
    sat_captura: { success: true, captura: { tiene: true } },
    sbs: { success: true, soat: { total_accidentes: 1 } },
  });
  assert.equal(result.score, 30);
  assert.deepEqual(result.alerts.map(item => item.points), [25, 15, 30]);
});
