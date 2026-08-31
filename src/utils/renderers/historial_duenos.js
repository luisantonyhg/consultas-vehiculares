/** Historial registral SUNARP: un dato no consultado nunca se muestra como cero. */
import { escapeHTML } from '../renderers.js';

const safe = (value, fallback = '—') => escapeHTML(
    value === null || value === undefined || value === '' ? fallback : String(value)
);
function formatPlate(value) {
    const clean = String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    return clean.length === 6 ? `${clean.slice(0, 3)}-${clean.slice(3)}` : clean;
}

function statusPill(metadata = {}, gravamenes = {}, verification = {}) {
    const status = gravamenes.status || verification.encumbrances_history || (metadata.gravamenes_verificados ? 'VERIFIED_NONE' : 'NOT_VERIFIED');
    const active = Array.isArray(gravamenes.vigentes) ? gravamenes.vigentes.length : 0;
    if (status === 'FOUND' || active > 0) {
        return `<span class="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-2.5 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-rose-700"><i class="fas fa-triangle-exclamation"></i> ${active || 1} gravamen${active === 1 ? '' : 'es'}</span>`;
    }
    if (status === 'PARTIAL') {
        return `<span class="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-amber-700"><i class="fas fa-clock"></i> Parcial</span>`;
    }
    if (status === 'FAILED') {
        return `<span class="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-slate-700"><i class="fas fa-circle-question"></i> No disponible</span>`;
    }
    if (status === 'VERIFIED_NONE' || status === 'VERIFIED') {
        return `<span class="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-emerald-700"><i class="fas fa-circle-check"></i> Sin gravámenes vigentes</span>`;
    }
    // NOT_VERIFIED
    return `<span class="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-amber-700"><i class="fas fa-clock"></i> Pendiente</span>`;
}

function metric(icon, label, value, tone = 'slate') {
    const tones = {
        navy: 'border-blue-200 bg-blue-50/80 text-blue-800',
        emerald: 'border-emerald-200 bg-emerald-50/80 text-emerald-700',
        amber: 'border-amber-200 bg-amber-50/80 text-amber-700',
        slate: 'border-slate-200 bg-slate-50/80 text-slate-800',
        rose: 'border-rose-200 bg-rose-50/80 text-rose-700',
        blue: 'border-blue-200 bg-blue-50/80 text-blue-700',
        violet: 'border-violet-200 bg-violet-50/80 text-violet-700',
        cyan: 'border-cyan-200 bg-cyan-50/80 text-cyan-700',
    };
    return `<div class="rounded-xl border ${tones[tone] || tones.slate} p-2.5 sm:p-3.5"><div class="flex items-start justify-between gap-1"><span class="min-w-0 text-[9px] sm:text-[10px] font-black uppercase leading-tight tracking-[0.1em] opacity-70 break-words">${safe(label)}</span><i class="${safe(icon)} mt-0.5 text-xs opacity-70 shrink-0"></i></div><div class="mt-1 text-xl sm:text-2xl font-black leading-none">${safe(value)}</div></div>`;
}

