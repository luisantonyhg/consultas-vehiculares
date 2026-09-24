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
    let backoffMs = 1000;
    while (state.status === 'queued') {
        if (Date.now() >= deadline) {
            const err = new Error('La espera está tomando más de lo previsto. Inténtalo nuevamente en unos segundos.');
            err.name = 'ConsultationQueueTimeout';
            throw err;
        }
        if (onUpdate) onUpdate(state);
        const suggested = Number(state.poll_after_ms || 0);
        const delay = Math.max(750, suggested || backoffMs);
        await new Promise(resolve => setTimeout(resolve, delay));
        backoffMs = Math.min(5000, Math.round(backoffMs * 1.5));
        // La espera de admisión también debe reconciliar Redis: una lectura
        // pasiva no puede liberar un ticket abandonado ni promover al primero.
        const res = await secureFetch(`${BACKEND_URL}/consultations/${encodeURIComponent(state.ticket_id)}?reconcile_heavy=true`);
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
    let reserve = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            reserve = await secureFetch(
                `${BACKEND_URL}/consultations/${encodeURIComponent(ticketId)}/heavy-phase`,
                { method: 'POST' }
            );
            if (reserve.ok || (reserve.status !== 503 && reserve.status !== 429)) {
                break;
            }
            if (attempt < 3) {
                console.warn(`[HEAVY-PHASE] Reserva respondió HTTP ${reserve.status} (intento ${attempt}/3). Reintentando en 1s...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (fetchErr) {
            if (attempt === 3) throw fetchErr;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    if (!reserve || !reserve.ok) throw new Error(`No se pudo reservar la fase avanzada (HTTP ${reserve?.status || '503'}).`);
    let state = await reserve.json();
    const deadline = Date.now() + 12 * 60 * 1000;
    let backoffMs = 1500;
    while (state.heavy_status === 'queued') {
        if (onUpdate) onUpdate(state);
        if (Date.now() >= deadline) {
            const err = new Error('La fase avanzada está tomando más de lo previsto. Los resultados rápidos permanecen disponibles.');
            err.name = 'ConsultationQueueTimeout';
            throw err;
        }
        const suggested = Number(state.poll_after_ms || 0);
        const delay = Math.max(1000, suggested || backoffMs);
        await new Promise(resolve => setTimeout(resolve, delay));
        backoffMs = Math.min(8000, Math.round(backoffMs * 1.35));
        // No es una lectura pasiva: el backend reconcilia atómicamente Redis,
        // renueva este heartbeat y promueve el primer turno pesado disponible.
        const current = await secureFetch(`${BACKEND_URL}/consultations/${encodeURIComponent(ticketId)}?reconcile_heavy=true`);
        if (!current.ok) throw new Error(`El turno de la fase avanzada expiró (HTTP ${current.status}).`);
        state = await current.json();
    }
    if (onUpdate) onUpdate(state);
    return state;
}

export async function releaseHeavyPhase(BACKEND_URL, ticketId) {
    if (!ticketId) return false;
    try {
        const res = await secureFetch(
            `${BACKEND_URL}/consultations/${encodeURIComponent(ticketId)}/heavy-phase/complete`,
            { method: 'POST' }
        );
        return res.ok;
    } catch {
        return false;
    }
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
