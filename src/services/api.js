import {
    renderLima,
    renderSunarp,
    renderSunarpNotFound,
    renderPlacasPE,
    renderValorVenal,
    renderOsinergmin,
    renderPNPRequisitorias,
    renderHistorialDuenos,
    initHistorialDuenosEvents
} from '../utils/renderers.js';
import { secureFetch } from './transport.js';
export { setConsultationTicket } from './transport.js';
export {
    acquireConsultationSlot,
    waitForConsultationSlot,
    touchConsultationSlot,
    waitForHeavyPhase,
    releaseConsultationSlot,
} from './consultation_queue.js';

export { runFetchSOAT, runFetchSOATDetallado, runFetchCITV } from './providers/insurance.js';
export {
    runFetchLunas,
    runFetchCallao,
    runFetchSutran,
    runFetchCinemometro,
    runFetchATU,
    runFetchSBS,
} from './providers/official_portals.js';
export { runFetchGNV, runFetchFISE, runFetchMunicipal } from './providers/energy_municipal.js';
export async function runFetchSAT(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('sat_captura', 'Orden de Captura (SAT)', 'Provincia de Lima', 'fas fa-gavel', '', 'SAT Lima');
    callbacks.setCardLoading('sat_deposito', 'Internamiento en Depósito (SAT)', '', 'fas fa-warehouse', '', 'SAT Lima');
    const okBadge = (t) => `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-circle-check"></i> ${t}</span>`;
    const badBadge = (t) => `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-triangle-exclamation"></i> ${t}</span>`;
    const renderTablaDetalle = (detalle) => {
        if (!Array.isArray(detalle) || detalle.length === 0) return '';
        const headers = Object.keys(detalle[0]);
        if (headers.length === 0) return '';
        
        const ths = headers.map(h => `<th class="py-2 px-2.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wider border-r border-white/10 dark:border-slate-800 sticky top-0 bg-slate-900 dark:bg-slate-950 text-white whitespace-nowrap">${h}</th>`).join('');
        
        const rows = detalle.map(row => {
            const tds = headers.map(h => {
                const val = row[h] || '—';
                const isMonto = h.toLowerCase().includes('monto');
                const cls = isMonto ? 'font-bold text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300';
                return `<td class="py-2 px-2.5 text-[10px] md:text-xs border-r border-slate-100 dark:border-slate-800 leading-tight whitespace-nowrap ${cls}">${val}</td>`;
            }).join('');
            return `<tr class="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors font-poppins">${tds}</tr>`;
        }).join('');

        return `
            <div class="mt-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800/60 shadow-sm">
                <div class="overflow-x-auto max-h-[260px]">
                    <table class="w-full text-left border-collapse bg-white dark:bg-slate-900">
                        <thead>
                            <tr class="bg-slate-900 dark:bg-slate-950 text-white">${ths}</tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>`;
    };

    const bloque = (mensaje, fecha, resaltarRojo, detalle) => `
        <div class="p-3 md:p-4 font-poppins">
            <div class="flex items-start gap-3 rounded-xl border p-3 ${resaltarRojo ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20' : 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20'}">
                <i class="fas ${resaltarRojo ? 'fa-triangle-exclamation text-rose-500' : 'fa-circle-check text-emerald-500'} mt-0.5 text-base"></i>
                <div class="flex-1 min-w-0">
                    <p class="text-[13px] md:text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">${mensaje}</p>
                    ${fecha ? `<p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1"><i class="fas fa-calendar-day"></i>Informe actualizado al ${fecha}</p>` : ''}
                </div>
            </div>
            ${resaltarRojo && detalle ? renderTablaDetalle(detalle) : ''}
        </div>`;

    try {
        // Una única llamada consulta captura y depósito con un solo Chromium.
        // El backend ya hace los reintentos de CAPTCHA. No iniciar aquí otra
        // consulta larga: si el AbortController vence, el Chromium del servidor
        // no puede cancelarse de forma fiable y terminaría compitiendo con Lima
        // y Lunas aunque el frontend ya hubiera avanzado de fase.
        let cap = null, dep = null, satLastError = null;
        const SAT_BUDGET_MS = 170000;
        const satStart = Date.now();

        const requestSAT = async (path) => {
            const remaining = SAT_BUDGET_MS - (Date.now() - satStart);
            if (remaining < 3000) throw new DOMException('Tiempo SAT agotado', 'AbortError');
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), remaining);
            try {
                const res = await secureFetch(`${BACKEND_URL}${path}`, { signal: ctrl.signal });
                if (!res.ok) throw new Error(res.status === 404 ? 'HTTP 404: Sección en actualización.' : `Error ${res.status}`);
                return await res.json();
            } finally {
                clearTimeout(timer);
            }
        };

        try {
            const data = await requestSAT(`/sat/${plate}`);
            cap = data.captura;
            dep = data.deposito;
            satLastError = data.error || null;
        } catch (err) {
            satLastError = err.name === 'AbortError' ? 'Tiempo de espera agotado (SAT).' : (err.message || 'Error de conexión');
        }

        if (cap && cap.success) {
            const tiene = !!cap.tiene;
            callbacks.setCardData('sat_captura', 'Orden de Captura (SAT)', 'Provincia de Lima', 'fas fa-gavel', '', 'SAT Lima',
                bloque(cap.mensaje, cap.fecha, tiene, cap.detalle), true, tiene, tiene ? badBadge('CON ORDEN') : okBadge('SIN ORDEN'));
        } else {
            callbacks.setCardError('sat_captura', 'Orden de Captura (SAT)', 'Provincia de Lima', 'fas fa-gavel', '', 'SAT Lima', (cap && cap.error) || satLastError || 'No se pudo consultar', plate);
        }

        if (dep && dep.success) {
            const internado = !!dep.internado;
            callbacks.setCardData('sat_deposito', 'Internamiento en Depósito (SAT)', '', 'fas fa-warehouse', '', 'SAT Lima',
                bloque(dep.mensaje, dep.fecha, internado, dep.detalle), true, internado, internado ? badBadge('INTERNADO') : okBadge('NO INTERNADO'));
        } else {
            callbacks.setCardError('sat_deposito', 'Internamiento en Depósito (SAT)', '', 'fas fa-warehouse', '', 'SAT Lima', (dep && dep.error) || satLastError || 'No se pudo consultar', plate);
        }

        return { success: !!(cap && cap.success) || !!(dep && dep.success), error: satLastError, captura: cap, deposito: dep, deuda: null };
    } catch (err) {
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado (160s).' : (err.message || 'Error de conexión');
        callbacks.setCardError('sat_captura', 'Orden de Captura (SAT)', 'Provincia de Lima', 'fas fa-gavel', '', 'SAT Lima', msg, plate);
        callbacks.setCardError('sat_deposito', 'Internamiento en Depósito (SAT)', '', 'fas fa-warehouse', '', 'SAT Lima', msg, plate);
        return { success: false, error: msg };
    }
}

export async function runFetchSATCaptura(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('sat_captura', 'Orden de Captura (SAT)', 'Provincia de Lima', 'fas fa-gavel', '', 'SAT Lima');
    const okBadge = (t) => `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-circle-check"></i> ${t}</span>`;
    const badBadge = (t) => `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-triangle-exclamation"></i> ${t}</span>`;
    const bloque = (mensaje, fecha, resaltarRojo, detalle) => `
        <div class="p-3 md:p-4 font-poppins">
            <div class="flex items-start gap-3 rounded-xl border p-3 ${resaltarRojo ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20' : 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20'}">
                <i class="fas ${resaltarRojo ? 'fa-triangle-exclamation text-rose-500' : 'fa-circle-check text-emerald-500'} mt-0.5 text-base"></i>
                <div class="flex-1 min-w-0">
                    <p class="text-[13px] md:text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">${mensaje}</p>
                    ${fecha ? `<p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1"><i class="fas fa-calendar-day"></i>Informe actualizado al ${fecha}</p>` : ''}
                </div>
            </div>
        </div>`;
    try {
        const res = await secureFetch(`${BACKEND_URL}/sat/captura/${plate}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const cap = data.captura;
        if (cap && cap.success) {
            const tiene = !!cap.tiene;
            callbacks.setCardData('sat_captura', 'Orden de Captura (SAT)', 'Provincia de Lima', 'fas fa-gavel', '', 'SAT Lima',
                bloque(cap.mensaje, cap.fecha, tiene, cap.detalle), true, tiene, tiene ? badBadge('CON ORDEN') : okBadge('SIN ORDEN'));
            return data;
        } else {
            throw new Error((cap && cap.error) || 'No se pudo consultar orden de captura');
        }
    } catch (err) {
        callbacks.setCardError('sat_captura', 'Orden de Captura (SAT)', 'Provincia de Lima', 'fas fa-gavel', '', 'SAT Lima', err.message || 'Error de conexión', plate);
        return { success: false, error: err.message };
    }
}

