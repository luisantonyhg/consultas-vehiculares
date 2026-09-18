import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { secureFetch, setManualRetrySection } from '../src/services/transport.js';

const consultationSource = fs.readFileSync(new URL('../src/pages/consulta.astro', import.meta.url), 'utf8');

test('FISE manual retry dispatches the FISE provider', () => {
    assert.match(consultationSource, /cardId === 'fise'\)\s+await fetchFISE\(plate\)/);
});

test('manual retry headers only travel with the selected section', async () => {
    const oldFetch = globalThis.fetch;
    const observed = [];
    globalThis.fetch = async (_url, options) => {
        observed.push(options.headers);
        return new Response('{}', { status: 200 });
    };
    try {
        setManualRetrySection('fise');
        await secureFetch('https://api.example.test/api/v1/fise/ABC123');
        await secureFetch('https://api.example.test/api/v1/sat/ABC123');

        assert.equal(observed[0]['X-Manual-Retry'], '1');
        assert.equal(observed[0]['X-Manual-Retry-Section'], 'fise');
        assert.equal(observed[1]['X-Manual-Retry'], undefined);
        assert.equal(observed[1]['X-Manual-Retry-Section'], undefined);
    } finally {
        setManualRetrySection(null);
        globalThis.fetch = oldFetch;
    }
});
