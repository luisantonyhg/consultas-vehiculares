import { escapeHTML } from '../renderers.js';

const rawValue = (row, ...keys) => {
    for (const key of keys) {
        if (row?.[key] !== undefined && row?.[key] !== null && String(row[key]).trim()) return String(row[key]).trim();
    }
    return '';
};

const value = (row, ...keys) => escapeHTML(rawValue(row, ...keys) || '—');

const movementStyle = (type, index) => {
    const normalized = String(type || '').toUpperCase();
    if (normalized.includes('CANCEL') || normalized.includes('EJECUCION') || normalized.includes('EJECUCIÓN')) {
        return { dot: 'bg-rose-600', tag: 'bg-rose-50 text-rose-700 border-rose-200', icon: 'fa-triangle-exclamation' };
    }
    if (normalized.includes('CONSTITUID')) {
        return { dot: 'bg-emerald-500', tag: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'fa-lock' };
    }
    return index % 2
        ? { dot: 'bg-amber-500', tag: 'bg-amber-50 text-amber-700 border-amber-200', icon: 'fa-pen' }
        : { dot: 'bg-orange-500', tag: 'bg-orange-50 text-orange-700 border-orange-200', icon: 'fa-pen' };
};

const renderMovement = (movement, index, folio) => {
    const style = movementStyle(movement?.tipo, index);
    const attrs = {
        folio: rawValue({ folio }, 'folio'), year: rawValue(movement, 'anio_ticket'),
        ticket: rawValue(movement, 'id_ticket'), formId: rawValue(movement, 'id_formulario'),
        act: rawValue(movement, 'codigo_acto'), mod: rawValue(movement, 'tipo_modificacion'),
        form: rawValue(movement, 'formulario'),
    };
    const canOpen = Boolean(movement?.documento?.disponible && attrs.formId);
    return `<div class="relative pb-5 pl-8 last:pb-0">
        <span class="absolute left-[7px] top-2 h-full w-px bg-slate-200 last:hidden"></span>
        <span class="absolute left-0 top-1 flex h-4 w-4 items-center justify-center rounded-full ${style.dot} ring-4 ring-white"></span>
        <div class="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <span class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${style.tag}"><i class="fas ${style.icon}"></i>${value(movement, 'tipo')}</span>
            <p class="mt-2 text-[11px] font-black text-slate-800">Formulario N.º ${value(movement, 'formulario')}</p>
            <p class="mt-0.5 text-[10px] font-medium text-slate-500"><i class="far fa-calendar mr-1"></i>${value(movement, 'fecha')}</p>
            <p class="mt-2 text-[10px] leading-relaxed text-slate-500">${rawValue(movement, 'codigo_acto') === '00' ? 'Constitución inicial de la garantía sobre el vehículo.' : 'Operación registral que actualiza la garantía mobiliaria.'}</p>
            ${canOpen ? `<button type="button" class="sigm-document-button mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[10px] font-black text-slate-700 shadow-sm transition hover:border-lime-500 hover:text-lime-700" data-folio="${escapeHTML(attrs.folio)}" data-year="${escapeHTML(attrs.year)}" data-ticket="${escapeHTML(attrs.ticket)}" data-form-id="${escapeHTML(attrs.formId)}" data-act="${escapeHTML(attrs.act)}" data-mod="${escapeHTML(attrs.mod)}" data-form="${escapeHTML(attrs.form)}"><i class="fas fa-file-pdf text-rose-600"></i> Ver documento oficial</button>` : '<p class="mt-2 text-[10px] text-slate-400">Documento no disponible en la fuente.</p>'}
        </div>
    </div>`;
};

export function renderSIGM(data, plate) {
    const rows = Array.isArray(data) ? data : [];
    if (!rows.length) {
        return `<div class="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-center font-poppins dark:border-emerald-900 dark:bg-emerald-950/20"><div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white"><i class="fas fa-circle-check text-xl"></i></div><h4 class="mt-3 text-sm font-black text-emerald-800 dark:text-emerald-300">Vehículo sin garantías mobiliarias encontradas</h4><p class="mt-1 text-xs leading-relaxed text-emerald-700/80 dark:text-emerald-400">La consulta gratuita de la placa <strong>${escapeHTML(plate)}</strong> no devolvió folios en SIGM SUNARP.</p></div>`;
    }
    return `<div class="space-y-4 font-poppins">
        <div class="rounded-2xl border border-rose-200 bg-rose-50/70 p-4"><div class="flex items-start gap-3"><span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white"><i class="fas fa-lock"></i></span><div><h4 class="text-sm font-black text-rose-900">Tiene garantía mobiliaria registrada</h4><p class="mt-1 text-[10px] leading-relaxed text-rose-700">Revise el folio, su estado y cada formulario oficial antes de adquirir el vehículo.</p></div></div></div>
        ${rows.map((row, index) => {
            const folio = rawValue(row, 'numeroFolio', 'nuFolio');
            const movements = Array.isArray(row?.movimientos) ? [...row.movimientos].reverse() : [];
            const state = rawValue(row, 'estado_actual') || 'ACTIVA';
            return `<article class="overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm dark:border-rose-900/70 dark:bg-slate-900"><div class="border-b border-rose-100 bg-gradient-to-r from-rose-50 to-white px-4 py-3"><div class="flex flex-wrap items-center justify-between gap-2"><span class="text-[10px] font-black uppercase tracking-widest text-rose-700">Garantía N.º ${escapeHTML(folio || String(index + 1))}</span><span class="rounded-full ${state === 'CANCELADA' ? 'bg-slate-600' : 'bg-rose-600'} px-2.5 py-1 text-[9px] font-black uppercase text-white">${escapeHTML(state)}</span></div><div class="mt-3 grid grid-cols-2 gap-2 text-[10px]"><div><span class="block uppercase tracking-wide text-slate-400">Fecha de inscripción</span><strong class="text-slate-800">${value(row, 'fechaInscripcion')}</strong></div><div><span class="block uppercase tracking-wide text-slate-400">Última operación</span><strong class="text-slate-800">${value(row, 'ultimaOperacion')}</strong></div></div></div><div class="p-4"><h5 class="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800"><i class="fas fa-timeline text-lime-600"></i> Historial de movimientos</h5>${movements.length ? movements.map((movement, movementIndex) => renderMovement(movement, movementIndex, folio)).join('') : '<p class="rounded-xl bg-slate-50 p-3 text-[10px] text-slate-500">El folio fue identificado, pero su línea de tiempo no estuvo disponible temporalmente.</p>'}<div class="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-[10px] leading-relaxed text-blue-800"><i class="fas fa-circle-info mr-1"></i>Los datos del deudor garante, acreedor y condiciones completas se muestran dentro de cada formulario oficial.</div></div></article>`;
        }).join('')}
    </div>`;
}