function seatType(event) {
    const type = String(event.tipo || '').toUpperCase();
    const family = String(event.family || event.classification?.family || '').toUpperCase();
    const legalEffect = String(event.legal_effect || event.classification?.legal_effect || '').toUpperCase();
    const lifecycle = String(event.lifecycle_status || event.classification?.lifecycle_status || '').toUpperCase();
    const ownershipEffect = String(event.ownership_effect || event.classification?.ownership_effect || '').toUpperCase();
    const actoLower = String(event.acto || event.acto_raw || '').toLowerCase();

    if (ownershipEffect === 'INITIAL' || actoLower.includes('primera inscrip')) {
        return {
            title: 'Primera inscripción de dominio',
            badgeText: 'Inicio de titularidad',
            badgeIcon: 'fas fa-circle-check',
            badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/60',
            iconClass: 'bg-blue-600 text-white',
            icon: 'fas fa-flag',
            effectBadge: 'bg-blue-100 text-blue-800',
            effectLabel: 'Inicio de titularidad',
            category: 'other'
        };
    }
    if (family === 'OWNERSHIP' || ownershipEffect === 'TRANSFER' || actoLower.includes('compra') || actoLower.includes('venta') || actoLower.includes('transferencia')) {
        return {
            title: 'Compra - Venta',
            badgeText: 'Cambia titularidad',
            badgeIcon: 'fas fa-user',
            badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
            iconClass: 'bg-emerald-600 text-white',
            icon: 'fas fa-users',
            effectBadge: 'bg-emerald-100 text-emerald-800',
            effectLabel: 'Implica cambio de propietario',
            category: 'transfers'
        };
    }
    if (family === 'CHARACTERISTICS' || actoLower.includes('caracteristica') || actoLower.includes('características') || actoLower.includes('cambio de motor') || actoLower.includes('color')) {
        return {
            title: event.acto || 'Cambio de características',
            badgeText: 'Actualización técnica',
            badgeIcon: 'fas fa-wrench',
            badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/60',
            iconClass: 'bg-amber-500 text-white',
            icon: 'fas fa-wrench',
            effectBadge: 'bg-slate-100 text-slate-700',
            effectLabel: 'No cambia titularidad',
            category: 'other'
        };
    }
    if (family === 'LEGAL_RESTRICTION' || legalEffect !== 'NONE' || actoLower.includes('embargo') || actoLower.includes('robo') || actoLower.includes('cautelar')) {
        const isClosed = ['CLOSED', 'MODIFIED', 'EXECUTED'].includes(lifecycle)
            || ['CANCEL', 'LIFT'].includes(legalEffect);
        const isOpen = lifecycle === 'OPEN' || (legalEffect === 'CREATE' && lifecycle !== 'UNRESOLVED');
        if (isClosed) {
            return {
                title: event.acto || 'Cancelación de afectación',
                badgeText: 'Antecedente cancelado',
                badgeIcon: 'fas fa-shield-halved',
                badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/60',
                iconClass: 'bg-rose-600 text-white',
                icon: 'fas fa-shield-halved',
                effectBadge: 'bg-rose-100 text-rose-800',
                effectLabel: 'Afectación cerrada o cancelada',
                category: 'alerts'
            };
        }
        return {
            title: event.acto || 'Afectación registral',
            badgeText: isOpen ? 'Afectación vigente' : 'Pendiente de verificación',
            badgeIcon: 'fas fa-triangle-exclamation',
            badgeClass: isOpen ? 'bg-rose-50 text-rose-700 border-rose-200/60' : 'bg-amber-50 text-amber-700 border-amber-200/60',
            iconClass: isOpen ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white',
            icon: 'fas fa-triangle-exclamation',
            effectBadge: 'bg-rose-100 text-rose-800',
            effectLabel: 'Afectación legal',
            category: 'alerts'
        };
    }
    return {
        title: event.acto || 'Acto registral',
        badgeText: 'Acto registral',
        badgeIcon: 'fas fa-file-lines',
        badgeClass: 'bg-slate-50 text-slate-700 border-slate-200/60',
        iconClass: 'bg-slate-600 text-white',
        icon: 'fas fa-file-contract',
        effectBadge: 'bg-slate-100 text-slate-700',
        effectLabel: 'Acto administrativo',
        category: 'other'
    };
}

