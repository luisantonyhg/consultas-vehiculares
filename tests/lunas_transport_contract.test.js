import test from 'node:test';
import assert from 'node:assert/strict';
import { runFetchLunas } from '../src/services/providers/official_portals.js';
import fs from 'node:fs';

const consultationSource = fs.readFileSync(new URL('../src/pages/consulta.astro', import.meta.url), 'utf8');

function callbacks() {
    return {
        setCardLoading() {}, setCardData() {},
        setCardError(_id, _t, _s, _i, _b, _src, _msg, _plate, meta) { this.meta = meta; },
    };
}

test('Lunas body code survives when custom header is not visible', async () => {
    const oldFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({ success: false, error: 'captcha', code: 'LUNAS_CAPTCHA_ERROR', outcome: 'CAPTCHA_ERROR' }), { status: 200 });
    try {
        const cb = callbacks();
        const result = await runFetchLunas('BHP751', 'http://backend', cb);
        assert.equal(result.code, 'LUNAS_CAPTCHA_ERROR');
        assert.equal(result.outcome, 'CAPTCHA_ERROR');
        assert.equal(cb.meta.code, 'LUNAS_CAPTCHA_ERROR');
    } finally { globalThis.fetch = oldFetch; }
});

test('Lunas legacy header is translated for compatibility', async () => {
    const oldFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({ success: false, error: 'captcha' }), { status: 200, headers: { 'X-Provider-Status': 'captcha_error' } });
    try {
        const result = await runFetchLunas('BHP751', 'http://backend', callbacks());
        assert.equal(result.code, 'LUNAS_CAPTCHA_ERROR');
        assert.equal(result.outcome, 'CAPTCHA_ERROR');
    } finally { globalThis.fetch = oldFetch; }
});

test('Lunas timeout body is preserved for retry policy', async () => {
    const oldFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({ success: false, error: 'timeout', code: 'LUNAS_TIMEOUT', outcome: 'TIMEOUT' }), { status: 200 });
    try {
        const result = await runFetchLunas('BHP751', 'http://backend', callbacks());
        assert.equal(result.code, 'LUNAS_TIMEOUT');
        assert.equal(result.outcome, 'TIMEOUT');
    } finally { globalThis.fetch = oldFetch; }
});

test('Lunas deferred retry uses a new official session only when explicitly requested', async () => {
    const oldFetch = globalThis.fetch;
    let url = '';
    globalThis.fetch = async (requestUrl) => {
        url = String(requestUrl);
        return new Response(JSON.stringify({ success: false, code: 'LUNAS_TIMEOUT', outcome: 'TIMEOUT' }), { status: 200 });
    };
    try {
        await runFetchLunas('BHP751', 'http://backend', callbacks(), { forceRefresh: true });
        assert.equal(url, 'http://backend/lunas/BHP751?force_refresh=true');
    } finally { globalThis.fetch = oldFetch; }
});

test('CAPTCHA_ERROR gets exactly one deferred normal session after the primary report', () => {
    assert.match(consultationSource, /\[LUNAS-DEFERRED-RETRY\].*attempt=1\/1/s);
    assert.match(consultationSource, /reason=captcha_error attempt=1\/1 force_refresh=false/);
    assert.match(consultationSource, /await runSectionSafely\('lunas', \(\) => fetchLunas\(plate\)\)/);
    assert.match(consultationSource, /const lunasCaptchaRejected = !lunasInitial\?\.success/);
    assert.match(consultationSource, /lunasInitial\?\.code === 'LUNAS_CAPTCHA_ERROR'/);
    assert.doesNotMatch(consultationSource, /lunasTimedOut \|\| lunasCaptchaRejected/);
});
