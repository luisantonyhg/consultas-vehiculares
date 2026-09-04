/**
 * Renderizadores de Infracciones, Papeletas y Sanciones
 * (Callao, SAT Lima Papeletas, SUTRAN Récord, Cinemómetro SUTRAN, ATU Taxi, SBS Siniestralidad)
 */
import {
    fila,
    escapeHTML,
    getFormattedTimestamp,
    cardHeaderAccordion,
    SOURCE_URLS
} from '../renderers.js';

export function renderCallao(data, plate, total) {
    if (!data || data.length === 0) {
        return `<div class="flex flex-col items-center justify-center py-8 gap-2 text-center font-poppins">
            <div class="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900 flex items-center justify-center mb-1">
                <i class="fas fa-circle-check text-emerald-500 text-xl"></i>
            </div>
            <p class="font-bold text-emerald-700 dark:text-emerald-400 text-sm">¡Sin Papeletas!</p>
            <p class="text-xs text-slate-400 dark:text-slate-500">No se registraron infracciones para <strong class="text-slate-600 dark:text-slate-300">${plate}</strong> en el Callao</p>
        </div>`;
    }
    const rows = data.map((p) => {
        const docIdentifier = p.nroPapeleta || p.detalleUrl || '';
        const insoluto = p.importe || p.insoluto || p.total || '0.00';
        const totalPagar = p.totalPagar || p.total || insoluto;
        const fecha = p.fechaInfraccion || p.fecha || '-';
        return `
        <tr class="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-red-50/50 dark:hover:bg-rose-950/10 transition-colors duration-150 font-poppins">
            <td class="py-2 px-2 text-[10px] md:text-xs font-black text-slate-900 dark:text-slate-100 border-r border-slate-100 dark:border-slate-800 leading-tight">
                <span class="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-bold text-slate-800 dark:text-slate-200">${p.nroPapeleta || '-'}</span>
                ${p.nroCuota ? `<span class="block text-[8px] text-slate-400 font-medium">Cuota: ${p.nroCuota}</span>` : ''}
            </td>
            <td class="py-2 px-2 text-[10px] md:text-xs font-extrabold text-amber-700 dark:text-amber-400 border-r border-slate-100 dark:border-slate-800 leading-tight">${p.codigo || '-'}</td>
            <td class="py-2 px-2 text-[10px] md:text-xs text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 leading-tight whitespace-nowrap">${fecha}</td>
            <td class="py-2 px-2 text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800 leading-tight">S/ ${insoluto}</td>
            <td class="py-2 px-2 text-[10px] md:text-xs font-black text-red-600 dark:text-red-400 border-r border-slate-100 dark:border-slate-800 leading-tight">S/ ${totalPagar}</td>
            <td class="py-2 px-2 text-center">
                ${docIdentifier ? `
                    <button type="button" data-canita-action="callao-document" data-url="${escapeHTML(encodeURIComponent(docIdentifier))}"
                        class="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-600 hover:text-white transition-all active:scale-95 shadow-xs text-[10px] font-bold"
                        title="Ver Documento de la Papeleta ${docIdentifier}">
                        <i class="fas fa-file-pdf text-[11px]"></i>
                        <span class="hidden sm:inline">Ver</span>
                    </button>
                ` : '<span class="text-slate-300 dark:text-slate-700 text-[10px]">—</span>'}
            </td>
        </tr>`;
    }).join('');

    return `
        <div class="flex items-start justify-between mb-4 gap-3 font-poppins px-1">
            <div>
                <p class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Infracciones encontradas</p>
                <p class="text-xl font-bold text-red-600 dark:text-red-500 leading-tight">${data.length} papeleta${data.length > 1 ? 's' : ''}</p>
            </div>
            <div class="text-right">
                <p class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Total adeudado</p>
                <p class="text-xl font-bold text-red-750 dark:text-red-400 leading-tight">S/ ${total || '0.00'}</p>
                <p class="text-[8px] text-red-500 mt-0.5 font-bold uppercase tracking-wider">⚠ PAGA O EVITA EMBARGO</p>
            </div>
        </div>
        <div class="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800/60 shadow-sm">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse bg-white dark:bg-slate-900 min-w-[580px]">
                    <thead>
                        <tr class="bg-slate-900 dark:bg-slate-955 text-white">
                            <th class="py-2 px-2 text-[8px] md:text-[9px] font-bold uppercase tracking-wider border-r border-white/10 dark:border-slate-800">Papeleta</th>
                            <th class="py-2 px-2 text-[8px] md:text-[9px] font-bold uppercase tracking-wider border-r border-white/10 dark:border-slate-800">Código</th>
                            <th class="py-2 px-2 text-[8px] md:text-[9px] font-bold uppercase tracking-wider border-r border-white/10 dark:border-slate-800">Fecha Infracción</th>
                            <th class="py-2 px-2 text-[8px] md:text-[9px] font-bold uppercase tracking-wider border-r border-white/10 dark:border-slate-800">Insoluto</th>
                            <th class="py-2 px-2 text-[8px] md:text-[9px] font-bold uppercase tracking-wider border-r border-white/10 dark:border-slate-800">Total a Pagar</th>
                            <th class="py-2 px-2 text-[8px] md:text-[9px] font-bold uppercase tracking-wider text-center">Documento</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>`;
}

