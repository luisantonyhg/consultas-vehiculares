import test from 'node:test';
import assert from 'node:assert/strict';
import { isSatCaptchaExhausted, isSatTimeout, isLunasCaptchaError, runRetryCore } from '../src/services/sat_retry_policy.js';

test('T1 SAT CAPTCHA_EXHAUSTED stops automatic retry', () => {
    assert.equal(isSatCaptchaExhausted('sat_captura', 'No se pudo validar SAT Captura. Puede reintentar.'), true);
});
test('T2 transient network errors remain eligible for existing retry policy', () => {
    assert.equal(isSatCaptchaExhausted('sat_captura', 'Failed to fetch'), false);
});
test('SAT TIMEOUT preserves manual-only behavior and never opens a second browser automatically', async () => {
    assert.equal(isSatTimeout('sat_captura', { code: 'SAT_TIMEOUT', outcome: 'TIMEOUT' }), true);
    const result = await runRetryCore({
        cardId: 'sat_captura', maxAttempts: 2,
        fetchCall: async () => {
            const error = new Error('SAT agotó el tiempo');
            error.code = 'SAT_TIMEOUT'; error.outcome = 'TIMEOUT';
            throw error;
        },
    });
    assert.equal(result.calls, 1);
});
test('T3 confirmed negative does not trigger SAT CAPTCHA stop', () => {
    assert.equal(isSatCaptchaExhausted('sat_captura', 'CONFIRMED_NEGATIVE'), false);
});
test('T4 confirmed positive does not trigger SAT CAPTCHA stop', () => {
    assert.equal(isSatCaptchaExhausted('sat_captura', 'CONFIRMED_POSITIVE'), false);
});
test('T5 manual retry remains a new action', () => {
    assert.equal(isSatCaptchaExhausted('sat_captura', ''), false);
});
test('T6 other providers are unaffected', () => {
    assert.equal(isSatCaptchaExhausted('sat_deposito', 'No se pudo validar SAT Captura. Puede reintentar.'), false);
    assert.equal(isSatCaptchaExhausted('sunarp', 'No se pudo validar SAT Captura. Puede reintentar.'), false);
});

test('T1 CAPTCHA_EXHAUSTED calls===1', async () => {
    const result = await runRetryCore({ cardId: 'sat_captura', maxAttempts: 2, fetchCall: async () => { const e = new Error('irrelevant'); e.code = 'SAT_CAPTCHA_EXHAUSTED'; e.outcome = 'CAPTCHA_EXHAUSTED'; throw e; } });
    assert.equal(result.calls, 1);
});
test('T2 network calls===2', async () => {
    let calls = 0;
    const result = await runRetryCore({ cardId: 'citv', maxAttempts: 1, fetchCall: async () => { calls += 1; if (calls === 1) throw new Error('Failed to fetch'); return { success: true }; } });
    assert.equal(result.calls, 2);
});
test('T3/T4 SAT depósito y otro proveedor conservan retry', async () => {
    for (const cardId of ['sat_deposito', 'sunarp']) {
        let calls = 0;
        const result = await runRetryCore({ cardId, maxAttempts: 1, fetchCall: async () => { calls += 1; if (calls === 1) throw new Error('Failed to fetch'); return { success: true }; } });
        assert.equal(result.calls, 2);
    }
});
test('T5/T6 confirmed positive/negative no reintentan', async () => {
    for (const outcome of ['CONFIRMED_POSITIVE', 'CONFIRMED_NEGATIVE']) {
        const result = await runRetryCore({ cardId: 'sat_captura', maxAttempts: 2, fetchCall: async () => ({ success: true, outcome }) });
        assert.equal(result.calls, 1);
    }
});
test('T7 retry manual posterior permitido', async () => {
    let calls = 0;
    const first = async () => { calls += 1; const e = new Error(); e.code = 'SAT_CAPTCHA_EXHAUSTED'; throw e; };
    await runRetryCore({ cardId: 'sat_captura', maxAttempts: 2, fetchCall: first });
    const second = await runRetryCore({ cardId: 'sat_captura', maxAttempts: 1, fetchCall: async () => { calls += 1; return { success: true }; } });
    assert.equal(second.calls, 1);
    assert.equal(calls, 2);
});

test('Lunas CAPTCHA_ERROR stops automatic retry but manual action is independent', async () => {
    assert.equal(isLunasCaptchaError('lunas', { code: 'LUNAS_CAPTCHA_ERROR', outcome: 'CAPTCHA_ERROR' }), true);
    const first = await runRetryCore({ cardId: 'lunas', maxAttempts: 2, fetchCall: async () => { const e = new Error('texto'); e.code = 'LUNAS_CAPTCHA_ERROR'; throw e; } });
    assert.equal(first.calls, 1);
    const second = await runRetryCore({ cardId: 'lunas', maxAttempts: 1, fetchCall: async () => ({ success: true }) });
    assert.equal(second.calls, 1);
});

test('Lunas retryable_error conserva el segundo intento', async () => {
    let calls = 0;
    const result = await runRetryCore({ cardId: 'lunas', maxAttempts: 1, fetchCall: async () => {
        calls += 1; if (calls === 1) { const e = new Error('transitorio'); e.outcome = 'retryable_error'; throw e; } return { success: true };
    }});
    assert.equal(result.calls, 2);
});
