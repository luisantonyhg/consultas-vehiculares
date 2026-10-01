import { renderGNV, renderFise } from '../../utils/renderers.js';
import { secureFetch } from '../transport.js';

export const MUNICIPAL_SOURCE_URLS = Object.freeze({
    'Huánuco': 'https://www.munihuanuco.gob.pe/wp-content/servicios/transportes/gt_papeletas.php',
    'Huancayo': 'https://estadocuentavirtual.sath.gob.pe/papeletastransito',
    'Chachapoyas': 'https://app.munichachapoyas.gob.pe/servicios/consulta_papeletas/app/papeletas.php',
    'Arequipa': 'https://www.muniarequipa.gob.pe/oficina-virtual/c0nInfrPermisos/faltas/papeletas.php',
    'Cajamarca': 'https://www.satcajamarca.gob.pe/consultas',
    'Chiclayo': 'https://virtualsatch.satch.gob.pe/virtualsatch/record_infracciones/buscar_placa_',
    'Cusco': 'https://cusco.gob.pe/informatica/index.php/',
    'Ica': 'https://m.satica.gob.pe/',
    'Piura': 'https://fiscalizacionelectronica.munipiura.gob.pe/',
    'Tacna': 'https://www.munitacna.gob.pe/pagina/sf/servicios/papeletas',
    'Tarapoto': 'https://www.sat-t.gob.pe/',
    // El formulario de papeletas se habilita desde el panel autenticado.
    'Trujillo': 'https://digital.satt.gob.pe/pagos/',
});

const municipalEscape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

function renderHuancayoFast(item, plate) {
    const records = Array.isArray(item?.data) ? item.data : [];
    const recordHtml = records.map((record, index) => {
        const pending = record.EstadoPago === 'PENDING';
        const stateLabel = record.EstadoPago === 'UNKNOWN'
            ? 'Estado de pago no informado'
            : (pending ? 'Pendiente de pago' : 'Cancelada / pagada');
        const amount = Number(String(record.Importe ?? '').replace(/[^\d.,-]/g, '').replace(',', '.'));
        const money = Number.isFinite(amount) ? `S/ ${amount.toFixed(2)}` : 'No informado';
        const cells = [
            ['Folio', record.Papeleta], ['Placa', record.Placa || plate], ['Código', record.Código],
            ['Infracción', record.Infracción], ['Fecha', record.Fecha], ['Infractor', record.Conductor],
            ['Propietario', record.Propietario], ['Importe', money], ['Pago', stateLabel],
        ];
        return `<article class="rounded-xl border ${pending ? 'border-rose-300 bg-rose-50/60 dark:border-rose-900 dark:bg-rose-950/20' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'} p-3">
            <h4 class="mb-2 text-xs font-black text-slate-900 dark:text-white">Papeleta ${index + 1}</h4>
            <dl class="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">${cells.map(([label, value]) => `<div class="min-w-0"><dt class="text-[9px] font-bold uppercase text-slate-400">${label}</dt><dd class="break-words text-xs font-semibold ${label === 'Importe' && pending ? 'text-rose-700 dark:text-rose-300' : 'text-slate-700 dark:text-slate-200'}">${municipalEscape(value || '—')}</dd></div>`).join('')}</dl>
            <span class="mt-2 inline-flex rounded-full px-2 py-1 text-[9px] font-black uppercase ${pending ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}">${municipalEscape(stateLabel)}</span>
        </article>`;
    }).join('');
    return `<div class="space-y-3 p-3"><div class="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900"><strong class="text-sm">Huancayo · SATH</strong><p class="text-xs text-slate-500">Resultado rápido de una fuente. La cobertura provincial completa sigue verificándose.</p></div>${recordHtml || '<p class="text-sm text-slate-500">Huancayo no reportó filas.</p>'}</div>`;
}

