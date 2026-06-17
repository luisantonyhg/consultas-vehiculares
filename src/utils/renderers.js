// Mapings and Configurations
export const LOGO_MAPPING = {
    soat: '/assets/apeseg.png',
    citv: '/assets/mtc.png',
    lunas: '/assets/pnp.png',
    callao: '/assets/callao.png',
    lima: '/assets/sat.png',
    sutran: '/assets/sutran.png',
    atu: '/assets/atu.png',
    gnv: '/assets/infogas.png',
    sbs: '/assets/sbs.png',
    vehiculo: '/assets/sunarp.jpeg'
};

export const SOURCE_URLS = {
    soat: 'https://www.apeseg.org.pe/consultas-soat/',
    citv: 'https://citv.mtc.gob.pe/citv-portal/',
    lunas: 'https://www.policia.gob.pe/',
    callao: 'https://pagopapeletascallao.pe/',
    lima: 'https://www.sat.gob.pe/',
    sutran: 'https://webexterno.sutran.gob.pe/WebExterno/Pages/frmRecordInfracciones.aspx',
    atu: 'https://soluciones.atu.gob.pe/ConsultaVehiculo',
    gnv: 'https://vh.infogas.com.pe/',
    sbs: 'https://servicios.sbs.gob.pe/reportesoat/',
    vehiculo: 'https://www.sunarp.gob.pe/'
};

