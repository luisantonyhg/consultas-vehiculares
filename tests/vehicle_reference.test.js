import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveVehicleReference } from '../src/services/vehicle_reference.js';

test('usa marca y modelo SUNARP cuando AAP no devuelve información', () => {
  assert.deepEqual(
    resolveVehicleReference({}, { marca: 'TOYOTA', modelo: 'HILUX', anio: '2021' }),
    { marca: 'TOYOTA', modelo: 'HILUX', anio: '2021' },
  );
});

test('AAP conserva prioridad y SUNARP completa únicamente campos ausentes', () => {
  assert.deepEqual(
    resolveVehicleReference(
      { marca: 'KIA', modelo: '—', anioFabricacion: '2020' },
      { marca: 'TOYOTA', modelo: 'PICANTO', anio: '2019' },
    ),
    { marca: 'KIA', modelo: 'PICANTO', anio: '2020' },
  );
});