export function renderLima(plate, message, directUrl, data, totalDeudaParam) {
    if (data && Array.isArray(data) && data.length > 0) {
        const totalCalculado = totalDeudaParam !== undefined 
            ? Number(totalDeudaParam) 
            : data.reduce((acc, r) => acc + (parseFloat(r.deuda || r.monto || r.importe) || 0), 0);
        const totalFormateado = totalCalculado.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        // Tarjetas individuales optimizadas para Móvil (sm:hidden)
        const mobileCards = data.map((p, idx) => {
            const numDoc = p.nro_documento || p['N° Documento/Código de pago'] || p.documento || p.codigo || `#${idx + 1}`;
            const falta = p.falta || p.Falta || p.infraccion || '—';
            const reglamento = p.reglamento || p.Reglamento || 'SET';
            const fecha = p.fecha_infraccion || p['Fecha Infración/Fecha Emisión'] || p.fecha || '—';
            const deuda = p.deuda || p.Deuda || p.monto || '0.00';
            const gastos = p.gastos_costas || p['Gastos/Costas'] || '0.00';
            const estado = p.estado || p.Estado || 'En Coa-Pr';
            const fotoUrl = p.foto_url || p.foto_href || '';

            return `
            <div class="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col gap-2.5 font-poppins">
                <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div class="flex items-center gap-1.5">
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-900 text-white dark:bg-slate-800 tracking-wider font-mono">
                            ${numDoc}
                        </span>
                        <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                            ${reglamento} · ${falta}
                        </span>
                    </div>
                    <span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${estado.toLowerCase().includes('coa') ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}">
                        ${estado}
                    </span>
                </div>
                
                <div class="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                        <span class="text-[9px] uppercase font-bold text-slate-400 block">Fecha Infracción</span>
                        <span class="font-semibold text-slate-700 dark:text-slate-200">${fecha}</span>
                    </div>
                    <div>
                        <span class="text-[9px] uppercase font-bold text-slate-400 block">Gastos / Costas</span>
                        <span class="font-semibold text-slate-600 dark:text-slate-300">S/ ${gastos}</span>
                    </div>
                </div>

                <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 mt-0.5">
                    <div>
                        <span class="text-[9px] uppercase font-bold text-slate-400 block">Deuda Pendiente</span>
                        <span class="text-sm font-black text-rose-600 dark:text-rose-400 font-archivo">S/ ${deuda}</span>
                    </div>
                    ${fotoUrl ? `
                    <button type="button" 
                            data-canita-action="sat-document" data-url="${escapeHTML(encodeURIComponent(fotoUrl))}" data-document="${escapeHTML(encodeURIComponent(numDoc))}"
                            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10px] uppercase tracking-wide transition-all shadow-xs active:scale-95 cursor-pointer">
                        <i class="fas fa-file-image"></i> Ver Copia Acta
                    </button>` : `
                    <span class="text-[10px] text-slate-400 italic">Sin copia digital</span>`}
                </div>
            </div>`;
        }).join('');

        // Filas para Tabla en Desktop (hidden sm:table)
        const tableRows = data.map((p, idx) => {
            const numDoc = p.nro_documento || p['N° Documento/Código de pago'] || p.documento || p.codigo || `#${idx + 1}`;
            const falta = p.falta || p.Falta || p.infraccion || '—';
            const reglamento = p.reglamento || p.Reglamento || 'SET';
            const fecha = p.fecha_infraccion || p['Fecha Infración/Fecha Emisión'] || p.fecha || '—';
            const gastos = p.gastos_costas || p['Gastos/Costas'] || '0.00';
            const deuda = p.deuda || p.Deuda || p.monto || '0.00';
            const estado = p.estado || p.Estado || 'En Coa-Pr';
            const fotoUrl = p.foto_url || p.foto_href || '';

            return `
            <tr class="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors font-poppins text-xs">
                <td class="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">${numDoc}</td>
                <td class="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">${reglamento}</td>
                <td class="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">${falta}</td>
                <td class="py-2.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">${fecha}</td>
                <td class="py-2.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">S/ ${gastos}</td>
                <td class="py-2.5 px-3 font-black text-rose-600 dark:text-rose-400 font-archivo whitespace-nowrap">S/ ${deuda}</td>
                <td class="py-2.5 px-3 whitespace-nowrap">
                    <span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${estado.toLowerCase().includes('coa') ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}">
                        ${estado}
                    </span>
                </td>
                <td class="py-2.5 px-3 text-center whitespace-nowrap">
                    ${fotoUrl ? `
                    <button type="button" 
                            data-canita-action="sat-document" data-url="${escapeHTML(encodeURIComponent(fotoUrl))}" data-document="${escapeHTML(encodeURIComponent(numDoc))}"
                            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-200 dark:border-blue-800 text-[10px] font-bold transition-all shadow-xs cursor-pointer"
                            title="Ver copia oficial de la papeleta en modal">
                        <i class="fas fa-file-image"></i> Ver Acta
                    </button>` : `<span class="text-slate-300 dark:text-slate-600">—</span>`}
                </td>
            </tr>`;
        }).join('');

        return `
        <div class="flex flex-col gap-4 font-poppins">
            <!-- Banner Resumen de Deuda SAT (Diseño Ejecutivo Fintech) -->
            <div class="p-4 sm:p-5 rounded-2xl bg-slate-900 dark:bg-slate-950 text-white shadow-md border-l-4 border-rose-500 border-y border-r border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div class="flex items-center gap-3.5">
                    <div class="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0 shadow-inner">
                        <i class="fas fa-file-invoice-dollar text-xl text-rose-400"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] uppercase font-extrabold tracking-widest text-slate-400">Deuda Total SAT Lima</span>
                            <span class="text-[10px] font-extrabold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-800/60">${data.length} Papeleta${data.length > 1 ? 's' : ''}</span>
                        </div>
                        <div class="flex items-baseline gap-2 mt-0.5">
                            <span class="text-2xl sm:text-3xl font-black text-white font-archivo tracking-tight">S/ ${totalFormateado}</span>
                        </div>
                    </div>
                </div>
                <a href="${directUrl}" target="_blank" rel="noopener noreferrer"
                   class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95">
                    <i class="fas fa-arrow-up-right-from-square text-[11px]"></i> Pagar en SAT
                </a>
            </div>

            <!-- Vista Móvil (Cards) -->
            <div class="sm:hidden flex flex-col gap-2.5">
                ${mobileCards}
            </div>

            <!-- Vista Desktop (Tabla completa) -->
            <div class="hidden sm:block rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-900 dark:bg-slate-950 text-white text-[10px] font-extrabold uppercase tracking-wider">
                                <th class="py-3 px-3">N° Documento</th>
                                <th class="py-3 px-3">Reglamento</th>
                                <th class="py-3 px-3">Falta</th>
                                <th class="py-3 px-3">Fecha Infracción</th>
                                <th class="py-3 px-3">Gastos/Costas</th>
                                <th class="py-3 px-3">Deuda</th>
                                <th class="py-3 px-3">Estado</th>
                                <th class="py-3 px-3 text-center">Copia Papeleta</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            </div>

            <p class="text-[10px] text-slate-400 dark:text-slate-500 text-center font-medium">
                Información oficial obtenida en tiempo real desde el portal del Servicio de Administración Tributaria (SAT Lima).
            </p>
        </div>`;
    }

    return `
    <div class="flex flex-col gap-4 text-slate-900 dark:text-white font-poppins">
        <div class="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl">
            <div class="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center shrink-0 shadow-xs">
                <i class="fas fa-circle-check text-emerald-600 dark:text-emerald-400 text-lg"></i>
            </div>
            <div>
                <p class="font-extrabold text-emerald-800 dark:text-emerald-300 text-sm">¡Sin Papeletas Pendientes en SAT Lima!</p>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">${message || `No se encontraron papeletas pendientes de pago registradas para la placa ${plate}.`}</p>
            </div>
        </div>
        <div class="flex flex-col items-center gap-2">
            <p class="text-[11px] text-slate-400 dark:text-slate-500">Verificado en tiempo real con el portal oficial del SAT Lima</p>
            <a href="${directUrl}" target="_blank" rel="noopener noreferrer"
               class="w-full max-w-xs flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-extrabold uppercase tracking-wide transition-all shadow-md active:scale-95">
               <i class="fas fa-arrow-up-right-from-square"></i> Verificar portal SAT
            </a>
        </div>
    </div>`;
}