function renderSeat(event) {
    const type = seatType(event);
    const pages = Array.isArray(event.paginas) && event.paginas.length ? event.paginas.join(', ') : '1';
    const participantsNat = (Array.isArray(event.participantes_naturales) ? event.participantes_naturales : []).filter(Boolean);
    const participantsJur = (Array.isArray(event.participantes_juridicos) ? event.participantes_juridicos : []).filter(Boolean);
    const allParticipants = [...new Set([...participantsNat, ...participantsJur])];
    const seatNumber = event.asiento ?? event.numero ?? event.numero_raw ?? '—';
    const year = event.anio || '—';
    const titleNumber = event.titulo || event.titulo_raw || '—';
    const rubroCode = event.rubro_codigo || event.codigo_rubro || event.rubro_code || '—';

    const rubroStr = safe(event.rubro_raw || event.rubro || (type.category === 'transfers' ? 'TRANSFERENCIA DE PROPIEDAD' : (type.title.includes('características') ? 'REGISTRO DE PROPIEDAD VEHICULAR' : 'PROPIEDAD VEHICULAR')));
    const actoStr = safe(event.acto_raw || event.acto || type.title.toUpperCase());
    const natStr = participantsNat.length ? safe(participantsNat.join(', ')) : 'Sin participantes identificados';
    const jurStr = participantsJur.length ? safe(participantsJur.join(', ')) : 'Sin participantes identificados';
    const fechaInsc = safe(event.inscripcion_raw || event.inscripcion || (event.anio ? String(event.anio) : '—'));
    const fechaPres = safe(event.presentacion_raw || event.presentacion || '—');
    const tone = type.category === 'alerts'
        ? { border: 'border-rose-200', panel: 'bg-rose-50/45 border-rose-200/80', accent: 'text-rose-800', people: 'border-rose-100 bg-white/80' }
        : type.category === 'transfers'
            ? { border: 'border-emerald-200', panel: 'bg-emerald-50/40 border-emerald-200/80', accent: 'text-emerald-900', people: 'border-emerald-100 bg-white/80' }
            : { border: 'border-slate-200', panel: 'bg-slate-50/70 border-slate-200', accent: 'text-slate-800', people: 'border-slate-200 bg-white' };
    const linkedPeople = allParticipants.length
        ? allParticipants.map(name => `<span class="inline-flex items-center gap-1.5 rounded-lg border ${tone.people} px-2.5 py-1.5 text-[11px] sm:text-xs font-bold text-slate-800"><i class="fas fa-user text-[10px] opacity-60"></i>${safe(name)}</span>`).join('')
        : '<span class="text-[11px] font-medium text-slate-500">Sin participantes identificados en el detalle gratuito del asiento.</span>';
    const eventSentence = type.category === 'transfers'
        ? (allParticipants.length
            ? `<strong>${safe(allParticipants.join(', '))}</strong> figura vinculado a la transferencia inscrita el <strong>${fechaInsc}</strong>.`
            : `La transferencia de propiedad fue inscrita el <strong>${fechaInsc}</strong>.`)
        : type.category === 'alerts'
            ? `SUNARP registró <strong>${actoStr}</strong> el <strong>${fechaInsc}</strong>. ${String(type.effectLabel).toLowerCase().includes('cerrada') ? 'Este asiento corresponde a un antecedente cerrado o cancelado.' : 'La vigencia se determina con la cadena completa de asientos.'}`
            : `SUNARP registró <strong>${actoStr}</strong> el <strong>${fechaInsc}</strong>.`;

    return `<article class="sprl-timeline-item rounded-2xl border ${tone.border} bg-white p-3.5 sm:p-5 shadow-xs" data-category="${type.category}">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="flex min-w-0 items-start gap-3">
                <div class="shrink-0 text-center"><div class="text-sm font-black ${tone.accent}">${safe(year)}</div><div class="mt-0.5 rounded-md bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-slate-600">Asiento N.° ${safe(seatNumber)}</div></div>
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${type.iconClass}"><i class="${type.icon} text-sm"></i></div>
                <div class="min-w-0"><h4 class="text-sm font-black uppercase leading-snug ${tone.accent}">${actoStr}</h4><p class="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">${rubroStr}</p></div>
            </div>
            <span class="inline-flex self-start items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase ${type.badgeClass}"><i class="${type.badgeIcon}"></i>${safe(type.badgeText)}</span>
        </div>
        <div class="mt-3 rounded-xl border ${tone.people} p-3">
            <p class="mb-2 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500"><i class="fas fa-users mr-1.5"></i>Personas vinculadas</p><div class="flex flex-wrap gap-1.5">${linkedPeople}</div>
        </div>
        <p class="mt-3 rounded-xl border ${tone.panel} px-3 py-2.5 text-[11px] leading-relaxed text-slate-700">${eventSentence}</p>
        <div class="mt-3 rounded-xl border ${tone.panel} p-3 sm:p-4">
            <p class="mb-3 text-[9px] font-black uppercase tracking-[0.15em] ${tone.accent}">Información registral SUNARP</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-5 text-[11px] sm:text-xs">
                    <div class="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span class="font-bold text-slate-500 sm:w-36 shrink-0">N.° de Título SUNARP</span><span class="text-slate-900 font-mono font-bold break-words">${safe(titleNumber)}</span>
                    </div>
                    <div class="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span class="font-bold text-slate-500 sm:w-36 shrink-0">N.° de Asiento</span><span class="text-slate-900 font-bold">${safe(seatNumber)}</span>
                    </div>
                    <div class="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span class="font-bold text-slate-500 sm:w-36 shrink-0">Año</span><span class="text-slate-900 font-bold">${safe(year)}</span>
                    </div>
                    <div class="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span class="font-bold text-slate-500 sm:w-36 shrink-0">Código de Rubro</span><span class="text-slate-900 font-bold">${safe(rubroCode)}</span>
                    </div>
                    <div class="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span class="font-bold text-slate-500 sm:w-36 shrink-0">Fecha de Presentación</span><span class="text-slate-900 font-medium break-words">${fechaPres}</span>
                    </div>
                    <div class="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span class="font-bold text-slate-500 sm:w-36 shrink-0">Fecha de Inscripción</span><span class="text-slate-900 font-bold break-words">${fechaInsc}</span>
                    </div>
                    <div class="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span class="font-bold text-slate-500 sm:w-36 shrink-0">Rubro</span><span class="text-slate-900 font-medium break-words">${rubroStr}</span>
                    </div>
                    <div class="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span class="font-bold text-slate-500 sm:w-36 shrink-0">Acto</span><span class="font-bold break-words ${tone.accent}">${actoStr}</span>
                    </div>
                    <div class="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span class="font-bold text-slate-500 sm:w-36 shrink-0">Participantes Naturales</span><span class="text-slate-900 font-medium break-words">${natStr}</span>
                    </div>
                    <div class="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span class="font-bold text-slate-500 sm:w-36 shrink-0">Participantes Jurídicos</span><span class="text-slate-900 font-medium break-words">${jurStr}</span>
                    </div>
                    <div class="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2"><span class="font-bold text-slate-500 sm:w-36 shrink-0">Páginas</span><span class="text-slate-900 font-medium">${safe(pages)}</span></div>
                    <div class="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2"><span class="font-bold text-slate-500 sm:w-36 shrink-0">Efecto registral</span><span class="inline-flex w-fit items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${type.effectBadge}">${safe(type.effectLabel)}</span></div>
                </div>
        </div>
    </article>`;
}

