import { renderGNV, renderFise } from '../../utils/renderers.js';
import { secureFetch } from '../transport.js';

export const MUNICIPAL_SOURCE_URLS = Object.freeze({
    'Huánuco': 'https://www.munihuanuco.gob.pe/wp-content/servicios/transportes/gt_papeletas.php',
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
    const timeoutId = setTimeout(() => controller.abort(), 45000);
    try {
        const res = await secureFetch(`${BACKEND_URL}/fise/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
            const hasData = Boolean(data.data && data.data.tiene_financiamiento);
            const content = renderFise(data.data, plate);
            let customBadge = '';
            if (hasData) {
                const pend = data.data.montoPendiente;
                const deudaVencida = Number(data.data.montoDeudaVencido || 0) > 0;
                customBadge = deudaVencida
                    ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-triangle-exclamation"></i> DEUDA VENCIDA: S/ ${Number(data.data.montoDeudaVencido).toFixed(2)}</span>`
                    : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-coins"></i> SALDO: S/ ${Number(pend || 0).toFixed(2)}</span>`;
            } else {
                customBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-circle-check"></i> SIN DEUDA FISE</span>`;
            }
            callbacks.setCardData('fise', 'Deuda GNV (FISE Ahorro GNV)', 'Programa Ahorro GNV - MINEM', 'fas fa-gas-pump', '', 'FISE MINEM', content, true, hasData, customBadge);
            return data;
        } else {
            callbacks.setCardError('fise', 'Deuda GNV (FISE Ahorro GNV)', 'Programa Ahorro GNV - MINEM', 'fas fa-gas-pump', '', 'FISE MINEM', data.error || 'Error al consultar FISE', plate);
            return data;
        }
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado (45s).' : (err.message || 'Error de conexión');
        callbacks.setCardError('fise', 'Deuda GNV (FISE Ahorro GNV)', 'Programa Ahorro GNV - MINEM', 'fas fa-gas-pump', '', 'FISE MINEM', msg, plate);
        return { success: false, error: msg };
    }
}

