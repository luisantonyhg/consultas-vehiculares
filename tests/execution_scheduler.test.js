import test from 'node:test';
import assert from 'node:assert/strict';

import { runOrderedWithConcurrency } from '../src/services/execution_scheduler.js';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

test('inicia el siguiente servicio apenas se libera capacidad, sin esperar todo el lote', async () => {
  const events = [];
  const jobs = [
    async () => { events.push('start-1'); await delay(70); events.push('end-1'); return 1; },
    async () => { events.push('start-2'); await delay(10); events.push('end-2'); return 2; },
    async () => { events.push('start-3'); await delay(5); events.push('end-3'); return 3; },
  ];
  const result = await runOrderedWithConcurrency(jobs, 2);
  assert.ok(events.indexOf('start-3') < events.indexOf('end-1'));
  assert.deepEqual(result.map(item => item.status), ['fulfilled', 'fulfilled', 'fulfilled']);
});

test('conserva el orden de resultados y aísla fallos entre secciones', async () => {
  const result = await runOrderedWithConcurrency([
    async () => 'uno',
    async () => { throw new Error('portal caído'); },
    async () => 'tres',
  ], 2);
  assert.equal(result[0].value, 'uno');
  assert.equal(result[1].status, 'rejected');
  assert.equal(result[2].value, 'tres');
});
