import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { shouldAutoRetry } from '../src/services/sat_retry_policy.js';
import { runFetchLunas } from '../src/services/providers/official_portals.js';

const source = fs.readFileSync(new URL('../src/pages/consulta.astro', import.meta.url), 'utf8');

function callbacks() {
    return {
        setCardLoading() {}, setCardData() {}, setCardError(_id, _t, _s, _i, _b, _src, _msg, _plate, meta) { this.meta = meta; },
    };
}

test('T1/T2: timeout y CAPTCHA_ERROR de Lunas conservan contrato y no reintentan', async () => {
    for (const body of [
        { code: 'LUNAS_TIMEOUT', outcome: 'TIMEOUT' },
        { code: 'LUNAS_CAPTCHA_ERROR', outcome: 'CAPTCHA_ERROR' },
    ]) {
        globalThis.fetch = async () => new Response(JSON.stringify({ success: false, ...body }), { status: 200, headers: { 'X-Provider-Status': body.outcome === 'TIMEOUT' ? 'timeout' : 'captcha_error' } });
        const cb = callbacks();
        const result = await runFetchLunas('BHP751', 'http://backend', cb);
        assert.equal(result.code, body.code);
        assert.equal(result.outcome, body.outcome);
        assert.equal(shouldAutoRetry({ cardId: 'lunas', error: result, attempt: 1, maxAttempts: 2 }).retry, false);
    }
});

test('T3/T4: error de red conserva retry y la ventana normal no es stale', () => {
    assert.equal(shouldAutoRetry({ cardId: 'lunas', error: { code: 'NETWORK_ERROR' }, attempt: 1, maxAttempts: 2 }).retry, true);
    assert.match(source, /const expectedRunAt = scheduledAt \+ delay/);
    assert.match(source, /const staleWindowMs = Math\.max\(10000, delay \* 4\)/);
});

test('T5: callback tardía omite el segundo GET con stale_timer', () => {
    assert.match(source, /if \(latenessMs > staleWindowMs\) skipReason = 'stale_timer'/);
    assert.match(source, /\[RETRY-SKIP\].*reason=\$\{skipReason\}/s);
});

test('T6: generación o ticket cambiado omite retry', () => {
    assert.match(source, /retryGeneration !== consultationGeneration \|\| retryTicket !== activeConsultationTicket/);
    assert.match(source, /skipReason = 'consultation_changed'/);
});

test('T7: consulta completada o cancelada omite retry', () => {
    assert.match(source, /consultationLifecycle === 'completed'/);
    assert.match(source, /consultationLifecycle === 'cancelled'/);
});

test('T8-A/B: metadata estructurada llega a política sin depender solo del texto', async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({ success: false, code: 'LUNAS_TIMEOUT', outcome: 'TIMEOUT' }), { status: 200 });
    const cb = callbacks();
    const result = await runFetchLunas('BHP751', 'http://backend', cb);
    assert.equal(result.code, 'LUNAS_TIMEOUT');
    assert.equal(result.outcome, 'TIMEOUT');
    assert.equal(shouldAutoRetry({ cardId: 'lunas', error: result, attempt: 1, maxAttempts: 2 }).retry, false);
    assert.match(source, /errorMeta \|\| errorMessage/);
});
