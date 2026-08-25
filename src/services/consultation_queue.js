/** Sala de espera y ciclo de vida de una consulta completa. */
import { secureFetch } from './transport.js';

export async function acquireConsultationSlot(BACKEND_URL, captchaProof = {}) {
    const res = await secureFetch(`${BACKEND_URL}/consultations`, {
        method: 'POST',
        headers: {
            'X-Turnstile-Token': captchaProof.turnstileToken || '',
            'X-Captcha-Challenge': captchaProof.challengeId || '',
            'X-Captcha-Answer': captchaProof.answer || '',
        },
    });
    if (res.status === 404) return { supported: false, status: 'active' };
    if (!res.ok) {
        const retryAfter = Number(res.headers.get('Retry-After') || 30);
        const err = new Error(
            res.status === 503
                ? `Estamos atendiendo muchas consultas. Inténtalo nuevamente en ${retryAfter} segundos.`
                : res.status === 422
                    ? 'La verificación anti-bots fue rechazada o expiró. Complétala nuevamente.'
                    : `No se pudo reservar un turno (HTTP ${res.status}).`
        );
        err.name = res.status === 503 ? 'ConsultationQueueFull' : 'ConsultationQueueError';
        err.status = res.status;
        err.retryAfter = retryAfter;
        throw err;
    }
    return { supported: true, ...(await res.json()) };
}

export async function waitForConsultationSlot(BACKEND_URL, initialState, onUpdate) {
    if (!initialState?.supported || initialState.status === 'active') return initialState;
    let state = initialState;
    const deadline = Date.now() + 210000;
    while (state.status === 'queued') {
        if (Date.now() >= deadline) {
            const err = new Error('La espera está tomando más de lo previsto. Inténtalo nuevamente en unos segundos.');
            err.name = 'ConsultationQueueTimeout';
            throw err;
        }
        if (onUpdate) onUpdate(state);
        await new Promise(resolve => setTimeout(resolve, Math.max(750, state.poll_after_ms || 1500)));
        const res = await secureFetch(`${BACKEND_URL}/consultations/${encodeURIComponent(state.ticket_id)}`);
        if (res.status === 404) {
            const err = new Error('Tu turno expiró antes de comenzar. Inténtalo nuevamente.');
            err.name = 'ConsultationQueueExpired';
            throw err;
        }
        if (!res.ok) throw new Error(`Error consultando el turno (HTTP ${res.status}).`);
        state = { supported: true, ...(await res.json()) };
    }
    if (onUpdate) onUpdate(state);
    return state;
}

export async function touchConsultationSlot(BACKEND_URL, ticketId) {
    if (!ticketId) return null;
    const res = await secureFetch(`${BACKEND_URL}/consultations/${encodeURIComponent(ticketId)}`);
    if (!res.ok) return null;
    return await res.json();
}

export async function waitForHeavyPhase(BACKEND_URL, ticketId, onUpdate) {
    const reserve = await secureFetch(
        `${BACKEND_URL}/consultations/${encodeURIComponent(ticketId)}/heavy-phase`,
        { method: 'POST' }
    );
    if (!reserve.ok) throw new Error(`No se pudo reservar la fase avanzada (HTTP ${reserve.status}).`);
    let state = await reserve.json();
    const deadline = Date.now() + 12 * 60 * 1000;
    while (state.heavy_status === 'queued') {
        if (onUpdate) onUpdate(state);
        if (Date.now() >= deadline) {
            const err = new Error('La fase avanzada está tomando más de lo previsto. Los resultados rápidos permanecen disponibles.');
            err.name = 'ConsultationQueueTimeout';
            throw err;
        }
        await new Promise(resolve => setTimeout(resolve, Math.max(1000, state.poll_after_ms || 1500)));
        const current = await secureFetch(`${BACKEND_URL}/consultations/${encodeURIComponent(ticketId)}`);
        if (!current.ok) throw new Error(`El turno de la fase avanzada expiró (HTTP ${current.status}).`);
        state = await current.json();
    }
    if (onUpdate) onUpdate(state);
    return state;
}

export async function releaseConsultationSlot(BACKEND_URL, ticketId, keepalive = false) {
    if (!ticketId) return;
    try {
        await secureFetch(`${BACKEND_URL}/consultations/${encodeURIComponent(ticketId)}/complete`, {
            method: 'POST',
            keepalive,
        });
    } catch (_err) {
        // El lease del backend libera automáticamente reservas abandonadas.
    }
}
