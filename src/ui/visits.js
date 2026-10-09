const SESSION_KEY = 'canita-visits-session-v1';
const SESSION_TTL = 30 * 60 * 1000;
const pending = new Map();

// DESHABILITADO: el contador de visitas despertaba el contenedor de Railway (cada
// POST /visits reabre Redis y Railway deja de dormirlo = RAM facturada 24/7).
// Solo se reactiva con PUBLIC_ENABLE_VISITS_TRACKING=true en el build.
let trackingEnabled = import.meta.env?.PUBLIC_ENABLE_VISITS_TRACKING === 'true';
export function setVisitsTrackingForTests(value) { trackingEnabled = Boolean(value); }

function hideCounter(counterEl) {
    try {
        const card = counterEl?.closest?.('.inline-flex') || counterEl?.parentElement?.parentElement;
        if (card?.style) card.style.display = 'none';
    } catch { /* DOM no disponible. */ }
}

function read(storage, key) {
    try { return globalThis[storage].getItem(key); } catch { return null; }
}
function write(storage, key, value) {
    try { globalThis[storage].setItem(key, value); } catch { /* Storage can be blocked. */ }
}
function validTotal(data) {
    return data?.success === true && Number.isSafeInteger(data.total) && data.total >= 0;
}

export async function initVisits(BACKEND_URL, clientSecret) {
    const counterEl = document.getElementById('visit-counter');
    if (!trackingEnabled) { hideCounter(counterEl); return; }
    const key = `${SESSION_KEY}:${BACKEND_URL}`;
    let cached;
    try { cached = JSON.parse(read('sessionStorage', key)); } catch { /* Ignore corrupt cache. */ }
    const show = (total) => {
        if (counterEl) counterEl.textContent = Number.isSafeInteger(total) ? total.toLocaleString() : 'No disponible';
    };
    const genuineCache = Number.isSafeInteger(cached?.total) && cached.total >= 0;
    if (genuineCache && cached.at <= Date.now() && Date.now() - cached.at < SESSION_TTL) {
        show(cached.total);
        return;
    }
    if (!pending.has(key)) {
        pending.set(key, (async () => {
            let visitorId = read('localStorage', 'canita-visitor-id');
            if (!visitorId) {
                visitorId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
                write('localStorage', 'canita-visitor-id', visitorId);
            }
            const headers = { 'X-Client-Secret': clientSecret, 'X-Visitor-ID': visitorId };
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 15000);
            try {
                const response = await fetch(`${BACKEND_URL}/visits`, { method: 'POST', headers, signal: controller.signal }).catch(() => null);
                let data = response?.ok ? await response.json().catch(() => null) : null;
                if (!validTotal(data) && !controller.signal.aborted) {
                    const fallback = await fetch(`${BACKEND_URL}/visits`, { headers, signal: controller.signal });
                    data = fallback.ok ? await fallback.json() : null;
                }
                if (!validTotal(data)) return null;
                write('sessionStorage', key, JSON.stringify({ total: data.total, at: Date.now() }));
                return data.total;
            } catch { return null; }
            finally { clearTimeout(timer); }
        })());
    }
    const request = pending.get(key);
    try { show(await request); }
    finally { if (pending.get(key) === request) pending.delete(key); }
}