export function renderSutran(data, plate, infoReporte) {
    let bodyHTML = '';
    if (!data || data.length === 0) {
        bodyHTML = `<div class="flex flex-col items-center justify-center py-8 gap-2 text-center font-poppins">
            <div class="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900 flex items-center justify-center mb-1">
                <i class="fas fa-circle-check text-emerald-500 text-xl"></i>
            </div>
            <p class="font-bold text-emerald-700 dark:text-emerald-400 text-sm">¡Sin Papeletas SUTRAN!</p>
            <p class="text-xs text-slate-400 dark:text-slate-500">No se encontraron infracciones para <strong class="text-slate-600 dark:text-slate-300">${plate}</strong></p>
        </div>`;
    } else {
        const rows = data.map((p) => `
            <tr class="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-orange-50/50 dark:hover:bg-orange-955/10 transition-colors duration-150 font-poppins">
                <td class="py-1.5 px-1.5 text-[9px] md:text-xs font-bold text-slate-850 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800 leading-tight">${p.nroDocumento || '-'}</td>
                <td class="py-1.5 px-1.5 text-[9px] md:text-xs font-semibold text-slate-655 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800 leading-tight">${p.codigoInfraccion || '-'}</td>
                <td class="py-1.5 px-1.5 text-[9px] md:text-xs text-slate-550 dark:text-slate-500 border-r border-slate-100 dark:border-slate-800 leading-tight">${p.fechaDocumento || '-'}</td>
                <td class="py-1.5 px-1.5 text-[9px] md:text-xs font-bold text-orange-700 dark:text-orange-455 border-r border-slate-100 dark:border-slate-800 leading-tight">${p.clasificacion || '-'}</td>
            </tr>`).join('');
        bodyHTML = `
            <div class="flex items-start justify-between mb-4 gap-3 font-poppins px-1">
                <div>
                    <p class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Infracciones SUTRAN</p>
                    <p class="text-xl font-bold text-red-600 dark:text-red-500 leading-tight">${data.length} papeleta${data.length > 1 ? 's' : ''}</p>
                </div>
            </div>
            <div class="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800/60 shadow-sm">
                <div class="overflow-x-auto max-h-[240px]">
                    <table class="w-full text-left border-collapse bg-white dark:bg-slate-900 table-fixed">
                        <thead>
                            <tr class="bg-slate-900 dark:bg-slate-955 text-white">
                                <th class="py-2 px-1.5 text-[8px] md:text-[9px] font-bold uppercase tracking-wider border-r border-white/10 dark:border-slate-800 sticky top-0 bg-slate-900 dark:bg-slate-955 w-[32%]">Documento</th>
                                <th class="py-2 px-1.5 text-[8px] md:text-[9px] font-bold uppercase tracking-wider border-r border-white/10 dark:border-slate-800 sticky top-0 bg-slate-900 dark:bg-slate-955 w-[18%]">Código</th>
                                <th class="py-2 px-1.5 text-[8px] md:text-[9px] font-bold uppercase tracking-wider border-r border-white/10 dark:border-slate-800 sticky top-0 bg-slate-900 dark:bg-slate-955 w-[24%]">Fecha</th>
                                <th class="py-2 px-1.5 text-[8px] md:text-[9px] font-bold uppercase tracking-wider sticky top-0 bg-slate-900 dark:bg-slate-955 w-[26%]">Clasif.</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>`;
    }
    if (infoReporte) {
        bodyHTML += `
            <div class="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-start gap-1.5 font-poppins px-1">
                <i class="fas fa-circle-info text-slate-400 dark:text-slate-655 mt-0.5 shrink-0 text-[10px]"></i>
                <p class="text-[9px] text-slate-400 dark:text-slate-500 italic leading-relaxed">${infoReporte}</p>
            </div>`;
    }
    return bodyHTML;
}

