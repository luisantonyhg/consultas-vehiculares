import test from 'node:test';
import assert from 'node:assert/strict';

import { acquireConsultationSlot } from '../src/services/consultation_queue.js';

test('envía el CAPTCHA al reservar y conserva el contrato del ticket', async () => {
  const previousFetch = globalThis.fetch;
  let receivedHeaders;
  globalThis.fetch = async (_url, options) => {
    receivedHeaders = options.headers;
    return new Response(JSON.stringify({ ticket_id: 'ticket-1', status: 'active' }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
  };
  try {
    const result = await acquireConsultationSlot('https://backend.test/api/v1', {
      challengeId: 'challenge-1', answer: 'A2B3', turnstileToken: 'turnstile-token-1',
    });
    assert.equal(result.ticket_id, 'ticket-1');
    assert.equal(receivedHeaders['X-Captcha-Challenge'], 'challenge-1');
    assert.equal(receivedHeaders['X-Captcha-Answer'], 'A2B3');
    assert.equal(receivedHeaders['X-Turnstile-Token'], 'turnstile-token-1');
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('convierte CAPTCHA inválido en mensaje útil', async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('{}', { status: 422 });
  try {
    await assert.rejects(
      () => acquireConsultationSlot('https://backend.test/api/v1', {}),
      /verificación anti-bots/i,
    );
  } finally {
    globalThis.fetch = previousFetch;
  }
});
