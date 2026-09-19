/**
 * Renderizador de Papeletas y Actas de Fiscalización ATU (Pasarela Oficial).
 * Inspirado en el diseño compacto, moderno y estructurado de Lunas Polarizadas PNP.
 */
import { escapeHTML } from '../renderers.js';

const safe = (value, fallback = '—') => {
    if (value === null || value === undefined || value === 'null' || value === 'undefined' || String(value).trim() === '') {
        return fallback;
    }
    // Normalizar posibles desajustes de caracteres especiales de portales estatales
    let str = String(value).replace(/ELECTRNICA/gi, 'ELECTRÓNICA').replace(/INFRACCIN/gi, 'INFRACCIÓN');
    return escapeHTML(str);
};

const money = (value) => {
    const clean = String(value || '0.00').replace(/[^0-9.,]/g, '');
    return `S/ ${escapeHTML(clean || '0.00')}`;
};

function filaCustom(label, contentHtml) {
    if (!contentHtml) return '';
    const safeLabel = escapeHTML(label);
    return `<tr class="border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors duration-150 font-poppins">
        <td class="py-2 px-3 md:px-4 text-[9px] md:text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/40 dark:bg-slate-900/30 border-r border-slate-150 dark:border-slate-800/50 w-[38%] align-middle">${safeLabel}</td>
        <td class="py-2 px-3 md:px-4 text-[11px] md:text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight align-middle">${contentHtml}</td>
    </tr>`;
}