export function renderCinemometro(data, plate, infoReporte) {
    let bodyHTML = '';
    if (!data || data.length === 0) {
        bodyHTML = `<div class="flex flex-col items-center justify-center py-8 gap-2 text-center font-poppins">
            <div class="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center mb-1">
                <i class="fas fa-circle-check text-emerald-500 text-xl"></i>
            </div>
            <p class="font-bold text-emerald-700 dark:text-emerald-400 text-sm">¡Sin Papeletas de Velocidad!</p>
            <p class="text-xs text-slate-400 dark:text-slate-500">No se encontraron infracciones de cinemómetro para <strong class="text-slate-600 dark:text-slate-300">${plate}</strong></p>
        </div>`;
    } else {
        const cards = data.map((r, idx) => {
            const nroDoc = r['N° de Papeleta'] || r['nroDocumento'] || `Infracción #${idx + 1}`;
            const fecha = r['F. Infracción'] || r['fechaDocumento'] || '-';
            const codigo = r['Código Infraccion'] || r['codigoInfraccion'] || 'M20';
            const calificacion = r['Calificación'] || r['clasificacion'] || 'Muy Grave';
            const infractor = r['Nombre / Razón social'] || r['infractor'] || '-';
            const dni = r['Dni/Ruc'] || r['dni'] || '-';
            const estado = r['Estado'] || 'PENDIENTE DE PAGO';
            const fotoTarget = r['foto_target'] || '';

            if (r.foto && (r.foto.startsWith('data:') || r.foto.startsWith('http'))) {
                if (typeof window !== 'undefined') {
                    window.cinemometroFotos = window.cinemometroFotos || {};
                    window.cinemometroFotos[nroDoc] = r.foto;
                }
            }

            return `
            <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all font-poppins">
                <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5 mb-3">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold font-mono">
                            ${nroDoc}
                        </span>
                        <span class="px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40">
                            ${codigo} • ${calificacion}
                        </span>
                    </div>
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${estado.includes('PENDIENTE') ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40'}">
                        ${estado}
                    </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div class="space-y-2 bg-slate-50/70 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/50">
                        <div>
                            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">Fecha de Infracción</span>
                            <span class="font-bold text-slate-800 dark:text-slate-200">${fecha}</span>
                        </div>
                        <div>
                            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">Placa Registrada</span>
                            <span class="font-bold font-mono text-slate-800 dark:text-slate-200">${plate}</span>
                        </div>
                    </div>

                    <div class="space-y-2 bg-slate-50/70 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/50">
                        <div>
                            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">Infractor / Razon Social</span>
                            <span class="font-bold text-slate-800 dark:text-slate-100 truncate block">${infractor}</span>
                        </div>
                        <div>
                            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">DNI / RUC</span>
                            <span class="font-bold font-mono text-slate-700 dark:text-slate-300">${dni}</span>
                        </div>
                    </div>
                </div>

                <div class="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span class="text-[10px] text-slate-400 dark:text-slate-500 font-medium">SUTRAN Cinemómetro</span>
                    <button data-canita-action="cinemometro-photo" data-document="${escapeHTML(encodeURIComponent(nroDoc))}" data-target="${escapeHTML(encodeURIComponent(fotoTarget))}" data-plate="${escapeHTML(encodeURIComponent(plate))}"
                        class="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer">
                        <i class="fas fa-camera text-xs"></i> Ver Foto Probatoria
                    </button>
                </div>
            </div>`;
        }).join('');

        bodyHTML = `
            <div class="flex items-start justify-between mb-4 gap-3 font-poppins px-1">
                <div>
                    <p class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Papeletas y Cinemómetro SUTRAN</p>
                    <p class="text-xl font-bold text-red-600 dark:text-red-500 leading-tight">${data.length} papeleta${data.length > 1 ? 's' : ''} registrada${data.length > 1 ? 's' : ''}</p>
                </div>
            </div>
            <div class="flex flex-col gap-3">
                ${cards}
            </div>`;
    }
    if (infoReporte) {
        bodyHTML += `
            <div class="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-start gap-1.5 font-poppins px-1">
                <i class="fas fa-circle-info text-slate-400 dark:text-slate-600 mt-0.5 shrink-0 text-[10px]"></i>
                <p class="text-[9px] text-slate-400 dark:text-slate-500 italic leading-relaxed">${infoReporte}</p>
            </div>`;
    }
    return bodyHTML;
}

