// Mapings and Configurations
export * from './renderers/index.js';

export const LOGO_MAPPING = {
    soat: '/assets/apeseg.png',
    citv: '/assets/mtc.png',
    lunas: '/assets/pnp.png',
    callao: '/assets/callao.png',
    lima: '/assets/sat.png',
    sutran: '/assets/sutran.png',
    cinemometro: '/assets/sutran.png',
    atu: '/assets/atu.png',
    gnv: '/assets/infogas.png',
    sbs: '/assets/sbs.png',
    sunarp: '/assets/sunarp.jpeg',
    vehiculo: '/assets/sunarp.jpeg',
    sat_captura: '/assets/sat.png',
    sat_deposito: '/assets/sat.png',
    sat_deuda: '/assets/sat.png',
    placas_pe: '/assets/aap.png',
    valor_venal: '/assets/apeseg.png',
    osinergmin: '/assets/osinergmin.png'
};

export const SOURCE_URLS = {
    soat: 'https://www.apeseg.org.pe/consultas-soat/',
    citv: 'https://rec.mtc.gob.pe/Citv/ArConsultaCitv',
    lunas: 'https://sistemas.policia.gob.pe/consultalunas/ConsultarServicioLunas',
    callao: 'https://pagopapeletascallao.pe/',
    lima: 'https://www.sat.gob.pe/',
    sutran: 'https://webexterno.sutran.gob.pe/WebExterno/Pages/frmRecordInfracciones.aspx',
    cinemometro: 'https://webexterno.sutran.gob.pe/WebExterno/Pages/frmPapeletasCinemometro.aspx',
    atu: 'https://soluciones.atu.gob.pe/ConsultaVehiculo',
    gnv: 'https://vh.infogas.com.pe/',
    sbs: 'https://servicios.sbs.gob.pe/reportesoat/',
    sunarp: 'https://consultavehicular.sunarp.gob.pe/consulta-vehicular/',
    vehiculo: 'https://www.sunarp.gob.pe/',
    placas_pe: 'https://www.placas.pe/#/home/verificarEstadoPlaca',
    valor_venal: 'https://www.apeseg.org.pe/lista-referencial-de-precios/',
    osinergmin: 'https://pvo.osinergmin.gob.pe/msfh5/registroHidrocarburos.xhtml?method=buscar',
    sat_captura: 'https://www.sat.gob.pe/VirtualSAT/modulos/Capturas.aspx',
    sat_deposito: 'https://www.sat.gob.pe/VirtualSAT/modulos/ConsultaDeposito.aspx',
    sat_deuda: 'https://www.sat.gob.pe/pagosenlinea/',
    municipal: 'https://www.munihuanuco.gob.pe/wp-content/servicios/transportes/gt_papeletas.php'
};