export async function runFetchSATDeposito(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('sat_deposito', 'Internamiento en Depósito (SAT)', '', 'fas fa-warehouse', '', 'SAT Lima');
    const okBadge = (t) => `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-circle-check"></i> ${t}</span>`;
    const badBadge = (t) => `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-triangle-exclamation"></i> ${t}</span>`;
    const bloque = (mensaje, fecha, resaltarRojo, detalle) => `
        <div class="p-3 md:p-4 font-poppins">
            <div class="flex items-start gap-3 rounded-xl border p-3 ${resaltarRojo ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20' : 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20'}">
                <i class="fas ${resaltarRojo ? 'fa-triangle-exclamation text-rose-500' : 'fa-circle-check text-emerald-500'} mt-0.5 text-base"></i>
                <div class="flex-1 min-w-0">
                    <p class="text-[13px] md:text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">${mensaje}</p>
                    ${fecha ? `<p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1"><i class="fas fa-calendar-day"></i>Informe actualizado al ${fecha}</p>` : ''}
                </div>
            </div>
        </div>`;
    try {
        const res = await secureFetch(`${BACKEND_URL}/sat/deposito/${plate}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const dep = data.deposito;
        if (dep && dep.success) {
            const internado = !!dep.internado;
            callbacks.setCardData('sat_deposito', 'Internamiento en Depósito (SAT)', '', 'fas fa-warehouse', '', 'SAT Lima',
                bloque(dep.mensaje, dep.fecha, internado, dep.detalle), true, internado, internado ? badBadge('INTERNADO') : okBadge('NO INTERNADO'));
            return data;
        } else {
            throw new Error((dep && dep.error) || 'No se pudo consultar internamiento en depósito');
        }
    } catch (err) {
        callbacks.setCardError('sat_deposito', 'Internamiento en Depósito (SAT)', '', 'fas fa-warehouse', '', 'SAT Lima', err.message || 'Error de conexión', plate);
        return { success: false, error: err.message };
    }
}

