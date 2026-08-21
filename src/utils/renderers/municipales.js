/**
 * Renderizadores de Servicios Municipales y SAT
 */

export function renderMunicipal(data, plate) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return `<div class="p-4 text-center text-xs text-slate-400 font-poppins">No se encontraron papeletas en el registro municipal para la placa <b>${plate || ''}</b>.</div>`;
    }
    const rows = data.map((item, i) => `
        <tr class="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors text-xs">
            <td class="py-2 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">${item.nroPapeleta || `#${i+1}`}</td>
            <td class="py-2 px-3 text-slate-600 dark:text-slate-400">${item.fecha || '-'}</td>
            <td class="py-2 px-3 font-bold text-rose-600 dark:text-rose-400">${item.monto || '-'}</td>
            <td class="py-2 px-3 text-slate-700 dark:text-slate-300 font-medium">${item.estado || 'Pendiente'}</td>
        </tr>
    `).join('');

    return `<div class="font-poppins">
        <div class="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800/60 shadow-sm">
            <table class="w-full text-left border-collapse bg-white dark:bg-slate-900">
                <thead>
                    <tr class="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th class="py-2 px-3">Papeleta</th>
                        <th class="py-2 px-3">Fecha</th>
                        <th class="py-2 px-3">Monto</th>
                        <th class="py-2 px-3">Estado</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    </div>`;
}

export function renderSatDeuda(data, plate) {
    if (!data) return `<div class="p-3 text-xs text-slate-600 dark:text-slate-300 font-poppins">Sin registros de deuda tributaria en SAT para la placa ${plate || ''}.</div>`;
    return `<div class="p-3 text-xs text-slate-600 dark:text-slate-300 font-poppins">Consulta de Deuda SAT procesada con éxito.</div>`;
}

export function renderSatCaptura(data, plate) {
    if (!data) return `<div class="p-3 text-xs text-slate-600 dark:text-slate-300 font-poppins">Sin orden de captura vehicular en SAT para la placa ${plate || ''}.</div>`;
    return `<div class="p-3 text-xs text-slate-600 dark:text-slate-300 font-poppins">Consulta de Orden de Captura SAT procesada con éxito.</div>`;
}

export function renderSatDeposito(data, plate) {
    if (!data) return `<div class="p-3 text-xs text-slate-600 dark:text-slate-300 font-poppins">Sin registros de internamiento en depósito SAT para la placa ${plate || ''}.</div>`;
    return `<div class="p-3 text-xs text-slate-600 dark:text-slate-300 font-poppins">Consulta de Depósito SAT procesada con éxito.</div>`;
}
