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

import { fila, escapeHTML } from '../renderers.js';

export function renderSatDeuda(data, plate) {
    if (!data) return `<div class="p-3 text-xs text-slate-600 dark:text-slate-300 font-poppins">Sin registros de deuda tributaria en SAT para la placa ${escapeHTML(plate || '')}.</div>`;
    return `<div class="p-3 text-xs text-slate-600 dark:text-slate-300 font-poppins">Consulta de Deuda SAT procesada con éxito.</div>`;
}

export function renderSatCaptura(data, plate) {
    const safePlate = escapeHTML(plate || '');
    const cap = data?.captura || data;
    const tiene = Boolean(cap?.tiene);
    const fecha = cap?.fecha ? escapeHTML(cap.fecha) : null;
    const detalle = Array.isArray(cap?.detalle) ? cap.detalle : [];

    if (!cap || !tiene) {
        return `<div class="flex flex-col items-center justify-center py-7 px-4 gap-2 text-center font-poppins">
            <div class="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mb-1 shadow-xs">
                <i class="fas fa-shield-check text-emerald-500 text-xl"></i>
            </div>
            <p class="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">Sin Orden de Captura Registrada</p>
            <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                El vehículo de placa <strong class="font-mono text-slate-700 dark:text-slate-200 font-bold">${safePlate}</strong> no registra medidas cautelares de orden de captura ni secuestro coactivo en el SAT de Lima.
            </p>
            ${fecha ? `<div class="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <i class="fas fa-calendar-day text-slate-400"></i> Informe actualizado al ${fecha}
            </div>` : ''}
        </div>`;
    }

    // El vehículo TIENE orden de captura
    const itemsHTML = detalle.map((item, index) => {
        const conceptoTitle = escapeHTML(item.Concepto || item.concepto || item.documento || item.Documento || 'Orden de Captura Coactiva');
        const rows = Object.entries(item).map(([k, v]) => {
            if (!v || v === '—') return '';
            const keyLower = k.toLowerCase();
            const isMonto = keyLower.includes('monto') || keyLower.includes('total') || keyLower.includes('deuda');
            const safeVal = escapeHTML(String(v));
            if (isMonto) {
                return `<tr class="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors duration-150 group font-poppins">
                    <td class="py-1.5 px-2 md:py-2 md:px-4 text-[9px] md:text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/30 dark:bg-slate-900/10 border-r border-slate-150 dark:border-slate-800/40 w-[38%] align-middle font-poppins">${escapeHTML(k)}</td>
                    <td class="py-1.5 px-2 md:py-2 md:px-4 text-[11px] md:text-xs font-black text-rose-600 dark:text-rose-400 leading-tight w-auto align-middle font-poppins">${safeVal}</td>
                </tr>`;
            }
            return fila(k, v);
        }).join('');

        const borderClass = index > 0 ? 'mt-4 border-t-2 border-dashed border-slate-200 dark:border-slate-800 pt-4' : '';

        return `
        <article class="${borderClass} font-poppins">
            <div class="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div class="relative flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 px-3 py-2.5 pr-14">
                    <div class="min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-[9px] font-extrabold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                                Captura SAT #${index + 1}
                            </span>
                            <span class="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-xs">
                                <i class="fas fa-handcuffs text-[8px]"></i> Orden Activa
                            </span>
                        </div>
                        <div class="mt-1 flex items-baseline gap-x-4 gap-y-1 flex-wrap">
                            <p class="text-sm md:text-base font-black leading-tight text-slate-900 dark:text-white">
                                ${conceptoTitle}
                            </p>
                            <p class="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                Placa: <strong class="font-mono text-xs text-slate-700 dark:text-slate-200">${safePlate}</strong>
                            </p>
                        </div>
                    </div>
                    <img src="/assets/sat.png" alt="SAT Lima" class="absolute right-3 top-1/2 h-8 w-8 -translate-y-1/2 rounded-md bg-white object-contain p-0.5 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700" />
                </div>
                <table class="w-full table-fixed border-collapse text-left">
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        </article>`;
    }).join('');

    return `
    <div class="p-3 md:p-4 font-poppins">
        <!-- Banner de alerta coactiva destacada -->
        <div class="mb-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/30 p-3.5 shadow-xs">
            <div class="flex items-start gap-3">
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-600 text-white shadow-xs mt-0.5">
                    <i class="fas fa-gavel text-sm"></i>
                </div>
                <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 flex-wrap mb-1">
                        <span class="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                            <i class="fas fa-triangle-exclamation text-[8px]"></i> Alerta Coactiva
                        </span>
                        ${fecha ? `<span class="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1"><i class="fas fa-calendar-day text-rose-500"></i> Informe actualizado al ${fecha}</span>` : ''}
                    </div>
                    <p class="text-xs md:text-sm font-black text-rose-900 dark:text-rose-200 leading-snug">
                        El vehículo de placa <span class="font-mono font-black underline decoration-rose-500 decoration-2">${safePlate}</span> TIENE ORDEN DE CAPTURA por los siguientes conceptos:
                    </p>
                </div>
            </div>
        </div>

        <!-- Detalle de órdenes con diseño de tarjetas de Lunas -->
        <div class="space-y-3">
            ${itemsHTML || `
                <div class="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 p-4 text-center">
                    <p class="text-xs font-bold text-rose-600 dark:text-rose-400">${escapeHTML(cap.mensaje || 'Orden de captura vigente')}</p>
                </div>
            `}
        </div>
    </div>`;
}