export const SERVICE_COLORS = {
    soat:     { bg: 'bg-blue-50 dark:bg-blue-950/20',     icon: 'text-blue-600 dark:text-blue-400',    ring: 'ring-blue-200 dark:ring-blue-900' },
    citv:     { bg: 'bg-emerald-50 dark:bg-emerald-950/20', icon: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-200 dark:ring-emerald-900' },
    lunas:    { bg: 'bg-purple-50 dark:bg-purple-950/20',   icon: 'text-purple-600 dark:text-purple-400',  ring: 'ring-purple-200 dark:ring-purple-900' },
    callao:   { bg: 'bg-red-50 dark:bg-red-950/20',       icon: 'text-red-600 dark:text-red-400',      ring: 'ring-red-200 dark:ring-red-900' },
    lima:     { bg: 'bg-amber-50 dark:bg-amber-950/20',     icon: 'text-amber-600 dark:text-amber-400',    ring: 'ring-amber-200 dark:ring-amber-900' },
    sutran:      { bg: 'bg-orange-50 dark:bg-orange-950/20',   icon: 'text-orange-600 dark:text-orange-400',  ring: 'ring-orange-200 dark:ring-orange-900' },
    cinemometro: { bg: 'bg-rose-50 dark:bg-rose-950/20',      icon: 'text-rose-600 dark:text-rose-400',      ring: 'ring-rose-200 dark:ring-rose-900' },
    atu:         { bg: 'bg-teal-50 dark:bg-teal-950/20',      icon: 'text-teal-600 dark:text-teal-400',      ring: 'ring-teal-200 dark:ring-teal-900' },
    gnv:      { bg: 'bg-green-50 dark:bg-green-950/20',     icon: 'text-green-600 dark:text-green-400',   ring: 'ring-green-200 dark:ring-green-900' },
    sbs:      { bg: 'bg-violet-50 dark:bg-violet-950/20',  icon: 'text-violet-600 dark:text-violet-400', ring: 'ring-violet-200 dark:ring-violet-900' },
    sunarp:   { bg: 'bg-indigo-50 dark:bg-indigo-950/20',  icon: 'text-indigo-600 dark:text-indigo-400', ring: 'ring-indigo-200 dark:ring-indigo-900' },
    vehiculo: { bg: 'bg-slate-50 dark:bg-slate-950/20',   icon: 'text-slate-600 dark:text-slate-400',  ring: 'ring-slate-200 dark:ring-slate-900' },
    placas_pe: { bg: 'bg-cyan-50 dark:bg-cyan-950/20',    icon: 'text-cyan-600 dark:text-cyan-400',   ring: 'ring-cyan-200 dark:ring-cyan-900' },
    valor_venal: { bg: 'bg-amber-50 dark:bg-amber-950/20', icon: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-200 dark:ring-amber-900' },
    osinergmin: { bg: 'bg-lime-50 dark:bg-lime-950/20',   icon: 'text-lime-600 dark:text-lime-400',   ring: 'ring-lime-200 dark:ring-lime-900' }
};

// Formatters and Helpers
export function getFormattedTimestamp() {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const date = `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()}`;
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    return `${date} ${time}`;
}

export function parseDateDDMMYYYY(dateStr) {
    if (!dateStr) return new Date(0);
    const parts = dateStr.trim().split('/');
    if (parts.length !== 3) return new Date(0);
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
}

export function fila(label, value) {
    if (!value || value === 'null' || value === 'undefined' || value.trim() === '') return '';
    return `<tr class="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors duration-150 group font-poppins">
        <td class="py-1.5 px-2 md:py-2 md:px-4 text-[9px] md:text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/30 dark:bg-slate-900/10 border-r border-slate-150 dark:border-slate-800/40 w-[38%] align-middle font-poppins">${label}</td>
        <td class="py-1.5 px-2 md:py-2 md:px-4 text-[11px] md:text-xs font-bold text-slate-850 dark:text-slate-200 leading-tight w-auto align-middle font-poppins">${value}</td>
    </tr>`;
}

export function getColors(cardId) {
    return SERVICE_COLORS[cardId] || { bg: 'bg-slate-50 dark:bg-slate-900', icon: 'text-slate-600 dark:text-slate-400', ring: 'ring-slate-200 dark:ring-slate-800' };
}

/**
 * Convierte una fecha del portal (dd/mm/aaaa, dd-mm-aaaa o aaaa-mm-dd) a Date.
 * Devuelve null si no se puede interpretar.
 */
export function parseFechaPE(str) {
    if (!str || typeof str !== 'string') return null;
    const s = str.trim().split(' ')[0];
    let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) {
        const d = new Date(+m[3], +m[2] - 1, +m[1]);
        return isNaN(d.getTime()) ? null : d;
    }
    m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (m) {
        const d = new Date(+m[1], +m[2] - 1, +m[3]);
        return isNaN(d.getTime()) ? null : d;
    }
    return null;
}

/**
 * Días completos entre hoy y una fecha. Negativo = ya pasó (vencido).
 */
export function diasHasta(fechaStr) {
    const f = parseFechaPE(fechaStr);
    if (!f) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    f.setHours(0, 0, 0, 0);
    return Math.round((f - hoy) / 86400000);
}

/**
 * "50 días" / "1 día" / "2 años 3 meses".
 * Hasta un año se expresa SIEMPRE en días: es la unidad que se pidió y la que
 * sirve para decidir ("VENCIDO hace 50 días" es accionable, "hace 1 mes" no).
 * A partir del año se pasa a años/meses porque "hace 2392 días" no se lee.
 */
function _formatoLapso(dias) {
    const n = Math.abs(dias);
    if (n < 365) return `${n} ${n === 1 ? 'día' : 'días'}`;
    const anios = Math.floor(n / 365);
    const meses = Math.floor((n % 365) / 30);
    return meses > 0
        ? `${anios} ${anios === 1 ? 'año' : 'años'} ${meses} ${meses === 1 ? 'mes' : 'meses'}`
        : `${anios} ${anios === 1 ? 'año' : 'años'}`;
}

/**
 * Etiqueta de estado enriquecida con el tiempo transcurrido/restante.
 * "VENCIDO" a secas no dice si caducó ayer o hace tres años, que es justo lo
 * que necesita saber quien consulta → "VENCIDO (50 días)".
 */
export function estadoConVigencia(estado, fechaVencimiento) {
    const base = (estado || '').toString().trim();
    const dias = diasHasta(fechaVencimiento);
    if (dias === null) return base;

    const s = base.toUpperCase();
    const vigenteDeclarado = s === 'VIGENTE' || s === 'APROBADO' || s === 'APROBADA';

    if (dias < 0) {
        // Vencido: siempre indicar cuánto hace. Si el portal decía "VIGENTE"
        // pero la fecha ya pasó, manda la fecha.
        return `VENCIDO (hace ${_formatoLapso(dias)})`;
    }
    if (vigenteDeclarado) {
        if (dias === 0) return 'VENCE HOY';
        if (dias <= 30) return `${base} (vence en ${_formatoLapso(dias)})`;
        return base;
    }
    return base;
}

export function estadoBadge(estado) {
    const s = (estado || '').toUpperCase();

    // Ámbar: vigente pero a punto de caducar (lo genera estadoConVigencia).
    if (s.includes('VENCE HOY') || s.includes('VENCE EN')) {
        return `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-900 shadow-sm font-poppins">
            <i class="fas fa-triangle-exclamation"></i> ${estado}
        </span>`;
    }
    // startsWith y no igualdad exacta: el estado puede venir enriquecido
    // ("VIGENTE (vence en 12 días)") y con === caía al badge rojo de vencido.
    if (s.startsWith('VIGENTE') || s.startsWith('APROBAD')) {
        return `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-900 shadow-sm font-poppins">
            <i class="fas fa-circle-check"></i> ${estado}
        </span>`;
    }
    return `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-900 shadow-sm font-poppins">
        <i class="fas fa-circle-xmark"></i> ${estado || 'VENCIDO'}
    </span>`;
}

export function cardHeaderAccordion(cardId, title, sourceName, iconClass, badgeHTML, isExpanded) {
    const c = getColors(cardId);
    const activeHeaderClass = isExpanded 
        ? "bg-gradient-to-r from-[#1a3a6b] to-[#0b1c36] text-white border-b-2 border-slate-900 dark:border-slate-800" 
        : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white";
    const textClass = isExpanded ? "text-white font-bold temp-white-title" : "text-slate-900 dark:text-white font-bold";
    const subtextClass = isExpanded ? "text-white/60 font-semibold temp-white-sub" : "text-slate-400 dark:text-slate-500 font-semibold";
    const chevronClass = isExpanded ? "rotate-180 text-white" : "text-slate-400 dark:text-slate-500";
    
    const logoSrc = LOGO_MAPPING[cardId] || '';
    const origWrapperClass = `w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 ${c.bg} ring-2 ${c.ring} ${c.icon}`;
    const origIconClass = `${iconClass} text-base md:text-lg`;
    const logoHTML = logoSrc 
        ? `<div data-is-logo="true" class="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-1 transition-all duration-300">
               <img src="${logoSrc}" alt="${title}" style="max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; object-position: center; display: block; margin: auto;" onerror="this.outerHTML='<i class=&quot;${iconClass} text-base md:text-lg text-slate-600&quot;></i>'"/>
           </div>`
        : (isExpanded 
            ? `<div data-orig-class="${origWrapperClass}" class="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 bg-white/10 ring-1 ring-white/20 text-white">
                   <i data-orig-class="${origIconClass}" class="${iconClass} text-base md:text-lg text-white"></i>
               </div>`
            : `<div class="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 ${origWrapperClass}">
                   <i class="${origIconClass}"></i>
               </div>`);

    return `
        <div onclick="window.toggleAccordion('${cardId}-card-container')" 
             class="accordion-header flex items-center justify-between gap-4 p-3 md:p-4 cursor-pointer select-none transition-all duration-300 ${activeHeaderClass}">
            <div class="flex items-center gap-3 md:gap-4">
                ${logoHTML}
                <div class="text-left font-poppins">
                    <h3 class="text-xs md:text-sm tracking-wide uppercase leading-tight transition-colors ${textClass}">${title}</h3>
                    <p class="text-[9px] md:text-[10px] tracking-wider uppercase mt-0.5 transition-colors ${subtextClass}">${sourceName}</p>
                </div>
            </div>
            <div class="flex items-center gap-3 shrink-0">
                <div class="status-badge-container">${badgeHTML}</div>
                <i class="fas fa-chevron-down accordion-chevron transition-transform duration-300 text-xs md:text-sm ${chevronClass}"></i>
            </div>
        </div>`;
}

export function skeletonBody() {
    return `
        <div class="flex flex-col items-center justify-center py-6 gap-3 text-center font-poppins">
            <div class="relative flex items-center justify-center">
                <span class="inline-block w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-500 spin-icon"></span>
                <i class="fas fa-search text-[10px] text-blue-600 dark:text-blue-400 absolute animate-pulse"></i>
            </div>
            <div>
                <p class="text-sm font-bold text-slate-700 dark:text-slate-300">Consultando, espere...</p>
                <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Obteniendo datos en tiempo real de la fuente oficial</p>
            </div>
            <div class="w-full flex flex-col gap-2 pt-1.5 max-w-[220px]">
                <div class="skeleton h-1.5 w-full mx-auto opacity-45"></div>
                <div class="skeleton h-1.5 w-5/6 mx-auto opacity-25"></div>
            </div>
        </div>`;
}

// Order dynamic cards
export function reorderCards() {
    const wrapper = document.getElementById('results-cards-wrapper');
    if (!wrapper) return;
    const cards = Array.from(wrapper.children);
    
    const getCardScore = (card) => {
        const status = card.getAttribute('data-status') || 'loading';
        // TODO lo de mantenimiento/desarrollo va SIEMPRE al final (score 4).
        const statusOrder = {
            'funciona': 1,
            'loading': 2,
            'waiting': 2,
            'no-funciona': 3,
            'mantenimiento': 10,
            'maintenance': 10,   // setCardMaintenance usa 'maintenance'
            'development': 10    // setCardDevelopment usa 'development'
        };
        const score = statusOrder[status] ?? 2;
        // vehiculo mientras carga va entre loading y el resto; si ya tiene estado (ej. mantenimiento), lo respeta
        if (card.id === 'vehiculo-card-container' && score === 2) return 2.5;
        return score;
    };

    cards.sort((a, b) => {
        const scoreA = getCardScore(a);
        const scoreB = getCardScore(b);
        if (scoreA !== scoreB) {
            return scoreA - scoreB;
        }

        const defaultOrder = [
            'placas_pe-card-container',
            'vehiculo-card-container',
            'sunarp-card-container',
            'soat-card-container',
            'sbs-card-container',
            'valor_venal-card-container',
            'citv-card-container',
            'gnv-card-container',
            'osinergmin-card-container',
            'lunas-card-container',
            'sutran-card-container',
            'cinemometro-card-container',
            'callao-card-container',
            'lima-card-container',
            'municipal-card-container',
            'sat_deuda-card-container',
            'sat_captura-card-container',
            'sat_deposito-card-container',
            'atu-card-container'
        ];
        const _ia = defaultOrder.indexOf(a.id); const _ib = defaultOrder.indexOf(b.id);
        return (_ia === -1 ? 999 : _ia) - (_ib === -1 ? 999 : _ib);
    });
    cards.forEach(card => wrapper.appendChild(card));
}

// Card states builders
export function setCardLoading(cardId, title, sub, iconClass, bgColorClass, sourceName) {
    const container = document.getElementById(`${cardId}-card-container`);
    if (!container) return;
    container.setAttribute('data-status', 'loading');
    container.className = "accordion-card results-card card-animate bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 rounded-2xl shadow-md flex flex-col overflow-hidden font-poppins transition-all duration-300";
    const loadingBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border border-slate-900 dark:border-slate-100 shadow-sm uppercase tracking-wider">
        <span class="inline-block w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 border-t-transparent spin-icon"></span> Consultando
    </span>`;
    
    const logoSrc = LOGO_MAPPING[cardId] || '';
    const logoHTML = logoSrc 
        ? `<div data-is-logo="true" class="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-1">
               <img src="${logoSrc}" alt="${title}" style="max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; object-position: center; display: block; margin: auto;" onerror="this.outerHTML='<i class=&quot;${iconClass} text-slate-400 text-base md:text-lg&quot;></i>'"/>
           </div>`
        : `<div class="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
               <i class="${iconClass} text-slate-400 text-base md:text-lg"></i>
           </div>`;

    container.innerHTML = `
        <div class="flex items-center justify-between gap-4 p-3 md:p-4 rounded-t-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
            <div class="flex items-center gap-3 md:gap-4">
                ${logoHTML}
                <div class="text-left font-poppins">
                    <h3 class="font-bold text-xs md:text-sm tracking-wide uppercase leading-tight text-slate-400 dark:text-slate-500">${title}</h3>
                    <p class="text-[9px] md:text-[10px] font-semibold tracking-wider uppercase mt-0.5 text-slate-300 dark:text-slate-650">${sourceName}</p>
                </div>
            </div>
            <div class="flex items-center gap-3 shrink-0">
                ${loadingBadge}
                <i class="fas fa-chevron-down text-slate-300 dark:text-slate-600 text-xs"></i>
            </div>
        </div>
        <div class="accordion-body w-full p-3 md:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-955/20 hidden">
            ${skeletonBody()}
        </div>`;
    reorderCards();
}

export function setCardWaiting(cardId, title, sub, iconClass, bgColorClass, sourceName, queueText) {
    const container = document.getElementById(`${cardId}-card-container`);
    if (!container) return;
    container.setAttribute('data-status', 'waiting');
    container.className = "accordion-card results-card card-animate bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 rounded-2xl shadow-md flex flex-col overflow-hidden font-poppins transition-all duration-300";
    const waitingBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border border-slate-900 dark:border-slate-100 shadow-sm uppercase tracking-wider">
        <i class="fas fa-clock text-slate-300 dark:text-slate-600 animate-pulse"></i> ${queueText || 'En cola'}
    </span>`;
    
    const logoSrc = LOGO_MAPPING[cardId] || '';
    const logoHTML = logoSrc 
        ? `<div data-is-logo="true" class="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-1 opacity-75">
               <img src="${logoSrc}" alt="${title}" style="max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; object-position: center; display: block; margin: auto;" onerror="this.outerHTML='<i class=&quot;${iconClass} text-slate-400 text-base md:text-lg&quot;></i>'"/>
           </div>`
        : `<div class="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 opacity-75">
               <i class="${iconClass} text-slate-400 text-base md:text-lg"></i>
           </div>`;

    container.innerHTML = `
        <div class="flex items-center justify-between gap-4 p-3 md:p-4 rounded-t-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
            <div class="flex items-center gap-3 md:gap-4">
                ${logoHTML}
                <div class="text-left font-poppins">
                    <h3 class="font-bold text-xs md:text-sm tracking-wide uppercase leading-tight text-slate-400 dark:text-slate-500">${title}</h3>
                    <p class="text-[9px] md:text-[10px] font-semibold tracking-wider uppercase mt-0.5 text-slate-300 dark:text-slate-650">${sourceName}</p>
                </div>
            </div>
            <div class="flex items-center gap-3 shrink-0">
                ${waitingBadge}
                <i class="fas fa-chevron-down text-slate-300 dark:text-slate-600 text-xs"></i>
            </div>
        </div>
        <div class="accordion-body w-full p-3 md:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-955/20 hidden">
            ${skeletonBody()}
        </div>`;
    reorderCards();
}

// ── Base UNIFORME para tarjetas no disponibles (desarrollo / mantenimiento) ──
// Mismo estilo oscuro/gris premium para todas → consistencia visual total.
function _renderUnavailableCard(cardId, title, iconClass, sourceName, badgeLabel, statusAttr, mensaje) {
    const container = document.getElementById(`${cardId}-card-container`);
    if (!container) return;
    container.setAttribute('data-status', statusAttr);
    container.className = "accordion-card results-card card-animate bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/70 rounded-2xl shadow-md ring-1 ring-white/5 flex flex-col overflow-hidden font-poppins transition-all duration-300";
    const badge = `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-700/60 text-slate-200 border border-slate-600/70 shadow-inner uppercase tracking-wider backdrop-blur-sm">
        <i class="fas fa-screwdriver-wrench text-slate-400"></i> ${badgeLabel}
    </span>`;
    const logoSrc = LOGO_MAPPING[cardId] || '';
    const logoHTML = logoSrc
        ? `<div data-is-logo="true" class="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-700/40 border border-slate-600/50 flex items-center justify-center shrink-0 overflow-hidden p-1 opacity-60 grayscale">
               <img src="${logoSrc}" alt="${title}" style="max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;object-position:center;display:block;margin:auto;" onerror="this.outerHTML='<i class=&quot;${iconClass} text-slate-400 text-base md:text-lg&quot;></i>'"/>
           </div>`
        : `<div class="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-700/40 border border-slate-600/50 flex items-center justify-center shrink-0">
               <i class="${iconClass} text-slate-400 text-base md:text-lg"></i>
           </div>`;
    const msg = mensaje || 'Estamos mejorando esta sección para darte una mejor experiencia. Vuelve pronto.';
    container.innerHTML = `
        <div class="flex items-center justify-between gap-4 p-3 md:p-4">
            <div class="flex items-center gap-3 md:gap-4">
                ${logoHTML}
                <div class="text-left font-poppins">
                    <h3 class="font-bold text-xs md:text-sm tracking-wide uppercase leading-tight text-slate-200">${title}</h3>
                    <p class="text-[9px] md:text-[10px] font-semibold tracking-wider uppercase mt-0.5 text-slate-500">${sourceName}</p>
                </div>
            </div>
            <div class="flex items-center gap-3 shrink-0">${badge}</div>
        </div>
        <div class="w-full px-4 pb-3.5 -mt-1">
            <p class="text-[11px] md:text-xs text-slate-400 flex items-center gap-1.5">
                <i class="fas fa-circle-info text-slate-500"></i> ${msg}
            </p>
        </div>`;
    reorderCards();
}

// Tarjeta EN DESARROLLO (estilo oscuro uniforme).
export function setCardDevelopment(cardId, title, sub, iconClass, sourceName, mensaje) {
    _renderUnavailableCard(cardId, title, iconClass, sourceName, 'En desarrollo', 'development', mensaje);
}

// Tarjeta EN MANTENIMIENTO (mismo estilo oscuro uniforme).
export function setCardMaintenance(cardId, title, sub, iconClass, sourceName, mensaje) {
    _renderUnavailableCard(cardId, title, iconClass, sourceName, 'Mantenimiento', 'maintenance', mensaje);
}

export function setCardData(cardId, title, sub, iconClass, bgColorClass, sourceName, htmlContent, isSuccess, hasData, customBadge) {
    const container = document.getElementById(`${cardId}-card-container`);
    if (!container) return;
    let badgeHTML = '';

    if (isSuccess) {
        container.setAttribute('data-status', 'funciona');
        if (customBadge) {
            badgeHTML = customBadge;
        } else if (hasData) {
            if (cardId === 'callao' || cardId === 'sutran' || cardId === 'lima' || cardId === 'cinemometro') {
                const text = cardId === 'cinemometro' ? 'CON INFRACCIONES' : 'CON PAPELETAS';
                badgeHTML = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-sm uppercase tracking-wider">
                    <i class="fas fa-triangle-exclamation"></i> ${text}
                </span>`;
            } else {
                let text = 'CON REGISTROS';
                if (cardId === 'soat') text = 'ACTIVO';
                if (cardId === 'citv') text = 'VIGENTE';
                if (cardId === 'atu') text = 'HABILITADO';
                badgeHTML = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider">
                    <i class="fas fa-circle-check"></i> ${text}
                </span>`;
            }
        } else {
            let text = 'SIN REGISTROS';
            if (cardId === 'callao' || cardId === 'sutran' || cardId === 'lima' || cardId === 'cinemometro') text = 'SIN PAPELETAS';
            if (cardId === 'atu') text = 'NO REGISTRADO';
            if (cardId === 'lunas') text = 'SIN PERMISO';
            if (cardId === 'citv') text = 'SIN INSPECCIÓN';   // sin CITV vigente = alerta (rojo)

            // ROJO: la falta de estos registros es una ALERTA para el usuario (SOAT, CITV, Lunas)
            const rojoSinDato = (cardId === 'soat' || cardId === 'citv' || cardId === 'lunas');
            // VERDE: la ausencia es lo normal/positivo (sin papeletas, sin deudas, etc.)
            const verdeSinDato = (text === 'SIN PAPELETAS' || text === 'NO REGISTRADO'
                || cardId === 'gnv' || cardId === 'osinergmin');

            if (rojoSinDato) {
                badgeHTML = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-sm uppercase tracking-wider">
                    <i class="fas fa-triangle-exclamation"></i> ${text}
                </span>`;
            } else if (verdeSinDato) {
                badgeHTML = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider">
                    <i class="fas fa-circle-check"></i> ${text}
                </span>`;
            } else {
                badgeHTML = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shadow-sm uppercase tracking-wider">
                    <i class="fas fa-circle-info"></i> ${text}
                </span>`;
            }
        }
    } else {
        container.setAttribute('data-status', 'mantenimiento');
        badgeHTML = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-orange-500 text-white shadow-sm animate-pulse uppercase tracking-wider">
            <i class="fas fa-triangle-exclamation"></i> EN DESARROLLO
        </span>`;
    }

    const existingBody = container?.querySelector('.accordion-body');
    const isExpanded = existingBody ? !existingBody.classList.contains('hidden') : false;

    const sourceUrl = SOURCE_URLS[cardId] || '';
    const verifyLink = sourceUrl 
        ? `<a href="${sourceUrl}" target="_blank" rel="noopener" class="inline-flex items-center gap-0.5 text-blue-500 hover:text-blue-655 dark:text-amber-400 dark:hover:text-amber-300 font-bold ml-1 normal-case hover:underline"><i class="fas fa-arrow-up-right-from-square text-[8px]"></i> Verificar</a>`
        : '';
    const finalContent = `
        <div class="flex flex-col h-full justify-between">
            <div class="flex-1">${htmlContent}</div>
            <div class="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-850 flex items-center justify-between text-[9px] md:text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider font-poppins">
                <span>Fuente: ${sourceName}${verifyLink}</span>
                <span>Consultado: ${getFormattedTimestamp()}</span>
            </div>
        </div>`;

    container.className = "accordion-card results-card card-animate bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 rounded-2xl shadow-md flex flex-col overflow-hidden transition-all duration-300 font-poppins";
    container.innerHTML = `
        ${cardHeaderAccordion(cardId, title, sourceName, iconClass, badgeHTML, isExpanded)}
        <div class="accordion-body w-full p-3 md:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955/20 ${isExpanded ? '' : 'hidden'}">
            ${finalContent}
        </div>`;
    reorderCards();
}

export function setCardError(cardId, title, sub, iconClass, bgColorClass, sourceName, errorMessage, plate) {
    const container = document.getElementById(`${cardId}-card-container`);
    if (!container) return;
    const isMantenimiento = (errorMessage || "").toLowerCase().includes("mantenimiento") || (errorMessage || "").toLowerCase().includes("desarrollo");
    let badgeHTML = '';
    let rightContent = '';

    if (isMantenimiento) {
        container.setAttribute('data-status', 'mantenimiento');
        badgeHTML = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-orange-500 text-white shadow-sm uppercase tracking-wider animate-pulse">
            <i class="fas fa-wrench"></i> EN DESARROLLO
        </span>`;
        rightContent = `
            <div class="flex flex-col items-center justify-center text-center gap-3 py-6 font-poppins">
                <div class="w-14 h-14 rounded-full bg-orange-50 dark:bg-orange-955/10 border-2 border-orange-200 dark:border-orange-900 flex items-center justify-center mb-1">
                    <i class="fas fa-wrench text-2xl text-orange-500 animate-pulse"></i>
                </div>
                <div>
                    <p class="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">Servicio en Desarrollo</p>
                    <p class="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-[300px] mx-auto leading-relaxed">${errorMessage}</p>
                </div>
                <button onclick="window.reintentarSeccion('${cardId}', '${plate}')"
                    class="mt-1 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wide transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg">
                    <i class="fas fa-rotate-right"></i> Reintentar Consulta
                </button>
            </div>`;
    } else {
        container.setAttribute('data-status', 'no-funciona');
        badgeHTML = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-700 text-slate-100 shadow-sm uppercase tracking-wider">
            <i class="fas fa-rotate-right"></i> REINTENTAR
        </span>`;
        const sourceUrl = SOURCE_URLS[cardId] || '';
        const verifyBtn = sourceUrl 
            ? `<a href="${sourceUrl}" target="_blank" rel="noopener"
                  class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-600 hover:bg-slate-500 text-white text-xs font-bold uppercase tracking-wide transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg border border-slate-500">
                  <i class="fas fa-arrow-up-right-from-square"></i> Portal Oficial
               </a>`
            : '';
        rightContent = `
            <div class="flex flex-col items-center justify-center text-center gap-3 py-6 font-poppins">
                <div class="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center mb-1">
                    <i class="fas fa-rotate-right text-2xl text-slate-500 dark:text-slate-400"></i>
                </div>
                <div>
                    <p class="text-sm font-bold text-slate-700 dark:text-slate-300 leading-tight">No se pudo obtener respuesta</p>
                    <p class="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-[300px] mx-auto leading-relaxed">El servicio no respondió a tiempo. Puedes reintentar la consulta.</p>
                </div>
                <div class="flex flex-wrap items-center justify-center gap-2">
                    <button onclick="window.reintentarSeccion('${cardId}', '${plate}')"
                        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-700 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-bold uppercase tracking-wide transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg">
                        <i class="fas fa-rotate-right"></i> Reintentar Consulta
                    </button>
                    ${verifyBtn}
                </div>
            </div>`;
    }

    const existingBody = container?.querySelector('.accordion-body');
    const isExpanded = existingBody ? !existingBody.classList.contains('hidden') : false;

    const sourceUrl = SOURCE_URLS[cardId] || '';
    const verifyLink = sourceUrl 
        ? `<a href="${sourceUrl}" target="_blank" rel="noopener" class="inline-flex items-center gap-0.5 text-blue-500 hover:text-blue-655 dark:text-amber-400 dark:hover:text-amber-300 font-bold ml-1 normal-case hover:underline"><i class="fas fa-arrow-up-right-from-square text-[8px]"></i> Verificar</a>`
        : '';
    const finalContent = `
        <div class="flex flex-col h-full justify-between">
            <div class="flex-1">${rightContent}</div>
            <div class="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-850 flex items-center justify-between text-[9px] md:text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider font-poppins">
                <span>Fuente: ${sourceName}${verifyLink}</span>
                <span>Consultado: ${getFormattedTimestamp()}</span>
            </div>
        </div>`;

    container.className = "accordion-card results-card card-animate bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 rounded-2xl shadow-md flex flex-col overflow-hidden transition-all duration-300 font-poppins";
    container.innerHTML = `
        ${cardHeaderAccordion(cardId, title, sourceName, iconClass, badgeHTML, isExpanded)}
        <div class="accordion-body w-full p-3 md:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955/20 ${isExpanded ? '' : 'hidden'}">
            ${finalContent}
        </div>`;
    reorderCards();
}

// Renderers
export function renderSOAT(data, plate) {
    if (!data || data.length === 0) {
        return `<div class="flex flex-col items-center justify-center py-8 gap-2 text-center font-poppins">
            <div class="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 flex items-center justify-center mb-1">
                <i class="fas fa-file-circle-xmark text-rose-500 text-xl"></i>
            </div>
            <p class="font-bold text-rose-600 dark:text-rose-400 text-sm">Sin registro de SOAT</p>
            <p class="text-xs text-slate-400 dark:text-slate-500">No se encontraron pólizas ni certificados SOAT contratados para <strong class="text-slate-600 dark:text-slate-300 font-mono">${plate}</strong></p>
        </div>`;
    }
    return data.map((cert, index) => {
        const borderClass = index > 0 ? 'border-t-2 border-slate-200 dark:border-slate-800 pt-5 mt-5' : '';
        const estadoDisplay = estadoConVigencia(cert.Estado, cert.FechaFin);
        const polizaNum = cert.NumeroPoliza || cert.numPoliza || '—';
        const certNum = cert.NumeroCertificado || cert.numCertificado || '—';

        return `
        <div class="${borderClass} font-poppins">
            <div class="flex items-start justify-between mb-3 gap-3 flex-wrap">
                <div>
                    <span class="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest block">
                        PÓLIZA SOAT ${data.length > 1 ? `#${index + 1}` : ''}
                    </span>
                    <p class="text-sm md:text-base font-black text-slate-900 dark:text-white leading-tight mt-0.5">${cert.NombreCompania || 'Aseguradora Registrada'}</p>
                    <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Placa: <strong class="text-slate-700 dark:text-slate-300 font-mono">${cert.Placa || plate}</strong></p>
                </div>
                <div class="shrink-0">${estadoBadge(estadoDisplay)}</div>
            </div>
            <div class="rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs mb-2">
                <table class="w-full text-left border-collapse bg-white dark:bg-slate-900">
                    <tbody>
                        ${fila('N.° de Póliza', polizaNum)}
                        ${certNum && certNum !== polizaNum ? fila('N.° de Certificado', certNum) : ''}
                        ${fila('Inicio de Vigencia', cert.FechaInicio)}
                        ${fila('Fin de Vigencia', cert.FechaFin)}
                        ${fila('Uso de Vehículo', cert.NombreUsoVehiculo)}
                        ${fila('Clase de Vehículo', cert.NombreClaseVehiculo)}
                        ${cert.Marca ? fila('Marca', cert.Marca) : ''}
                        ${cert.ModeloVehiculo ? fila('Modelo', cert.ModeloVehiculo) : ''}
                        ${cert.NumeroAsientos ? fila('Asientos', cert.NumeroAsientos) : ''}
                        ${cert.Comentario ? fila('Comentario', cert.Comentario) : ''}
                    </tbody>
                </table>
            </div>
        </div>`;
    }).join('');
}

export function renderCITV(data, plate) {
    if (!data || data.length === 0) {
        return `<div class="flex flex-col items-center justify-center py-8 gap-2 text-center font-poppins">
            <div class="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900 flex items-center justify-center mb-1">
                <i class="fas fa-circle-check text-emerald-500 text-xl"></i>
            </div>
            <p class="font-bold text-emerald-700 dark:text-emerald-400 text-sm">Sin CITV registrado</p>
            <p class="text-xs text-slate-400 dark:text-slate-500">No se encontraron inspecciones técnicas para <strong class="text-slate-600 dark:text-slate-300">${plate}</strong></p>
        </div>`;
    }

    const docLabels = ["ÚLTIMO DOCUMENTO REGISTRADO", "PENÚLTIMO DOCUMENTO REGISTRADO", "ANTEPENÚLTIMO DOCUMENTO REGISTRADO"];

    return data.map((cert, index) => {
        const docTitle = docLabels[index] || `DOCUMENTO REGISTRADO #${index + 1}`;
        const borderClass = index > 0 ? 'border-t-2 border-slate-200 dark:border-slate-800 pt-6 mt-6' : '';
        const estadoBase = (cert.estado && cert.estado !== 'N/A') ? cert.estado : cert.resultado;
        const estadoDisplay = estadoConVigencia(estadoBase, cert.fechaVencimiento);

        return `
        <div class="${borderClass} font-poppins">
            <div class="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex-wrap">
                <div class="flex items-center gap-2">
                    <span class="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-black flex items-center justify-center shadow-xs">${index + 1}</span>
                    <h4 class="text-xs md:text-sm font-extrabold uppercase tracking-wider text-blue-900 dark:text-blue-300">${docTitle}</h4>
                </div>
                <div class="shrink-0">${estadoBadge(estadoDisplay)}</div>
            </div>

            <!-- Bloque 1: Empresa Certificadora y Dirección -->
            <div class="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 mb-3 space-y-2">
                <div>
                    <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">EMPRESA CERTIFICADORA</span>
                    <p class="text-xs md:text-sm font-bold text-slate-900 dark:text-white leading-tight mt-0.5">${cert.centroInspeccion || 'CENTRO DE INSPECCIÓN TÉCNICA MTC'}</p>
                </div>
                ${cert.direccion ? `
                <div class="pt-1.5 border-t border-slate-200/60 dark:border-slate-800">
                    <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">DIRECCIÓN</span>
                    <p class="text-[11px] md:text-xs text-slate-700 dark:text-slate-300 leading-snug mt-0.5 flex items-start gap-1.5">
                        <i class="fas fa-location-dot text-brand-red text-[11px] mt-0.5 shrink-0"></i>
                        <span>${cert.direccion}</span>
                    </p>
                </div>` : ''}
            </div>

            <!-- Bloque 2: Tabla de Datos del Certificado (11 campos) -->
            <div class="rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs mb-3">
                <table class="w-full text-left border-collapse bg-white dark:bg-slate-900">
                    <tbody>
                        ${fila('Placa', cert.placa || plate)}
                        ${fila('N° de Certificado', cert.numeroInforme)}
                        ${fila('Vigente Desde', cert.fechaInspeccion)}
                        ${fila('Vigente Hasta', cert.fechaVencimiento)}
                        ${fila('Resultado Inspección', cert.resultado)}
                        ${fila('Estado', cert.estado)}
                        ${fila('Ámbito', cert.tipoAmbito)}
                        ${fila('Tipo de Servicio', cert.tipoServicio)}
                        ${cert.tipoDocumento ? fila('Tipo Documento', cert.tipoDocumento) : ''}
                        ${cert.clase ? fila('Clase Vehículo', cert.clase) : ''}
                        ${cert.marca ? fila('Marca', cert.marca) : ''}
                        ${cert.modelo ? fila('Modelo', cert.modelo) : ''}
                        ${cert.anio ? fila('Año Fabricación', cert.anio) : ''}
                    </tbody>
                </table>
            </div>

            <!-- Bloque 3: Observaciones -->
            <div class="bg-amber-50/60 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/80 dark:border-amber-900/40">
                <span class="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest block mb-0.5">
                    <i class="fas fa-clipboard-list text-amber-600 mr-1"></i> OBSERVACIONES
                </span>
                <p class="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">${cert.observaciones || 'Sin observaciones'}</p>
            </div>
        </div>`;
    }).join('');
}

export function renderLunas(data, plate) {
    if (!data || data.length === 0) {
        return `<div class="flex flex-col items-center justify-center py-8 gap-2 text-center font-poppins">
            <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-1">
                <i class="fas fa-eye text-slate-300 dark:text-slate-650 text-xl"></i>
            </div>
            <p class="font-bold text-slate-600 dark:text-slate-400 text-sm">Sin Permiso de Lunas</p>
            <p class="text-xs text-slate-400 dark:text-slate-500">No se encontraron lunas oscurecidas autorizadas para <strong class="text-slate-600 dark:text-slate-300">${plate}</strong></p>
        </div>`;
    }
    return data.map((cert, index) => {
        const borderClass = index > 0 ? 'border-t border-slate-200 dark:border-slate-800 pt-4 mt-4' : '';
        return `
        <div class="${borderClass}">
            <div class="flex items-start justify-between mb-4 gap-3 font-poppins">
                <div>
                    <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">N° Certificado ${data.length > 1 ? `#${index + 1}` : ''}</p>
                    <p class="text-base font-bold text-slate-900 dark:text-white leading-tight">${cert.nroCertificado || 'N/A'}</p>
                    <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Placa: <strong class="text-slate-700 dark:text-slate-300">${cert.placa || plate}</strong></p>
                </div>
                <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm shrink-0 font-poppins">
                    <i class="fas fa-certificate"></i> AUTORIZADO
                </span>
            </div>
            <div class="rounded-xl overflow-hidden">
                <table class="w-full text-left border-collapse bg-white dark:bg-slate-900">
                    <tbody>
                        ${fila('Categoría', cert.categoria)}
                        ${fila('Marca', cert.marca)}
                        ${fila('Modelo', cert.modelo)}
                        ${fila('Color', cert.color)}
                        ${fila('Año', cert.anio)}
                        ${fila('Fecha Emisión', cert.fechaEmision)}
                    </tbody>
                </table>
            </div>
        </div>`;
    }).join('');
}

export function renderCallao(data, plate, total) {
    if (!data || data.length === 0) {
        return `<div class="flex flex-col items-center justify-center py-8 gap-2 text-center font-poppins">
            <div class="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900 flex items-center justify-center mb-1">
                <i class="fas fa-circle-check text-emerald-500 text-xl"></i>
            </div>
            <p class="font-bold text-emerald-700 dark:text-emerald-400 text-sm">¡Sin Papeletas!</p>
            <p class="text-xs text-slate-400 dark:text-slate-500">No se registraron infracciones para <strong class="text-slate-600 dark:text-slate-300">${plate}</strong> en el Callao</p>
        </div>`;
    }
    const rows = data.map((p) => `
        <tr class="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-red-50/50 dark:hover:bg-rose-950/10 transition-colors duration-150 font-poppins">
            <td class="py-1.5 px-1.5 text-[9px] md:text-xs font-bold text-slate-850 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800 leading-tight">${p.nroPapeleta || '-'}</td>
            <td class="py-1.5 px-1.5 text-[9px] md:text-xs font-semibold text-slate-655 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800 leading-tight">${p.codigo || '-'}</td>
            <td class="py-1.5 px-1.5 text-[9px] md:text-xs text-slate-550 dark:text-slate-500 border-r border-slate-100 dark:border-slate-800 leading-tight">${p.fechaInfraccion || '-'}</td>
            <td class="py-1.5 px-1.5 text-[9px] md:text-xs font-bold text-red-655 dark:text-red-400 border-r border-slate-100 dark:border-slate-800 leading-tight">S/ ${p.total || '0'}</td>
            <td class="py-1.5 px-1.5 text-center">
                ${p.detalleUrl ? `
                    <button onclick="window.abrirModalPapeleta('${p.detalleUrl}')"
                        class="inline-flex items-center justify-center w-6 h-6 rounded bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900 transition-all active:scale-95 shadow-sm"
                        title="Ver papeleta">
                        <i class="fas fa-file-image text-[10px]"></i>
                    </button>
                ` : '<span class="text-slate-300 dark:text-slate-700 text-[10px]">—</span>'}
            </td>
        </tr>`).join('');
    return `
        <div class="flex items-start justify-between mb-4 gap-3 font-poppins px-1">
            <div>
                <p class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Infracciones encontradas</p>
                <p class="text-xl font-bold text-red-600 dark:text-red-500 leading-tight">${data.length} papeleta${data.length > 1 ? 's' : ''}</p>
            </div>
            <div class="text-right">
                <p class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Total adeudado</p>
                <p class="text-xl font-bold text-red-750 dark:text-red-400 leading-tight">S/ ${total || '0.00'}</p>
                <p class="text-[8px] text-red-500 mt-0.5 font-bold uppercase tracking-wider">⚠ PAGA O EVITA EMBARGO</p>
            </div>
        </div>
        <div class="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800/60 shadow-sm">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse bg-white dark:bg-slate-900 table-fixed">
                    <thead>
                        <tr class="bg-slate-900 dark:bg-slate-955 text-white">
                            <th class="py-2 px-1.5 text-[8px] md:text-[9px] font-bold uppercase tracking-wider border-r border-white/10 dark:border-slate-800 w-[28%]">Papeleta</th>
                            <th class="py-2 px-1.5 text-[8px] md:text-[9px] font-bold uppercase tracking-wider border-r border-white/10 dark:border-slate-800 w-[18%]">Código</th>
                            <th class="py-2 px-1.5 text-[8px] md:text-[9px] font-bold uppercase tracking-wider border-r border-white/10 dark:border-slate-800 w-[24%]">Fecha</th>
                            <th class="py-2 px-1.5 text-[8px] md:text-[9px] font-bold uppercase tracking-wider border-r border-white/10 dark:border-slate-800 w-[20%]">Total</th>
                            <th class="py-2 px-1.5 text-[8px] md:text-[9px] font-bold uppercase tracking-wider text-center w-[10%]">Doc.</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>`;
}

export function renderLima(plate, message, directUrl, data) {
    // Si hay papeletas reales, renderizarlas como tabla detallada
    if (data && Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0]).filter(k => data[0][k] !== undefined);
        const ths = headers.map(h => `<th class="py-2 px-2.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wider border-r border-white/10 dark:border-slate-800 sticky top-0 bg-slate-900 dark:bg-slate-950 text-white whitespace-nowrap">${h}</th>`).join('');
        const rows = data.map(row => {
            const tds = headers.map(h => {
                const val = row[h];
                const isMonto = h.toLowerCase().includes('monto') || h.toLowerCase().includes('importe');
                const cls = isMonto ? 'font-bold text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300';
                return `<td class="py-2 px-2.5 text-[10px] md:text-xs border-r border-slate-100 dark:border-slate-800 leading-tight whitespace-nowrap ${cls}">${val || '—'}</td>`;
            }).join('');
            return `<tr class="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors font-poppins">${tds}</tr>`;
        }).join('');
        return `
            <div class="p-3 md:p-4 font-poppins">
                <div class="flex items-center gap-2 mb-3">
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-triangle-exclamation"></i> ${data.length} PAPELETA${data.length > 1 ? 'S' : ''}</span>
                    <span class="text-[10px] text-slate-400 uppercase tracking-wide">Pendientes de pago — SAT Lima</span>
                </div>
                <div class="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800/60 shadow-sm">
                    <div class="overflow-x-auto max-h-[260px]">
                        <table class="w-full text-left border-collapse bg-white dark:bg-slate-900">
                            <thead><tr class="bg-slate-900 dark:bg-slate-950 text-white">${ths}</tr></thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                </div>
            </div>`;
    }

    // Sin papeletas: mensaje de éxito + enlace de verificación manual
    return `
        <div class="flex flex-col gap-5 text-slate-900 dark:text-white font-poppins">
            <div class="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl">
                <div class="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center shrink-0">
                    <i class="fas fa-circle-check text-emerald-600 dark:text-emerald-400"></i>
                </div>
                <div>
                    <p class="font-bold text-emerald-800 dark:text-emerald-300 text-sm">Sin papeletas pendientes</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">${message || `No se encontraron papeletas registradas pendientes de pago para la placa ${plate}.`}</p>
                </div>
            </div>
            <div class="flex flex-col items-center gap-3">
                <p class="text-[11px] text-slate-400 dark:text-slate-500">Verificado en el SAT Lima</p>
                <a href="${directUrl}" target="_blank" rel="noopener"
                   class="w-full max-w-xs flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold uppercase tracking-wide transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg">
                   <i class="fas fa-arrow-up-right-from-square"></i> Verificar en SAT Lima
                </a>
            </div>
        </div>`;
}

export function renderSutran(data, plate, infoReporte) {
    let bodyHTML = '';
    if (!data || data.length === 0) {
        bodyHTML = `<div class="flex flex-col items-center justify-center py-8 gap-2 text-center font-poppins">
            <div class="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900 flex items-center justify-center mb-1">
                <i class="fas fa-circle-check text-emerald-500 text-xl"></i>
            </div>
            <p class="font-bold text-emerald-700 dark:text-emerald-400 text-sm">¡Sin Papeletas SUTRAN!</p>
            <p class="text-xs text-slate-400 dark:text-slate-500">No se encontraron infracciones para <strong class="text-slate-600 dark:text-slate-300">${plate}</strong></p>
        </div>`;
    } else {
        const rows = data.map((p) => `
            <tr class="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-orange-50/50 dark:hover:bg-orange-955/10 transition-colors duration-150 font-poppins">
                <td class="py-1.5 px-1.5 text-[9px] md:text-xs font-bold text-slate-850 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800 leading-tight">${p.nroDocumento || '-'}</td>
                <td class="py-1.5 px-1.5 text-[9px] md:text-xs font-semibold text-slate-655 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800 leading-tight">${p.codigoInfraccion || '-'}</td>
                <td class="py-1.5 px-1.5 text-[9px] md:text-xs text-slate-550 dark:text-slate-500 border-r border-slate-100 dark:border-slate-800 leading-tight">${p.fechaDocumento || '-'}</td>
                <td class="py-1.5 px-1.5 text-[9px] md:text-xs font-bold text-orange-700 dark:text-orange-455 border-r border-slate-100 dark:border-slate-800 leading-tight">${p.clasificacion || '-'}</td>
            </tr>`).join('');
        bodyHTML = `
            <div class="flex items-start justify-between mb-4 gap-3 font-poppins px-1">
                <div>
                    <p class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Infracciones SUTRAN</p>
                    <p class="text-xl font-bold text-red-600 dark:text-red-500 leading-tight">${data.length} papeleta${data.length > 1 ? 's' : ''}</p>
                </div>
            </div>
            <div class="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800/60 shadow-sm">
                <div class="overflow-x-auto max-h-[240px]">
                    <table class="w-full text-left border-collapse bg-white dark:bg-slate-900 table-fixed">
                        <thead>
                            <tr class="bg-slate-900 dark:bg-slate-955 text-white">
                                <th class="py-2 px-1.5 text-[8px] md:text-[9px] font-bold uppercase tracking-wider border-r border-white/10 dark:border-slate-800 sticky top-0 bg-slate-900 dark:bg-slate-955 w-[32%]">Documento</th>
                                <th class="py-2 px-1.5 text-[8px] md:text-[9px] font-bold uppercase tracking-wider border-r border-white/10 dark:border-slate-800 sticky top-0 bg-slate-900 dark:bg-slate-955 w-[18%]">Código</th>
                                <th class="py-2 px-1.5 text-[8px] md:text-[9px] font-bold uppercase tracking-wider border-r border-white/10 dark:border-slate-800 sticky top-0 bg-slate-900 dark:bg-slate-955 w-[24%]">Fecha</th>
                                <th class="py-2 px-1.5 text-[8px] md:text-[9px] font-bold uppercase tracking-wider sticky top-0 bg-slate-900 dark:bg-slate-955 w-[26%]">Clasif.</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>`;
    }
    if (infoReporte) {
        bodyHTML += `
            <div class="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-start gap-1.5 font-poppins px-1">
                <i class="fas fa-circle-info text-slate-400 dark:text-slate-655 mt-0.5 shrink-0 text-[10px]"></i>
                <p class="text-[9px] text-slate-400 dark:text-slate-500 italic leading-relaxed">${infoReporte}</p>
            </div>`;
    }
    return bodyHTML;
}

export function renderCinemometro(data, plate, infoReporte) {
    let bodyHTML = '';
    if (!data || data.length === 0) {
        bodyHTML = `<div class="flex flex-col items-center justify-center py-8 gap-2 text-center font-poppins">
            <div class="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center mb-1">
                <i class="fas fa-circle-check text-emerald-500 text-xl"></i>
            </div>
            <p class="font-bold text-emerald-700 dark:text-emerald-400 text-sm">¡Sin Papeletas de Velocidad!</p>
            <p class="text-xs text-slate-400 dark:text-slate-500">No se encontraron infracciones de cinemómetro para <strong class="text-slate-600 dark:text-slate-300">${plate}</strong></p>
        </div>`;
    } else {
        const cards = data.map((r, idx) => {
            const nroDoc = r['N° de Papeleta'] || r['nroDocumento'] || `Infracción #${idx + 1}`;
            const fecha = r['F. Infracción'] || r['fechaDocumento'] || '-';
            const codigo = r['Código Infraccion'] || r['codigoInfraccion'] || 'M20';
            const calificacion = r['Calificación'] || r['clasificacion'] || 'Muy Grave';
            const infractor = r['Nombre / Razón social'] || r['infractor'] || '-';
            const dni = r['Dni/Ruc'] || r['dni'] || '-';
            const estado = r['Estado'] || 'PENDIENTE DE PAGO';
            const fotoTarget = r['foto_target'] || '';

            if (r.foto && (r.foto.startsWith('data:') || r.foto.startsWith('http'))) {
                if (typeof window !== 'undefined') {
                    window.cinemometroFotos = window.cinemometroFotos || {};
                    window.cinemometroFotos[nroDoc] = r.foto;
                }
            }

            return `
            <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all font-poppins">
                <!-- Header del registro -->
                <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5 mb-3">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold font-mono">
                            ${nroDoc}
                        </span>
                        <span class="px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40">
                            ${codigo} • ${calificacion}
                        </span>
                    </div>
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${estado.includes('PENDIENTE') ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40'}">
                        ${estado}
                    </span>
                </div>

                <!-- Rejilla de 2 Columnas -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <!-- Columna 1: Datos principales -->
                    <div class="space-y-2 bg-slate-50/70 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/50">
                        <div>
                            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">Fecha de Infracción</span>
                            <span class="font-bold text-slate-800 dark:text-slate-200">${fecha}</span>
                        </div>
                        <div>
                            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">Placa Registrada</span>
                            <span class="font-bold font-mono text-slate-800 dark:text-slate-200">${plate}</span>
                        </div>
                    </div>

                    <!-- Columna 2: Propietario e Infracción -->
                    <div class="space-y-2 bg-slate-50/70 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/50">
                        <div>
                            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">Infractor / Razon Social</span>
                            <span class="font-bold text-slate-800 dark:text-slate-100 truncate block">${infractor}</span>
                        </div>
                        <div>
                            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">DNI / RUC</span>
                            <span class="font-bold font-mono text-slate-700 dark:text-slate-300">${dni}</span>
                        </div>
                    </div>
                </div>

                <!-- Footer de Acción: Botón Modal Ver Foto -->
                <div class="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span class="text-[10px] text-slate-400 dark:text-slate-500 font-medium">SUTRAN Cinemómetro</span>
                    <button onclick="window.abrirModalFotoCinemometro('${nroDoc}', '${fotoTarget}', '${plate}')"
                        class="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer">
                        <i class="fas fa-camera text-xs"></i> Ver Foto Probatoria
                    </button>
                </div>
            </div>`;
        }).join('');

        bodyHTML = `
            <div class="flex items-start justify-between mb-4 gap-3 font-poppins px-1">
                <div>
                    <p class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Papeletas y Cinemómetro SUTRAN</p>
                    <p class="text-xl font-bold text-red-600 dark:text-red-500 leading-tight">${data.length} papeleta${data.length > 1 ? 's' : ''} registrada${data.length > 1 ? 's' : ''}</p>
                </div>
            </div>
            <div class="flex flex-col gap-3">
                ${cards}
            </div>`;
    }
    if (infoReporte) {
        bodyHTML += `
            <div class="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-start gap-1.5 font-poppins px-1">
                <i class="fas fa-circle-info text-slate-400 dark:text-slate-600 mt-0.5 shrink-0 text-[10px]"></i>
                <p class="text-[9px] text-slate-400 dark:text-slate-500 italic leading-relaxed">${infoReporte}</p>
            </div>`;
    }
    return bodyHTML;
}

export function renderAtu(data, plate) {
    if (!data || data.fuenteDato === 'NOREGISTRADO') {
        const marca = data?.marcaSunarp || 'N/A';
        const modelo = data?.modeloSunarp || 'N/A';
        const color = data?.color || 'N/A';
        return `
            <div class="flex flex-col items-center justify-center py-6 gap-2 text-center font-poppins">
                <div class="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900 flex items-center justify-center mb-1">
                    <i class="fas fa-circle-check text-emerald-500 text-xl"></i>
                </div>
                <p class="font-bold text-emerald-700 dark:text-emerald-400 text-sm">No registrado como taxi</p>
                <p class="text-xs text-slate-400 dark:text-slate-500 max-w-[260px] leading-relaxed">Este vehículo no cuenta con habilitación vigente para prestar servicio de taxi ante la ATU.</p>
            </div>
            <div class="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 font-poppins">
                <p class="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5"><i class="fas fa-database mr-1"></i>Datos SUNARP del vehículo</p>
                <div class="rounded-xl overflow-hidden">
                    <table class="w-full text-left border-collapse bg-white dark:bg-slate-900">
                        <tbody>
                            ${fila('Marca', marca)}
                            ${fila('Modelo', modelo)}
                            ${fila('Color', color)}
                            ${fila('N° Serie', data?.serie)}
                            ${fila('N° Motor', data?.motor)}
                        </tbody>
                    </table>
                </div>
            </div>`;
    }
    let badgeHTML = '';
    const estadoNum = data.estadoCertificado;
    const estadoTexto = estadoNum === 1 ? 'HABILITADO' : estadoNum === 2 ? 'SUSPENDIDO' : estadoNum === 3 ? 'BAJA' : 'NO HABILITADO';
    if (estadoNum === 1) {
        badgeHTML = `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-sm font-poppins">
            <i class="fas fa-circle-check"></i> HABILITADO
        </span>`;
    } else if (estadoNum === 2) {
        badgeHTML = `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm font-poppins">
            <i class="fas fa-triangle-exclamation"></i> SUSPENDIDO
        </span>`;
    } else {
        badgeHTML = `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-500 text-white shadow-sm font-poppins">
            <i class="fas fa-circle-xmark"></i> ${estadoTexto}
        </span>`;
    }
    let conductoresHTML = '';
    if (data.conductores && data.conductores.length > 0) {
        const rows = data.conductores.map((c) => `
            <tr class="border-b border-slate-200 dark:border-slate-800 last:border-0 hover:bg-teal-50/50 dark:hover:bg-teal-955/10 transition-colors duration-150 font-poppins">
                <td class="py-2 px-3 text-[10px] font-bold text-slate-850 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800 leading-tight">${c.nombreOperador || '-'}</td>
                <td class="py-2 px-3 text-[10px] text-slate-600 dark:text-slate-450 border-r border-slate-200 dark:border-slate-800">${c.numeroDocumento || '-'}</td>
                <td class="py-2 px-3 text-[10px] text-slate-600 dark:text-slate-450">${c.nroLicenciaConducir || '-'}</td>
            </tr>`).join('');
        conductoresHTML = `
            <div class="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 font-poppins px-1">
                <p class="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5"><i class="fas fa-users mr-1"></i>Conductores Vinculados</p>
                <div class="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800/60 shadow-sm">
                    <div class="overflow-x-auto max-h-[130px]">
                        <table class="w-full text-left border-collapse bg-white dark:bg-slate-900 table-fixed">
                            <thead>
                                <tr class="bg-slate-900 dark:bg-slate-955 text-white">
                                    <th class="py-2 px-1.5 text-[8px] md:text-[9px] font-bold uppercase tracking-wider border-r border-white/10 dark:border-slate-800 sticky top-0 bg-slate-900 dark:bg-slate-955 w-[40%]">Nombre</th>
                                    <th class="py-2 px-1.5 text-[8px] md:text-[9px] font-bold uppercase tracking-wider border-r border-white/10 dark:border-slate-800 sticky top-0 bg-slate-900 dark:bg-slate-955 w-[30%]">Documento</th>
                                    <th class="py-2 px-1.5 text-[8px] md:text-[9px] font-bold uppercase tracking-wider sticky top-0 bg-slate-900 dark:bg-slate-955 w-[30%]">Licencia</th>
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                </div>
            </div>`;
    }
    return `
        <div class="flex items-start justify-between mb-4 gap-3 font-poppins">
            <div>
                <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Modalidad</p>
                <p class="text-base font-bold text-slate-900 dark:text-white leading-tight">${data.modalidad || 'Taxi'}</p>
            </div>
            <div class="shrink-0">${badgeHTML}</div>
        </div>
        <div class="rounded-xl overflow-hidden">
            <table class="w-full text-left border-collapse bg-white dark:bg-slate-900 font-poppins">
                <tbody>
                    ${fila('N° TUC', data.certificadoTuc)}
                    ${fila('Propietario', data.propietario)}
                    ${fila('Documento', data.rucDNI)}
                    ${fila('Fecha Emisión', data.fechaEmision)}
                    ${fila('Fecha Vencimiento', data.fechaVencimiento)}
                    ${fila('Vehículo', [data.marcaSunarp, data.modeloSunarp, data.color].filter(Boolean).join(' · '))}
                </tbody>
            </table>
        </div>
        ${conductoresHTML}`;
}

export function renderGNV(data, plate) {
    if (!data || data.length === 0) {
        return `<div class="flex flex-col items-center justify-center py-8 gap-2 text-center font-poppins">
            <div class="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900 flex items-center justify-center mb-1">
                <i class="fas fa-circle-check text-emerald-500 text-xl"></i>
            </div>
            <p class="font-bold text-emerald-700 dark:text-emerald-400 text-sm">Sin habilitación GNV</p>
            <p class="text-xs text-slate-400 dark:text-slate-500">No se encontró registro de Gas Natural Vehicular para <strong class="text-slate-600 dark:text-slate-300">${plate}</strong></p>
        </div>`;
    }
    return data.map((cert, index) => {
        const borderClass = index > 0 ? 'border-t border-slate-200 dark:border-slate-800 pt-4 mt-4' : '';
        const habilitado = (cert.vehiculoHabilitado || '').toLowerCase();
        const habBadge = (habilitado === 'sí' || habilitado === 'si')
            ? `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-900 shadow-sm font-poppins">
                <i class="fas fa-circle-check"></i> HABILITADO
               </span>`
            : `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-900 shadow-sm font-poppins">
                <i class="fas fa-circle-xmark"></i> NO HABILITADO
               </span>`;
        return `
        <div class="${borderClass}">
            <div class="flex items-start justify-between mb-4 gap-3 font-poppins">
                <div>
                    <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Gas Natural Vehicular</p>
                    <p class="text-base font-bold text-slate-900 dark:text-white leading-tight">${cert.tipoCombustible || 'GNV'}</p>
                    <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Placa: <strong class="text-slate-700 dark:text-slate-300">${cert.placa || plate}</strong></p>
                </div>
                <div class="shrink-0">${habBadge}</div>
            </div>
            <div class="rounded-xl overflow-hidden">
                <table class="w-full text-left border-collapse bg-white dark:bg-slate-900">
                    <tbody>
                        ${fila('Tipo Combustible', cert.tipoCombustible)}
                        ${fila('Habilitado para consumir', cert.vehiculoHabilitado)}
                        ${fila('Venc. Revisión Anual', cert.proximaRevAnual)}
                        ${fila('Venc. Cilindro', cert.proximoVencCilindro)}
                        ${fila('¿Tiene Crédito?', cert.tieneCredito)}
                    </tbody>
                </table>
            </div>
        </div>`;
    }).join('');
}

export function renderSBS(data, plate) {
    // data = { soat: SBSTipo, vehicular: SBSTipo, cat: SBSTipo }
    if (!data) {
        return `<div class="flex flex-col items-center justify-center py-8 gap-2 text-center font-poppins">
            <i class="fas fa-circle-exclamation text-slate-300 dark:text-slate-600 text-2xl mb-1"></i>
            <p class="text-xs text-slate-400 dark:text-slate-500">Sin datos disponibles para <strong>${plate}</strong></p>
        </div>`;
    }

    const tiposConfig = [
        { key: 'soat',      label: 'SOAT',             icon: 'fas fa-shield-halved', color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-950/20',   border: 'border-blue-200 dark:border-blue-900' },
        { key: 'vehicular', label: 'Vehícular',         icon: 'fas fa-car',           color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/20', border: 'border-violet-200 dark:border-violet-900' },
        { key: 'cat',       label: 'CAT',               icon: 'fas fa-house-chimney-crack', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20',  border: 'border-amber-200 dark:border-amber-900' },
    ];

    let html = '';
    let totalSiniestros = 0;

    tiposConfig.forEach((cfg, idx) => {
        const tipo = data[cfg.key];
        const borderTop = idx > 0 ? 'border-t border-slate-200 dark:border-slate-800 pt-4 mt-4' : '';
        if (!tipo) return;

        const count = (tipo.data || []).length;
        // "N.° de accidentes coberturados" oficial del portal SBS (más preciso que contar pólizas).
        const acc = typeof tipo.total_accidentes === 'number' ? tipo.total_accidentes : null;
        const badgeVal = acc !== null ? acc : count;
        totalSiniestros += badgeVal;
        const badgeTone = badgeVal > 0 ? 'red' : 'emerald';

        html += `<div class="${borderTop} font-poppins">`;
        html += `<div class="flex items-center gap-2 mb-2">
            <div class="w-7 h-7 rounded-lg flex items-center justify-center ${cfg.bg} border ${cfg.border} shrink-0">
                <i class="${cfg.icon} text-xs ${cfg.color}"></i>
            </div>
            <span class="text-[10px] font-extrabold uppercase tracking-widest ${cfg.color}">${cfg.label}</span>
            ${count > 0
                ? `<span class="ml-auto text-[9px] font-bold ${badgeTone === 'red' ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900' : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'} border px-2 py-0.5 rounded-full">${acc !== null ? `${acc} accidente${acc !== 1 ? 's' : ''}` : `${count} póliza${count > 1 ? 's' : ''}`}</span>`
                : ''
            }
        </div>`;

        if (tipo.error) {
            html += `<p class="text-[10px] text-red-500 italic pl-9">${tipo.error}</p>`;
        } else if (count === 0) {
            html += `<div class="flex items-center gap-2 pl-9 py-1">
                <i class="fas fa-circle-check text-emerald-500 text-xs"></i>
                <p class="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Sin siniestros registrados</p>
            </div>`;
        } else {
            // Mostrar tabla con las columnas que devolvió el parser genérico
            const headers = Object.keys(tipo.data[0] || {});
            html += `<div class="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800/60 shadow-sm">
                <div class="overflow-x-auto max-h-[200px]">
                    <table class="w-full text-left border-collapse bg-white dark:bg-slate-900 table-fixed">
                        <thead>
                            <tr class="bg-slate-900 dark:bg-slate-955 text-white">
                                ${headers.map(h => `<th class="py-1.5 px-2 text-[8px] font-bold uppercase tracking-wider border-r border-white/10 last:border-0 sticky top-0 bg-slate-900">${h}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${tipo.data.map(row => `
                                <tr class="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-violet-50/50 dark:hover:bg-violet-955/10 transition-colors duration-150">
                                    ${headers.map(h => `<td class="py-1.5 px-2 text-[9px] font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 last:border-0 leading-tight">${row[h] || '—'}</td>`).join('')}
                                </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
        }
        html += '</div>';
    });

    return html || `<p class="text-xs text-slate-400 dark:text-slate-500 text-center py-4">Sin datos de siniestralidad para ${plate}</p>`;
}

export function renderVehicleInfoCard(vehicleData, isExpanded = false) {
    const container = document.getElementById('vehiculo-card-container');
    if (!container) return;

    const hasData = Object.keys(vehicleData).length > 0;
    let badgeHTML = '';

    if (hasData) {
        badgeHTML = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider">
            <i class="fas fa-circle-check"></i> DISPONIBLE
        </span>`;
    } else {
        badgeHTML = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 shadow-sm uppercase tracking-wider animate-pulse">
            <i class="fas fa-circle-notch fa-spin"></i> BUSCANDO
        </span>`;
    }

    let tableRows = '';
    if (hasData) {
        tableRows = `
            <table class="w-full text-left border-collapse bg-white dark:bg-slate-900 font-poppins">
                <tbody>
                    ${fila('Marca', vehicleData.marca || '—')}
                    ${fila('Modelo', vehicleData.modelo || '—')}
                    ${fila('Año Fabricación', vehicleData.anio || '—')}
                    ${fila('Color', vehicleData.color || '—')}
                    ${fila('Categoría / Clase', vehicleData.categoria || '—')}
                    ${fila('Uso registrado', vehicleData.uso || '—')}
                    ${fila('Número Serie / Chasis', vehicleData.serie || '—')}
                    ${fila('Número Motor', vehicleData.motor || '—')}
                    ${fila('Propietario SUNARP', vehicleData.propietario || '—')}
                </tbody>
            </table>`;
    } else {
        tableRows = `
            <div class="flex flex-col items-center justify-center py-8 gap-2 text-center font-poppins">
                <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-1">
                    <i class="fas fa-car-side text-slate-300 dark:bg-slate-600 text-xl animate-pulse"></i>
                </div>
                <p class="font-extrabold text-slate-600 dark:text-slate-400 text-sm">Esperando información técnica</p>
                <p class="text-xs text-slate-400 dark:text-slate-500 max-w-[280px] leading-relaxed">Los datos se completarán conforme se obtengan de las consultas en tiempo real.</p>
            </div>`;
    }

    container.className = "accordion-card results-card card-animate bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 rounded-2xl shadow-md flex flex-col overflow-hidden transition-all duration-300 font-poppins";
    container.innerHTML = `
        ${cardHeaderAccordion('vehiculo', 'Información Vehicular (SUNARP)', 'REGISTRO MULTIFUENTE', 'fas fa-car-side', badgeHTML, isExpanded)}
        <div class="accordion-body w-full p-3 md:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955/20 ${isExpanded ? '' : 'hidden'}">
            <div class="rounded-xl overflow-hidden">
                ${tableRows}
            </div>
            <div class="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-850 flex items-center justify-between text-[9px] md:text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider font-poppins">
                <span>Fuente: SUNARP <a href="${SOURCE_URLS.vehiculo}" target="_blank" rel="noopener" class="inline-flex items-center gap-0.5 text-blue-500 hover:text-blue-655 dark:text-amber-400 dark:hover:text-amber-300 font-bold ml-1 normal-case hover:underline"><i class="fas fa-arrow-up-right-from-square text-[8px]"></i> Verificar</a></span>
                <span>Consultado: ${getFormattedTimestamp()}</span>
            </div>
        </div>`;
}

export function renderSunarp(datos, plate) {
    if (!datos || Object.keys(datos).length === 0) {
        return `<div class="flex flex-col items-center justify-center py-8 gap-2 text-center font-poppins">
            <i class="fas fa-circle-exclamation text-slate-300 dark:text-slate-600 text-2xl mb-1"></i>
            <p class="text-xs text-slate-400 dark:text-slate-500">Sin registros de gravamen o datos para <strong>${plate}</strong> en SUNARP</p>
        </div>`;
    }

    let rowsHtml = '';
    for (const [key, val] of Object.entries(datos)) {
        rowsHtml += fila(key, String(val));
    }

    return `<div class="font-poppins">
        <div class="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800/60 shadow-sm">
            <table class="w-full text-left border-collapse bg-white dark:bg-slate-900">
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        </div>
    </div>`;
}

export function renderPlacasPE(data, plate) {
    if (!data) return `<div class="p-4 text-center text-xs text-slate-400">Sin datos de la Asociación Automotriz del Perú.</div>`;
    
    const P = (v) => (v && v !== '-' && String(v).trim()) ? v : null;
    const filaOpt = (label, value) => P(value) ? fila(label, value) : '';
    
    // Check if data has real registration info
    const registrado = data.registrado !== false;
    const propietario = P(data.propietario);
    const disponible = registrado && propietario && !/no disponible|disponible en portal/i.test(propietario);
    
    if (!disponible) {
        const mensaje = data.mensaje || 'Sin registros activos de entrega de placa en AAP.';
        const estado = P(data.estado);
        return `<div class="p-4 text-center font-poppins">
            <i class="fas fa-info-circle text-blue-400 text-xl mb-2"></i>
            <p class="text-sm font-semibold text-slate-600 dark:text-slate-300">${mensaje}</p>
            ${estado ? `<p class="text-xs text-slate-400 mt-1">Estado: <b>${estado}</b></p>` : ''}
            <a href="https://www.placas.pe/#/home/verificarEstadoPlaca" target="_blank" rel="noopener noreferrer" 
               class="inline-flex items-center gap-1.5 mt-3 py-1.5 px-3.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-xs font-bold transition-all shadow-sm">
                <i class="fas fa-external-link-alt text-xs"></i> Verificar en Portal AAP
            </a>
        </div>`;
    }
    
    const placaFmt = data.placaNueva || plate || data.placa || '';
    return `<div class="font-poppins">
        <p class="text-[10px] text-slate-400 dark:text-slate-500 mb-2 italic">* La información corresponde al último trámite realizado (Placa ${data.tipoPlaca || 'Regular'}).</p>
        <div class="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800/60 shadow-sm">
            <table class="w-full text-left border-collapse bg-white dark:bg-slate-900">
                <tbody>
                    ${fila('Placa', placaFmt)}
                    ${filaOpt('Placa Anterior', data.placaAnterior)}
                    ${filaOpt('Propietario', data.propietario)}
                    ${filaOpt('Marca', data.marca)}
                    ${filaOpt('Modelo', data.modelo)}
                    ${filaOpt('N° de Serie (VIN)', data.serie)}
                    ${filaOpt('Tipo de Uso', data.tipoUso)}
                    ${filaOpt('Tipo de Solicitud', data.tipoSolicitud)}
                    ${filaOpt('Estado', data.estado)}
                    ${filaOpt('Punto de Entrega', data.puntoEntrega)}
                    ${filaOpt('Fecha de Inicio', data.fechaInicio)}
                    ${filaOpt('Fecha de Entrega', data.fechaEntrega)}
                </tbody>
            </table>
        </div>
    </div>`;
}

export function renderValorVenal(data) {
    if (!data) return `<div class="p-4 text-center text-xs text-slate-400 font-poppins">Información de valor comercial no disponible.</div>`;
    const valorFmt = (data.valorReferencial || 0).toLocaleString();
    const vrnFmt = (data.vrn || data.valorReferencial || 0).toLocaleString();
    const tabla = data.tablaHistorica || {};
    const car = data.caracteristicas || {};

    const carHtml = Object.keys(car).length > 0 ? `
        <div class="mb-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 font-poppins">
            <div class="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2 mb-2.5">
                <span class="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    <i class="fas fa-car-side"></i> CARACTERÍSTICAS TÉCNICAS (AUTOMÁS / APESEG)
                </span>
                ${data.modeloConsultado && data.modeloConsultado !== data.modelo ? `
                    <span class="text-[9px] font-semibold text-slate-400 dark:text-slate-500 italic">
                        Matriz ajustada desde: <strong class="text-slate-600 dark:text-slate-300 font-mono">${data.modeloConsultado}</strong>
                    </span>` : ''}
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-[11px]">
                <div class="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                    <span class="text-[9px] uppercase font-bold text-slate-400 block">Marca</span>
                    <strong class="text-slate-800 dark:text-slate-200">${data.marca || '-'}</strong>
                </div>
                <div class="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                    <span class="text-[9px] uppercase font-bold text-slate-400 block">Modelo</span>
                    <strong class="text-slate-800 dark:text-slate-200">${data.modelo || '-'}</strong>
                </div>
                ${car.lanzamiento ? `
                <div class="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                    <span class="text-[9px] uppercase font-bold text-slate-400 block">Lanzamiento / Vigencia</span>
                    <strong class="text-slate-800 dark:text-slate-200">${car.lanzamiento} — ${car.vigencia || 'Act.'}</strong>
                </div>` : ''}
                ${car.carroceria ? `
                <div class="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800 sm:col-span-2 md:col-span-1">
                    <span class="text-[9px] uppercase font-bold text-slate-400 block">Carrocería</span>
                    <strong class="text-slate-800 dark:text-slate-200">${car.carroceria}</strong>
                </div>` : ''}
                ${car.puertas ? `
                <div class="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                    <span class="text-[9px] uppercase font-bold text-slate-400 block">Puertas / Asientos</span>
                    <strong class="text-slate-800 dark:text-slate-200">${car.puertas} ptas / ${car.asientos || '5'} astos</strong>
                </div>` : ''}
                ${car.traccion ? `
                <div class="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                    <span class="text-[9px] uppercase font-bold text-slate-400 block">Tracción</span>
                    <strong class="text-slate-800 dark:text-slate-200">${car.traccion}</strong>
                </div>` : ''}
                ${car.desplazamiento || car.potencia ? `
                <div class="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                    <span class="text-[9px] uppercase font-bold text-slate-400 block">Motor / Potencia</span>
                    <strong class="text-slate-800 dark:text-slate-200">${car.desplazamiento || ''} ${car.potencia ? `(${car.potencia})` : ''}</strong>
                </div>` : ''}
                ${car.tm || car.ta ? `
                <div class="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                    <span class="text-[9px] uppercase font-bold text-slate-400 block">Transmisión (TM/TA)</span>
                    <strong class="text-slate-800 dark:text-slate-200">TM: ${car.tm || '—'} / TA: ${car.ta || '—'}</strong>
                </div>` : ''}
                ${car.peso ? `
                <div class="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                    <span class="text-[9px] uppercase font-bold text-slate-400 block">Peso</span>
                    <strong class="text-slate-800 dark:text-slate-200">${car.peso}</strong>
                </div>` : ''}
                ${car.carburante ? `
                <div class="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                    <span class="text-[9px] uppercase font-bold text-slate-400 block">Combustible</span>
                    <strong class="text-slate-800 dark:text-slate-200">${car.carburante}</strong>
                </div>` : ''}
            </div>
        </div>` : '';

    const yearsList = Object.keys(tabla).map(Number).filter(n => isFinite(n)).sort((a, b) => a - b);
    
    // Segmentar en dos bloques (ej: 2011-2019 y 2020-2026)
    const block1Years = yearsList.filter(y => y <= 2019);
    const block2Years = yearsList.filter(y => y >= 2020);

    const renderPriceGrid = (years) => `
        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-9 gap-1.5 mb-3">
            ${years.map(yr => {
                const price = `$${(tabla[yr] || 0).toLocaleString()}`;
                const isSelected = yr === (data.anio || 2024);
                return `
                    <div class="text-center p-2 rounded-lg ${isSelected ? 'bg-amber-500 text-white shadow-sm font-extrabold' : 'bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800'} transition-all">
                        <p class="text-[9px] ${isSelected ? 'text-white/90 font-black' : 'text-slate-400 dark:text-slate-500 font-bold'}">${yr}</p>
                        <p class="text-[11px] md:text-xs font-bold mt-0.5 ${isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-200'}">${price}</p>
                    </div>`;
            }).join('')}
        </div>`;

    return `<div class="p-3 md:p-4 font-poppins">
        <div class="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 mb-4 shadow-xs">
            <div>
                <p class="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    <i class="fas fa-tag"></i> VALOR REFERENCIAL ESTIMADO DEL MERCADO (V.R.N.)
                </p>
                <div class="flex items-center gap-3 mt-1.5 flex-wrap">
                    <p class="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">US$ ${valorFmt} <span class="text-xs font-medium text-slate-400">Dólares</span></p>
                    <div id="valor-venal-soles" data-usd="${data.valorReferencial || 0}" title="Al tipo de cambio del día (fuente abierta)" class="inline-flex flex-col items-center px-3 py-1 rounded-xl bg-slate-900 text-white shadow-xs border border-emerald-500/40">
                        <span class="text-[8px] font-bold text-emerald-400 uppercase tracking-widest leading-none">Soles (hoy)</span>
                        <span class="vrn-soles-amount text-sm font-extrabold leading-tight">S/ …</span>
                        <span class="vrn-rate text-[8px] text-slate-400 font-medium leading-none">T.C. …</span>
                    </div>
                </div>
            </div>
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center text-xl shadow-md shrink-0">
                <i class="fas fa-coins"></i>
            </div>
        </div>

        ${carHtml}

        <!-- Tablas Históricas por Períodos -->
        <div class="space-y-3">
            ${block1Years.length > 0 ? `
            <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    <i class="fas fa-calendar-alt text-amber-500 mr-1"></i> Precios Referenciales ${block1Years[0]} - ${block1Years[block1Years.length - 1]}
                </span>
                ${renderPriceGrid(block1Years)}
            </div>` : ''}

            ${block2Years.length > 0 ? `
            <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    <i class="fas fa-calendar-check text-emerald-500 mr-1"></i> Precios Referenciales ${block2Years[0]} - ${block2Years[block2Years.length - 1]} & V.R.N. (US$ ${vrnFmt})
                </span>
                ${renderPriceGrid(block2Years)}
            </div>` : ''}
        </div>
    </div>`;
}

export function renderOsinergmin(data, plate) {
    if (!data || !data.registrado) {
        return `<div class="flex flex-col items-center justify-center py-6 gap-2 text-center font-poppins">
            <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-1">
                <i class="fas fa-gas-pump text-slate-400 text-lg"></i>
            </div>
            <p class="font-bold text-slate-700 dark:text-slate-300 text-xs">Sin Registro de Hidrocarburos</p>
            <p class="text-[11px] text-slate-400 max-w-[260px] leading-relaxed">El vehículo no presenta certificado activo de tanque de hidrocarburos / GNV / GLP en OSINERGMIN.</p>
        </div>`;
    }
    const rows = (data.data || []).map(r => `
        <tr class="border-b border-slate-100 dark:border-slate-800 last:border-0 font-poppins">
            <td class="py-2 px-2.5 text-xs font-bold text-slate-800 dark:text-slate-200">${r.col0 || '-'}</td>
            <td class="py-2 px-2.5 text-xs text-slate-600 dark:text-slate-400">${r.col1 || '-'}</td>
            <td class="py-2 px-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">${r.col2 || '-'}</td>
        </tr>`).join('');

    return `<div class="p-3 font-poppins">
        <div class="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <table class="w-full text-left border-collapse bg-white dark:bg-slate-900">
                <thead>
                    <tr class="bg-slate-900 text-white text-[9px] uppercase tracking-wider">
                        <th class="py-2 px-2.5">N° Registro</th>
                        <th class="py-2 px-2.5">Detalle / Tipo</th>
                        <th class="py-2 px-2.5">Estado</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    </div>`;
}