export async function runFetchGNV(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('gnv', 'Gas Natural Vehicular (GNV)', '', 'fas fa-fire-flame-curved', '', 'Infogas');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);
    try {
        const res = await secureFetch(`${BACKEND_URL}/gnv/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
            const content = renderGNV(data.data, plate);
            const hasData = Array.isArray(data.data) && data.data.length > 0;
            let customBadge = '';
            if (hasData) {
                const cert = data.data[0];
                const habilitado = (cert.vehiculoHabilitado || '').toLowerCase();
                const esHabilitado = habilitado === 'sí' || habilitado === 'si';
                customBadge = esHabilitado
                    ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider">
                        <i class="fas fa-circle-check"></i> HABILITADO
                       </span>`
                    : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-500 text-white shadow-sm uppercase tracking-wider">
                        <i class="fas fa-circle-xmark"></i> NO HABILITADO
                       </span>`;
            } else if (String(data.provider_status || data.outcome || '').toUpperCase() === 'VERIFIED_NONE') {
                customBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider">
                    <i class="fas fa-circle-check"></i> SIN REGISTRO GNV
                </span>`;
            }
            callbacks.setCardData('gnv', 'Gas Natural Vehicular (GNV)', '', 'fas fa-fire-flame-curved', '', 'Infogas', content, true, hasData, customBadge);
            return data;
        } else {
            callbacks.setCardError('gnv', 'Gas Natural Vehicular (GNV)', '', 'fas fa-fire-flame-curved', '', 'Infogas', data.error || 'Error al consultar GNV', plate);
            return data;
        }
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado (120s).' : (err.message || 'Error de conexión');
        callbacks.setCardError('gnv', 'Gas Natural Vehicular (GNV)', '', 'fas fa-fire-flame-curved', '', 'Infogas', msg, plate);
        return { success: false, error: msg };
    }
}

export async function runFetchFISE(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('fise', 'Deuda GNV (FISE Ahorro GNV)', 'Programa Ahorro GNV - MINEM', 'fas fa-gas-pump', '', 'FISE MINEM');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 75000);
    try {
        const res = await secureFetch(`${BACKEND_URL}/fise/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await res.json();
        console.info('[FISE-OBS]', {
            status: res.status,
            ok: res.ok,
            code: data?.code || '',
            outcome: data?.outcome || '',
            retryable: Boolean(data?.retryable),
            retry_after_seconds: data?.retry_after_seconds ?? null,
        });
        // El backend devuelve 503/504 deliberadamente para no disfrazar un
        // timeout como éxito. Conservamos el cuerpo tipado para que el botón
        // Reintentar reciba el código real y no un genérico "HTTP 504".
        if (!res.ok) {
            const httpError = {
                ...data,
                success: false,
                code: data?.code || `FISE_HTTP_${res.status}`,
                outcome: data?.outcome || (res.status === 504 ? 'TIMEOUT' : 'RETRYABLE_ERROR'),
                retryable: data?.retryable ?? res.status >= 500,
            };
            callbacks.setCardError('fise', 'Deuda GNV (FISE Ahorro GNV)', 'Programa Ahorro GNV - MINEM', 'fas fa-gas-pump', '', 'FISE MINEM', httpError.error || `FISE no disponible (HTTP ${res.status})`, plate, httpError);
            return httpError;
        }
        if (data.success) {
            const hasData = Boolean(data.data && data.data.tiene_financiamiento);
            const content = renderFise(data.data, plate);
            let customBadge = '';
            if (hasData) {
                const pend = data.data.montoPendiente;
                const deudaVencida = Number(data.data.montoDeudaVencido || 0) > 0;
                customBadge = deudaVencida
                    ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-triangle-exclamation"></i> DEUDA VENCIDA: S/ ${Number(data.data.montoDeudaVencido).toFixed(2)}</span>`
                    : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-coins"></i> SALDO: S/ ${Number(pend || 0).toFixed(2)}</span>`;
            } else {
                customBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-circle-check"></i> SIN DEUDA FISE</span>`;
            }
            callbacks.setCardData('fise', 'Deuda GNV (FISE Ahorro GNV)', 'Programa Ahorro GNV - MINEM', 'fas fa-gas-pump', '', 'FISE MINEM', content, true, hasData, customBadge);
            return data;
        } else {
            // Conserva el resultado tipado del backend: la política de reintentos
            // distingue un corte de red del portal de un CAPTCHA rechazado.
            callbacks.setCardError('fise', 'Deuda GNV (FISE Ahorro GNV)', 'Programa Ahorro GNV - MINEM', 'fas fa-gas-pump', '', 'FISE MINEM', data.error || 'Error al consultar FISE', plate, data);
            return data;
        }
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado (75s).' : (err.message || 'Error de conexión');
        const errorMeta = {
            success: false,
            error: msg,
            code: err.name === 'AbortError' ? 'FISE_CLIENT_TIMEOUT' : 'FISE_CLIENT_NETWORK_ERROR',
            outcome: err.name === 'AbortError' ? 'TIMEOUT' : 'RETRYABLE_ERROR',
            retryable: true,
            retry_after_seconds: 8,
        };
        callbacks.setCardError('fise', 'Deuda GNV (FISE Ahorro GNV)', 'Programa Ahorro GNV - MINEM', 'fas fa-gas-pump', '', 'FISE MINEM', msg, plate, errorMeta);
        return errorMeta;
    }
}