export function renderSatDeposito(data, plate) {
    const safePlate = escapeHTML(plate || '');
    const dep = data?.deposito || data;
    const internado = Boolean(dep?.internado);
    const fecha = dep?.fecha ? escapeHTML(dep.fecha) : null;
    const detalle = Array.isArray(dep?.detalle) ? dep.detalle : [];

    if (!dep || !internado) {
        return `<div class="flex flex-col items-center justify-center py-7 px-4 gap-2 text-center font-poppins">
            <div class="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mb-1 shadow-xs">
                <i class="fas fa-circle-check text-emerald-500 text-xl"></i>
            </div>
            <p class="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">No Internado en Depósito</p>
            <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                La placa <strong class="font-mono text-slate-700 dark:text-slate-200 font-bold">${safePlate}</strong> no se encuentra internada físicamente en los depósitos vehiculares del SAT de Lima.
            </p>
            ${fecha ? `<div class="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <i class="fas fa-calendar-day text-slate-400"></i> Informe actualizado al ${fecha}
            </div>` : ''}
        </div>`;
    }

    const rows = detalle.map(item => Object.entries(item).map(([k, v]) => fila(k, v)).join('')).join('');

    return `
    <div class="p-3 md:p-4 font-poppins">
        <div class="mb-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/30 p-3.5 shadow-xs">
            <div class="flex items-start gap-3">
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-600 text-white shadow-xs mt-0.5">
                    <i class="fas fa-warehouse text-sm"></i>
                </div>
                <div class="min-w-0 flex-1">
                    <span class="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white mb-1">
                        <i class="fas fa-triangle-exclamation text-[8px]"></i> Unidad Internada
                    </span>
                    <p class="text-xs md:text-sm font-black text-rose-900 dark:text-rose-200 leading-snug">
                        La placa <span class="font-mono underline decoration-rose-500 decoration-2">${safePlate}</span> SE ENCUENTRA INTERNADA en el depósito del SAT.
                    </p>
                    ${fecha ? `<p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1"><i class="fas fa-calendar-day text-rose-500"></i> Informe actualizado al ${fecha}</p>` : ''}
                </div>
            </div>
        </div>
        ${detalle.length > 0 ? `
            <div class="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <table class="w-full table-fixed border-collapse text-left">
                    <tbody>${rows}</tbody>
                </table>
            </div>` : ''}
    </div>`;
}