export function renderAtu(data, plate) {
    if (!data || data.fuenteDato === 'NOREGISTRADO') {
        const marca = data?.marcaSunarp || 'N/A';
        const modelo = data?.modeloSunarp || 'N/A';
        const color = data?.color || 'N/A';
        return `
            <div class="flex flex-col items-center justify-center py-6 gap-2 text-center font-poppins">
                <div class="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900 flex items-center justify-center mb-1">
                    <i class="fas fa-circle-check text-emerald-500 text-xl"></i>
                </div>
                <p class="font-bold text-emerald-700 dark:text-emerald-400 text-sm">No registrado como taxi</p>
                <p class="text-xs text-slate-400 dark:text-slate-500 max-w-[260px] leading-relaxed">Este vehículo no cuenta con habilitación vigente para prestar servicio de taxi ante la ATU.</p>
            </div>
            <div class="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 font-poppins">
                <p class="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5"><i class="fas fa-database mr-1"></i>Datos SUNARP del vehículo</p>
                <div class="rounded-xl overflow-hidden">
                    <table class="w-full text-left border-collapse bg-white dark:bg-slate-900">
                        <tbody>
                            ${fila('Marca', marca)}
                            ${fila('Modelo', modelo)}
                            ${fila('Color', color)}
                            ${fila('N° Serie', data?.serie)}
                            ${fila('N° Motor', data?.motor)}
                        </tbody>
                    </table>
                </div>
            </div>`;
    }
    let badgeHTML = '';
    const estadoNum = data.estadoCertificado;
    const estadoTexto = estadoNum === 1 ? 'HABILITADO' : estadoNum === 2 ? 'SUSPENDIDO' : estadoNum === 3 ? 'BAJA' : 'NO HABILITADO';
    if (estadoNum === 1) {
        badgeHTML = `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-sm font-poppins">
            <i class="fas fa-circle-check"></i> HABILITADO
        </span>`;
    } else if (estadoNum === 2) {
        badgeHTML = `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm font-poppins">
            <i class="fas fa-triangle-exclamation"></i> SUSPENDIDO
        </span>`;
    } else {
        badgeHTML = `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-500 text-white shadow-sm font-poppins">
            <i class="fas fa-circle-xmark"></i> ${estadoTexto}
        </span>`;
    }
    let conductoresHTML = '';
    if (data.conductores && data.conductores.length > 0) {
        const rows = data.conductores.map((c) => `
            <tr class="border-b border-slate-200 dark:border-slate-800 last:border-0 hover:bg-teal-50/50 dark:hover:bg-teal-955/10 transition-colors duration-150 font-poppins">
                <td class="py-2 px-3 text-[10px] font-bold text-slate-850 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800 leading-tight">${c.nombreOperador || '-'}</td>
                <td class="py-2 px-3 text-[10px] text-slate-600 dark:text-slate-450 border-r border-slate-200 dark:border-slate-800">${c.numeroDocumento || '-'}</td>
                <td class="py-2 px-3 text-[10px] text-slate-600 dark:text-slate-450">${c.nroLicenciaConducir || '-'}</td>
            </tr>`).join('');
        conductoresHTML = `
            <div class="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 font-poppins px-1">
                <p class="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5"><i class="fas fa-users mr-1"></i>Conductores Vinculados</p>
                <div class="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800/60 shadow-sm">
                    <div class="overflow-x-auto max-h-[130px]">
                        <table class="w-full text-left border-collapse bg-white dark:bg-slate-900 table-fixed">
                            <thead>
                                <tr class="bg-slate-900 dark:bg-slate-955 text-white">
                                    <th class="py-2 px-1.5 text-[8px] md:text-[9px] font-bold uppercase tracking-wider border-r border-white/10 dark:border-slate-800 sticky top-0 bg-slate-900 dark:bg-slate-955 w-[40%]">Nombre</th>
                                    <th class="py-2 px-1.5 text-[8px] md:text-[9px] font-bold uppercase tracking-wider border-r border-white/10 dark:border-slate-800 sticky top-0 bg-slate-900 dark:bg-slate-955 w-[30%]">Documento</th>
                                    <th class="py-2 px-1.5 text-[8px] md:text-[9px] font-bold uppercase tracking-wider sticky top-0 bg-slate-900 dark:bg-slate-955 w-[30%]">Licencia</th>
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                </div>
            </div>`;
    }
    return `
        <div class="flex items-start justify-between mb-4 gap-3 font-poppins">
            <div>
                <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Modalidad</p>
                <p class="text-base font-bold text-slate-900 dark:text-white leading-tight">${data.modalidad || 'Taxi'}</p>
            </div>
            <div class="shrink-0">${badgeHTML}</div>
        </div>
        <div class="rounded-xl overflow-hidden">
            <table class="w-full text-left border-collapse bg-white dark:bg-slate-900 font-poppins">
                <tbody>
                    ${fila('N° TUC', data.certificadoTuc)}
                    ${fila('Propietario', data.propietario)}
                    ${fila('Documento', data.rucDNI)}
                    ${fila('Fecha Emisión', data.fechaEmision)}
                    ${fila('Fecha Vencimiento', data.fechaVencimiento)}
                    ${fila('Vehículo', [data.marcaSunarp, data.modeloSunarp, data.color].filter(Boolean).join(' · '))}
                </tbody>
            </table>
        </div>
        ${conductoresHTML}`;
}