export async function runFetchSATDeuda(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('sat_deuda', 'Deuda Imp. Vehicular (SAT)', 'Impuesto Vehicular', 'fas fa-file-invoice-dollar', '', 'SAT Lima');
    const okBadge = (t) => `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-circle-check"></i> ${t}</span>`;
    const badBadge = (t) => `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-triangle-exclamation"></i> ${t}</span>`;
    const neutralBadge = (t) => `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shadow-sm uppercase tracking-wider"><i class="fas fa-circle-info"></i> ${t}</span>`;
    const bloque = (mensaje, fecha, resaltarRojo, detalle) => `
        <div class="p-3 md:p-4 font-poppins">
            <div class="flex items-start gap-3 rounded-xl border p-3 ${resaltarRojo ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20' : 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20'}">
                <i class="fas ${resaltarRojo ? 'fa-triangle-exclamation text-rose-500' : 'fa-circle-check text-emerald-500'} mt-0.5 text-base"></i>
                <div class="flex-1 min-w-0">
                    <p class="text-[13px] md:text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">${mensaje}</p>
                    ${fecha ? `<p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1"><i class="fas fa-calendar-day"></i>Informe actualizado al ${fecha}</p>` : ''}
                </div>
            </div>
        </div>`;
    try {
        const res = await secureFetch(`${BACKEND_URL}/sat/deuda/${plate}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const deu = data.deuda;
        if (deu && deu.success) {
            if (deu.manual || deu.tiene_deuda === null || deu.tiene_deuda === undefined) {
                callbacks.setCardData('sat_deuda', 'Deuda Imp. Vehicular (SAT)', 'Impuesto Vehicular', 'fas fa-file-invoice-dollar', '', 'SAT Lima',
                    bloque(deu.mensaje, deu.fecha, false, null), true, false, neutralBadge('VERIFICAR MANUAL'));
            } else {
                const conDeuda = !!deu.tiene_deuda;
                callbacks.setCardData('sat_deuda', 'Deuda Imp. Vehicular (SAT)', 'Impuesto Vehicular', 'fas fa-file-invoice-dollar', '', 'SAT Lima',
                    bloque(deu.mensaje, deu.fecha, conDeuda, deu.detalle), true, conDeuda, conDeuda ? badBadge('CON DEUDA') : okBadge('SIN DEUDA'));
            }
            return data;
        } else {
            throw new Error((deu && deu.error) || 'No se pudo consultar deuda');
        }
    } catch (err) {
        callbacks.setCardError('sat_deuda', 'Deuda Imp. Vehicular (SAT)', 'Impuesto Vehicular', 'fas fa-file-invoice-dollar', '', 'SAT Lima', err.message || 'Error de conexión', plate);
        return { success: false, error: err.message };
    }
}