export async function runFetchMunicipal(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('municipal', 'Papeletas Otras Municipalidades', 'Provincias del Perú', 'fas fa-building-columns', '', 'Municipalidades');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 40000);
    try {
        const res = await secureFetch(`${BACKEND_URL}/municipal/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(res.status === 404 ? 'HTTP 404: Sección en actualización.' : `Error ${res.status}`);
        const data = await res.json();
        const items = Array.isArray(data.data) ? data.data : [];
        const rows = items.map(m => {
            const err = !m.success;
            const con = !!m.tiene_papeletas;
            const cls = err ? 'text-slate-400 dark:text-slate-500' : (con ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-emerald-600 dark:text-emerald-400 font-bold');
            const icon = err ? 'fa-circle-minus' : (con ? 'fa-triangle-exclamation animate-pulse' : 'fa-circle-check');
            const estado = err ? 'No disponible' : (con ? `${m.total || 1} papeleta(s) registrada(s)` : 'Sin papeletas');
            const url = MUNICIPAL_SOURCE_URLS[m.municipio] || '';
            const verBtn = url
                ? `<a href="${url}" target="_blank" rel="noopener noreferrer" title="Verificar en el portal oficial de ${m.municipio}"
                     class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold transition-all shadow-xs border border-slate-200/80 dark:border-slate-700 shrink-0">
                     <i class="fas fa-arrow-up-right-from-square text-[9px] text-brand-red"></i> Verificar portal</a>`
                : '';

            // Detalle completo y responsivo de todas las papeletas de la municipalidad
            let detalleHTML = '';
            if (con && Array.isArray(m.data) && m.data.length > 0) {
                const totalCount = m.data.length;
                const pendientesCount = m.data.filter(d => (d['Situación'] || '').toUpperCase().includes('PENDIENTE')).length;
                const canceladasCount = totalCount - pendientesCount;

                const itemCards = m.data.map((d, idx) => {
                    const esPendiente = (d['Situación'] || '').toUpperCase().includes('PENDIENTE');
                    const badgeSit = esPendiente
                        ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-rose-500 text-white shadow-xs tracking-wider uppercase"><i class="fas fa-clock"></i> ${d['Situación']}</span>`
                        : `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-500 text-white shadow-xs tracking-wider uppercase"><i class="fas fa-check-double"></i> ${d['Situación']}</span>`;

                    return `
                        <div class="p-2.5 rounded-xl border ${esPendiente ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80'} shadow-xs font-poppins transition-all">
                            <div class="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-1.5 flex-wrap">
                                <div class="flex items-center gap-1.5">
                                    <span class="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] font-black flex items-center justify-center">${idx + 1}</span>
                                    <span class="text-xs font-black text-slate-900 dark:text-white font-mono">${d['Papeleta'] || 'S/N'}</span>
                                    <span class="px-1.5 py-0.5 rounded bg-brand-red/10 text-brand-red text-[9px] font-bold">${d['Infracción'] || ''}</span>
                                </div>
                                <div class="flex items-center gap-1.5">
                                    ${badgeSit}
                                    <span class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-semibold">${d['Estado'] || ''}</span>
                                </div>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 text-[10px] text-slate-600 dark:text-slate-300">
                                <div><strong class="text-slate-400 dark:text-slate-500 text-[9px] uppercase block">Fecha Infracción:</strong> ${d['Fecha'] || '—'}</div>
                                <div><strong class="text-slate-400 dark:text-slate-500 text-[9px] uppercase block">Conductor:</strong> <span class="uppercase font-semibold">${d['Conductor'] || '—'}</span></div>
                                <div class="sm:col-span-2 md:col-span-1"><strong class="text-slate-400 dark:text-slate-500 text-[9px] uppercase block">Lugar:</strong> <span class="capitalize">${d['Lugar'] || '—'}</span></div>
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
                                <span class="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full text-[10px]">${canceladasCount} canceladas</span>
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
                            <i class="fas fa-city text-[11px] text-slate-400"></i> ${m.municipio || ''}
                        </p>
                        <p class="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold mt-0.5">${m.provincia || ''} · ${m.fuente || 'Gobierno Local'}</p>
                    </div>
                    <div class="flex items-center gap-2.5 shrink-0">
                        <span class="inline-flex items-center gap-1.5 text-[11px] md:text-xs ${cls}">
                            <i class="fas ${icon}"></i> ${estado}
                        </span>
                        ${verBtn}
                    </div>
                </div>
                ${m.mensaje && m.mensaje !== 'Sin papeletas registradas.' && !con ? `<p class="text-[10px] text-slate-400 dark:text-slate-500 mt-1 italic">${m.mensaje}</p>` : ''}
                ${detalleHTML}
            </div>`;
        }).join('');
        const content = `<div class="p-3 md:p-4">
            <div class="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-3 md:px-4 divide-y divide-slate-100 dark:divide-slate-800">${rows || '<p class="py-4 text-center text-sm text-slate-400">Sin datos.</p>'}</div>
        </div>`;
        const conPapeletas = items.some(m => m.tiene_papeletas);
        let badge = conPapeletas
            ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-triangle-exclamation"></i> CON REGISTROS</span>`
            : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-circle-check"></i> SIN REGISTROS</span>`;
        callbacks.setCardData('municipal', 'Papeletas Otras Municipalidades', 'Provincias del Perú', 'fas fa-building-columns', '', 'Municipalidades', content, true, conPapeletas, badge);
        return data;
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado.' : (err.message || 'Error de conexión');
        callbacks.setCardError('municipal', 'Papeletas Otras Municipalidades', 'Provincias del Perú', 'fas fa-building-columns', '', 'Municipalidades', msg, plate);
        return { success: false, error: msg };
    }
}