export const SERVICE_COLORS = {
    soat:     { bg: 'bg-blue-50 dark:bg-blue-950/20',     icon: 'text-blue-600 dark:text-blue-400',    ring: 'ring-blue-200 dark:ring-blue-900' },
    citv:     { bg: 'bg-emerald-50 dark:bg-emerald-950/20', icon: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-200 dark:ring-emerald-900' },
    lunas:    { bg: 'bg-purple-50 dark:bg-purple-950/20',   icon: 'text-purple-600 dark:text-purple-400',  ring: 'ring-purple-200 dark:ring-purple-900' },
    callao:   { bg: 'bg-red-50 dark:bg-red-950/20',       icon: 'text-red-600 dark:text-red-400',      ring: 'ring-red-200 dark:ring-red-900' },
    lima:     { bg: 'bg-amber-50 dark:bg-amber-950/20',     icon: 'text-amber-600 dark:text-amber-400',    ring: 'ring-amber-200 dark:ring-amber-900' },
    sutran:   { bg: 'bg-orange-50 dark:bg-orange-950/20',   icon: 'text-orange-600 dark:text-orange-400',  ring: 'ring-orange-200 dark:ring-orange-900' },
    atu:      { bg: 'bg-teal-50 dark:bg-teal-950/20',       icon: 'text-teal-600 dark:text-teal-400',    ring: 'ring-teal-200 dark:ring-teal-900' },
    gnv:      { bg: 'bg-green-50 dark:bg-green-950/20',     icon: 'text-green-600 dark:text-green-400',   ring: 'ring-green-200 dark:ring-green-900' },
    sbs:      { bg: 'bg-violet-50 dark:bg-violet-950/20',  icon: 'text-violet-600 dark:text-violet-400', ring: 'ring-violet-200 dark:ring-violet-900' },
    vehiculo: { bg: 'bg-slate-50 dark:bg-slate-950/20',   icon: 'text-slate-600 dark:text-slate-400',  ring: 'ring-slate-200 dark:ring-slate-900' }
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

export function estadoBadge(estado) {
    const s = (estado || '').toUpperCase();
    if (s === 'VIGENTE' || s === 'APROBADO' || s === 'APROBADA') {
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
        if (card.id === 'vehiculo-card-container') {
            return 2.5; // Entre loading (2) y no-funciona/mantenimiento (3)
        }
        const status = card.getAttribute('data-status') || 'loading';
        const statusOrder = {
            'funciona': 1,
            'loading': 2,
            'no-funciona': 3,
            'mantenimiento': 3
        };
        return statusOrder[status] ?? 2;
    };

    cards.sort((a, b) => {
        const scoreA = getCardScore(a);
        const scoreB = getCardScore(b);
        if (scoreA !== scoreB) {
            return scoreA - scoreB;
        }

        const defaultOrder = [
            'soat-card-container',
            'citv-card-container',
            'gnv-card-container',
            'lunas-card-container',
            'callao-card-container',
            'sbs-card-container',
            'sutran-card-container',
            'atu-card-container',
            'lima-card-container',
            'vehiculo-card-container'
        ];
        return defaultOrder.indexOf(a.id) - defaultOrder.indexOf(b.id);
    });
    cards.forEach(card => wrapper.appendChild(card));
}

// Card states builders
export function setCardLoading(cardId, title, sub, iconClass, bgColorClass, sourceName) {
    const container = document.getElementById(`${cardId}-card-container`);
    if (!container) return;
    container.setAttribute('data-status', 'loading');
    container.className = "accordion-card results-card card-animate bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col overflow-hidden font-poppins";
    const loadingBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-sm uppercase tracking-wider">
        <span class="inline-block w-2.5 h-2.5 rounded-full border-2 border-slate-400 dark:border-slate-600 border-t-transparent spin-icon"></span> Buscando
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

export function setCardData(cardId, title, sub, iconClass, bgColorClass, sourceName, htmlContent, isSuccess, hasData, customBadge) {
    const container = document.getElementById(`${cardId}-card-container`);
    if (!container) return;
    let badgeHTML = '';

    if (isSuccess) {
        container.setAttribute('data-status', 'funciona');
        if (customBadge) {
            badgeHTML = customBadge;
        } else if (hasData) {
            let text = 'CON REGISTROS';
            if (cardId === 'soat') text = 'ACTIVO';
            if (cardId === 'citv') text = 'VIGENTE';
            if (cardId === 'atu') text = 'HABILITADO';
            badgeHTML = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider">
                <i class="fas fa-circle-check"></i> ${text}
            </span>`;
        } else {
            let text = 'SIN REGISTROS';
            if (cardId === 'callao' || cardId === 'sutran' || cardId === 'lima') text = 'SIN PAPELETAS';
            if (cardId === 'atu') text = 'NO REGISTRADO';
            if (cardId === 'lunas') text = 'SIN PERMISO';
            
            if (text === 'SIN PAPELETAS' || text === 'NO REGISTRADO' || cardId === 'gnv' || cardId === 'citv') {
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
        badgeHTML = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-500 text-white shadow-sm uppercase tracking-wider">
            <i class="fas fa-circle-xmark"></i> ERROR
        </span>`;
        const sourceUrl = SOURCE_URLS[cardId] || '';
        const verifyBtn = sourceUrl 
            ? `<a href="${sourceUrl}" target="_blank" rel="noopener"
                  class="mt-1 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wide transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg">
                  <i class="fas fa-arrow-up-right-from-square"></i> Consultar Portal Oficial
               </a>`
            : '';
        rightContent = `
            <div class="flex flex-col items-center justify-center text-center gap-3 py-6 font-poppins">
                <div class="w-14 h-14 rounded-full bg-red-50 dark:bg-rose-955/10 border-2 border-red-200 dark:border-rose-900 flex items-center justify-center mb-1">
                    <i class="fas fa-circle-xmark text-2xl text-red-500 font-bold"></i>
                </div>
                <div>
                    <p class="text-sm font-bold text-red-700 dark:text-red-400 leading-tight">Error al conectar con la fuente</p>
                    <p class="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-[300px] mx-auto leading-relaxed">${errorMessage}</p>
                </div>
                <div class="flex flex-wrap items-center justify-center gap-2">
                    <button onclick="window.reintentarSeccion('${cardId}', '${plate}')"
                        class="mt-1 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wide transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg">
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
            <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-1">
                <i class="fas fa-file-slash text-slate-300 dark:text-slate-650 text-xl"></i>
            </div>
            <p class="font-bold text-slate-600 dark:text-slate-400 text-sm">Sin SOAT registrado</p>
            <p class="text-xs text-slate-400 dark:text-slate-500">No se encontraron certificados SOAT para <strong class="text-slate-600 dark:text-slate-300">${plate}</strong></p>
        </div>`;
    }
    return data.map((cert, index) => {
        const borderClass = index > 0 ? 'border-t border-slate-200 dark:border-slate-800 pt-4 mt-4' : '';
        return `
        <div class="${borderClass}">
            <div class="flex items-start justify-between mb-4 gap-3 font-poppins">
                <div>
                    <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Aseguradora ${data.length > 1 ? `#${index + 1}` : ''}</p>
                    <p class="text-base font-bold text-slate-900 dark:text-white leading-tight">${cert.NombreCompania || 'N/A'}</p>
                    <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Placa: <strong class="text-slate-700 dark:text-slate-300">${cert.Placa || plate}</strong></p>
                </div>
                <div class="shrink-0">${estadoBadge(cert.Estado)}</div>
            </div>
            <div class="rounded-xl overflow-hidden">
                <table class="w-full text-left border-collapse bg-white dark:bg-slate-900">
                    <tbody>
                        ${fila('Certificado N°', cert.NumeroPoliza)}
                        ${fila('Tipo', cert.TipoCertificado)}
                        ${fila('Vigencia Inicio', cert.FechaInicio)}
                        ${fila('Vigencia Fin', cert.FechaFin)}
                        ${fila('Uso', cert.NombreUsoVehiculo)}
                        ${fila('Clase', cert.NombreClaseVehiculo)}
                        ${fila('Marca', cert.Marca)}
                        ${fila('Modelo', cert.ModeloVehiculo)}
                        ${fila('Asientos', cert.NumeroAsientos)}
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
    return data.map((cert, index) => {
        const borderClass = index > 0 ? 'border-t border-slate-200 dark:border-slate-800 pt-4 mt-4' : '';
        const estadoDisplay = (cert.estado && cert.estado !== 'N/A') ? cert.estado : cert.resultado;
        return `
        <div class="${borderClass}">
            <div class="flex items-start justify-between mb-4 gap-3 font-poppins">
                <div>
                    <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Centro de Inspección ${data.length > 1 ? `#${index + 1}` : ''}</p>
                    <p class="text-base font-bold text-slate-900 dark:text-white leading-tight">${cert.centroInspeccion || 'Centro MTC'}</p>
                </div>
                <div class="shrink-0">${estadoBadge(estadoDisplay)}</div>
            </div>
            <div class="rounded-xl overflow-hidden">
                <table class="w-full text-left border-collapse bg-white dark:bg-slate-900">
                    <tbody>
                        ${fila('N° Informe', cert.numeroInforme)}
                        ${fila('Fecha Inspección', cert.fechaInspeccion)}
                        ${fila('Fecha Vencimiento', cert.fechaVencimiento)}
                        ${fila('Clase Vehículo', cert.clase)}
                        ${fila('Marca', cert.marca)}
                        ${fila('Modelo', cert.modelo)}
                        ${fila('Año Fabricación', cert.anio)}
                    </tbody>
                </table>
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

export function renderLima(plate, message, directUrl) {
    return `
        <div class="flex flex-col gap-5 text-slate-900 dark:text-white font-poppins">
            <div class="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900 rounded-xl">
                <div class="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-800 flex items-center justify-center shrink-0">
                    <i class="fas fa-gavel text-amber-600 dark:text-amber-400"></i>
                </div>
                <div>
                    <p class="font-bold text-slate-850 dark:text-slate-200 text-sm">Consulta directa requerida</p>
                    <p class="text-xs text-slate-500 dark:text-slate-450 mt-0.5 leading-relaxed">${message}</p>
                </div>
            </div>
            <div class="flex flex-col items-center gap-3">
                <p class="text-[11px] text-slate-400 dark:text-slate-550">Placa a consultar: <strong class="font-bold text-slate-800 dark:text-slate-250 font-poppins text-sm">${plate}</strong></p>
                <a href="${directUrl}" target="_blank" rel="noopener"
                   class="w-full max-w-xs flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold uppercase tracking-wide transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg">
                   <i class="fas fa-arrow-up-right-from-square"></i> Abrir Portal SAT Lima
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
        totalSiniestros += count;

        html += `<div class="${borderTop} font-poppins">`;
        html += `<div class="flex items-center gap-2 mb-2">
            <div class="w-7 h-7 rounded-lg flex items-center justify-center ${cfg.bg} border ${cfg.border} shrink-0">
                <i class="${cfg.icon} text-xs ${cfg.color}"></i>
            </div>
            <span class="text-[10px] font-extrabold uppercase tracking-widest ${cfg.color}">${cfg.label}</span>
            ${count > 0
                ? `<span class="ml-auto text-[9px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 px-2 py-0.5 rounded-full">${count} siniestro${count > 1 ? 's' : ''}</span>`
                : ''
            }
        </div>`;

        if (tipo.error) {
            html += `<p class="text-[10px] text-red-500 italic pl-9">${tipo.error}</p>`;
        } else if (tipo.sin_registros || count === 0) {
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
