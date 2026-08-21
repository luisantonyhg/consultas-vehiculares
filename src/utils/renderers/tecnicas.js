/**
 * Renderizadores de Consultas Técnicas, Comerciales y Especializadas
 * (Placas PE AAP, Valor Venal Automás/APESEG, OSINERGMIN Hidrocarburos)
 */
import {
    fila
} from '../renderers.js';

export function renderPlacasPE(data, plate) {
    if (!data) return `<div class="p-4 text-center text-xs text-slate-400">Sin datos de la Asociación Automotriz del Perú.</div>`;
    
    const P = (v) => (v && v !== '-' && String(v).trim()) ? v : null;
    const filaOpt = (label, value) => P(value) ? fila(label, value) : '';
    
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
    if (!data) return `<div class="p-5 text-center text-xs text-slate-400 font-poppins">Información de valor comercial no disponible.</div>`;
    const valorFmt = (data.valorReferencial || 0).toLocaleString();
    const vrnFmt = (data.vrn || data.valorReferencial || 0).toLocaleString();
    const tabla = data.tablaHistorica || {};
    const car = data.caracteristicas || {};

    const carHtml = Object.keys(car).length > 0 ? `
        <div class="mb-5 p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 font-poppins">
            <div class="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2.5 mb-3.5 flex-wrap">
                <span class="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <i class="fas fa-sliders text-blue-500"></i> Ficha Técnica del Modelo (APESEG / Automás)
                </span>
                ${data.modeloConsultado && data.modeloConsultado !== data.modelo ? `
                    <span class="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                        Matriz estimada desde: <strong class="text-slate-600 dark:text-slate-300 font-mono">${data.modeloConsultado}</strong>
                    </span>` : ''}
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
                <div class="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-xs">
                    <span class="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Marca</span>
                    <strong class="text-slate-900 dark:text-white font-black">${data.marca || '—'}</strong>
                </div>
                <div class="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-xs">
                    <span class="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Modelo</span>
                    <strong class="text-slate-900 dark:text-white font-black">${data.modelo || '—'}</strong>
                </div>
                ${car.lanzamiento ? `
                <div class="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-xs">
                    <span class="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Lanzamiento / Vigencia</span>
                    <strong class="text-slate-800 dark:text-slate-200 font-bold">${car.lanzamiento} — ${car.vigencia || 'Act.'}</strong>
                </div>` : ''}
                ${car.carroceria ? `
                <div class="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-xs">
                    <span class="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Carrocería</span>
                    <strong class="text-slate-800 dark:text-slate-200 font-bold">${car.carroceria}</strong>
                </div>` : ''}
                ${car.puertas ? `
                <div class="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-xs">
                    <span class="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Puertas / Asientos</span>
                    <strong class="text-slate-800 dark:text-slate-200 font-bold">${car.puertas} ptas · ${car.asientos || '5'} as.</strong>
                </div>` : ''}
                ${car.traccion ? `
                <div class="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-xs">
                    <span class="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Tracción</span>
                    <strong class="text-slate-800 dark:text-slate-200 font-bold">${car.traccion}</strong>
                </div>` : ''}
                ${car.desplazamiento || car.potencia ? `
                <div class="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-xs">
                    <span class="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Motor / Potencia</span>
                    <strong class="text-slate-800 dark:text-slate-200 font-bold">${car.desplazamiento || ''} ${car.potencia ? `(${car.potencia})` : ''}</strong>
                </div>` : ''}
                ${car.tm || car.ta ? `
                <div class="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-xs">
                    <span class="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Transmisión</span>
                    <strong class="text-slate-800 dark:text-slate-200 font-bold">TM: ${car.tm || '—'} / TA: ${car.ta || '—'}</strong>
                </div>` : ''}
                ${car.carburante ? `
                <div class="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-xs">
                    <span class="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Combustible</span>
                    <strong class="text-slate-800 dark:text-slate-200 font-bold">${car.carburante}</strong>
                </div>` : ''}
            </div>
        </div>` : '';

    const yearsList = Object.keys(tabla).map(Number).filter(n => isFinite(n)).sort((a, b) => a - b);
    const block1Years = yearsList.filter(y => y <= 2019);
    const block2Years = yearsList.filter(y => y >= 2020);

    const renderPriceGrid = (years) => `
        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 lg:grid-cols-9 gap-2 mb-4">
            ${years.map(yr => {
                const price = `$${(tabla[yr] || 0).toLocaleString()}`;
                const isSelected = yr === (data.anio || 2024);
                return `
                    <div class="text-center p-2.5 rounded-xl ${isSelected ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md font-extrabold border border-slate-800 dark:border-slate-200' : 'bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800'} transition-all">
                        <p class="text-[10px] ${isSelected ? 'text-slate-300 dark:text-slate-600 font-black' : 'text-slate-400 dark:text-slate-500 font-bold'}">${yr}</p>
                        <p class="text-xs sm:text-[13px] font-black mt-0.5 ${isSelected ? 'text-white dark:text-slate-900' : 'text-slate-800 dark:text-slate-200 font-archivo'}">${price}</p>
                    </div>`;
            }).join('')}
        </div>`;

    return `<div class="p-4 sm:p-6 font-poppins">
        <!-- Banner Valor Referencial Sobrio y Ejecutivo -->
        <div class="p-4 sm:p-5 rounded-2xl bg-slate-900 dark:bg-slate-950 text-white border-l-4 border-emerald-500 border-y border-r border-slate-800 mb-5 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <div class="flex items-center gap-2">
                    <span class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                        <i class="fas fa-coins text-emerald-400"></i> Valor Referencial de Mercado (V.R.N.)
                    </span>
                </div>
                <div class="flex items-baseline gap-3 mt-1.5 flex-wrap">
                    <span class="text-2xl sm:text-3xl font-black text-white font-archivo tracking-tight">US$ ${valorFmt}</span>
                    <div id="valor-venal-soles" data-usd="${data.valorReferencial || 0}" title="Al tipo de cambio del día (fuente abierta)" class="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-800 text-white border border-slate-700 shadow-xs">
                        <span class="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Aprox. Soles</span>
                        <span class="vrn-soles-amount text-sm font-black font-archivo leading-none">S/ …</span>
                        <span class="vrn-rate text-[9px] text-slate-400 font-medium">T.C. …</span>
                    </div>
                </div>
            </div>
            <div class="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                <i class="fas fa-circle-info text-slate-500"></i> Catálogo Referencial APESEG
            </div>
        </div>

        ${carHtml}

        <div class="space-y-4">
            ${block1Years.length > 0 ? `
            <div>
                <span class="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                    <i class="fas fa-calendar-days text-slate-400"></i> Tabla Histórica ${block1Years[0]} – ${block1Years[block1Years.length - 1]}
                </span>
                ${renderPriceGrid(block1Years)}
            </div>` : ''}

            ${block2Years.length > 0 ? `
            <div>
                <span class="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                    <i class="fas fa-calendar-check text-emerald-500"></i> Tabla Reciente ${block2Years[0]} – ${block2Years[block2Years.length - 1]} & V.R.N. Oficial (US$ ${vrnFmt})
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
