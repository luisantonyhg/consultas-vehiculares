/** Historial registral SUNARP: un dato no consultado nunca se muestra como cero. */
import { escapeHTML } from '../renderers.js';

const safe = (value, fallback = '—') => escapeHTML(
    value === null || value === undefined || value === '' ? fallback : String(value)
);
const numberValue = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

function formatPlate(value) {
    const clean = String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    return clean.length === 6 ? `${clean.slice(0, 3)}-${clean.slice(3)}` : clean;
}

function statusPill(metadata, gravamenes) {
    const verified = metadata.gravamenes_verificados === true;
    const active = Array.isArray(gravamenes.vigentes) ? gravamenes.vigentes.length : 0;
    if (!verified) return `<span class="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-amber-700"><i class="fas fa-clock"></i> Gravámenes por verificar</span>`;
    if (active > 0) return `<span class="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-rose-700"><i class="fas fa-triangle-exclamation"></i> ${active} gravamen${active === 1 ? '' : 'es'} vigente${active === 1 ? '' : 's'}</span>`;
    return `<span class="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-emerald-700"><i class="fas fa-circle-check"></i> Sin gravámenes vigentes</span>`;
}

function metric(icon, label, value, tone = 'slate') {
    const tones = {
        navy: 'border-blue-200 bg-blue-50 text-blue-800',
        emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        amber: 'border-amber-200 bg-amber-50 text-amber-700',
        slate: 'border-slate-200 bg-slate-50 text-slate-800',
    };
    return `<div class="rounded-xl border ${tones[tone] || tones.slate} p-3.5"><div class="flex items-center justify-between gap-2"><span class="text-[10px] font-black uppercase tracking-[0.12em] opacity-70">${safe(label)}</span><i class="${safe(icon)} text-xs opacity-70"></i></div><div class="mt-1 text-2xl font-black leading-none">${safe(value)}</div></div>`;
}

function seatType(event) {
    const type = String(event.tipo || '').toUpperCase();
    if (type === 'TRANSFERENCIA') return { label: 'Compra · Venta', color: 'blue', category: 'transfers' };
    if (type === 'PRIMERA_INSCRIPCION') return { label: 'Primera inscripción', color: 'emerald', category: 'other' };
    if (type.includes('ROBO') || type === 'REMATE' || type === 'GRAVAMEN') return { label: event.acto || event.subtitulo || type, color: 'rose', category: 'alerts' };
    return { label: event.acto || event.subtitulo || 'Acto registral', color: 'slate', category: 'other' };
}

function renderSeat(event) {
    const type = seatType(event);
    const colors = {
        blue: 'border-blue-200 bg-blue-50 text-blue-700',
        emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        rose: 'border-rose-200 bg-rose-50 text-rose-700',
        slate: 'border-slate-200 bg-slate-50 text-slate-700',
    };
    const pages = Array.isArray(event.paginas) && event.paginas.length ? event.paginas.join(', ') : '—';
    const participants = [
        ...(Array.isArray(event.participantes_naturales) ? event.participantes_naturales : []),
        ...(Array.isArray(event.participantes_juridicos) ? event.participantes_juridicos : []),
    ].filter(Boolean);
    return `<article class="sprl-timeline-item overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" data-category="${type.category}">
        <div class="flex items-start gap-3 p-4 sm:p-5">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#102a52] text-base font-black text-white shadow-sm">${safe(event.asiento)}</div>
            <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2"><span class="rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ${colors[type.color]}">${safe(type.label)}</span>${event.anio ? `<span class="text-[10px] font-black text-slate-400">AÑO ${safe(event.anio)}</span>` : ''}</div>
                <h4 class="mt-2 text-sm font-black leading-snug text-slate-900 sm:text-base">${safe(event.titulo_registro || event.titulo || `Asiento ${event.asiento}`)}</h4>
                <p class="mt-1 text-xs font-semibold leading-relaxed text-slate-500">${safe(event.rubro || event.subtitulo || event.acto)}</p>
                <div class="mt-3 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
                    <div class="rounded-lg bg-slate-50 px-3 py-2"><span class="block font-bold uppercase text-slate-400">Asiento</span><strong class="text-slate-800">N.° ${safe(event.asiento)}</strong></div>
                    <div class="rounded-lg bg-slate-50 px-3 py-2"><span class="block font-bold uppercase text-slate-400">Páginas</span><strong class="text-slate-800">${safe(pages)}</strong></div>
                    <div class="rounded-lg bg-slate-50 px-3 py-2"><span class="block font-bold uppercase text-slate-400">Inscripción</span><strong class="text-slate-800">${safe(event.inscripcion || event.fecha)}</strong></div>
                    <div class="rounded-lg bg-slate-50 px-3 py-2"><span class="block font-bold uppercase text-slate-400">Presentación</span><strong class="text-slate-800">${safe(event.presentacion)}</strong></div>
                </div>
                ${participants.length ? `<div class="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600"><span class="mr-1 font-black uppercase text-slate-400">Participantes:</span>${safe(participants.join(' · '))}</div>` : ''}
            </div>
        </div>
    </article>`;
}

