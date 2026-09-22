import test from 'node:test';
import assert from 'node:assert/strict';

import { runFetchGNV } from '../src/services/providers/energy_municipal.js';

test('GNV sin registro oficial conserva un estado verde explícito', async () => {
  const originalFetch = globalThis.fetch;
  let rendered = null;
  globalThis.fetch = async () => new Response(JSON.stringify({
    success: true,
    data: [],
    outcome: 'VERIFIED_NONE',
    provider_status: 'VERIFIED_NONE',
  }), { status: 200, headers: { 'content-type': 'application/json' } });

  try {
    await runFetchGNV('T6T487', 'https://backend.test', {
      setCardLoading() {},
      setCardError() { assert.fail('un resultado VERIFIED_NONE no es un error'); },
      setCardData(...args) { rendered = { badge: args[9] }; },
    });
    assert.match(rendered.badge, /SIN REGISTRO GNV/);
    assert.match(rendered.badge, /bg-emerald-500/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
