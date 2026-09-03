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
        <div class="flex flex-col items-center justify-center py-8 gap-2 text-center font-poppins">
            <div class="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl mb-1 ring-4 ring-emerald-50 dark:ring-emerald-900/20">
                <i class="fas fa-check-circle"></i>
            </div>
            <p class="font-bold text-slate-700 dark:text-slate-300 text-sm">Sin Deuda ni Financiamiento FISE</p>
            <p class="text-xs text-slate-400 dark:text-slate-500 max-w-sm">
                El vehículo con placa <strong class="font-mono text-slate-600 dark:text-slate-300">${escapeHTML(plate)}</strong> no registra saldos pendientes ni financiamiento activo en el programa Ahorro GNV (FISE).
            </p>
        </div>`;
    }

    const {
        costoFinanciamiento = 0,
        montoPagado = 0,
        montoPendiente = 0,
        montoCuotasTeorico = 0,
        montoDeudaVencido = 0,
        esPerdidaDescuentoProvincia,
        recaudos = []
    } = data;

    const safePlate = escapeHTML(data.placaVehiculo || plate || '—');
    const tieneRetraso = Number(montoDeudaVencido || 0) > 0;
    const estadoBadgeHtml = tieneRetraso
        ? `<span class="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white">
            <i class="fas fa-triangle-exclamation text-[8px]"></i> Retraso en pago: ${fmtMoney(montoDeudaVencido)}
           </span>`
        : `<span class="inline-flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white">
            <i class="fas fa-coins text-[8px]"></i> Saldo pendiente: ${fmtMoney(montoPendiente)}
           </span>`;

    // Tabla de Recaudos oficial formateada
    let recaudosFilas = '';
    if (recaudos && recaudos.length > 0) {
        recaudosFilas = recaudos.map((r, i) => {
            const ultimoRecaudoTexto = r.fechaUltimoRecaudo
                ? `${escapeHTML(r.fechaUltimoRecaudo)}${r.montoUltimoRecaudo ? ` <span class="text-slate-500 font-semibold">(${fmtMoney(r.montoUltimoRecaudo)})</span>` : ''}`
                : '—';
            return `
            <tr class="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors text-xs font-poppins">
                <td class="py-2.5 px-3 font-semibold text-slate-500 dark:text-slate-400 text-center">${r.nro || (i + 1)}</td>
                <td class="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">${escapeHTML(r.tipoRecaudo || 'Recarga GRIFOS')}</td>
                <td class="py-2.5 px-3 font-bold text-slate-900 dark:text-white text-right">${Number(r.montoRecaudo || 0).toFixed(2)}</td>
                <td class="py-2.5 px-3 text-slate-600 dark:text-slate-400 text-center">${escapeHTML(r.fechaPrimerRecaudo || '—')}</td>
                <td class="py-2.5 px-3 text-slate-700 dark:text-slate-300 text-center font-bold">${r.cantidadRecaudo || 0}</td>
                <td class="py-2.5 px-3 text-slate-700 dark:text-slate-300 text-right font-medium">${ultimoRecaudoTexto}</td>
            </tr>`;
        }).join('');
    } else {
        recaudosFilas = `
            <tr>
                <td colspan="6" class="py-4 px-3 text-center text-xs text-slate-400 dark:text-slate-500">
                    No se registran transacciones de recaudo para este financiamiento.
                </td>
            </tr>`;
    }

    const advertenciaProvinciaHtml = esPerdidaDescuentoProvincia === 'S'
        ? `<div class="mb-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
            <i class="fas fa-triangle-exclamation text-rose-600 mt-0.5 shrink-0 text-sm"></i>
            <div>
                <strong>Pérdida de Bono de Descuento:</strong> Se detectó abastecimiento fuera de provincia de conversión. El saldo se recalculó sin el subsidio estatal.
            </div>
           </div>`
        : '';

    return `
    <article class="font-poppins">
        <div class="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <!-- Header con estética automotriz como lunas polarizadas -->
            <div class="relative flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 px-4 py-3 pr-16">
                <div class="min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-[9px] font-extrabold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Programa Ahorro GNV · MINEM</span>
                        ${estadoBadgeHtml}
                    </div>
                    <div class="mt-1 flex items-baseline gap-x-4 gap-y-1 flex-wrap">
                        <p class="text-sm md:text-base font-black leading-tight text-slate-900 dark:text-white">Liquidación de Financiamiento</p>
                        <p class="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Placa: <strong class="font-mono text-xs text-slate-700 dark:text-slate-200">${safePlate}</strong></p>
                    </div>
                </div>
                <img src="/assets/fise.png" alt="FISE Ahorro GNV" class="absolute right-3.5 top-1/2 h-8 w-auto -translate-y-1/2 rounded-md bg-white object-contain p-1 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700" />
            </div>

            <!-- Tabla de recaudos -->
            <div class="overflow-x-auto border-b border-slate-200 dark:border-slate-800">
                <table class="w-full text-left border-collapse bg-white dark:bg-slate-900">
                    <thead>
                        <tr class="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                            <th class="py-2.5 px-3 text-center">Nro.</th>
                            <th class="py-2.5 px-3">Tipo recaudo</th>
                            <th class="py-2.5 px-3 text-right">Monto recaudo (S/)</th>
                            <th class="py-2.5 px-3 text-center">Fecha primer recaudo</th>
                            <th class="py-2.5 px-3 text-center">Cantidad recargas</th>
                            <th class="py-2.5 px-3 text-right">Último recaudo</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recaudosFilas}
                    </tbody>
                </table>
            </div>

            <!-- Desglose oficial de amortización y cronograma -->
            <div class="p-4 bg-slate-50/40 dark:bg-slate-950/20">
                ${advertenciaProvinciaHtml}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-poppins">
                    <!-- Columna izquierda: Estado del financiamiento total -->
                    <div class="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-3 shadow-xs">
                        <table class="w-full border-collapse">
                            <tbody>
                                <tr class="border-b border-slate-100 dark:border-slate-800/60">
                                    <td class="py-2 text-slate-600 dark:text-slate-400 font-medium">Monto financiamiento (S/):</td>
                                    <td class="py-2 text-right font-mono font-bold text-slate-900 dark:text-white">${Number(costoFinanciamiento || 0).toFixed(2)}</td>
                                </tr>
                                <tr class="border-b border-slate-100 dark:border-slate-800/60">
                                    <td class="py-2 text-slate-600 dark:text-slate-400 font-medium">Monto pagado (S/):</td>
                                    <td class="py-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">${Number(montoPagado || 0).toFixed(2)}</td>
                                </tr>
                                <tr class="font-bold">
                                    <td class="py-2 text-slate-900 dark:text-white">* Monto total pendiente de pago:</td>
                                    <td class="py-2 text-right font-mono text-slate-900 dark:text-white text-sm">${Number(montoPendiente || 0).toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Columna derecha: Estado de cuotas a la fecha -->
                    <div class="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-3 shadow-xs">
                        <table class="w-full border-collapse">
                            <tbody>
                                <tr class="border-b border-slate-100 dark:border-slate-800/60">
                                    <td class="py-2 text-slate-600 dark:text-slate-400 font-medium">Monto a pagar a la fecha (S/):</td>
                                    <td class="py-2 text-right font-mono font-bold text-slate-900 dark:text-white">${Number(montoCuotasTeorico || 0).toFixed(2)}</td>
                                </tr>
                                <tr class="border-b border-slate-100 dark:border-slate-800/60">
                                    <td class="py-2 text-slate-600 dark:text-slate-400 font-medium">Monto total pagado (S/):</td>
                                    <td class="py-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">${Number(montoPagado || 0).toFixed(2)}</td>
                                </tr>
                                <tr class="font-bold ${tieneRetraso ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}">
                                    <td class="py-2">** Monto retrasado en pago a la fecha:</td>
                                    <td class="py-2 text-right font-mono text-sm">${Number(montoDeudaVencido || 0).toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Notas y consideraciones oficiales -->
                <div class="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800/70 text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed space-y-1">
                    <p><strong>*</strong> Monto total a pagar en caso de que desee cancelar la totalidad del financiamiento.</p>
                    <p><strong>**</strong> Monto retrasado en el pago con respecto a su cronograma de pagos de referencia.</p>
                </div>
            </div>
        </div>
    </article>`;
}
