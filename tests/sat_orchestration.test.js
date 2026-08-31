import test from 'node:test';
import assert from 'node:assert/strict';

import { runFetchSAT } from '../src/services/api.js';

test('SAT no lanza una segunda consulta automática cuando depósito queda parcial', async () => {
  const previousFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    return new Response(JSON.stringify({
      success: true,
      captura: {
        success: true,
        tiene: false,
        mensaje: 'Sin orden de captura',
      },
      deposito: {
        success: false,
        error: 'Captcha SAT no validado',
      },
      error: null,
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };

  const rendered = [];
  const callbacks = {
    setCardLoading() {},
    setCardData(id) { rendered.push(['data', id]); },
    setCardError(id) { rendered.push(['error', id]); },
  };

  try {
    const result = await runFetchSAT('ABC123', 'https://backend.test/api/v1', callbacks);
    assert.equal(result.success, true);
    assert.equal(calls.length, 1);
    assert.match(calls[0], /\/sat\/ABC123$/);
    assert.deepEqual(rendered, [
      ['data', 'sat_captura'],
      ['error', 'sat_deposito'],
    ]);
  } finally {
    globalThis.fetch = previousFetch;
  }
});