export async function runFetchSUNARP(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('sunarp', 'Información Registro SUNARP', 'Superintendencia de los Registros Públicos', 'fas fa-file-contract', '', 'SUNARP');
    const controller = new AbortController();
    // 95s: el backend limita CapSolver + SUNARP a 60s. Este margen cubre cola,
    // red, serialización y entrega de la respuesta sin dejar el loader indefinido.
    const timeoutId = setTimeout(() => controller.abort(), 95000);
    try {
        const res = await secureFetch(`${BACKEND_URL}/sunarp/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const datos = data.datos && typeof data.datos === 'object' ? data.datos : {};
        const evidence = `${data.error || ''} ${datos.estado || ''} ${datos.mensaje || ''}`.toLowerCase();
        const legacyNotFound = ['no encontrado', 'no encontrada', 'no se encontr', 'no existe', 'no se hallaron', 'no hay resultados']
            .some(marker => evidence.includes(marker));
        const validationStatus = data.validation_status || (legacyNotFound ? 'not_found' : null);

        if (validationStatus === 'not_found' || data.vehicle_exists === false) {
            const content = renderSunarpNotFound(plate);
            const badge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-900 text-white shadow-sm uppercase tracking-wider">
                <i class="fas fa-circle-xmark"></i> NO ENCONTRADA
            </span>`;
            callbacks.setCardData('sunarp', 'Información Registro SUNARP', 'Validación oficial de existencia', 'fas fa-file-contract', '', 'SUNARP', content, true, false, badge);
            return { ...data, success: true, validation_status: 'not_found', vehicle_exists: false };
        }

        if (data.success) {
            const ignoredKeys = new Set(['estado', 'mensaje', 'html_raw']);
            const hasStructuredData = Object.entries(datos).some(([key, value]) =>
                !ignoredKeys.has(key) && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0));
            const hasOfficialImage = Boolean(data.imagen_base64 || data.official_image_base64);
            const explicitRegistered = ['registrado', 'encontrado'].includes(String(datos.estado || '').trim().toLowerCase());
            const isFound = validationStatus === 'found' || data.vehicle_exists === true || explicitRegistered || hasStructuredData || hasOfficialImage;

            if (!isFound) {
                const message = 'SUNARP respondió, pero no permitió confirmar si la placa existe. Las demás fuentes continuarán normalmente.';
                callbacks.setCardError('sunarp', 'Información Registro SUNARP', 'Superintendencia de los Registros Públicos', 'fas fa-file-contract', '', 'SUNARP', message, plate);
                return { ...data, success: false, validation_status: 'indeterminate', vehicle_exists: null, error: message };
            }

            if (hasStructuredData) {
                callbacks.processVehicleInfo('sunarp', datos);
            }
            const customBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-600 text-white shadow-sm uppercase tracking-wider">
                <i class="fas fa-circle-check"></i> REGISTRADO
            </span>`;
            const content = renderSunarp(datos, plate, data.imagen_base64 || data.official_image_base64);
            callbacks.setCardData('sunarp', 'Información Registro SUNARP', 'Superintendencia de los Registros Públicos', 'fas fa-file-contract', '', 'SUNARP', content, true, true, customBadge);
            return { ...data, validation_status: 'found', vehicle_exists: true };

        } else {
            callbacks.setCardError('sunarp', 'Información Registro SUNARP', 'Superintendencia de los Registros Públicos', 'fas fa-file-contract', '', 'SUNARP', data.error || 'Error al consultar SUNARP', plate);
            return data;
        }
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'SUNARP no respondió dentro de 95s. Pulse Reintentar.' : (err.message || 'Error de conexión');
        callbacks.setCardError('sunarp', 'Información Registro SUNARP', 'Superintendencia de los Registros Públicos', 'fas fa-file-contract', '', 'SUNARP', msg, plate);
        return { success: false, error: msg };
    }
}

export async function runFetchPlacasPE(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('placas_pe', 'Consulta Estado de Placa (AAP)', 'Estado de Placa', 'fas fa-car', '', 'AAP');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
        const res = await secureFetch(`${BACKEND_URL}/placas_pe/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
            callbacks.processVehicleInfo('placas_pe', data.data);
            const content = renderPlacasPE(data.data, plate);
            const d = data.data || {};
            const tieneReg = !!(d.propietario || d.marca || d.modelo || d.estado || (d.serie && d.serie !== '-'));
            const badge = tieneReg
                ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-circle-check"></i> CON REGISTRO</span>`
                : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shadow-sm uppercase tracking-wider"><i class="fas fa-circle-info"></i> SIN REGISTRO</span>`;
            callbacks.setCardData('placas_pe', 'Consulta Estado de Placa (AAP)', 'Estado de Placa', 'fas fa-car', '', 'AAP', content, true, tieneReg, badge);
            return data;
        } else {
            callbacks.setCardError('placas_pe', 'Consulta Estado de Placa (AAP)', 'Estado de Placa', 'fas fa-car', '', 'AAP', data.error || 'Error al consultar placas.pe', plate);
            return data;
        }
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado (30s).' : (err.message || 'Error de conexión');
        callbacks.setCardError('placas_pe', 'Consulta Estado de Placa (AAP)', 'Estado de Placa', 'fas fa-car', '', 'AAP', msg, plate);
        return { success: false, error: msg };
    }
}