export async function runFetchMunicipal(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('municipal', 'Papeletas Otras Municipalidades', 'Provincias del Perú', 'fas fa-building-columns', '', 'Municipalidades');
    const fastHuancayoPromise = secureFetch(`${BACKEND_URL}/municipal/huancayo/${plate}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
            const item = data?.data?.find(candidate => String(candidate?.municipio || '').toLowerCase() === 'huancayo');
            if (item) {
                const active = Boolean(item.tiene_papeletas);
                callbacks.setCardData(
                    'municipal', 'Papeletas Otras Municipalidades', 'Huancayo · SATH',
                    'fas fa-building-columns', '', 'SATH Huancayo', renderHuancayoFast(item, plate),
                    true, active,
                    `<span role="status" aria-live="polite" class="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-600"><i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Huancayo listo · consultando otras municipalidades</span>`,
                );
            }
            return data;
        })
        .catch(error => {
            console.info('[MUNICIPAL-FAST-SOURCE]', { source: 'Huancayo', status: 'unavailable', error: error?.message || 'network' });
            return null;
        });
    const controller = new AbortController();
    // Doce portales se consultan en paralelo y algunos requieren reintento de
    // conexión. No abortar el agregado mientras el backend aún está dentro de
    // su presupuesto; la tarjeta se actualiza sin retener el modal SUNARP.
    const timeoutId = setTimeout(() => controller.abort(), 85000);
    try {
        const res = await secureFetch(`${BACKEND_URL}/municipal/${plate}?exclude_huancayo=true`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(res.status === 404 ? 'HTTP 404: Sección en actualización.' : `Error ${res.status}`);
        const data = await res.json();
        const fastData = await fastHuancayoPromise;
        const fastItem = fastData?.data?.find(candidate => String(candidate?.municipio || '').toLowerCase() === 'huancayo');
        const items = Array.isArray(data.data) ? [...data.data] : [];
        const aggregateHasHuancayo = items.some(item => String(item?.municipio || '').toLowerCase() === 'huancayo');
        if (fastItem && !aggregateHasHuancayo) items.push(fastItem);
        if (fastItem && !aggregateHasHuancayo) {
            data.municipios_total = Number(data.municipios_total || 0) + 1;
            data.municipios_verificados = Number(data.municipios_verificados || 0) + Number(String(fastItem.verification_status || '').startsWith('VERIFIED_'));
            data.municipios_no_disponibles = Number(data.municipios_no_disponibles || 0) + Number(!String(fastItem.verification_status || '').startsWith('VERIFIED_'));
        } else if (!fastItem && Number(data.municipios_total || 0) < 12) {
            // El agregado se pidió excluyendo Huancayo. Si el endpoint rápido
            // falla, conserva el denominador oficial y registra esa fuente.
            data.municipios_total = 12;
            data.municipios_no_disponibles = Number(data.municipios_no_disponibles || 0) + 1;
            data.fuentes_no_disponibles = [...(data.fuentes_no_disponibles || []), 'Huancayo'];
        }
        data.municipios_total = Math.max(12, Number(data.municipios_total || 0));
        data.coverage_status = Number(data.municipios_verificados || 0) === Number(data.municipios_total)
            ? 'FULL' : (Number(data.municipios_verificados || 0) ? 'PARTIAL' : 'UNAVAILABLE');
        data.success = Boolean(data.success || fastItem?.success);
        data.data = items;
        const rows = items.map(m => {
            const err = !m.success;
            const con = !!m.tiene_papeletas;
            const safeMunicipio = municipalEscape(m.municipio || 'Municipalidad');
            const safeProvincia = municipalEscape(m.provincia || '');
            const safeFuente = municipalEscape(m.fuente || 'Gobierno Local');
            const cls = err ? 'text-slate-400 dark:text-slate-500' : (con ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-emerald-600 dark:text-emerald-400 font-bold');
            const icon = err ? 'fa-circle-minus' : (con ? 'fa-triangle-exclamation animate-pulse' : 'fa-circle-check');
            const estado = municipalEscape(err ? 'No disponible' : (con ? `${m.total || 1} papeleta(s) registrada(s)` : 'Sin papeletas'));
            const url = MUNICIPAL_SOURCE_URLS[m.municipio] || '';
            const verBtn = url
                ? `<a href="${url}" target="_blank" rel="noopener noreferrer" title="Verificar en el portal oficial de ${safeMunicipio}"
                     class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold transition-all shadow-xs border border-slate-200/80 dark:border-slate-700 shrink-0">
                     <i class="fas fa-arrow-up-right-from-square text-[9px] text-brand-red"></i> Verificar portal</a>`
                : '';

            // Detalle completo y responsivo de todas las papeletas de la municipalidad
            let detalleHTML = '';
            if (con && Array.isArray(m.data) && m.data.length > 0) {
                const totalCount = m.data.length;
                const pendientesCount = m.data.filter(d => d.EstadoPago === 'PENDING' || (d['Situación'] || '').toUpperCase().includes('PENDIENTE')).length;
                const canceladasCount = m.data.filter(d => d.EstadoPago === 'PAID' || /PAGAD[AO]|CANCELAD[AO]/i.test(d['Situación'] || '')).length;
                const unknownCount = totalCount - pendientesCount - canceladasCount;

                const itemCards = m.data.map((d, idx) => {
                    const paymentStatus = d.EstadoPago || 'UNKNOWN';
                    const esPendiente = paymentStatus === 'PENDING' || (d['Situación'] || '').toUpperCase().includes('PENDIENTE');
                    const esPagada = paymentStatus === 'PAID' || /PAGAD[AO]|CANCELAD[AO]/i.test(d['Situación'] || '');
                    const stateClass = esPendiente ? 'bg-rose-600 text-white' : (esPagada ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white');
                    const badgeSit = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-extrabold ${stateClass} shadow-xs tracking-wider uppercase">${municipalEscape(d['Situación'] || 'Estado de pago desconocido')}</span>`;
                    const safe = (value) => municipalEscape(value || '—');
                    const parseAmount = (value) => {
                        let raw = String(value ?? '').replace(/[^\d.,-]/g, '');
                        if (!raw) return Number.NaN;
                        const comma = raw.lastIndexOf(',');
                        const dot = raw.lastIndexOf('.');
                        if (comma >= 0 && dot >= 0) {
                            const decimal = Math.max(comma, dot);
                            raw = `${raw.slice(0, decimal).replace(/[.,]/g, '')}.${raw.slice(decimal + 1)}`;
                        } else if (comma >= 0 || dot >= 0) {
                            const separator = comma >= 0 ? ',' : '.';
                            const tail = raw.length - raw.lastIndexOf(separator) - 1;
                            raw = tail > 0 && tail <= 2
                                ? `${raw.slice(0, raw.lastIndexOf(separator)).replace(/[.,]/g, '')}.${raw.slice(raw.lastIndexOf(separator) + 1)}`
                                : raw.replace(/[.,]/g, '');
                        }
                        return Number(raw);
                    };
                    const amount = parseAmount(d.Importe);
                    const amountText = Number.isFinite(amount) ? `S/ ${amount.toFixed(2)}` : '—';
                    const moneyText = (value) => {
                        if (value == null || String(value).trim() === '') return '';
                        const parsed = parseAmount(value);
                        return Number.isFinite(parsed) ? `S/ ${parsed.toFixed(2)}` : safe(value);
                    };
                    const chargeText = moneyText(d.Cargo);
                    const discountText = moneyText(d.Descuento);
                    const balanceText = moneyText(d.Saldo);
                    const balanceNumber = parseAmount(d.Saldo);
                    const hasOutstandingBalance = Number.isFinite(balanceNumber) && balanceNumber > 0;

                    return `
                        <div class="p-2.5 rounded-xl border ${esPendiente ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80'} shadow-xs font-poppins transition-all">
                            <div class="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-1.5 flex-wrap">
                                <div class="flex items-center gap-1.5">
                                    <span class="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] font-black flex items-center justify-center">${idx + 1}</span>
                                    <span class="text-xs font-black text-slate-900 dark:text-white font-mono">${safe(d['Papeleta'] || 'S/N')}</span>
                                    <span class="px-1.5 py-0.5 rounded bg-brand-red/10 text-brand-red text-[9px] font-bold">${safe(d['Código'])}</span>
                                </div>
                                <div class="flex items-center gap-1.5">
                                    ${badgeSit}
                                    <span class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-semibold">${safe(d['EstadoRegistro'] || d['Estado'])}</span>
                                </div>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 text-[10px] text-slate-600 dark:text-slate-300">
                                <div><strong class="text-slate-400 dark:text-slate-500 text-[9px] uppercase block">Fecha:</strong> ${safe(d['Fecha'])}</div>
                                <div><strong class="text-slate-400 dark:text-slate-500 text-[9px] uppercase block">Infractor:</strong> <span class="uppercase font-semibold">${safe(d['Conductor'])}</span></div>
                                <div><strong class="text-slate-400 dark:text-slate-500 text-[9px] uppercase block">Propietario:</strong> <span class="uppercase font-semibold">${safe(d['Propietario'])}</span></div>
                                <div><strong class="text-slate-400 dark:text-slate-500 text-[9px] uppercase block">Importe:</strong> <span class="font-black ${esPendiente ? 'text-rose-600 dark:text-rose-400' : ''}">${amountText}</span></div>
                                ${chargeText ? `<div><strong class="text-slate-400 dark:text-slate-500 text-[9px] uppercase block">Cargo:</strong> <span>${chargeText}</span></div>` : ''}
                                ${discountText ? `<div><strong class="text-slate-400 dark:text-slate-500 text-[9px] uppercase block">Descuento:</strong> <span>${discountText}</span></div>` : ''}
                                ${balanceText ? `<div><strong class="text-slate-400 dark:text-slate-500 text-[9px] uppercase block">Saldo:</strong> <span class="font-black ${hasOutstandingBalance || esPendiente ? 'text-rose-600 dark:text-rose-400' : ''}">${balanceText}</span></div>` : ''}
                                <div class="sm:col-span-2 md:col-span-1"><strong class="text-slate-400 dark:text-slate-500 text-[9px] uppercase block">Infracción:</strong> <span>${safe(d['Infracción'])}</span></div>
                            </div>
                        </div>`;
                }).join('');

                detalleHTML = `
                    <div class="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800">
                        <div class="flex items-center justify-between gap-2 mb-2 flex-wrap text-[11px] font-bold">
                            <span class="text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                <i class="fas fa-list-check text-brand-red"></i> Detalle de las ${totalCount} infracciones registradas:
                            </span>
                            <div class="flex items-center gap-2">
                                <span class="text-rose-600 dark:text-rose-400 font-bold bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-full text-[10px]">${pendientesCount} pendientes</span>
                                <span class="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full text-[10px]">${canceladasCount} pagadas</span>
                                <span class="text-amber-700 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full text-[10px]">${unknownCount} desconocidas</span>
                            </div>
                        </div>
                        <div class="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
                            ${itemCards}
                        </div>
                    </div>`;
            }

            return `<div class="flex flex-col py-3 px-2 border-b border-slate-100 dark:border-slate-800/80 last:border-0 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <div class="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                    <div class="min-w-0">
                        <p class="text-[13px] md:text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight flex items-center gap-1.5">
                            <i class="fas fa-city text-[11px] text-slate-400"></i> ${safeMunicipio}
                        </p>
                        <p class="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold mt-0.5">${safeProvincia} · ${safeFuente}</p>
                    </div>
                    <div class="flex items-center gap-2.5 shrink-0">
                        <span class="inline-flex items-center gap-1.5 text-[11px] md:text-xs ${cls}">
                            <i class="fas ${icon}"></i> ${estado}
                        </span>
                        ${verBtn}
                    </div>
                </div>
                ${m.mensaje && m.mensaje !== 'Sin papeletas registradas.' && !con ? `<p class="text-[10px] text-slate-400 dark:text-slate-500 mt-1 italic">${municipalEscape(m.mensaje)}</p>` : ''}
                ${detalleHTML}
            </div>`;
        }).join('');
        const content = `<div class="p-3 md:p-4">
            <div class="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-3 md:px-4 divide-y divide-slate-100 dark:divide-slate-800">${rows || '<p class="py-4 text-center text-sm text-slate-400">Sin datos.</p>'}</div>
        </div>`;
        const conPapeletas = items.some(m => m.tiene_papeletas);
        const coverage = String(data.coverage_status || data.outcome || '').toUpperCase();
        const verified = Number(data.municipios_verificados || 0);
        const total = Number(data.municipios_total || items.length || 0);
        let badge = conPapeletas
            ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-triangle-exclamation"></i> CON REGISTROS</span>`
            : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-circle-check"></i> SIN REGISTROS</span>`;
        if (!conPapeletas && coverage === 'PARTIAL') {
            badge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-circle-check"></i> ${verified}/${total || '?'} VERIFICADAS</span>`;
        }
        callbacks.setCardData('municipal', 'Papeletas Otras Municipalidades', 'Provincias del Perú', 'fas fa-building-columns', '', 'Municipalidades', content, true, conPapeletas, badge);
        return data;
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado.' : (err.message || 'Error de conexión');
        callbacks.setCardError('municipal', 'Papeletas Otras Municipalidades', 'Provincias del Perú', 'fas fa-building-columns', '', 'Municipalidades', msg, plate);
        return { success: false, error: msg };
    }
}
