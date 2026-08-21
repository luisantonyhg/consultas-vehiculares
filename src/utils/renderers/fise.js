/**
 * Renderizador de respuestas para FISE (Fondo de Inclusión Social Energético - Ahorro GNV)
 * Muestra el estado del financiamiento, saldos pendientes y tabla de recaudos por recargas.
 */

function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function fmtMoney(num) {
    if (num === null || num === undefined || isNaN(num)) return 'S/ 0.00';
    return `S/ ${Number(num).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function renderFise(data, plate) {
    if (!data || !data.tiene_financiamiento) {
        return `
        <div class="flex flex-col items-center justify-center py-6 px-4 text-center font-poppins">
            <div class="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl mb-2.5 ring-4 ring-emerald-50 dark:ring-emerald-900/20">
                <i class="fas fa-check-circle"></i>
            </div>
            <h4 class="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Sin Deuda ni Financiamiento FISE</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                El vehículo con placa <strong>${escapeHTML(plate)}</strong> no registra saldos pendientes ni financiamiento en el programa Ahorro GNV (FISE).
            </p>
        </div>`;
    }

    const {
        numeroDocumento,
        nombreBeneficiario,
        costoFinanciamiento,
        montoPagado,
        montoPendiente,
        montoDeudaVencido,
        montoCuotasTeorico,
        esPerdidaDescuentoProvincia,
        recaudos = []
    } = data;

    // Resumen financiero en tarjetas KPI
    const kpiCards = `
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/50">
            <span class="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-0.5">Financiamiento</span>
            <span class="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">${fmtMoney(costoFinanciamiento)}</span>
        </div>
        <div class="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
            <span class="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">Total Pagado</span>
            <span class="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300">${fmtMoney(montoPagado)}</span>
        </div>
        <div class="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40">
            <span class="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block mb-0.5">Saldo Pendiente</span>
            <span class="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300">${fmtMoney(montoPendiente)}</span>
        </div>
        <div class="p-2.5 rounded-xl ${montoDeudaVencido > 0 ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200/70 dark:border-rose-800/40' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-700/50'} border">
            <span class="text-[10px] uppercase font-bold ${montoDeudaVencido > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'} block mb-0.5">Deuda Vencida</span>
            <span class="text-xs sm:text-sm font-bold ${montoDeudaVencido > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-slate-700 dark:text-slate-200'}">${fmtMoney(montoDeudaVencido)}</span>
        </div>
    </div>`;

    // Información del titular y advertencias
    let infoTitular = '';
    if (nombreBeneficiario || numeroDocumento) {
        infoTitular = `
        <div class="mb-3 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
                <span class="text-slate-500 dark:text-slate-400 font-medium">Beneficiario:</span>
                <strong class="text-slate-800 dark:text-slate-200 ml-1">${escapeHTML(nombreBeneficiario || '—')}</strong>
            </div>
            ${numeroDocumento ? `<div>
                <span class="text-slate-500 dark:text-slate-400 font-medium">Doc:</span>
                <span class="font-mono font-bold text-slate-700 dark:text-slate-300 ml-1">${escapeHTML(numeroDocumento)}</span>
            </div>` : ''}
        </div>`;
    }

    let advertenciaProvincia = '';
    if (esPerdidaDescuentoProvincia === 'S') {
        advertenciaProvincia = `
        <div class="mb-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
            <i class="fas fa-triangle-exclamation text-amber-600 mt-0.5"></i>
            <span><strong>Aviso FISE:</strong> Registra pérdida de bono/descuento por abastecimiento fuera de provincia de conversión.</span>
        </div>`;
    }

    // Tabla de Recaudos
    let tablaRecaudos = '';
    if (recaudos && recaudos.length > 0) {
        const filas = recaudos.map((r, i) => `
            <tr class="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors text-xs">
                <td class="py-2.5 px-3 font-semibold text-slate-500 dark:text-slate-400 text-center">${r.nro || (i + 1)}</td>
                <td class="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">${escapeHTML(r.tipoRecaudo || 'Recaudo')}</td>
                <td class="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300 text-right">${fmtMoney(r.montoRecaudo)}</td>
                <td class="py-2.5 px-3 text-slate-600 dark:text-slate-400 text-center">${escapeHTML(r.fechaPrimerRecaudo || '—')}</td>
                <td class="py-2.5 px-3 text-slate-700 dark:text-slate-300 text-center font-semibold">${r.cantidadRecaudo || 0}</td>
                <td class="py-2.5 px-3 text-slate-700 dark:text-slate-300 text-right">
                    <span>${escapeHTML(r.fechaUltimoRecaudo || '—')}</span>
                    ${r.montoUltimoRecaudo ? `<span class="text-[11px] text-slate-400 block">(${fmtMoney(r.montoUltimoRecaudo)})</span>` : ''}
                </td>
            </tr>
        `).join('');

        tablaRecaudos = `
        <div class="mt-2">
            <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <i class="fas fa-list-check text-blue-500"></i> Historial de Recaudos
                </span>
                <span class="text-[11px] text-slate-400 dark:text-slate-500">${recaudos.length} registro(s)</span>
            </div>
            <div class="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800/70 shadow-xs">
                <table class="w-full text-left border-collapse bg-white dark:bg-slate-900">
                    <thead>
                        <tr class="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                            <th class="py-2.5 px-3 text-center">Nro.</th>
                            <th class="py-2.5 px-3">Tipo recaudo</th>
                            <th class="py-2.5 px-3 text-right">Monto recaudo</th>
                            <th class="py-2.5 px-3 text-center">1er recaudo</th>
                            <th class="py-2.5 px-3 text-center">Recargas</th>
                            <th class="py-2.5 px-3 text-right">Último recaudo</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filas}
                    </tbody>
                </table>
            </div>
        </div>`;
    } else {
        tablaRecaudos = `
        <div class="p-3 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-400">
            No se registran movimientos de recaudo para este financiamiento.
        </div>`;
    }

    return `
    <div class="font-poppins">
        ${kpiCards}
        ${infoTitular}
        ${advertenciaProvincia}
        ${tablaRecaudos}
    </div>`;
}
