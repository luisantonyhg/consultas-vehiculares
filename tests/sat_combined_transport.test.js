import test from 'node:test';
import assert from 'node:assert/strict';

import { runFetchSAT } from '../src/services/api.js';

const callbacks = () => ({
  setCardLoading() {},
  setCardData() {},
  setCardError() {},
});

test('SAT unificado consulta una vez y preserva captura y depósito', async () => {
  const previousFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    return new Response(JSON.stringify({
      success: true,
      captura: { success: true, tiene: false, outcome: 'CONFIRMED_NEGATIVE' },
      deposito: { success: true, internado: false, outcome: 'CONFIRMED_NEGATIVE' },
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  try {
    const result = await runFetchSAT('AVW604', 'https://backend.test/api/v1', callbacks());
    assert.equal(calls.length, 1);
    assert.match(calls[0], /\/sat\/AVW604$/);
    assert.equal(result.captura.success, true);
    assert.equal(result.deposito.success, true);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('un fallo de Captcha conserva el resultado útil de depósito', async () => {
  const previousFetch = globalThis.fetch;
  const errors = [];
  globalThis.fetch = async () => new Response(JSON.stringify({
    success: true,
    captura: { success: false, outcome: 'CAPTCHA_EXHAUSTED', error: 'Captcha no validado' },
    deposito: { success: true, internado: false, outcome: 'CONFIRMED_NEGATIVE' },
  }), { status: 200, headers: { 'content-type': 'application/json' } });
  try {
    const result = await runFetchSAT('AVW604', 'https://backend.test/api/v1', {
      ...callbacks(),
      setCardError(...args) { errors.push(args); },
    });
    assert.equal(result.success, true);
    assert.equal(result.deposito.success, true);
    assert.equal(errors.length, 1);
  } finally {
    globalThis.fetch = previousFetch;
  }
});