const USD_PEN_CACHE_KEY = 'usd_pen_rate_cache';
const USD_PEN_TTL_MS = 6 * 60 * 60 * 1000; // 6h: el tipo de cambio se refresca ~diario

// Tipo de cambio USD -> PEN del día, desde fuente abierta (ExchangeRate-API, sin API key).
// Se cachea en localStorage (TTL 6h) para no golpear el endpoint en cada consulta.
async function getUSD_PEN() {
    try {
        const cachedRaw = localStorage.getItem(USD_PEN_CACHE_KEY);
        if (cachedRaw) {
            const c = JSON.parse(cachedRaw);
            if (c && Number(c.rate) > 0 && (Date.now() - c.ts) < USD_PEN_TTL_MS) {
                return Number(c.rate);
            }
        }
    } catch (e) { /* ignore */ }
    try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (res.ok) {
            const j = await res.json();
            const rate = Number(j && j.rates && j.rates.PEN);
            if (rate && isFinite(rate)) {
                try { localStorage.setItem(USD_PEN_CACHE_KEY, JSON.stringify({ rate, ts: Date.now() })); } catch (e) { /* ignore */ }
                return rate;
            }
        }
    } catch (e) { /* ignore */ }
    return 3.75; // fallback aproximado si la API no responde
}