export function renderSBS(data, plate) {
    if (!data) {
        return `<div class="flex flex-col items-center justify-center py-8 gap-2 text-center font-poppins">
            <i class="fas fa-circle-exclamation text-slate-300 dark:text-slate-600 text-2xl mb-1"></i>
            <p class="text-xs text-slate-400 dark:text-slate-500">Sin datos disponibles para <strong>${plate}</strong></p>
        </div>`;
    }

    const tiposConfig = [
        { key: 'soat',      label: 'SOAT',             icon: 'fas fa-shield-halved', color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-950/20',   border: 'border-blue-200 dark:border-blue-900' },
        { key: 'vehicular', label: 'Vehicular',         icon: 'fas fa-car',           color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/20', border: 'border-violet-200 dark:border-violet-900' },
        { key: 'cat',       label: 'CAT',               icon: 'fas fa-house-chimney-crack', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20',  border: 'border-amber-200 dark:border-amber-900' },
    ];

    let html = '';

    tiposConfig.forEach((cfg, idx) => {
        const tipo = data[cfg.key];
        const borderTop = idx > 0 ? 'border-t border-slate-200 dark:border-slate-800 pt-4 mt-4' : '';
        if (!tipo) return;

        const rows = Array.isArray(tipo.data) ? tipo.data : [];
        const count = rows.length;
        const acc = typeof tipo.total_accidentes === 'number'
            ? tipo.total_accidentes
            : (!tipo.error && (tipo.sin_registros || count === 0) ? 0 : null);
        const accidentTone = acc === null ? 'slate' : (acc > 0 ? 'red' : 'emerald');
        const accidentSummary = acc === null ? 'No informado' : `${acc} siniestro${acc === 1 ? '' : 's'} reportado${acc === 1 ? '' : 's'}`;

        html += `<div class="${borderTop} font-poppins">`;
        html += `<div class="flex items-center gap-2 mb-2">
            <div class="w-7 h-7 rounded-lg flex items-center justify-center ${cfg.bg} border ${cfg.border} shrink-0">
                <i class="${cfg.icon} text-xs ${cfg.color}"></i>
            </div>
            <span class="text-[10px] font-extrabold uppercase tracking-widest ${cfg.color}">${cfg.label}</span>
            <span class="ml-auto rounded-lg border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide ${
                accidentTone === 'red'
                    ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300'
                    : accidentTone === 'emerald'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
                        : 'border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
            }">${accidentSummary}</span>
        </div>`;

        if (tipo.error) {
            html += `<p class="text-[10px] text-red-500 italic pl-9">${tipo.error}</p>`;
        } else if (count === 0) {
            html += `<div class="flex items-center gap-2 pl-9 py-1">
                <i class="fas fa-circle-check text-emerald-500 text-xs"></i>
                <p class="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Sin siniestros registrados</p>
            </div>`;
        } else {
            // Tabla oficial responsive: en móvil conserva todas las columnas
            // mediante desplazamiento horizontal y posiciona la columna de siniestros
            // al costado de la Compañía Aseguradora.
            const rawHeaders = [...new Set(rows.flatMap(row => Object.keys(row || {})))]
                .filter(key => key !== 'dias_para_vencer');
            const accidentHeader = rawHeaders.find(key => /accident|siniest/i.test(key));
            const targetAccidentHeader = accidentHeader || 'Siniestros reportados';

            // Remueve la columna de accidente de los headers base para recolocarla
            const nonAccidentHeaders = rawHeaders.filter(k => k !== accidentHeader);

            // Busca la columna de Compañía Aseguradora
            const compIdx = nonAccidentHeaders.findIndex(k => /asegurad|compañ|compan|empresa/i.test(k));

            const displayHeaders = [];
            if (compIdx !== -1) {
                displayHeaders.push(...nonAccidentHeaders.slice(0, compIdx + 1));
                displayHeaders.push(targetAccidentHeader);
                displayHeaders.push(...nonAccidentHeaders.slice(compIdx + 1));
            } else {
                if (nonAccidentHeaders.length > 0) {
                    displayHeaders.push(nonAccidentHeaders[0], targetAccidentHeader, ...nonAccidentHeaders.slice(1));
                } else {
                    displayHeaders.push(targetAccidentHeader);
                }
            }

            const accidentCell = (rawValue) => {
                const value = rawValue === null || rawValue === undefined || rawValue === '' ? '—' : String(rawValue);
                const numeric = /^\s*\d+(?:[.,]\d+)?\s*$/.test(value) ? Number(value.replace(',', '.')) : null;
                const tone = numeric === null
                    ? 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    : numeric > 0
                        ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
                return `<span class="inline-flex min-w-[44px] items-center justify-center rounded-lg border px-2.5 py-1 font-black ${tone}">${escapeHTML(value)}</span>`;
            };

            html += `<div class="overflow-x-auto rounded-xl border border-slate-200 shadow-sm dark:border-slate-800" role="region" aria-label="Tabla de siniestralidad ${cfg.label}" tabindex="0">
                <table class="min-w-[820px] w-full border-collapse bg-white text-left text-[10px] font-poppins dark:bg-slate-900">
                    <thead class="bg-slate-900 text-white dark:bg-slate-950">
                        <tr>
                            ${displayHeaders.map((header, index) => `<th class="whitespace-nowrap border-r border-white/10 px-3 py-2.5 text-[8px] font-extrabold uppercase tracking-wider ${index === 0 ? 'sticky left-0 z-10 bg-slate-900 dark:bg-slate-950' : ''}">${escapeHTML(header)}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                        ${rows.map((row, rowIndex) => `<tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            ${displayHeaders.map((header, columnIndex) => {
                                const isAccident = header === targetAccidentHeader || header === accidentHeader;
                                const rawValue = (header === 'Siniestros reportados' && !row?.[header])
                                    ? (rowIndex === 0 ? (acc === null ? '—' : acc) : '—')
                                    : row?.[header];
                                const value = rawValue === null || rawValue === undefined || rawValue === '' ? '—' : String(rawValue);
                                return `<td class="max-w-[240px] border-r border-slate-100 px-3 py-2.5 align-top font-semibold leading-snug text-slate-700 [overflow-wrap:anywhere] dark:border-slate-800 dark:text-slate-200 ${columnIndex === 0 ? 'sticky left-0 z-[5] bg-white dark:bg-slate-900' : ''}">
                                    ${isAccident ? accidentCell(rawValue) : escapeHTML(value)}
                                </td>`;
                            }).join('')}
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
            <p class="mt-1.5 text-[9px] text-slate-400 md:hidden"><i class="fas fa-arrows-left-right mr-1"></i>Desliza horizontalmente para ver todas las columnas.</p>`;
        }
        html += '</div>';
    });

    return html || `<p class="text-xs text-slate-400 dark:text-slate-500 text-center py-4">Sin datos de siniestralidad para ${plate}</p>`;
}
