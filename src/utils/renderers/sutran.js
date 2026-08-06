/**
 * Renderizadores de SUTRAN Récord e Infracciones de Cinemómetro
 */

export function renderSutran(data, plate) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return `<div class="p-4 text-center text-xs text-slate-400 font-poppins">No se encontraron infracciones registradas en SUTRAN para la placa <b>${plate || ''}</b>.</div>`;
    }
    const rows = data.map((item, i) => `
        <tr class="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors text-xs">
            <td class="py-2 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">${item.nroDocumento || item.nroInfraccion || `#${i+1}`}</td>
            <td class="py-2 px-3 text-slate-600 dark:text-slate-400">${item.fechaDocumento || item.fecha || '-'}</td>
            <td class="py-2 px-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300">${item.codigoInfraccion || item.codigo || 'M20'}</span></td>
            <td class="py-2 px-3 text-slate-700 dark:text-slate-300 font-medium">${item.clasificacion || item.falta || 'Muy Grave'}</td>
        </tr>
    `).join('');

    return `<div class="font-poppins">
        <div class="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800/60 shadow-sm">
            <table class="w-full text-left border-collapse bg-white dark:bg-slate-900">
                <thead>
                    <tr class="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th class="py-2 px-3">N° Documento</th>
                        <th class="py-2 px-3">Fecha</th>
                        <th class="py-2 px-3">Código</th>
                        <th class="py-2 px-3">Clasificación</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    </div>`;
}

export function renderCinemometro(data, plate, infoReporte) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return `<div class="p-4 text-center text-xs text-slate-400 font-poppins">No se encontraron foto-papeletas de cinemómetro para la placa <b>${plate || ''}</b>.</div>`;
    }

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
                    <span class="px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold font-mono">${nroDoc}</span>
                    <span class="px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40">${codigo} • ${calificacion}</span>
                </div>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${estado.includes('PENDIENTE') ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40'}">${estado}</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div class="space-y-2 bg-slate-50/70 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/50">
                    <div><span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">Fecha de Infracción</span><span class="font-bold text-slate-800 dark:text-slate-200">${fecha}</span></div>
                    <div><span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">Placa Registrada</span><span class="font-bold font-mono text-slate-800 dark:text-slate-200">${plate}</span></div>
                </div>
                <div class="space-y-2 bg-slate-50/70 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/50">
                    <div><span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">Infractor / Razón Social</span><span class="font-bold text-slate-800 dark:text-slate-100 truncate block">${infractor}</span></div>
                    <div><span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">DNI / RUC</span><span class="font-bold font-mono text-slate-700 dark:text-slate-300">${dni}</span></div>
                </div>
            </div>
            <div class="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span class="text-[10px] text-slate-400 dark:text-slate-500 font-medium">SUTRAN Cinemómetro</span>
                <button onclick="window.abrirModalFotoCinemometro('${nroDoc}', '${fotoTarget}', '${plate}')"
                    class="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer">
                    <i class="fas fa-camera text-xs"></i> Ver Foto Probatoria
                </button>
            </div>
        </div>`;
    }).join('');

    return `<div class="space-y-3 font-poppins">
        ${infoReporte ? `<p class="text-[10px] text-slate-400 dark:text-slate-500 italic mb-2">${infoReporte}</p>` : ''}
        ${cards}
    </div>`;
}
