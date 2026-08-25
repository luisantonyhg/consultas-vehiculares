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
    if (!verified) return `<span class="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-amber-700"><i class="fas fa-clock"></i> Gravámenes por verificar</span>`;
    if (active > 0) return `<span class="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-2.5 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-rose-700"><i class="fas fa-triangle-exclamation"></i> ${active} gravamen${active === 1 ? '' : 'es'} vigente${active === 1 ? '' : 's'}</span>`;
    return `<span class="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-emerald-700"><i class="fas fa-circle-check"></i> Sin gravámenes vigentes</span>`;
}

function metric(icon, label, value, tone = 'slate') {
    const tones = {
        navy: 'border-blue-200 bg-blue-50/80 text-blue-800',
        emerald: 'border-emerald-200 bg-emerald-50/80 text-emerald-700',
        amber: 'border-amber-200 bg-amber-50/80 text-amber-700',
        slate: 'border-slate-200 bg-slate-50/80 text-slate-800',
    };
    return `<div class="rounded-xl border ${tones[tone] || tones.slate} p-2.5 sm:p-3.5"><div class="flex items-center justify-between gap-1"><span class="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] opacity-70 truncate">${safe(label)}</span><i class="${safe(icon)} text-xs opacity-70 shrink-0"></i></div><div class="mt-1 text-xl sm:text-2xl font-black leading-none">${safe(value)}</div></div>`;
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
    const pages = Array.isArray(event.paginas) && event.paginas.length ? event.paginas.join(', ') : '1';
    const participantsNat = (Array.isArray(event.participantes_naturales) ? event.participantes_naturales : []).filter(Boolean);
    const participantsJur = (Array.isArray(event.participantes_juridicos) ? event.participantes_juridicos : []).filter(Boolean);
    const allParticipants = [...participantsNat, ...participantsJur];

    const inscripcionStr = safe(event.inscripcion || event.fecha || '—');
    const presentacionStr = safe(event.presentacion || '—');
    const rubroStr = safe(event.rubro || event.subtitulo || 'PROPIEDAD VEHICULAR');
    const actoStr = safe(event.acto || event.titulo_registro || 'ACTO REGISTRAL');
    const natStr = safe(participantsNat.join(' - ') || '—');
    const jurStr = safe(participantsJur.join(' - ') || '—');

    return `<article class="sprl-timeline-item overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-blue-300 hover:shadow-md" data-category="${type.category}">
        <div class="p-3.5 sm:p-5">
            <div class="flex items-start gap-2.5 sm:gap-3.5">
                <div class="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-[#102a52] text-sm sm:text-base font-black text-white shadow-sm">${safe(event.asiento)}</div>
                <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center justify-between gap-1.5">
                        <div class="flex flex-wrap items-center gap-1.5">
                            <span class="rounded-full border px-2 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-wide ${colors[type.color]}">${safe(type.label)}</span>
                            ${event.anio ? `<span class="text-[9px] sm:text-[10px] font-black text-slate-400">AÑO ${safe(event.anio)}</span>` : ''}
                        </div>
                        <button type="button" class="sprl-modal-trigger inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 hover:bg-blue-100 transition-colors"
                            data-asiento="${safe(event.asiento)}"
                            data-inscripcion="${inscripcionStr}"
                            data-presentacion="${presentacionStr}"
                            data-rubro="${rubroStr}"
                            data-acto="${actoStr}"
                            data-nat="${natStr}"
                            data-jur="${jurStr}"
                            data-paginas="${safe(pages)}"
                            title="Ver detalles oficiales del asiento">
                            <svg viewBox="0 0 1024 1024" width="13" height="13" fill="currentColor" class="shrink-0"><path d="M926 164H94c-17.7 0-32 14.3-32 32v640c0 17.7 14.3 32 32 32h832c17.7 0 32-14.3 32-32V196c0-17.7-14.3-32-32-32zm-40 632H134V236h752v560zm-658.9-82.3c3.1 3.1 8.2 3.1 11.3 0l172.5-172.5 114.4 114.5c3.1 3.1 8.2 3.1 11.3 0l297-297.2c3.1-3.1 3.1-8.2 0-11.3l-36.8-36.8a8.03 8.03 0 00-11.3 0L531 565 416.6 450.5a8.03 8.03 0 00-11.3 0l-214.9 215a8.03 8.03 0 000 11.3l36.7 36.9z"></path></svg>
                            <span>Detalles</span>
                        </button>
                    </div>
                    <h4 class="mt-1.5 text-xs sm:text-sm font-black leading-snug text-slate-900 break-words">${safe(event.titulo_registro || event.titulo || `Asiento ${event.asiento}`)}</h4>
                    <p class="mt-0.5 text-[11px] sm:text-xs font-semibold leading-relaxed text-slate-500 break-words">${rubroStr} · ${actoStr}</p>
                    
                    <div class="mt-2.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2 text-[10px] sm:text-[11px]">
                        <div class="rounded-lg bg-slate-50 p-2 border border-slate-100/80"><span class="block font-bold uppercase text-slate-400 text-[8px] sm:text-[9px]">Asiento</span><strong class="text-slate-800 truncate block">N.° ${safe(event.asiento)}</strong></div>
                        <div class="rounded-lg bg-slate-50 p-2 border border-slate-100/80"><span class="block font-bold uppercase text-slate-400 text-[8px] sm:text-[9px]">Páginas</span><strong class="text-slate-800 truncate block">${safe(pages)}</strong></div>
                        <div class="rounded-lg bg-slate-50 p-2 border border-slate-100/80"><span class="block font-bold uppercase text-slate-400 text-[8px] sm:text-[9px]">Inscripción</span><strong class="text-slate-800 truncate block">${inscripcionStr}</strong></div>
                        <div class="rounded-lg bg-slate-50 p-2 border border-slate-100/80"><span class="block font-bold uppercase text-slate-400 text-[8px] sm:text-[9px]">Presentación</span><strong class="text-slate-800 truncate block">${presentacionStr}</strong></div>
                    </div>
                    ${allParticipants.length ? `<div class="mt-2.5 rounded-xl border border-slate-200 bg-white p-2 sm:p-2.5 text-[10px] sm:text-xs text-slate-600 break-words"><span class="mr-1 font-black uppercase text-slate-400">Participantes:</span>${safe(allParticipants.join(' · '))}</div>` : ''}
                </div>
            </div>
        </div>
    </article>`;
}