export function renderHistorialDuenos(data, plate = '') {
    if (!data) return `<div class="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs font-semibold text-slate-500">Historial registral no disponible.</div>`;
    const registro = data.registro || {};
    const resumen = data.resumen || {};
    const gravamenes = data.gravamenes || { vigentes: [], historicos: [] };
    const metadata = data.metadata || {};
    const warnings = Array.isArray(data.warnings) ? data.warnings.filter(Boolean) : [];
    const timeline = Array.isArray(data.timeline) ? data.timeline : [];
    const verifiedSeats = metadata.asientos_verificados === true;
    const totalSeats = numberValue(resumen.total_asientos) || timeline.length;
    const totalPages = numberValue(resumen.total_paginas);
    const transfers = numberValue(resumen.transferencias);
    const cleanPlate = String(plate || data.placa || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

    return `<div id="sprl-historial-container" data-plate="${safe(cleanPlate)}" class="space-y-4 font-poppins text-slate-800">
        <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div class="bg-gradient-to-r from-[#102a52] to-[#173d72] px-4 py-5 text-white sm:px-6">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div class="flex items-center gap-3"><img src="/assets/sunarp.jpeg" alt="SUNARP" class="h-12 w-12 rounded-xl bg-white object-contain p-1.5 shadow" /><div><p class="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">Registro vehicular SUNARP</p><h3 class="mt-1 text-lg font-black">Partida N.° ${safe(registro.partida, 'Pendiente')}</h3><p class="mt-0.5 text-xs font-semibold text-blue-100">${safe(registro.oficina)} · ${safe(registro.area)}</p></div></div>
                    <div class="inline-flex w-fit items-center rounded-xl border-2 border-slate-900 bg-white px-4 py-2 font-mono text-xl font-black tracking-[0.14em] text-slate-950 shadow-inner">${safe(formatPlate(cleanPlate))}</div>
                </div>
            </div>
            <div class="p-4 sm:p-6">
                <div class="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between"><div><p class="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Situación registral</p><p class="mt-1 text-sm font-extrabold text-slate-800">${verifiedSeats ? 'Listado de asientos confirmado' : 'Consulta registral parcial'}</p></div>${statusPill(metadata, gravamenes)}</div>
                <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    ${metric('fas fa-layer-group', 'Asientos', verifiedSeats ? totalSeats : '—', 'navy')}
                    ${metric('fas fa-right-left', 'Compra-ventas', verifiedSeats ? transfers : '—', 'emerald')}
                    ${metric('fas fa-file-lines', 'Páginas', verifiedSeats ? totalPages : '—', 'slate')}
                    ${metric('fas fa-shield-halved', 'Gravámenes', metadata.gravamenes_verificados ? numberValue(resumen.gravamenes_vigentes) : 'Pendiente', 'amber')}
                </div>
                ${warnings.length ? `<div class="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5"><div class="flex items-start gap-2.5 text-xs font-semibold leading-relaxed text-amber-800"><i class="fas fa-circle-info mt-0.5"></i><span>${safe(warnings.join(' '))}</span></div></div>` : ''}
            </div>
        </section>
        <section class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p class="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">Trazabilidad registral</p><h3 class="mt-1 text-base font-black text-slate-900">${verifiedSeats ? `${totalSeats} asientos encontrados` : 'Asientos pendientes de verificación'}</h3></div>${timeline.length ? `<div class="inline-flex w-fit rounded-xl border border-slate-200 bg-white p-1 text-[10px] font-black"><button type="button" class="sprl-filter-btn active rounded-lg bg-[#102a52] px-3 py-1.5 text-white" data-filter="all">Todos</button><button type="button" class="sprl-filter-btn rounded-lg px-3 py-1.5 text-slate-500" data-filter="transfers">Ventas</button></div>` : ''}</div>
            <div id="sprl-timeline-list" class="mt-4 space-y-3">${timeline.length ? timeline.slice().reverse().map(renderSeat).join('') : `<div class="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-xs font-semibold text-slate-500">La fuente todavía no entregó el listado verificable de asientos.</div>`}</div>
        </section>
    </div>`;
}

export function initHistorialDuenosEvents() {
    const container = document.getElementById('sprl-historial-container');
    if (!container) return;
    const buttons = container.querySelectorAll('.sprl-filter-btn');
    const items = container.querySelectorAll('.sprl-timeline-item');
    buttons.forEach((button) => button.addEventListener('click', () => {
        buttons.forEach((item) => { item.classList.remove('active', 'bg-[#102a52]', 'text-white'); item.classList.add('text-slate-500'); });
        button.classList.add('active', 'bg-[#102a52]', 'text-white');
        button.classList.remove('text-slate-500');
        const filter = button.getAttribute('data-filter');
        items.forEach((item) => { item.style.display = filter === 'all' || item.getAttribute('data-category') === filter ? '' : 'none'; });
    }));
}
