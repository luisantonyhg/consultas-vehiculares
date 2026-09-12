import test from 'node:test';
import assert from 'node:assert/strict';

import { runFetchCinemometro } from '../src/services/providers/official_portals.js';

function callbacks() {
    return {
        setCardLoading() {},
        setCardData() {},
        setCardError() { assert.fail('La respuesta dentro del presupuesto no debe fallar'); },
    };
}

test('Cinemómetro conserva margen cliente sobre el presupuesto máximo del backend', async () => {
    const oldFetch = globalThis.fetch;
    const oldSetTimeout = globalThis.setTimeout;
    const oldClearTimeout = globalThis.clearTimeout;
    const scheduled = [];
    globalThis.setTimeout = (_callback, delay) => {
        scheduled.push(delay);
        return { delay };
    };
    globalThis.clearTimeout = () => {};
    globalThis.fetch = async () => new Response(JSON.stringify({ success: true, data: [], info_reporte: '' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
    });
    try {
        const result = await runFetchCinemometro('BHP751', 'http://backend', callbacks());
        assert.equal(result.success, true);
        // Route: 80 s; follower SingleFlight: 90 s. Cliente: 95 s.
        assert.equal(scheduled[0], 95_000);
    } finally {
        globalThis.fetch = oldFetch;
        globalThis.setTimeout = oldSetTimeout;
        globalThis.clearTimeout = oldClearTimeout;
    }
});