export function renderAtuInfracciones(data, plate, totalPagar = '0.00') {
    const records = Array.isArray(data) ? data : [];
    if (records.length === 0) {
        return `<div class="flex flex-col items-center justify-center gap-2 py-8 text-center font-poppins">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-xl text-emerald-600 ring-4 ring-emerald-50 dark:bg-emerald-950/30 dark:ring-emerald-950/50">
                <i class="fas fa-circle-check"></i>
            </div>
            <p class="text-sm font-extrabold text-slate-700 dark:text-slate-200">Sin papeletas ATU registradas</p>
            <p class="text-xs text-slate-400">No se encontraron actas de fiscalización pendientes para <strong class="font-mono text-slate-600 dark:text-slate-300">${safe(plate)}</strong>.</p>
        </div>`;
    }

    const cards = records.map((item, index) => {
        const status = String(item.estado || 'PENDIENTE').toUpperCase();
        const isPendiente = status.includes('PENDIENTE') || status.includes('COAC');
        const badgeClass = isPendiente ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white';
        const badgeIcon = isPendiente ? 'fa-circle-exclamation' : 'fa-circle-check';
        const acta = safe(item.acta_fiscalizacion, `Acta #${index + 1}`);
        const infractor = safe(item.tipo_infractor, 'PROPIETARIO');
        const isPropietario = infractor.toUpperCase().includes('PROP');

        const documentButton = item.acta_document_available && item.id_acta
            ? `<button type="button" data-canita-action="atu-infracciones-acta" data-acta-id="${safe(item.id_acta)}" data-acta="${safe(item.acta_fiscalizacion || '')}"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10px] uppercase tracking-wide transition-all shadow-xs active:scale-95 cursor-pointer"
                    title="Ver acta oficial escaneada ${acta}">
                    <i class="fas fa-file-pdf"></i> <span>Ver acta oficial</span>
               </button>`
            : `<span class="text-[10px] font-semibold text-slate-400">Acta no disponible</span>`;

        const borderClass = index > 0 ? 'mt-4 border-t-2 border-dashed border-slate-200 dark:border-slate-800 pt-4' : '';

        return `
        <article class="${borderClass} font-poppins">
            <div class="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition">
                <div class="relative flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 px-3.5 py-2.5 pr-14">
                    <div class="min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-[9px] font-extrabold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Infracción ATU #${index + 1}</span>
                            <span class="inline-flex items-center gap-1 rounded-md ${badgeClass} px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider">
                                <i class="fas ${badgeIcon} text-[8px]"></i> ${safe(status)}
                            </span>
                        </div>
                        <div class="mt-1 flex items-baseline gap-x-4 gap-y-1 flex-wrap">
                            <p class="text-sm md:text-base font-black leading-tight font-mono text-slate-900 dark:text-white">${acta}</p>
                            <p class="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Placa: <strong class="font-mono text-xs text-slate-700 dark:text-slate-200">${safe(item.placa || plate)}</strong></p>
                        </div>
                    </div>
                    <img src="/assets/atu.png" alt="ATU" class="absolute right-3 top-1/2 h-8 w-8 -translate-y-1/2 rounded-md bg-white object-contain p-0.5 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700" />
                </div>
                <table class="w-full table-fixed border-collapse text-left">
                    <tbody>
                        ${filaCustom('Falta / Infracción', `<span class="inline-flex items-center px-2 py-0.5 rounded bg-slate-900 dark:bg-slate-800 text-white font-mono font-black text-xs tracking-wide">${safe(item.falta)}</span>`)}
                        ${filaCustom('Tipo de Infractor', `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold ${isPropietario ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50'}"><i class="fas ${isPropietario ? 'fa-id-card' : 'fa-id-badge'} text-[9px]"></i> ${infractor}</span>`)}
                        ${filaCustom('Reglamento', `<span>${safe(item.reglamento)}</span>`)}
                        ${filaCustom('Fecha de Infracción', `<span class="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200"><i class="far fa-calendar-alt text-slate-400 text-[10px]"></i> ${safe(item.fecha_infraccion)}</span>`)}
                        ${filaCustom('Reincidencia', `<span class="font-bold ${String(item.reincidencia).toUpperCase() === 'SÍ' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'}">${safe(item.reincidencia)}</span>`)}
                        ${item.importe && item.importe !== '0.00' ? filaCustom('Importe Multa', `<span class="font-bold text-slate-700 dark:text-slate-300">${money(item.importe)}</span>`) : ''}
                        ${item.gastos_costas && item.gastos_costas !== '0.00' ? filaCustom('Gastos y Costas', `<span class="font-bold text-slate-600 dark:text-slate-300">${money(item.gastos_costas)}</span>`) : ''}
                        ${item.total_pagado && item.total_pagado !== '0.00' ? filaCustom('Total Pagado', `<span class="font-bold text-emerald-600 dark:text-emerald-400">${money(item.total_pagado)}</span>`) : ''}
                        ${filaCustom('Total a Pagar', `<span class="text-sm md:text-base font-black text-rose-600 dark:text-rose-400 font-archivo">${money(item.total_pagar)}</span>`)}
                    </tbody>
                </table>
                <div class="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-3.5 py-2.5 dark:border-slate-800/80 dark:bg-slate-950/30">
                    <span class="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        <i class="fas fa-shield-halved text-sky-500 mr-1"></i>${safe(item.tipo_acta, 'ACTA DE CONTROL ELECTRÓNICA ATU')}
                    </span>
                    ${documentButton}
                </div>
            </div>
        </article>`;
    }).join('');

    return `<section class="font-poppins">
        <div class="mb-3 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 via-amber-50/20 to-white px-3.5 py-3 dark:border-rose-900/50 dark:from-rose-950/30 dark:via-slate-900 dark:to-slate-900 shadow-xs">
            <div>
                <p class="text-[9px] font-extrabold uppercase tracking-[.16em] text-rose-700 dark:text-rose-400">Papeletas e Infracciones ATU</p>
                <p class="mt-0.5 text-sm font-black text-slate-900 dark:text-white">${records.length} acta${records.length !== 1 ? 's' : ''} para <span class="font-mono">${safe(plate)}</span></p>
            </div>
            <div class="text-right">
                <p class="text-[8px] font-bold uppercase tracking-wider text-slate-400">Total a pagar</p>
                <p class="text-base md:text-lg font-black text-rose-600 dark:text-rose-400 font-archivo">${money(totalPagar)}</p>
                <p class="text-[8px] font-bold text-rose-500 uppercase tracking-wider mt-0.5">⚠ Paga o evita cobranza coactiva</p>
            </div>
        </div>
        <div class="grid gap-3">${cards}</div>
    </section>`;
}