// Rellena el monto en soles junto al valor en dólares dentro de la tarjeta de Valor Venal.
export async function fillValorVenalSoles() {
    const el = document.getElementById('valor-venal-soles');
    if (!el) return;
    const usd = Number(el.getAttribute('data-usd'));
    if (!usd) return;
    const rate = await getUSD_PEN();
    const soles = Math.round(usd * rate);
    const amountEl = el.querySelector('.vrn-soles-amount');
    const rateEl = el.querySelector('.vrn-rate');
    if (amountEl) amountEl.textContent = `S/ ${soles.toLocaleString('es-PE')}`;
    if (rateEl) rateEl.textContent = `T.C. S/ ${rate.toFixed(2)}`;
}

export async function runFetchValorVenal(plate, BACKEND_URL, callbacks, marca, modelo, anio) {
    const TIT = 'Valor Comercial Referencial (APESEG)';
    callbacks.setCardLoading('valor_venal', TIT, 'APESEG', 'fas fa-tag', '', 'APESEG');
    const neutralBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shadow-sm uppercase tracking-wider"><i class="fas fa-circle-info"></i> REQUIERE MARCA/MODELO</span>`;

    const clean = (v) => (v && v !== '-' && String(v).trim()) ? String(v).trim() : '';
    marca = clean(marca); modelo = clean(modelo);
    // Sin marca/modelo real (dependen de Estado de Placa / SUNARP) → honesto, sin precios falsos
    if (!marca || !modelo) {
        const content = `<div class="p-4 text-center font-poppins">
            <i class="fas fa-circle-info text-slate-400 text-xl mb-2"></i>
            <p class="text-sm font-semibold text-slate-600 dark:text-slate-300">Requiere la marca y el modelo del vehículo.</p>
            <p class="text-xs text-slate-400 mt-1">Se calcula automáticamente cuando la <b>Consulta de Estado de Placa</b> (o SUNARP) devuelva marca y modelo. Mientras, verifícalo con el botón <b>Verificar</b>.</p></div>`;
        callbacks.setCardData('valor_venal', TIT, 'APESEG', 'fas fa-tag', '', 'APESEG', content, true, false, neutralBadge);
        return { success: true, sinDatos: true };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
        const qs = `marca=${encodeURIComponent(marca)}&modelo=${encodeURIComponent(modelo)}${anio ? `&anio=${encodeURIComponent(anio)}` : ''}`;
        const res = await secureFetch(`${BACKEND_URL}/apeseg/precio?${qs}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
            const content = renderValorVenal(data);
            callbacks.setCardData('valor_venal', TIT, 'APESEG', 'fas fa-tag', '', 'APESEG', content, true, true);
            fillValorVenalSoles(); // rellena el monto en soles al tipo de cambio del día
            return data;
        } else {
            callbacks.setCardError('valor_venal', TIT, 'APESEG', 'fas fa-tag', '', 'APESEG', data.error || 'Error al consultar valor venal', plate);
            return data;
        }
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado (30s).' : (err.message || 'Error de conexión');
        callbacks.setCardError('valor_venal', TIT, 'APESEG', 'fas fa-tag', '', 'APESEG', msg, plate);
        return { success: false, error: msg };
    }
}

export async function runFetchOsinergmin(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('osinergmin', 'Registro Oficial de Tanque / Hidrocarburos', 'OSINERGMIN', 'fas fa-gas-pump', '', 'OSINERGMIN');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
        const res = await secureFetch(`${BACKEND_URL}/osinergmin/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
            const content = renderOsinergmin(data, plate);
            const hasData = !!data.registrado;
            callbacks.setCardData('osinergmin', 'Registro Oficial de Tanque / Hidrocarburos', 'OSINERGMIN', 'fas fa-gas-pump', '', 'OSINERGMIN', content, true, hasData);
            return data;
        } else {
            callbacks.setCardError('osinergmin', 'Registro Oficial de Tanque / Hidrocarburos', 'OSINERGMIN', 'fas fa-gas-pump', '', 'OSINERGMIN', data.error || 'Error al consultar OSINERGMIN', plate);
            return data;
        }
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado (30s).' : (err.message || 'Error de conexión');
        callbacks.setCardError('osinergmin', 'Registro Oficial de Tanque / Hidrocarburos', 'OSINERGMIN', 'fas fa-gas-pump', '', 'OSINERGMIN', msg, plate);
        return { success: false, error: msg };
    }
}

