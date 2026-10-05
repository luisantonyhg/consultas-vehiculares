import test from 'node:test';
import assert from 'node:assert/strict';
import { initVisits } from '../src/ui/visits.js';

function storage() {
    const values = new Map();
    return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test('contador real: deduplica navegación, comparte solicitudes y rechaza cifras inválidas', async () => {
    const names = ['document', 'localStorage', 'sessionStorage', 'fetch'];
    const originals = names.map((name) => Object.getOwnPropertyDescriptor(globalThis, name));
    const counter = { textContent: '...' };
    for (const [name, value] of Object.entries({
        document: { getElementById: () => counter }, localStorage: storage(), sessionStorage: storage(),
    })) Object.defineProperty(globalThis, name, { configurable: true, value });
    let calls = 0;
    let release;
    globalThis.fetch = async () => {
        calls++;
        await new Promise((resolve) => { release = resolve; });
        return new Response(JSON.stringify({ success: true, total: 1234 }));
    };
    try {
        const first = initVisits('https://backend.test', 'test');
        const second = initVisits('https://backend.test', 'test');
        release();
        await Promise.all([first, second]);
        assert.equal(calls, 1);
        assert.equal(counter.textContent, (1234).toLocaleString());
        await initVisits('https://backend.test', 'test');
        assert.equal(calls, 1);
        globalThis.fetch = async () => new Response(JSON.stringify({ success: true, total: -20 }));
        await initVisits('https://invalid.test', 'test');
        assert.equal(counter.textContent, 'No disponible');
        globalThis.fetch = async () => { throw new Error('offline'); };
        await initVisits('https://offline.test', 'test');
        assert.equal(counter.textContent, 'No disponible');
        Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, get() { throw new Error('blocked'); } });
        await initVisits('https://blocked.test', 'test');
        assert.equal(counter.textContent, 'No disponible');
    } finally {
        names.forEach((name, i) => originals[i] ? Object.defineProperty(globalThis, name, originals[i]) : delete globalThis[name]);
    }
});