export function renderHistorialDuenos(data, plate = '') {
    if (!data) return `<div class="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs font-semibold text-slate-500">Historial registral no disponible.</div>`;
    const registro = data.registro || {};
    const resumen = data.resumen || {};
    const propiedad = data.propiedad || { actuales: [], anteriores: [] };
    const gravamenes = data.gravamenes || { vigentes: [], historicos: [] };
    const metadata = data.metadata || {};
    const warnings = Array.isArray(data.warnings) ? data.warnings.filter(Boolean) : [];
    const timeline = Array.isArray(data.timeline) ? data.timeline : [];
    const hallazgos = Array.isArray(data.hallazgos) ? data.hallazgos.filter(Boolean) : [];
    const verifiedSeats = metadata.asientos_verificados === true;
    const verifiedOwners = metadata.propietarios_verificados === true;
    const verifiedGravamenes = metadata.gravamenes_verificados === true;
    const totalSeats = numberValue(resumen.total_asientos) || timeline.length;
    const cleanPlate = String(plate || data.placa || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

    const actuales = Array.isArray(propiedad.actuales) ? propiedad.actuales : [];
    const anteriores = Array.isArray(propiedad.anteriores) ? propiedad.anteriores : [];
    const vigentes = Array.isArray(gravamenes.vigentes) ? gravamenes.vigentes : [];

    return `<div id="sprl-historial-container" data-plate="${safe(cleanPlate)}" class="space-y-3 sm:space-y-4 font-poppins text-slate-800 w-full overflow-hidden">
        <!-- Header Registral SUNARP -->
        <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div class="bg-gradient-to-r from-[#102a52] to-[#173d72] p-4 sm:p-6 text-white">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div class="flex items-center gap-3">
                        <img src="/assets/sunarp.jpeg" alt="SUNARP" class="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white object-contain p-1 shadow shrink-0" />
                        <div class="min-w-0">
                            <p class="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-blue-200">Registro vehicular SUNARP</p>
                            <h3 class="mt-0.5 text-base sm:text-lg font-black truncate">${safe(registro.partida, 'Inscripción Confirmada')}</h3>
                            <p class="text-[11px] sm:text-xs font-semibold text-blue-100 truncate">${safe(registro.oficina)} · ${safe(registro.area, 'PROPIEDAD VEHICULAR')}</p>
                        </div>
                    </div>
                    <div class="inline-flex w-fit items-center rounded-xl border-2 border-slate-900 bg-white px-3 py-1.5 sm:px-4 sm:py-2 font-mono text-lg sm:text-xl font-black tracking-[0.14em] text-slate-950 shadow-inner">${safe(formatPlate(cleanPlate))}</div>
                </div>
            </div>
            <div class="p-3.5 sm:p-6">
                <div class="flex flex-col gap-2.5 border-b border-slate-200 pb-3.5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p class="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Situación registral</p>
                        <p class="mt-0.5 text-xs sm:text-sm font-extrabold text-slate-800">${verifiedOwners ? 'Titularidad registral confirmada' : 'Consulta registral en curso'}</p>
                    </div>
                    ${statusPill(metadata, gravamenes)}
                </div>
                <div class="mt-3 sm:mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                    ${metric('fas fa-user-check', 'Titulares Actuales', verifiedOwners ? (actuales.length || '1') : '—', 'navy')}
                    ${metric('fas fa-layer-group', 'Asientos Registrados', verifiedSeats ? totalSeats : '—', 'emerald')}
                    ${metric('fas fa-shield-halved', 'Gravámenes', verifiedGravamenes ? vigentes.length : 'Pendiente', vigentes.length > 0 ? 'rose' : 'emerald')}
                    ${metric('fas fa-file-lines', 'Estado Partida', safe(metadata.estado_vehiculo || 'VIGENTE'), 'slate')}
                </div>
                ${warnings.length ? `<div class="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3"><div class="flex items-start gap-2 text-xs font-semibold leading-relaxed text-amber-800"><i class="fas fa-circle-info mt-0.5 shrink-0"></i><span class="break-words">${safe(warnings.join(' '))}</span></div></div>` : ''}
            </div>
        </section>

        <!-- Titular / Propietario Actual Real -->
        <section class="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-sm">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div class="flex items-center gap-2">
                    <div class="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                        <i class="fas fa-user text-xs sm:text-sm"></i>
                    </div>
                    <div>
                        <h4 class="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-900">Titular / Propietario Registrado</h4>
                        <p class="text-[9px] sm:text-[10px] font-semibold text-slate-400">Información extraída del registro oficial SUNARP</p>
                    </div>
                </div>
                <span class="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase text-emerald-700 border border-emerald-200">Vigente</span>
            </div>
            <div class="mt-2.5 space-y-2">
                ${actuales.length ? actuales.map(p => `
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 rounded-xl bg-slate-50 p-2.5 sm:p-3 border border-slate-100">
                        <div class="flex items-center gap-2.5 min-w-0">
                            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${p.tipo === 'persona_juridica' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'} font-bold">
                                <i class="${p.tipo === 'persona_juridica' ? 'fas fa-building' : 'fas fa-user'} text-xs"></i>
                            </div>
                            <div class="min-w-0">
                                <p class="text-xs font-black text-slate-900 break-words">${safe(p.nombre)}</p>
                                <p class="text-[10px] font-semibold text-slate-500">${p.tipo === 'persona_juridica' ? 'Persona Jurídica' : 'Persona Natural'} ${p.documento && p.documento !== '-' ? `· Doc: ${safe(p.documento)}` : ''}</p>
                            </div>
                        </div>
                        ${p.desde ? `<span class="shrink-0 text-[10px] font-bold text-slate-400 self-end sm:self-auto">Inscripción ${safe(p.desde)}</span>` : ''}
                    </div>
                `).join('') : `
                    <div class="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-3 text-center text-xs font-medium text-slate-500">
                        No se identificaron titulares individuales en el resumen preliminar.
                    </div>
                `}
            </div>
        </section>

        <!-- Propietarios Anteriores / Historial de Transferencias -->
        ${anteriores.length ? `
            <section class="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-sm">
                <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div class="flex items-center gap-2">
                        <div class="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 shrink-0">
                            <i class="fas fa-clock-rotate-left text-xs sm:text-sm"></i>
                        </div>
                        <div>
                            <h4 class="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-900">Historial de Propietarios Anteriores</h4>
                            <p class="text-[9px] sm:text-[10px] font-semibold text-slate-400">${anteriores.length} transferencia${anteriores.length === 1 ? '' : 's'} registrada${anteriores.length === 1 ? '' : 's'}</p>
                        </div>
                    </div>
                    <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase text-slate-600 border border-slate-200">Histórico</span>
                </div>
                <div class="mt-2.5 space-y-2">
                    ${anteriores.map(p => `
                        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 rounded-xl bg-slate-50/70 p-2.5 sm:p-3 border border-slate-100">
                            <div class="flex items-center gap-2.5 min-w-0">
                                <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-600 font-bold text-xs">
                                    ${p.asiento ? `A${p.asiento}` : '<i class="fas fa-user-clock text-xs"></i>'}
                                </div>
                                <div class="min-w-0">
                                    <p class="text-xs font-bold text-slate-800 break-words">${safe(p.nombre)}</p>
                                    <p class="text-[10px] font-semibold text-slate-400">Asiento N.° ${safe(p.asiento, '—')} · ${safe(p.periodo || 'Periodo anterior')}</p>
                                </div>
                            </div>
                            <span class="shrink-0 rounded-md bg-slate-200/80 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-slate-600 self-end sm:self-auto">${safe(p.periodo, 'Transferido')}</span>
                        </div>
                    `).join('')}
                </div>
            </section>
        ` : ''}

        <!-- Gravámenes y Medidas Cautelares -->
        <section class="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-sm">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div class="flex items-center gap-2">
                    <div class="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg ${vigentes.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'} shrink-0">
                        <i class="${vigentes.length > 0 ? 'fas fa-triangle-exclamation' : 'fas fa-shield-check'} text-xs sm:text-sm"></i>
                    </div>
                    <div>
                        <h4 class="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-900">Gravámenes y Medidas Cautelares</h4>
                        <p class="text-[9px] sm:text-[10px] font-semibold text-slate-400">Anotaciones preventivas, embargos o prendas</p>
                    </div>
                </div>
            </div>
            <div class="mt-2.5">
                ${vigentes.length ? `
                    <div class="space-y-2">
                        ${vigentes.map(g => `
                            <div class="rounded-xl border border-rose-200 bg-rose-50/50 p-2.5 sm:p-3">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="min-w-0">
                                        <div class="flex items-center gap-2">
                                            <span class="rounded-full bg-rose-100 px-2 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-wide text-rose-800">${safe(g.tipo, 'Gravamen')}</span>
                                            ${g.fecha ? `<span class="text-[9px] sm:text-[10px] font-semibold text-slate-500">${safe(g.fecha)}</span>` : ''}
                                        </div>
                                        <p class="mt-1 text-xs font-bold text-slate-800 break-words">${safe(g.observacion || 'Medida cautelar activa inscrita')}</p>
                                    </div>
                                    <span class="shrink-0 rounded-full bg-rose-600 px-2 py-0.5 text-[8px] sm:text-[9px] font-black text-white uppercase">Vigente</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="flex items-center gap-2.5 sm:gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-emerald-800">
                        <i class="fas fa-circle-check text-sm sm:text-base text-emerald-600 shrink-0"></i>
                        <div>
                            <p class="text-xs font-black">Sin gravámenes vigentes confirmados</p>
                            <p class="text-[10px] font-semibold text-emerald-700 leading-snug">El vehículo no presenta órdenes de captura, embargos ni prendas registradas en SUNARP.</p>
                        </div>
                    </div>
                `}
            </div>
        </section>

        <!-- Hallazgos Analíticos -->
        ${hallazgos.length ? `
            <section class="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-sm">
                <div class="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                    <div class="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                        <i class="fas fa-magnifying-glass-chart text-xs sm:text-sm"></i>
                    </div>
                    <div>
                        <h4 class="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-900">Inteligencia Registral</h4>
                        <p class="text-[9px] sm:text-[10px] font-semibold text-slate-400">Diagnóstico analítico del estado vehicular</p>
                    </div>
                </div>
                <ul class="mt-2.5 space-y-1.5 sm:space-y-2">
                    ${hallazgos.map(h => `
                        <li class="flex items-start gap-2 text-xs font-medium text-slate-700">
                            <i class="fas fa-circle-dot mt-1 text-[7px] text-blue-500 shrink-0"></i>
                            <span class="break-words">${safe(h)}</span>
                        </li>
                    `).join('')}
                </ul>
            </section>
        ` : ''}

        <!-- Trazabilidad Registral / Asientos -->
        <section class="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 sm:p-5">
            <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p class="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">Trazabilidad registral oficial</p>
                    <h3 class="mt-0.5 text-sm sm:text-base font-black text-slate-900">${verifiedSeats ? `${totalSeats} asiento${totalSeats === 1 ? '' : 's'} registrado${totalSeats === 1 ? '' : 's'} en la partida` : 'Asientos registrales'}</h3>
                </div>
                ${timeline.length ? `
                    <div class="flex flex-wrap gap-1 w-full sm:w-fit rounded-xl border border-slate-200 bg-white p-1 text-[9px] sm:text-[10px] font-black">
                        <button type="button" class="sprl-filter-btn active flex-1 sm:flex-initial rounded-lg bg-[#102a52] px-2.5 py-1.5 text-white transition-colors text-center" data-filter="all">Todos (${timeline.length})</button>
                        <button type="button" class="sprl-filter-btn flex-1 sm:flex-initial rounded-lg px-2.5 py-1.5 text-slate-500 hover:bg-slate-100 transition-colors text-center" data-filter="transfers">Ventas</button>
                        <button type="button" class="sprl-filter-btn flex-1 sm:flex-initial rounded-lg px-2.5 py-1.5 text-slate-500 hover:bg-slate-100 transition-colors text-center" data-filter="other">Modificaciones</button>
                        <button type="button" class="sprl-filter-btn flex-1 sm:flex-initial rounded-lg px-2.5 py-1.5 text-slate-500 hover:bg-slate-100 transition-colors text-center" data-filter="alerts">Gravámenes / Alertas</button>
                    </div>
                ` : ''}
            </div>
            <div id="sprl-timeline-list" class="mt-3.5 space-y-2.5 sm:space-y-3">
                ${timeline.length ? timeline.slice().reverse().map(renderSeat).join('') : `
                    <div class="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center text-xs font-semibold text-slate-500">
                        La consulta dinámica oficial confirmó la titularidad y estado legal del vehículo.
                    </div>
                `}
            </div>
        </section>
    </div>

    <!-- Modal Oficial de Detalles SPRL -->
    <div id="sprl-details-modal" class="fixed inset-0 z-[9999] hidden items-center justify-center p-4 backdrop-blur-sm bg-slate-900/60 transition-opacity">
        <div class="w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-100 transform transition-transform animate-card max-h-[90vh] overflow-y-auto">
            <div class="flex items-start gap-3">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <svg viewBox="64 64 896 896" focusable="false" fill="currentColor" width="22" height="22"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path><path d="M464 336a48 48 0 1096 0 48 48 0 10-96 0zm72 112h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V456c0-4.4-3.6-8-8-8z"></path></svg>
                </div>
                <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between">
                        <h3 class="text-base sm:text-lg font-black text-slate-900">Detalles del Asiento</h3>
                        <button type="button" id="sprl-modal-close-x" class="text-slate-400 hover:text-slate-700 p-1 text-lg font-bold">✕</button>
                    </div>
                    <div class="mt-3 overflow-x-auto">
                        <table class="w-full text-left text-xs border-collapse">
                            <tbody class="divide-y divide-slate-100">
                                <tr class="py-2"><td class="py-2 pr-3 font-bold text-slate-500 w-32 shrink-0">Inscripción:</td><td id="sprl-m-inscripcion" class="py-2 font-black text-slate-900">—</td></tr>
                                <tr class="py-2"><td class="py-2 pr-3 font-bold text-slate-500">Presentación:</td><td id="sprl-m-presentacion" class="py-2 font-semibold text-slate-800">—</td></tr>
                                <tr class="py-2"><td class="py-2 pr-3 font-bold text-slate-500">Rubro:</td><td id="sprl-m-rubro" class="py-2 font-black text-blue-700 uppercase">—</td></tr>
                                <tr class="py-2"><td class="py-2 pr-3 font-bold text-slate-500">Acto:</td><td id="sprl-m-acto" class="py-2 font-extrabold text-slate-900 uppercase">—</td></tr>
                                <tr class="py-2"><td class="py-2 pr-3 font-bold text-slate-500 align-top">Participantes Naturales:</td><td id="sprl-m-nat" class="py-2 font-medium text-slate-700 break-words leading-relaxed">—</td></tr>
                                <tr class="py-2"><td class="py-2 pr-3 font-bold text-slate-500 align-top">Participantes Jurídicos:</td><td id="sprl-m-jur" class="py-2 font-medium text-slate-700 break-words leading-relaxed">—</td></tr>
                                <tr class="py-2"><td class="py-2 pr-3 font-bold text-slate-500">Páginas:</td><td id="sprl-m-paginas" class="py-2 font-bold text-slate-800">[ 1 ]</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="mt-5 flex justify-end">
                <button type="button" id="sprl-modal-accept" class="rounded-xl bg-[#102a52] hover:bg-[#173d72] px-5 py-2.5 text-xs font-black text-white shadow-md transition-all active:scale-95">
                    Aceptar
                </button>
            </div>
        </div>
    </div>`;
}

export function initHistorialDuenosEvents() {
    const container = document.getElementById('sprl-historial-container');
    if (!container) return;

    // Filtros de pestañas
    const buttons = container.querySelectorAll('.sprl-filter-btn');
    const items = container.querySelectorAll('.sprl-timeline-item');
    buttons.forEach((button) => button.addEventListener('click', () => {
        buttons.forEach((item) => { item.classList.remove('active', 'bg-[#102a52]', 'text-white'); item.classList.add('text-slate-500'); });
        button.classList.add('active', 'bg-[#102a52]', 'text-white');
        button.classList.remove('text-slate-500');
        const filter = button.getAttribute('data-filter');
        items.forEach((item) => { item.style.display = filter === 'all' || item.getAttribute('data-category') === filter ? '' : 'none'; });
    }));

    // Modal de Detalles SPRL
    const modal = document.getElementById('sprl-details-modal');
    if (modal) {
        const closeX = document.getElementById('sprl-modal-close-x');
        const closeBtn = document.getElementById('sprl-modal-accept');
        const mInscripcion = document.getElementById('sprl-m-inscripcion');
        const mPresentacion = document.getElementById('sprl-m-presentacion');
        const mRubro = document.getElementById('sprl-m-rubro');
        const mActo = document.getElementById('sprl-m-acto');
        const mNat = document.getElementById('sprl-m-nat');
        const mJur = document.getElementById('sprl-m-jur');
        const mPaginas = document.getElementById('sprl-m-paginas');

        const closeModal = () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        };

        if (closeX) closeX.addEventListener('click', closeModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        const triggers = container.querySelectorAll('.sprl-modal-trigger');
        triggers.forEach((trigger) => {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                if (mInscripcion) mInscripcion.textContent = trigger.getAttribute('data-inscripcion') || '—';
                if (mPresentacion) mPresentacion.textContent = trigger.getAttribute('data-presentacion') || '—';
                if (mRubro) mRubro.textContent = trigger.getAttribute('data-rubro') || '—';
                if (mActo) mActo.textContent = trigger.getAttribute('data-acto') || '—';
                if (mNat) mNat.textContent = trigger.getAttribute('data-nat') || '—';
                if (mJur) mJur.textContent = trigger.getAttribute('data-jur') || '—';
                if (mPaginas) mPaginas.textContent = trigger.getAttribute('data-paginas') ? `[ ${trigger.getAttribute('data-paginas')} ]` : '[ 1 ]';

                modal.classList.remove('hidden');
                modal.classList.add('flex');
            });
        });
    }
}