function buildAnalyticalNarrative(data, timeline, resumen, gravamenes) {
    const verifiedSeats = data.metadata?.asientos_verificados === true || data.verification?.seat_list === 'VERIFIED';
    const totalSeats = (resumen.total_asientos !== null && resumen.total_asientos !== undefined)
        ? resumen.total_asientos
        : (verifiedSeats && timeline.length ? timeline.length : null);
    const transfers = resumen.transferencias ?? null;
    const holders = resumen.propietarios_unicos_historicos ?? data.ownership_history?.unique_holders ?? null;
    const vigentes = Array.isArray(gravamenes.vigentes) ? gravamenes.vigentes.length : 0;
    const historicos = Array.isArray(gravamenes.historicos) ? gravamenes.historicos.length : 0;
    const alertasCanceladas = (Array.isArray(data.alertas) ? data.alertas : []).filter(alerta => {
        const state = String(alerta.lifecycle_status || alerta.estado || alerta.tipo || '').toUpperCase();
        return state.includes('CLOSED') || state.includes('CANCEL');
    }).length;
    const antecedentes = historicos + alertasCanceladas;
    const encumbrancesVerified = ['VERIFIED', 'VERIFIED_NONE'].includes(String(gravamenes.status || data.verification?.encumbrances_history || '').toUpperCase());
    const normalized = timeline.map(event => ({
        ...event,
        act: String(event.acto || event.acto_raw || '').toUpperCase(),
        date: event.inscripcion_raw || event.inscripcion || event.presentacion_raw || event.presentacion || event.anio || 'fecha no disponible',
    }));
    const isCancellation = event => {
        const effect = String(event.legal_effect || event.classification?.legal_effect || '').toUpperCase();
        if (effect === 'CREATE') return false;
        if (['CANCEL', 'LIFT'].includes(effect)) return true;
        return /CANCEL|LEVANTA|CIERRE|EXTINC/.test(event.act)
            || ['CLOSED', 'MODIFIED', 'EXECUTED'].includes(String(event.lifecycle_status || event.classification?.lifecycle_status || '').toUpperCase());
    };
    const theftOpen = normalized.filter(event => event.act.includes('ROBO') && !isCancellation(event));
    const theftClosed = normalized.filter(event => event.act.includes('ROBO') && isCancellation(event));
    const embargoOpen = normalized.filter(event => /EMBARGO|CAUTELAR/.test(event.act) && !isCancellation(event));
    const embargoClosed = normalized.filter(event => /EMBARGO|CAUTELAR/.test(event.act) && isCancellation(event));
    const latestTransfer = normalized
        .filter(event => seatType(event).category === 'transfers')
        .sort((a, b) => Number(b.asiento ?? b.numero ?? 0) - Number(a.asiento ?? a.numero ?? 0))[0];
    const latestPeople = latestTransfer
        ? [...new Set([...(latestTransfer.participantes_naturales || []), ...(latestTransfer.participantes_juridicos || [])].filter(Boolean))]
        : [];
    const paragraphs = [];
    if (totalSeats !== null || transfers !== null || holders !== null) {
        paragraphs.push(`Se revisaron ${totalSeats === null ? 'los asientos disponibles' : `<strong>${safe(totalSeats)} asientos oficiales</strong>`}. La cadena contiene ${transfers === null ? 'transferencias aún por cuantificar' : `<strong>${safe(transfers)} transferencias de dominio</strong>`} y permite identificar ${holders === null ? 'los titulares visibles en cada asiento' : `<strong>${safe(holders)} titulares o personas vinculadas</strong>`}.`);
    } else {
        paragraphs.push('La cantidad total de asientos y transferencias todavía está pendiente de verificación.');
    }
    if (latestTransfer) {
        paragraphs.push(`El último cambio de titularidad visible se inscribió el <strong>${safe(latestTransfer.date)}</strong>${latestPeople.length ? ` y vincula a <strong>${safe(latestPeople.join(', '))}</strong>` : ''} (asiento N.° ${safe(latestTransfer.asiento ?? latestTransfer.numero ?? '—')}).`);
    }
    if (theftOpen.length || theftClosed.length) {
        const first = theftOpen[0];
        const closed = theftClosed[theftClosed.length - 1];
        paragraphs.push(first && closed
            ? `Existe un antecedente de <strong class="text-rose-700">anotación de robo</strong> registrado el <strong>${safe(first.date)}</strong> y posteriormente cancelado el <strong>${safe(closed.date)}</strong>. Se muestra en rojo por su importancia, pero la cadena lo identifica como antecedente cerrado.`
            : theftOpen.length
                ? `Se detectó una <strong class="text-rose-700">anotación de robo</strong> en la cadena. Su estado debe contrastarse con los asientos posteriores y la sección de afectaciones vigentes.`
                : `La cadena contiene una cancelación relacionada con robo; el asiento se conserva como antecedente registral cerrado.`);
    }
    if (embargoOpen.length || embargoClosed.length) {
        paragraphs.push(embargoOpen.length && embargoClosed.length
            ? `También se observa un embargo o medida cautelar y su levantamiento/cancelación posterior; ambos permanecen visibles como parte de la historia legal del vehículo.`
            : `Se encontró un antecedente de embargo o medida cautelar en la partida registral.`);
    }
    let legal = 'El estado de afectaciones aún está pendiente de verificación.';
    if (vigentes > 0) {
        legal = `<strong class="text-rose-700">Atención:</strong> se identificaron <strong>${safe(vigentes)} afectaciones vigentes</strong>; revise el bloque de afectaciones antes de continuar.`;
    } else if (encumbrancesVerified) {
        legal = '<strong class="text-emerald-700">Diagnóstico actual:</strong> no se identificaron afectaciones registrales abiertas en los asientos verificados.';
    }
    if (antecedentes) legal += ` La partida conserva <strong>${safe(antecedentes)} antecedente${antecedentes === 1 ? '' : 's'} cancelado${antecedentes === 1 ? '' : 's'}</strong> para trazabilidad.`;
    paragraphs.push(legal);
    return `<div class="space-y-2">${paragraphs.map((paragraph, index) => `<p class="${index === paragraphs.length - 1 ? 'rounded-lg border border-slate-200 bg-white/80 p-2.5' : ''}">${paragraph}</p>`).join('')}</div>`;
}