export async function runFetchLima(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('lima', 'Papeletas Lima', 'Infracciones de tránsito', 'fas fa-traffic-light', '', 'SAT Lima');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 160000);
    const LIMA_URL = 'https://www.sat.gob.pe/VirtualSAT/modulos/papeletas.aspx';
    try {
        const res = await secureFetch(`${BACKEND_URL}/lima/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
            const papeletas = Array.isArray(data.data) ? data.data : [];
            const hasData = papeletas.length > 0;
            const totalDeuda = data.total_deuda || papeletas.reduce((acc, p) => acc + (parseFloat(p.deuda) || 0), 0);
            const content = renderLima(plate, data.message || '', LIMA_URL, papeletas, totalDeuda);
            const badge = hasData
                ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-triangle-exclamation"></i> ${papeletas.length} PAPELETA${papeletas.length > 1 ? 'S' : ''} · S/ ${totalDeuda.toLocaleString('es-PE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>`
                : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-circle-check"></i> SIN PAPELETAS</span>`;
            callbacks.setCardData('lima', 'Papeletas Lima (SAT)', 'Infracciones de tránsito', 'fas fa-traffic-light', '', 'SAT Lima', content, true, hasData, badge);
            return data;
        } else {
            callbacks.setCardError('lima', 'Papeletas Lima (SAT)', 'Infracciones de tránsito', 'fas fa-traffic-light', '', 'SAT Lima', data.error || 'Error al consultar papeletas SAT Lima', plate);
            return data;
        }
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado (160s). El navegador está ocupado, pulse Reintentar.' : (err.message || 'Error de conexión');
        callbacks.setCardError('lima', 'Papeletas Lima', 'Infracciones de tránsito', 'fas fa-traffic-light', '', 'SAT Lima', msg, plate);
        return { success: false, error: msg };
    }
}

export async function runFetchPNP(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('pnp_req', 'Requisitorias Policiales', 'Captura vehicular', 'fas fa-shield-halved', '', 'PNP Tránsito');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 145000);
    try {
        const res = await secureFetch(`${BACKEND_URL}/pnp/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
            const reqData = data.data || {};
            const tieneCaptura = !!reqData.tiene_captura;
            const content = renderPNPRequisitorias(reqData, plate);
            const badge = tieneCaptura
                ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-triangle-exclamation"></i> CON CAPTURA</span>`
                : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-circle-check"></i> SIN REQUISITORIA</span>`;
            callbacks.setCardData('pnp_req', 'Requisitorias Policiales (PNP)', 'Captura vehicular', 'fas fa-shield-halved', '', 'PNP Tránsito', content, true, tieneCaptura, badge);
            return data;
        } else {
            callbacks.setCardError('pnp_req', 'Requisitorias Policiales (PNP)', 'Captura vehicular', 'fas fa-shield-halved', '', 'PNP Tránsito', data.error || 'Error al consultar PNP', plate);
            return data;
        }
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado (145s). Por favor reintente la consulta.' : (err.message || 'Error de conexión');
        callbacks.setCardError('pnp_req', 'Requisitorias Policiales (PNP)', 'Captura vehicular', 'fas fa-shield-halved', '', 'PNP Tránsito', msg, plate);
        return { success: false, error: msg };
    }
}

