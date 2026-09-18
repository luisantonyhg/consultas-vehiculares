/** SAT Captura only: backend-exhausted CAPTCHA is retryable manually, not automatically. */
export function isSatCaptchaExhausted(cardId, errorOrMessage = '') {
    if (cardId !== 'sat_captura') return false;
    if (errorOrMessage?.code === 'SAT_CAPTCHA_EXHAUSTED' || errorOrMessage?.outcome === 'CAPTCHA_EXHAUSTED') return true;
    return String(errorOrMessage?.message ?? errorOrMessage).includes('No se pudo validar SAT Captura');
}

/** A SAT browser timeout is terminal for this automatic run; the user may retry manually. */
export function isSatTimeout(cardId, errorOrMessage = '') {
    return cardId === 'sat_captura' && (
        errorOrMessage?.code === 'SAT_TIMEOUT' ||
        errorOrMessage?.outcome === 'TIMEOUT' ||
        errorOrMessage?.providerStatus === 'timeout'
    );
}

export function isLunasCaptchaError(cardId, errorOrMessage = '') {
    if (cardId !== 'lunas') return false;
    if (errorOrMessage?.code === 'LUNAS_CAPTCHA_ERROR' || errorOrMessage?.outcome === 'CAPTCHA_ERROR') return true;
    return String(errorOrMessage?.message ?? errorOrMessage).toLowerCase().includes('captcha');
}

export function isLunasRetryableError(cardId, errorOrMessage = '') {
    return cardId === 'lunas' && (errorOrMessage?.code === 'LUNAS_RETRYABLE_ERROR' || errorOrMessage?.outcome === 'retryable_error');
}

export function isLunasTimeout(cardId, errorOrMessage = '') {
    return cardId === 'lunas' && (errorOrMessage?.code === 'LUNAS_TIMEOUT' || errorOrMessage?.outcome === 'TIMEOUT' || errorOrMessage?.providerStatus === 'timeout');
}

export function isLimaTimeout(cardId, errorOrMessage = '') {
    return cardId === 'lima' && (errorOrMessage?.code === 'LIMA_TIMEOUT' || errorOrMessage?.outcome === 'TIMEOUT' || errorOrMessage?.providerStatus === 'timeout');
}

export function isCallaoTimeout(cardId, errorOrMessage = '') {
    return cardId === 'callao' && (
        errorOrMessage?.code === 'CALLAO_TIMEOUT' ||
        errorOrMessage?.outcome === 'TIMEOUT' ||
        errorOrMessage?.providerStatus === 'timeout'
    );
}

export function isFiseRetryableError(cardId, errorOrMessage = '') {
    if (cardId !== 'fise') return false;
    return errorOrMessage?.retryable === true || [
        'FISE_NETWORK_ERROR',
        'FISE_UPSTREAM_ERROR',
        'FISE_PORT_UNREACHABLE',
        'FISE_CLIENT_TIMEOUT',
        'FISE_CLIENT_NETWORK_ERROR',
    ].includes(errorOrMessage?.code);
}

export function shouldAutoRetry({ cardId, error, attempt, maxAttempts }) {
    const message = String(error?.message ?? error ?? '');
    const normalized = message.toLowerCase();
    const is404 = message.includes('404') || message.includes('actualización') || message.includes('no encontrada');
    // Un 409 del ConsultationGate significa que SUNARP cerró la consulta por
    // placa inexistente; jamás debe tratarse como una falla reintentable.
    const gateClosed = error?.providerStatus === 'gate_closed' || error?.gateStatus === 'closed' || message.includes('HTTP 409');
    const isConnection = ['Failed to fetch', 'NetworkError', 'CONNECTION_REFUSED'].some(x => message.includes(x));
    const backpressure = ['429', '503', 'demasiadas consultas', 'servidor ocupado', 'alta demanda'].some(x => normalized.includes(x));
    const timeout = ['tiempo de espera', 'tiempo límite', 'tiempo máximo', 'timeout'].some(x => normalized.includes(x));
    const citvTimeout = cardId === 'citv' && (
        error?.code === 'CITV_TIMEOUT' ||
        error?.outcome === 'TIMEOUT' ||
        error?.providerStatus === 'timeout'
    );
    const citvCaptchaExhausted = cardId === 'citv' && (
        error?.code === 'CITV_CAPTCHA_ERROR' ||
        error?.outcome === 'CAPTCHA_ERROR'
    );
    const permanentProxy = normalized.includes('configure fise_proxy') || normalized.includes('no permite connect al puerto 23308');
    const maintenance = normalized.includes('mantenimiento') || normalized.includes('desarrollo');
    // Lima ya agota sus intentos CapSolver dentro del backend. Repetir toda la
    // sección desde el navegador duplica coste y puede crear más tokens, sin
    // aportar una señal nueva; queda disponible el reintento manual.
    // Callao: OCR.Space puede ser lento (~6-10s); reintento automático 1 vez.
    const retryableTimeout = new Set(['sunarp', 'fise', 'callao']);
    if (is404 || gateClosed || permanentProxy || maintenance || citvTimeout || citvCaptchaExhausted || isSatCaptchaExhausted(cardId, error) || isSatTimeout(cardId, error) || isLunasTimeout(cardId, error) || isLunasCaptchaError(cardId, error) || isLimaTimeout(cardId, error) || (timeout && !retryableTimeout.has(cardId))) return { retry: false, effectiveMaxAttempts: maxAttempts };
    if (isLunasRetryableError(cardId, error) || isFiseRetryableError(cardId, error)) {
        // Un segundo intento FISE crea un token CAPTCHA nuevo y no repite el
        // POST con uno potencialmente consumido. El límite es deliberadamente 2.
        return { retry: attempt < Math.max(maxAttempts, 2), effectiveMaxAttempts: Math.max(maxAttempts, 2) };
    }
    const effectiveMaxAttempts = backpressure ? Math.max(maxAttempts, 3) : isConnection ? Math.max(maxAttempts, 2) : maxAttempts;
    return { retry: attempt < effectiveMaxAttempts, effectiveMaxAttempts };
}

export async function runRetryCore({ cardId, fetchCall, maxAttempts = 1, onComplete = () => {} }) {
    let calls = 0;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        calls += 1;
        try { const result = await fetchCall(attempt); onComplete({ type: 'success', attempt }); return { result, calls }; }
        catch (error) {
            const decision = shouldAutoRetry({ cardId, error, attempt, maxAttempts });
            if (!decision.retry) { onComplete({ type: 'error', attempt, error }); return { result: { success: false, error: error.message }, calls }; }
            maxAttempts = decision.effectiveMaxAttempts;
        }
    }
    return { result: { success: false }, calls };
}