export function renderHistorialDuenos(data, plate = '') {
    if (!data) return `<div class="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs font-semibold text-slate-500">Historial registral no disponible.</div>`;
    const registro = data.registro || {};
    const resumen = data.resumen || {};
    const ownership = data.ownership_history || {};
    const legacyPropiedad = data.propiedad || { actuales: [], anteriores: [] };
    const gravamenes = data.gravamenes || { vigentes: [], historicos: [], events: [] };
    const metadata = data.metadata || {};
    const warnings = Array.isArray(data.warnings) ? data.warnings.filter(Boolean) : [];
    const reconciliation = ownership.current_owner_reconciliation || 'UNCHECKED';
    const reconciliationWarning = reconciliation === 'MISMATCH'
        ? 'Existe diferencia entre la titularidad identificada en SPRL y la Consulta Vehicular SUNARP.'
        : '';
    const timeline = Array.isArray(data.asientos) ? data.asientos : (Array.isArray(data.timeline) ? data.timeline : []);
    const verifiedSeats = metadata.asientos_verificados === true || data.verification?.seat_list === 'VERIFIED';
    const encumbrancesStatus = gravamenes.status || data.verification?.encumbrances_history || 'NOT_VERIFIED';
    const ownershipVerified = ownership.status === 'VERIFIED' || data.verification?.ownership_history === 'VERIFIED';
    const encumbrancesVerified = ['VERIFIED', 'VERIFIED_NONE'].includes(String(encumbrancesStatus).toUpperCase());
    const anteriores = Array.isArray(ownership.previous)
        ? ownership.previous
        : (Array.isArray(legacyPropiedad.anteriores) ? legacyPropiedad.anteriores : []);
    const vigentes = Array.isArray(gravamenes.vigentes) ? gravamenes.vigentes : [];

    const totalSeats = (resumen.total_asientos !== null && resumen.total_asientos !== undefined)
        ? resumen.total_asientos
        : (verifiedSeats && timeline.length ? timeline.length : '—');
    const etapasTitularidad = (resumen.etapas_titularidad !== null && resumen.etapas_titularidad !== undefined)
        ? resumen.etapas_titularidad
        : (ownershipVerified ? (ownership.stage_count ?? ownership.stages?.length ?? '—') : '—');
    const totalTransferencias = (resumen.transferencias !== null && resumen.transferencias !== undefined)
        ? resumen.transferencias
        : (ownershipVerified ? (ownership.transfer_count ?? '—') : '—');
    const affectationMetric = encumbrancesStatus === 'FOUND'
        ? `${vigentes.length || 1} vigentes`
        : (encumbrancesStatus === 'PARTIAL' ? 'En verificación' : (encumbrancesVerified ? '0 vigentes' : 'Pendiente'));
    const cleanPlate = String(plate || data.placa || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

    const partidaNum = registro.partida || data.vehiculo?.partida || data.partida;
    const partidaText = partidaNum ? `Partida N.° ${partidaNum}` : 'Partida registral oficial';

    return `<div id="sprl-historial-container" data-plate="${safe(cleanPlate)}" class="flex flex-col gap-3 font-poppins text-slate-800 w-full overflow-hidden">
        <style>#sprl-historial-container .sprl-timeline-item{min-width:0}#sprl-historial-container .seat-details{animation:sprl-open .2s ease-out}@keyframes sprl-open{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}</style>

        <!-- Header Registral SUNARP (Compacto y estilizado) -->
        <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-xs">
            <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
                <div class="flex items-center gap-3">
                    <div class="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 shrink-0"><i class="fas fa-car text-base sm:text-lg"></i></div>
                    <div class="min-w-0">
                        <h3 class="text-sm sm:text-base font-bold text-slate-900 truncate leading-tight">${safe(data.vehiculo?.marca)} ${safe(data.vehiculo?.modelo)}</h3>
                        <p class="text-[11px] font-medium text-slate-500 truncate mt-0.5">${partidaText} · ${safe(registro.oficina || 'LIMA')}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2 self-start sm:self-auto">
                    <div class="inline-flex items-center rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 font-mono text-xs sm:text-sm font-bold text-slate-800 tracking-wider">${safe(formatPlate(cleanPlate))}</div>
                    <span class="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700"><i class="fas fa-circle-check text-[9px]"></i>${safe(data.vehiculo?.estado || 'En circulación')}</span>
                </div>
            </div>

            <!-- Diseño compacto original; métricas exclusivamente verificadas -->
            <div class="mt-3 grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/70 p-1 sm:p-1.5 text-left">
                <div class="px-2.5 py-1.5 min-w-0">
                    <span class="block text-[9px] font-bold uppercase text-slate-400 tracking-wider">Total Asientos</span>
                    <strong class="block text-xs sm:text-sm font-bold text-slate-800">${safe(totalSeats)}</strong>
                </div>
                <div class="px-2.5 py-1.5 min-w-0">
                    <span class="block text-[9px] font-bold uppercase text-slate-400 tracking-wider">Etapas de titularidad</span>
                    <strong class="block text-xs sm:text-sm font-bold text-slate-800">${safe(etapasTitularidad)}</strong>
                </div>
                <div class="px-2.5 py-1.5 min-w-0">
                    <span class="block text-[9px] font-bold uppercase text-slate-400 tracking-wider">Transferencias</span>
                    <strong class="block text-xs sm:text-sm font-bold text-slate-800">${safe(totalTransferencias)}</strong>
                </div>
                <div class="px-2.5 py-1.5 min-w-0">
                    <span class="block text-[9px] font-bold uppercase text-slate-400 tracking-wider">Afectaciones</span>
                    <strong class="block text-xs sm:text-sm font-bold ${encumbrancesStatus === 'FOUND' ? 'text-rose-600' : (encumbrancesVerified ? 'text-emerald-700' : 'text-amber-600')}">${safe(affectationMetric)}</strong>
                </div>
            </div>
            ${(() => {
                const userWarnings = [...warnings, reconciliationWarning]
                    .filter(Boolean)
                    .filter(w => !['SPRL_SEAT_DETAILS_INCOMPLETE', 'SPRL_OWNERSHIP_PARTICIPANT_MISSING', 'SPRL_CURRENT_OWNER_MISMATCH', 'SPRL_ENCUMBRANCE_UNMAPPED_ACT', 'SPRL_OWNERSHIP_CHRONOLOGY_WARNING', 'SPRL_SEARCH_TIMEOUT', 'SPRL_AUTH_FAILED'].includes(w) && !w.toLowerCase().includes('sprl_') && !w.toLowerCase().includes('timeout'));
                return userWarnings.length ? `<div class="mt-2.5 rounded-lg border border-amber-200 bg-amber-50/80 p-2 text-[11px] font-medium leading-relaxed text-amber-800 flex items-start gap-1.5"><i class="fas fa-circle-info mt-0.5 text-xs shrink-0"></i><span class="break-words">${safe(userWarnings.join(' '))}</span></div>` : '';
            })()}
        </section>

        <!-- Propietarios Anteriores / Historial de Transferencias -->
        ${anteriores.length ? `
            <section class="order-3 rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-xs">
                <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div class="flex items-center gap-2">
                        <div class="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 shrink-0">
                            <i class="fas fa-clock-rotate-left text-xs sm:text-sm"></i>
                        </div>
                        <div>
                            <h4 class="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-900">Propietarios anteriores identificados</h4>
                            <p class="text-[9px] sm:text-[10px] font-medium text-slate-400">${anteriores.length} titular${anteriores.length === 1 ? '' : 'es'} anterior${anteriores.length === 1 ? '' : 'es'} identificado${anteriores.length === 1 ? '' : 's'}</p>
                        </div>
                    </div>
                    <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase text-slate-600 border border-slate-200">Histórico</span>
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
                                    <p class="text-[10px] font-medium text-slate-500">${p.desde ? `Adquirió o figura desde ${safe(p.desde)}` : 'Fecha de adquisición no precisada'}${p.asiento ? ` · Asiento N.° ${safe(p.asiento)}` : ''}</p>
                                </div>
                            </div>
                            <span class="shrink-0 rounded-md bg-slate-200/80 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-slate-600 self-end sm:self-auto">${safe(p.periodo, 'Transferido')}</span>
                        </div>
                    `).join('')}
                </div>
            </section>
        ` : ''}

        <!-- Gravámenes y Medidas Cautelares -->
        <section class="order-4 rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-xs">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div class="flex items-center gap-2">
                    <div class="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg ${encumbrancesStatus === 'FOUND' ? 'bg-rose-50 text-rose-600' : ((encumbrancesStatus === 'VERIFIED_NONE' || encumbrancesStatus === 'VERIFIED') ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600')} shrink-0">
                        <i class="${encumbrancesStatus === 'FOUND' ? 'fas fa-triangle-exclamation' : ((encumbrancesStatus === 'VERIFIED_NONE' || encumbrancesStatus === 'VERIFIED') ? 'fas fa-shield-check' : 'fas fa-clock')} text-xs sm:text-sm"></i>
                    </div>
                    <div>
                        <h4 class="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-900">Afectaciones registrales</h4>
                        <p class="text-[9px] sm:text-[10px] font-medium text-slate-400">Resultado verificado en partida y asientos SPRL</p>
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
                                            <span class="rounded-full bg-rose-100 px-2 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-wide text-rose-800">${safe(g.tipo, 'Gravamen')}</span>
                                            ${g.fecha ? `<span class="text-[9px] sm:text-[10px] font-medium text-slate-500">${safe(g.fecha)}</span>` : ''}
                                        </div>
                                        <p class="mt-1 text-xs font-bold text-slate-800 break-words">${safe(g.observacion || g.raw || 'Medida cautelar o carga detectada')}</p>
                                    </div>
                                    <span class="shrink-0 rounded-full bg-rose-600 px-2 py-0.5 text-[8px] sm:text-[9px] font-bold text-white uppercase">${safe(g.estado, 'Detectado')}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ((encumbrancesStatus === 'PARTIAL') ? `
                    <div class="flex items-center gap-2.5 sm:gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-amber-800">
                        <i class="fas fa-circle-info text-sm sm:text-base text-amber-600 shrink-0"></i>
                        <div>
                            <p class="text-xs font-bold">Verificación parcial de gravámenes</p>
                            <p class="text-[10px] font-medium text-amber-700 leading-snug">Se verificó la titularidad registral básica. Las anotaciones detalladas requieren inspección de títulos archivados.</p>
                        </div>
                    </div>
                ` : (encumbrancesVerified ? `
                    <div class="flex items-center gap-2.5 sm:gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-emerald-800">
                        <i class="fas fa-circle-check text-sm sm:text-base text-emerald-600 shrink-0"></i>
                        <div>
                            <p class="text-xs font-bold">No se identificaron afectaciones abiertas</p>
                            <p class="text-[10px] font-medium text-emerald-700 leading-snug">El vehículo no registra medidas cautelares, embargos ni prendas vehiculares activas.</p>
                        </div>
                    </div>
                ` : `
                    <div class="flex items-center gap-2.5 sm:gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-amber-800">
                        <i class="fas fa-clock text-sm sm:text-base text-amber-600 shrink-0"></i>
                        <div><p class="text-xs font-bold">Afectaciones pendientes de verificación</p><p class="text-[10px] font-medium text-amber-700 leading-snug">No se mostrará cero hasta completar la revisión de todos los asientos registrales.</p></div>
                    </div>
                `))}
            </div>
        </section>

        <!-- Trazabilidad Registral / Asientos -->
        <section class="order-2 rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-xs">
            <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p class="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">Trazabilidad registral oficial</p>
                    <h3 class="mt-0.5 text-sm sm:text-base font-bold text-slate-900">Línea de tiempo del historial registral del vehículo</h3>
                    <p class="mt-1 text-[10px] sm:text-[11px] font-medium text-slate-500">Qué ocurrió, cuándo fue registrado y qué personas aparecen vinculadas en cada asiento. Del más reciente al más antiguo.</p>
                </div>
            </div>
            <div id="sprl-timeline-list" class="mt-3.5 space-y-3">
                ${timeline.length ? timeline.slice().reverse().map(renderSeat).join('') : `
                    <div class="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center text-xs font-semibold text-slate-500">
                        La consulta dinámica oficial confirmó la titularidad y estado legal del vehículo.
                    </div>
                `}
            </div>

            <!-- Resumen y Diagnóstico Registral Dinámico (Delgado, con marco elegante) -->
            <div class="mt-4 rounded-xl border border-blue-200/70 bg-gradient-to-r from-blue-50/50 via-white to-slate-50/50 p-3 sm:p-4 shadow-xs">
                <div class="flex items-start gap-2.5">
                    <div class="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0 shadow-xs">
                        <i class="fas fa-file-shield text-xs sm:text-sm"></i>
                    </div>
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center justify-between gap-2">
                            <h4 class="text-xs sm:text-sm font-bold text-slate-900">Resumen y Diagnóstico Registral</h4>
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wide"><i class="fas fa-chart-simple text-[8px]"></i> Inteligencia Registral</span>
                        </div>
                        <div class="mt-2 text-[11px] sm:text-xs text-slate-600 leading-relaxed font-normal">
                            ${buildAnalyticalNarrative(data, timeline, resumen, gravamenes)}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </div>`;
}

export function initHistorialDuenosEvents() {
    const container = document.getElementById('sprl-historial-container');
    if (!container) return;

    let openSeat = null;
    container.querySelectorAll('.sprl-seat-toggle').forEach((button) => button.addEventListener('click', () => {
        const details = document.getElementById(button.getAttribute('aria-controls'));
        if (!details) return;
        const opening = details.classList.contains('hidden');
        if (openSeat && openSeat !== details) {
            openSeat.classList.add('hidden');
            openSeat.setAttribute('aria-hidden', 'true');
            const prevChevron = openSeat.parentElement?.querySelector('.sprl-seat-chevron');
            if (prevChevron) prevChevron.classList.remove('rotate-180');
            openSeat.parentElement?.querySelector('.sprl-seat-toggle')?.setAttribute('aria-expanded', 'false');
        }
        details.classList.toggle('hidden', !opening);
        details.setAttribute('aria-hidden', String(!opening));
        button.setAttribute('aria-expanded', String(opening));
        const chevron = button.querySelector('.sprl-seat-chevron');
        if (chevron) {
            chevron.classList.toggle('rotate-180', opening);
        }
        openSeat = opening ? details : null;
    }));
}