export async function runFetchHistorialDuenos(plate, BACKEND_URL, callbacks, oficina = '') {
    const TIT = 'Historial de Dueños y Gravámenes';
    callbacks.setCardLoading('historial_dueños', TIT, 'Trazabilidad registral', 'fas fa-clock-rotate-left', '', 'SUNARP / Registral');
    const controller = new AbortController();
    // SPRL puede consumir hasta 180-210s en partidas con más de 12 asientos.
    const timeoutMs = 240000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const queryParam = oficina ? `?oficina=${encodeURIComponent(oficina)}` : '';
        const res = await secureFetch(`${BACKEND_URL}/sunarp/historial/${plate}${queryParam}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) {
            let detail = '';
            try { detail = (await res.json())?.detail || ''; } catch (_) { /* respuesta no JSON */ }
            throw new Error(detail || `HTTP ${res.status}`);
        }
        const data = await res.json();

        // Registrar cada paso del proceso SPRL comunicado por el backend
        const debugSteps = data.metadata?.debug_steps || data.debug_steps || [];
        if (Array.isArray(debugSteps) && debugSteps.length > 0) {
            debugSteps.forEach(step => console.log(`[SPRL-PROCESO] ${step}`));
        }

        if (data.status === 'OK' || data.status === 'PARTIAL_RESULT') {
            const content = renderHistorialDuenos(data, plate);
            const encumbrancesStatus = data.gravamenes?.status || data.verification?.encumbrances_history || 'NOT_VERIFIED';
            const ownershipStatus = data.verification?.ownership_history || (data.ownership_history?.actual_identified?.length ? 'VERIFIED' : 'NOT_VERIFIED');
            const gravamenes = data.resumen?.gravamenes_vigentes;
            const totalAsientos = data.resumen?.total_asientos || (Array.isArray(data.asientos) && data.asientos.length ? data.asientos.length : null);
            let badge = '';
            if (encumbrancesStatus === 'FOUND' || (gravamenes !== null && gravamenes > 0)) {
                badge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-triangle-exclamation"></i> CON GRAVÁMENES</span>`;
            } else if (encumbrancesStatus === 'PARTIAL') {
                badge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-clock"></i> VERIFICACIÓN PARCIAL</span>`;
            } else if (encumbrancesStatus === 'VERIFIED_NONE' || encumbrancesStatus === 'VERIFIED' || totalAsientos !== null) {
                badge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-circle-check"></i> ${totalAsientos ? `${totalAsientos} ASIENTOS` : 'CADENA DOMINIAL VERIFICADA'}</span>`;
            } else if (data.vehiculo?.estado || data.verification?.public_current_owner === 'VERIFIED' || data.titularidad_publica?.titulares_identificados?.length) {
                badge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-circle-check"></i> REGISTRO SUNARP VERIFICADO</span>`;
            } else {
                badge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-circle-check"></i> REGISTRO VERIFICADO</span>`;
            }

            callbacks.setCardData('historial_dueños', TIT, 'Trazabilidad registral', 'fas fa-clock-rotate-left', '', 'SUNARP / Registral', content, true, true, badge);

            if (typeof window !== 'undefined') setTimeout(initHistorialDuenosEvents, 50);
            return data;
        } else {
            callbacks.setCardError('historial_dueños', TIT, 'Trazabilidad registral', 'fas fa-clock-rotate-left', '', 'SUNARP / Registral', data.message || 'Sin registros en SPRL', plate);
            return data;
        }
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'La consulta registral superó el tiempo máximo (195s). Pulse Reintentar.' : (err.message || 'Error de conexión');
        callbacks.setCardError('historial_dueños', TIT, 'Trazabilidad registral', 'fas fa-clock-rotate-left', '', 'SUNARP / Registral', msg, plate);
        return { success: false, error: msg };
    }
}

export function initHistorialDueñosCard(plate, callbacks, BACKEND_URL, oficina = '') {
    if (BACKEND_URL) {
        return runFetchHistorialDuenos(plate, BACKEND_URL, callbacks, oficina);
    }
    const content = renderHistorialDuenos(null, plate);
    const badge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-800 text-amber-300 border border-amber-500/30 uppercase tracking-wider"><i class="fas fa-clock-rotate-left text-[9px]"></i> EN ESPERA</span>`;
    callbacks.setCardData('historial_dueños', 'Historial de Dueños y Gravámenes', 'Trazabilidad registral', 'fas fa-clock-rotate-left', '', 'SUNARP / Registral', content, true, false, badge);
}
