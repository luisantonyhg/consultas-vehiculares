/**
 * Renderizador de respuestas para SUNARP (Padrón y Titularidad Vehicular)
 */

const P = (v) => (v && v !== '-' && String(v).trim()) ? v : null;

function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function fila(label, value, isBold = false) {
    const val = escapeHTML(value);
    return `<tr class="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
        <td class="py-2 px-3 text-slate-500 dark:text-slate-400 font-medium text-xs w-1/3 align-middle">${escapeHTML(label)}</td>
        <td class="py-2 px-3 text-slate-800 dark:text-slate-200 ${isBold ? 'font-bold' : 'font-normal'} text-xs align-middle">${val}</td>
    </tr>`;
}

export function renderSunarp(data, plate) {
    if (!data) return `<div class="p-4 text-center text-xs text-slate-400">Sin datos de la SUNARP.</div>`;
    const P_val = (v) => (v && v !== '-' && String(v).trim()) ? v : null;
    const filaOpt = (label, value) => P_val(value) ? fila(label, value) : '';
    
    return `<div class="font-poppins">
        <p class="text-[10px] text-slate-400 dark:text-slate-500 mb-2 italic">* Datos oficiales del Padrón Vehicular de la Superintendencia Nacional de los Registros Públicos.</p>
        <div class="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800/60 shadow-sm">
            <table class="w-full text-left border-collapse bg-white dark:bg-slate-900">
                <tbody>
                    ${fila('Placa', plate || data.placa || '-')}
                    ${filaOpt('Placa Anterior', data.placaAnterior)}
                    ${filaOpt('Propietario(s)', data.propietario)}
                    ${filaOpt('Marca', data.marca)}
                    ${filaOpt('Modelo', data.modelo)}
                    ${filaOpt('N° de Serie (VIN)', data.serie)}
                    ${filaOpt('N° de Motor', data.motor)}
                    ${filaOpt('Color', data.color)}
                    ${filaOpt('Sede Registral', data.sede)}
                    ${filaOpt('Estado / Condición', data.estado)}
                </tbody>
            </table>
        </div>
    </div>`;
}
