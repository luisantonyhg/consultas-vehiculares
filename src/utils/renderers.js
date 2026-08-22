// Mappings, Core UI Component Builders and Renderers Coordinator
export * from './renderers/index.js';

export const LOGO_MAPPING = {
    soat: '/assets/apeseg.png',
    citv: '/assets/mtc.png',
    lunas: '/assets/logopnp.png',
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
    osinergmin: '/assets/osinergmin.png',
    fise: '/assets/fise.png',
    // pnp_req desactivado junto con su tarjeta.
    historial_dueños: '/assets/sunarp.jpeg'
};

export const SOURCE_URLS = {
    soat: 'https://www.apeseg.org.pe/consultas-soat/',
    citv: 'https://rec.mtc.gob.pe/Citv/ArConsultaCitv',
    lunas: 'https://sistemas.policia.gob.pe/consultalunas/ConsultarServicioLunas',
    // pnp_req desactivado: no incluir la URL de ConsultaPVR en el bundle.
    historial_dueños: 'https://www.sunarp.gob.pe/',
    callao: 'https://pagopapeletascallao.pe/',
    lima: 'https://www.sat.gob.pe/',
    sutran: 'https://webexterno.sutran.gob.pe/WebExterno/Pages/frmRecordInfracciones.aspx',
    cinemometro: 'https://webexterno.sutran.gob.pe/WebExterno/Pages/frmPapeletasCinemometro.aspx',
    atu: 'https://soluciones.atu.gob.pe/ConsultaVehiculo',
    gnv: 'https://vh.infogas.com.pe/',
    fise: 'https://fise.minem.gob.pe:23308/consulta-taller/pages/consultaTaller/inicio',
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
    soat:        { bg: 'bg-blue-50 dark:bg-blue-950/20',       icon: 'text-blue-600 dark:text-blue-400',       ring: 'ring-blue-200 dark:ring-blue-900' },
    citv:        { bg: 'bg-emerald-50 dark:bg-emerald-950/20', icon: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-200 dark:ring-emerald-900' },
    lunas:       { bg: 'bg-purple-50 dark:bg-purple-950/20',   icon: 'text-purple-600 dark:text-purple-400',   ring: 'ring-purple-200 dark:ring-purple-900' },
    // pnp_req desactivado mientras Requisitorias esté fuera del producto.
    historial_dueños: { bg: 'bg-indigo-50 dark:bg-indigo-950/20', icon: 'text-indigo-600 dark:text-indigo-400', ring: 'ring-indigo-200 dark:ring-indigo-900' },
    callao:      { bg: 'bg-red-50 dark:bg-red-950/20',         icon: 'text-red-600 dark:text-red-400',         ring: 'ring-red-200 dark:ring-red-900' },
    lima:        { bg: 'bg-amber-50 dark:bg-amber-950/20',     icon: 'text-amber-600 dark:text-amber-400',     ring: 'ring-amber-200 dark:ring-amber-900' },
    sutran:      { bg: 'bg-orange-50 dark:bg-orange-950/20',   icon: 'text-orange-600 dark:text-orange-400',   ring: 'ring-orange-200 dark:ring-orange-900' },
    cinemometro: { bg: 'bg-rose-50 dark:bg-rose-950/20',       icon: 'text-rose-600 dark:text-rose-400',       ring: 'ring-rose-200 dark:ring-rose-900' },
    atu:         { bg: 'bg-teal-50 dark:bg-teal-950/20',       icon: 'text-teal-600 dark:text-teal-400',       ring: 'ring-teal-200 dark:ring-teal-900' },
    gnv:         { bg: 'bg-green-50 dark:bg-green-950/20',     icon: 'text-green-600 dark:text-green-400',     ring: 'ring-green-200 dark:ring-green-900' },
    fise:        { bg: 'bg-sky-50 dark:bg-sky-950/20',         icon: 'text-sky-600 dark:text-sky-400',         ring: 'ring-sky-200 dark:ring-sky-900' },
    sbs:         { bg: 'bg-violet-50 dark:bg-violet-950/20',   icon: 'text-violet-600 dark:text-violet-400',   ring: 'ring-violet-200 dark:ring-violet-900' },
    sunarp:      { bg: 'bg-emerald-50 dark:bg-emerald-950/20', icon: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-200 dark:ring-emerald-900' },
    vehiculo:    { bg: 'bg-slate-50 dark:bg-slate-950/20',     icon: 'text-slate-600 dark:text-slate-400',     ring: 'ring-slate-200 dark:ring-slate-900' },
    placas_pe:   { bg: 'bg-cyan-50 dark:bg-cyan-950/20',       icon: 'text-cyan-600 dark:text-cyan-400',       ring: 'ring-cyan-200 dark:ring-cyan-900' },
    valor_venal: { bg: 'bg-amber-50 dark:bg-amber-950/20',     icon: 'text-amber-600 dark:text-amber-400',     ring: 'ring-amber-200 dark:ring-amber-900' },
    osinergmin:  { bg: 'bg-lime-50 dark:bg-lime-950/20',       icon: 'text-lime-600 dark:text-lime-400',       ring: 'ring-lime-200 dark:ring-lime-900' }
};

// Formatters and Helpers
export function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

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

export function diasHasta(fechaStr) {
    const f = parseFechaPE(fechaStr);
    if (!f) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    f.setHours(0, 0, 0, 0);
    return Math.round((f - hoy) / 86400000);
}

function _formatoLapso(dias) {
    const n = Math.abs(dias);
    if (n < 365) return `${n} ${n === 1 ? 'día' : 'días'}`;
    const anios = Math.floor(n / 365);
    const meses = Math.floor((n % 365) / 30);
    return meses > 0
        ? `${anios} ${anios === 1 ? 'año' : 'años'} ${meses} ${meses === 1 ? 'mes' : 'meses'}`
        : `${anios} ${anios === 1 ? 'año' : 'años'}`;
}

export function estadoConVigencia(estado, fechaVencimiento) {
    const base = (estado || '').toString().trim();
    const dias = diasHasta(fechaVencimiento);
    if (dias === null) return base;

    const s = base.toUpperCase();
    const vigenteDeclarado = s === 'VIGENTE' || s === 'APROBADO' || s === 'APROBADA';

    if (dias < 0) {
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

    if (s.includes('VENCE HOY') || s.includes('VENCE EN')) {
        return `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-900 shadow-sm font-poppins">
            <i class="fas fa-triangle-exclamation"></i> ${estado}
        </span>`;
    }
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

export function reorderCards() {
    const wrapper = document.getElementById('results-cards-wrapper');
    if (!wrapper) return;
    const cards = Array.from(wrapper.children);
    
    const getCardScore = (card) => {
        const status = card.getAttribute('data-status') || 'loading';
        const statusOrder = {
            'funciona': 1,
            'loading': 2,
            'waiting': 2,
            'no-funciona': 3,
            'mantenimiento': 10,
            'maintenance': 10,
            'development': 10
        };
        const score = statusOrder[status] ?? 2;
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
            'sunarp-card-container',
            'lima-card-container',
            'placas_pe-card-container',
            'soat-card-container',
            'sbs-card-container',
            'valor_venal-card-container',
            'citv-card-container',
            'gnv-card-container',
            'fise-card-container',
            'osinergmin-card-container',
            'sutran-card-container',
            'cinemometro-card-container',
            'callao-card-container',
            'municipal-card-container',
            'sat_deuda-card-container',
            'sat_captura-card-container',
            'sat_deposito-card-container',
            'atu-card-container',
            'lunas-card-container',
            // Requisitorias PNP desactivado: no forma parte del orden visual.
            'historial_dueños-card-container'
        ];
        const _ia = defaultOrder.indexOf(a.id); const _ib = defaultOrder.indexOf(b.id);
        return (_ia === -1 ? 999 : _ia) - (_ib === -1 ? 999 : _ib);
    });
    cards.forEach(card => wrapper.appendChild(card));

    // Lunas se consulta al final por ser una fuente pesada. Cuando la fuente ya
    // respondió correctamente, se presenta junto a Papeletas Lima SAT; mientras
    // siga pendiente o falle, permanece al final sin alterar las demás tarjetas.
    const lunasCard = document.getElementById('lunas-card-container');
    const limaCard = document.getElementById('lima-card-container');
    if (lunasCard?.parentElement === wrapper) {
        if (lunasCard.getAttribute('data-status') === 'funciona' && limaCard?.parentElement === wrapper) {
            limaCard.insertAdjacentElement('afterend', lunasCard);
        } else {
            wrapper.appendChild(lunasCard);
        }
    }
}

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

export function setCardDevelopment(cardId, title, sub, iconClass, sourceName, mensaje) {
    _renderUnavailableCard(cardId, title, iconClass, sourceName, 'En desarrollo', 'development', mensaje);
}

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
            if (cardId === 'citv') text = 'SIN INSPECCIÓN';

            const rojoSinDato = (cardId === 'soat' || cardId === 'citv' || cardId === 'lunas');
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
        badgeHTML = `<button onclick="event.stopPropagation(); window.reintentarSeccion('${cardId}', '${plate}')" title="Reintentar esta consulta"
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-extrabold bg-slate-900 hover:bg-black text-white shadow-sm uppercase tracking-wider transition-all duration-150 active:scale-95 cursor-pointer border border-slate-700">
            <i class="fas fa-rotate-right"></i> REINTENTAR
        </button>`;
        rightContent = `
            <div class="flex flex-col items-center justify-center text-center gap-3 py-6 font-poppins">
                <div class="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center mb-1">
                    <i class="fas fa-wrench text-2xl text-slate-700 dark:text-slate-300 animate-pulse"></i>
                </div>
                <div>
                    <p class="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">Servicio en Desarrollo</p>
                    <p class="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-[300px] mx-auto leading-relaxed">${errorMessage}</p>
                </div>
                <button onclick="window.reintentarSeccion('${cardId}', '${plate}')"
                    class="mt-1 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wide transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg border border-slate-700">
                    <i class="fas fa-rotate-right"></i> Reintentar Consulta
                </button>
            </div>`;
    } else {
        container.setAttribute('data-status', 'no-funciona');
        badgeHTML = `<button onclick="event.stopPropagation(); window.reintentarSeccion('${cardId}', '${plate}')" title="Reintentar esta consulta"
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-extrabold bg-slate-900 hover:bg-black text-white shadow-sm uppercase tracking-wider transition-all duration-150 active:scale-95 cursor-pointer border border-slate-700">
            <i class="fas fa-rotate-right"></i> REINTENTAR
        </button>`;
        const sourceUrl = SOURCE_URLS[cardId] || '';
        const verifyBtn = sourceUrl 
            ? `<a href="${sourceUrl}" target="_blank" rel="noopener"
                  class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold uppercase tracking-wide transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg border border-slate-600">
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
                    <p class="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-[340px] mx-auto leading-relaxed">${errorMessage || 'El portal oficial no respondió a tiempo. Puedes pulsar Reintentar o verificar directamente en su portal.'}</p>
                </div>
                <div class="flex flex-wrap items-center justify-center gap-2">
                    <button onclick="window.reintentarSeccion('${cardId}', '${plate}')"
                        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wide transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg border border-slate-700">
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
