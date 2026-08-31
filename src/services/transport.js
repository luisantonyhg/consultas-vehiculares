/** Transporte HTTP compartido por todos los proveedores vehiculares. */
let activeConsultationTicket = null;
const sectionPerformanceSamples = [];

function sectionFromUrl(url) {
    try {
        const parts = new URL(url, typeof location !== 'undefined' ? location.href : 'http://localhost').pathname.split('/').filter(Boolean);
        const apiIndex = parts.indexOf('v1');
        const rest = apiIndex >= 0 ? parts.slice(apiIndex + 1) : parts;
        const provider = rest[0] || 'gateway';
        if (provider === 'sunarp' && rest[1] === 'historial') return 'historial_dueños';
        if (provider === 'sat' && ['captura', 'deposito', 'deuda'].includes(rest[1])) return `sat_${rest[1]}`;
        if (provider === 'apeseg' && rest[1] === 'precio') return 'valor_venal';
        return provider.replaceAll('-', '_');
    } catch (_) {
        return 'gateway';
    }
}

export function getSectionPerformanceSamples() {
    return sectionPerformanceSamples.slice();
}

export function clearSectionPerformanceSamples() {
    sectionPerformanceSamples.length = 0;
}

export function setConsultationTicket(ticketId) {
    activeConsultationTicket = ticketId || null;
}

export async function secureFetch(url, options = {}) {
    const clientSecret = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PUBLIC_CLIENT_SECRET)
        ? import.meta.env.PUBLIC_CLIENT_SECRET
        : 'VehicularPESecretSecure2026';
    const headers = {
        ...options.headers,
        ...(clientSecret ? { 'X-Client-Secret': clientSecret } : {}),
        ...(activeConsultationTicket ? { 'X-Consultation-Ticket': activeConsultationTicket } : {}),
    };
    const section = sectionFromUrl(url);
    const startedAt = performance.now();
    try {
        const res = await fetch(url, { ...options, headers });
        const sample = {
            section,
            status: res.status,
            ok: res.ok,
            frontend_total_ms: Math.round((performance.now() - startedAt) * 10) / 10,
            backend_total_ms: Number(res.headers.get('X-Response-Time-Ms') || 0),
            backend_queue_ms: Number(res.headers.get('X-Queue-Wait-Ms') || 0),
            backend_processing_ms: Number(res.headers.get('X-Processing-Time-Ms') || 0),
            request_id: res.headers.get('X-Request-ID') || '',
            timestamp: new Date().toISOString(),
        };
        sectionPerformanceSamples.push(sample);
        if (sectionPerformanceSamples.length > 200) sectionPerformanceSamples.shift();
        console.info(`[TIEMPO-SECCION] ${section}`, sample);
        if (res.status === 429) {
            const error = new Error('Demasiadas consultas en poco tiempo. Reintentando...');
            error.name = 'RateLimited';
            throw error;
        }
        return res;
    } catch (error) {
        if (error?.name !== 'RateLimited') {
            const failed = {
                section,
                status: 0,
                ok: false,
                frontend_total_ms: Math.round((performance.now() - startedAt) * 10) / 10,
                error: error?.name || 'FetchError',
                timestamp: new Date().toISOString(),
            };
            sectionPerformanceSamples.push(failed);
            if (sectionPerformanceSamples.length > 200) sectionPerformanceSamples.shift();
            console.error(`[TIEMPO-SECCION] ${section} falló`, failed);
        }
        throw error;
    }
}
