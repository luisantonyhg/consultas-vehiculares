import { secureFetch } from '../services/transport.js';

const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function loadTurnstile() {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (window.__canitaTurnstilePromise) return window.__canitaTurnstilePromise;
    window.__canitaTurnstilePromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = TURNSTILE_SCRIPT;
        script.async = true;
        script.defer = true;
        script.onload = () => window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile no disponible'));
        script.onerror = () => reject(new Error('No se pudo cargar Turnstile'));
        document.head.appendChild(script);
    });
    return window.__canitaTurnstilePromise;
}

/** Turnstile es la barrera principal; el CAPTCHA visual queda como fallback explícito. */
export function setupCaptcha(BACKEND_URL, configuredSiteKey = '') {
    const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    const siteKey = configuredSiteKey || (isLocal ? '3x00000000000000000000FF' : '');
    let turnstileToken = '';
    let widgetId = null;
    let challengeId = '';
    let loading = false;

    async function renderTurnstile() {
        const row = document.getElementById('captcha-row');
        const visual = document.getElementById('visual-captcha-controls');
        const input = document.getElementById('captcha-input');
        if (!row) return;
        visual?.classList.add('hidden');
        input?.classList.add('hidden');
        if (input) input.required = false;
        row.classList.remove('justify-between');
        row.classList.add('justify-center');
        let host = document.getElementById('turnstile-container');
        if (!host) {
            host = document.createElement('div');
            host.id = 'turnstile-container';
            host.className = 'w-full min-h-[65px] flex items-center justify-center';
            row.prepend(host);
        }
        try {
            const turnstile = await loadTurnstile();
            widgetId = turnstile.render(host, {
                sitekey: siteKey,
                action: 'vehicle_consultation',
                theme: 'light',
                size: 'flexible',
                language: 'es',
                'refresh-expired': 'auto',
                'refresh-timeout': 'auto',
                retry: 'auto',
                'retry-interval': 3000,
                callback: (token) => { 
                    turnstileToken = token; 
                },
                'expired-callback': () => { 
                    turnstileToken = ''; 
                    if (widgetId !== null && window.turnstile) {
                        try { window.turnstile.reset(widgetId); } catch (_) {}
                    }
                },
                'timeout-callback': () => {
                    turnstileToken = '';
                    if (widgetId !== null && window.turnstile) {
                        try { window.turnstile.reset(widgetId); } catch (_) {}
                    }
                },
                'error-callback': (errorCode) => { 
                    turnstileToken = ''; 
                    console.warn('[TURNSTILE] Desafío temporalmente no completado o expirado:', errorCode);
                    if (widgetId !== null && window.turnstile) {
                        setTimeout(() => {
                            try { window.turnstile.reset(widgetId); } catch (_) {}
                        }, 1500);
                    }
                    return false;
                },
            });
        } catch (_error) {
            host.innerHTML = '<p class="text-center text-xs font-bold text-rose-300">No se pudo cargar la verificación anti-bots. Revisa tu conexión.</p>';
        }
    }

    async function drawVisualCaptcha() {
        if (loading) return;
        loading = true;
        const canvas = document.getElementById('captcha-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        try {
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            const response = await secureFetch(`${BACKEND_URL}/security/captcha`, { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            challengeId = data.challenge_id || '';
            const image = new Image();
            image.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            };
            image.src = data.image;
        } catch (_error) {
            challengeId = '';
        } finally {
            loading = false;
        }
    }

    async function refresh() {
        if (siteKey) {
            turnstileToken = '';
            if (widgetId !== null && window.turnstile) {
                try {
                    window.turnstile.reset(widgetId);
                } catch (e) {
                    console.warn('[TURNSTILE] Reset error:', e);
                }
            }
            return;
        }
        await drawVisualCaptcha();
    }

    window.addEventListener('DOMContentLoaded', () => {
        if (siteKey) {
            void renderTurnstile();
        } else if (!isLocal) {
            const row = document.getElementById('captcha-row');
            if (row) row.innerHTML = '<p class="w-full text-center text-xs font-bold text-rose-300">Verificación anti-bots temporalmente no disponible.</p>';
        } else {
            void drawVisualCaptcha();
            document.getElementById('captcha-canvas')?.addEventListener('click', () => void drawVisualCaptcha());
            document.getElementById('refresh-captcha-btn')?.addEventListener('click', () => void drawVisualCaptcha());
        }
    });
    return {
        refresh,
        getProof(answer) {
            if (siteKey) return { turnstileToken, valid: Boolean(turnstileToken), mode: 'turnstile' };
            const normalized = String(answer || '').trim().toUpperCase();
            return { challengeId, answer: normalized, valid: Boolean(challengeId && normalized), mode: 'visual' };
        },
    };
}
