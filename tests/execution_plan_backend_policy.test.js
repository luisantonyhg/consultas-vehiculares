import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveExecutionLimits } from '../src/services/execution_plan.js';

test('el fallback conserva un solo carril pesado sin backend disponible', () => {
  assert.deepEqual(resolveExecutionLimits(null, { load_mode: 'fast' }), {
    fast_concurrency: 4,
    background_concurrency: 2,
    heavy_concurrency: 1,
    advanced_dispatch_concurrency: 2,
  });
});

test('un plan remoto no puede ampliar el carril pesado del navegador', () => {
  assert.deepEqual(resolveExecutionLimits({
    load_mode: 'fast',
    limits: { fast_concurrency: 99, background_concurrency: 99, heavy_concurrency: 4, advanced_dispatch_concurrency: 99 },
  }), {
    fast_concurrency: 4,
    background_concurrency: 2,
    heavy_concurrency: 1,
    advanced_dispatch_concurrency: 2,
  });
});
