/**
 * Renderizadores de Consultas Registrales y Vehiculares
 * (SOAT, CITV, Lunas Polarizadas PNP, GNV Infogas, SUNARP, Información Vehicular)
 */
import {
    fila,
    escapeHTML,
    getFormattedTimestamp,
    estadoConVigencia,
    estadoBadge,
    cardHeaderAccordion,
    SOURCE_URLS
} from '../renderers.js';

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
            <p class="text-xs text-slate-400 dark:text-slate-500">No se encontraron lunas oscurecidas autorizadas para <strong class="text-slate-600 dark:text-slate-300">${escapeHTML(plate)}</strong></p>
        </div>`;
    }
    return data.map((cert, index) => {
        const certificate = escapeHTML(cert.nroCertificado || 'N/A');
        const vehiclePlate = escapeHTML(cert.placa || plate || 'N/A');
        const safe = (value) => escapeHTML(value || 'No informado');
        const borderClass = index > 0 ? 'mt-4 border-t-2 border-dashed border-slate-200 dark:border-slate-800 pt-4' : '';
        return `
        <article class="${borderClass} font-poppins">
            <div class="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div class="relative flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 px-3 py-2.5 pr-14">
                    <div class="min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-[9px] font-extrabold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Autorización de lunas PNP ${data.length > 1 ? `#${index + 1}` : ''}</span>
                            <span class="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white">
                                <i class="fas fa-circle-check text-[8px]"></i> Autorizado
                            </span>
                        </div>
                        <div class="mt-1 flex items-baseline gap-x-4 gap-y-1 flex-wrap">
                            <p class="text-sm md:text-base font-black leading-tight text-slate-900 dark:text-white">${certificate}</p>
                            <p class="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Placa: <strong class="font-mono text-xs text-slate-700 dark:text-slate-200">${vehiclePlate}</strong></p>
                        </div>
                    </div>
                    <img src="/assets/logopnp.png" alt="Policía Nacional del Perú" class="absolute right-3 top-1/2 h-8 w-8 -translate-y-1/2 rounded-md bg-white object-contain p-0.5 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700" />
                </div>
                <table class="w-full table-fixed border-collapse text-left">
                    <tbody>
                        ${fila('Categoría', safe(cert.categoria))}
                        ${fila('Marca', safe(cert.marca))}
                        ${fila('Modelo', safe(cert.modelo))}
                        ${fila('Color', safe(cert.color))}
                        ${fila('Año', safe(cert.anio))}
                        ${fila('Fecha de emisión', safe(cert.fechaEmision))}
                    </tbody>
                </table>
            </div>
        </article>`;
    }).join('');
}

export function renderSOATDetallado(result, plate) {
    const certificados = Array.isArray(result?.certificados) ? result.certificados : [];
    const siniestros = Array.isArray(result?.siniestros) ? result.siniestros : [];
    const safe = (value) => escapeHTML(value || 'No informado');
    const estadoActivo = (value) => String(value || '').toLowerCase() === 'activo';

    if (certificados.length === 0) {
        return `<div class="flex flex-col items-center justify-center gap-2 py-7 text-center font-poppins">
            <div class="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800"><i class="fas fa-shield-halved"></i></div>
            <p class="text-sm font-extrabold text-slate-700 dark:text-slate-200">Sin historial detallado publicado</p>
            <p class="max-w-md text-[11px] leading-relaxed text-slate-400">APESEG no devolvió certificados históricos para la placa <strong class="font-mono text-slate-600 dark:text-slate-300">${safe(plate)}</strong>.</p>
        </div>`;
    }

    const mobileCards = certificados.map((cert, index) => {
        const active = estadoActivo(cert.estado);
        const badgeClass = active ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white';
        const estadoText = String(cert.estado || '').toUpperCase() || (active ? 'ACTIVO' : 'VENCIDO');
        return `<article class="overflow-hidden rounded-xl border ${active ? 'border-emerald-300 dark:border-emerald-800' : 'border-rose-200 dark:border-rose-950/60'} bg-white shadow-sm dark:bg-slate-900">
            <div class="flex items-start justify-between gap-2 border-b ${active ? 'border-emerald-100 dark:border-emerald-950/40' : 'border-rose-100 dark:border-rose-950/40'} px-3 py-2.5">
                <div class="min-w-0">
                    <p class="text-[9px] font-extrabold uppercase tracking-[.16em] ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}">Certificado histórico #${index + 1}</p>
                    <p class="truncate text-sm font-black text-slate-900 dark:text-white">${safe(cert.compania)}</p>
                </div>
                <span class="shrink-0 rounded-md px-2.5 py-1 text-[9px] font-extrabold uppercase shadow-xs ${badgeClass}"><i class="${active ? 'fas fa-circle-check' : 'fas fa-circle-xmark'} mr-1"></i>${safe(estadoText)}</span>
            </div>
            <table class="w-full table-fixed border-collapse text-left"><tbody>
                ${fila('Inicio', safe(cert.inicio))}${fila('Fin', safe(cert.fin))}
                ${fila('Contratante', safe(cert.contratante))}${fila('Uso', safe(cert.uso))}
                ${fila('Clase', safe(cert.clase))}${fila('Ubigeo', safe(cert.ubigeo))}
                ${fila('Tipo', safe(cert.tipo))}
            </tbody></table>
        </article>`;
    }).join('');

    const desktopRows = certificados.map((cert) => {
        const active = estadoActivo(cert.estado);
        const badgeClass = active ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white';
        const estadoText = String(cert.estado || '').toUpperCase() || (active ? 'ACTIVO' : 'VENCIDO');
        const values = [cert.compania, cert.inicio, cert.fin, cert.contratante, cert.uso, cert.clase, cert.ubigeo, cert.tipo];
        return `<tr class="border-b border-slate-100 last:border-0 dark:border-slate-800 ${active ? 'bg-emerald-50/30 dark:bg-emerald-950/15' : ''}">
            ${values.map((value, i) => `<td class="px-2.5 py-2.5 align-middle text-[10px] leading-snug ${i === 0 ? 'font-extrabold text-slate-900 dark:text-white' : 'font-semibold text-slate-600 dark:text-slate-300'}">${safe(value)}</td>`).join('')}
            <td class="px-2.5 py-2.5 align-middle"><span class="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[9px] font-extrabold uppercase shadow-xs ${badgeClass}"><i class="${active ? 'fas fa-circle-check' : 'fas fa-circle-xmark'} text-[8px]"></i>${safe(estadoText)}</span></td>
        </tr>`;
    }).join('');

    const siniestrosBlock = siniestros.length ? `<section class="mt-4 overflow-hidden rounded-xl border border-rose-200 dark:border-rose-900/60">
        <div class="flex items-center justify-between bg-rose-50 px-3 py-2.5 dark:bg-rose-950/30">
            <div><p class="text-[9px] font-extrabold uppercase tracking-[.16em] text-rose-500">Siniestros reportados</p><p class="text-xs font-bold text-slate-700 dark:text-slate-200">${siniestros.length} registro${siniestros.length === 1 ? '' : 's'} encontrado${siniestros.length === 1 ? '' : 's'}</p></div>
            <i class="fas fa-car-burst text-rose-500"></i>
        </div>
        <div class="grid gap-2 p-2.5 md:grid-cols-2">${siniestros.map((item, index) => `<article class="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
            <p class="mb-2 text-[10px] font-black text-rose-600 dark:text-rose-400">SINIESTRO #${index + 1} · ${safe(item.compania)}</p>
            <table class="w-full"><tbody>${fila('Fecha', safe(item.fecha))}${fila('Ubigeo', safe(item.ubigeo))}${fila('Causa', safe(item.causa))}${fila('Cobertura', safe(item.cobertura))}${fila('Pago', safe(item.pago))}${fila('Reserva', safe(item.reserva))}</tbody></table>
        </article>`).join('')}</div>
    </section>` : '';

    return `<div class="font-poppins">
        <div class="relative flex items-center justify-between gap-3 rounded-t-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 pr-14 dark:border-slate-800 dark:bg-slate-950/50">
            <div><p class="text-[9px] font-extrabold uppercase tracking-[.16em] text-slate-400">Historial oficial APESEG</p><p class="text-sm font-black text-slate-900 dark:text-white">Placa ${safe(result?.placa || plate)} · ${certificados.length} certificado${certificados.length === 1 ? '' : 's'}</p></div>
            <img src="/assets/apeseg.png" alt="APESEG" class="absolute right-3 top-1/2 h-8 w-8 -translate-y-1/2 rounded-md bg-white object-contain p-0.5 shadow-sm ring-1 ring-slate-200" />
        </div>
        <div class="grid gap-2.5 rounded-b-xl border border-t-0 border-slate-200 bg-slate-50/30 p-2.5 dark:border-slate-800 dark:bg-slate-950/20 md:hidden">${mobileCards}</div>
        <div class="hidden overflow-x-auto rounded-b-xl border border-t-0 border-slate-200 dark:border-slate-800 md:block">
            <table class="min-w-[1180px] w-full border-collapse text-left"><thead><tr class="bg-slate-900 text-white">${['Compañía','Inicio','Fin','Contratante','Uso','Clase','Ubigeo','Tipo','Estado'].map(h => `<th class="px-2.5 py-2 text-[9px] font-extrabold uppercase tracking-wider">${h}</th>`).join('')}</tr></thead><tbody>${desktopRows}</tbody></table>
        </div>
        ${siniestrosBlock}
    </div>`;
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

export function renderSunarp(datos, plate, imageBase64 = null) {
    if (!datos && !imageBase64) {
        return `<div class="flex flex-col items-center justify-center py-8 gap-2 text-center font-poppins">
            <i class="fas fa-circle-exclamation text-slate-300 dark:text-slate-600 text-2xl mb-1"></i>
            <p class="text-xs text-slate-400 dark:text-slate-500">Sin registros de gravamen o datos para <strong>${escapeHTML(plate)}</strong> en SUNARP</p>
        </div>`;
    }

    const img = imageBase64 || (datos && (datos.imagen_base64 || datos.official_image_base64 || datos.imagen));
    const cleanImg = img && img.startsWith('data:') ? img : (img ? `data:image/png;base64,${img}` : null);

    let imageHtml = '';
    if (cleanImg) {
        imageHtml = `
        <div class="mb-4 rounded-xl overflow-hidden border border-emerald-200 dark:border-emerald-950/60 bg-gradient-to-b from-emerald-50/40 to-slate-50/40 dark:from-emerald-950/20 dark:to-slate-900/40 p-3 shadow-sm">
            <div class="flex items-center justify-between pb-2 mb-2 border-b border-emerald-100/60 dark:border-emerald-900/30">
                <div class="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <i class="fas fa-certificate text-emerald-500"></i>
                    <span>Resultado Gráfico Oficial SUNARP</span>
                </div>
                <a href="${cleanImg}" target="_blank" download="SUNARP_${plate}.png" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs">
                    <i class="fas fa-download text-[10px]"></i> Descargar
                </a>
            </div>
            <div class="relative group flex justify-center bg-white dark:bg-slate-900 rounded-xl p-3 md:p-4 border border-slate-200/80 dark:border-slate-800 shadow-inner">
                <img 
                    src="${cleanImg}" 
                    alt="Certificado Oficial SUNARP para placa ${escapeHTML(plate)}" 
                    class="w-full max-h-[550px] md:max-h-[650px] object-contain rounded-lg shadow-sm transition-transform duration-200 group-hover:scale-[1.01]" 
                />
            </div>
            <p class="text-[10px] text-center text-slate-400 dark:text-slate-500 mt-2 italic">
                * Imagen oficial generada directamente por la Superintendencia Nacional de los Registros Públicos.
            </p>
        </div>`;
    }

    let rowsHtml = '';
    if (datos && typeof datos === 'object') {
        for (const [key, val] of Object.entries(datos)) {
            if (['imagen_base64', 'official_image_base64', 'imagen'].includes(key)) continue;
            if (val && String(val).trim() && String(val) !== 'null') {
                rowsHtml += fila(key, String(val));
            }
        }
    }

    let tableHtml = '';
    if (rowsHtml) {
        tableHtml = `
        <div class="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800/60 shadow-sm">
            <table class="w-full text-left border-collapse bg-white dark:bg-slate-900">
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        </div>`;
    }

    return `<div class="font-poppins">
        ${imageHtml}
        ${tableHtml}
    </div>`;
}

export function renderSunarpNotFound(plate) {
    const safePlate = escapeHTML(plate);
    return `<div class="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 px-5 py-7 text-center font-poppins shadow-sm sm:px-8">
        <div class="absolute inset-x-0 top-0 h-1 bg-slate-900"></div>
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-md">
            <img src="/assets/sunarp.jpeg" alt="SUNARP" class="h-11 w-11 object-contain" />
        </div>
        <span class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[.14em] text-slate-700">
            <i class="fas fa-magnifying-glass"></i> Sin registro oficial
        </span>
        <h4 class="mt-4 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">La placa ${safePlate} no fue encontrada</h4>
        <p class="mx-auto mt-2 max-w-xl text-xs font-medium leading-relaxed text-slate-500 sm:text-sm">
            SUNARP confirmó que no existen datos registrales para la placa ingresada. Verifica cuidadosamente las letras y números antes de volver a consultar.
        </p>
        <div class="mx-auto mt-5 flex max-w-md items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-sm">
            <i class="fas fa-shield-halved mt-0.5 text-slate-700"></i>
            <p class="text-[11px] font-semibold leading-relaxed text-slate-500">Para proteger el sistema y evitar consultas innecesarias, las demás fuentes no fueron ejecutadas.</p>
        </div>
    </div>`;
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
    container.setAttribute('data-export-title', 'Información Vehicular SUNARP');
    container.innerHTML = `
        ${cardHeaderAccordion('vehiculo', 'Información Vehicular (SUNARP)', 'REGISTRO MULTIFUENTE', 'fas fa-car-side', badgeHTML, isExpanded)}
        <div class="accordion-body w-full p-3 md:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955/20 ${isExpanded ? '' : 'hidden'}">
            <div class="rounded-xl overflow-hidden">
                ${tableRows}
            </div>
            ${hasData ? `<div class="canita-export-brand mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-800">
                <div class="flex items-center justify-between gap-3">
                    <div class="flex min-w-0 items-center gap-2.5">
                        <img src="/assets/logocanita.jpeg" alt="Cañita" class="h-8 w-auto max-w-[105px] rounded-md object-contain" />
                        <div><p class="text-[9px] font-extrabold uppercase tracking-[.14em]">Consulta vehicular Cañita</p><p class="text-[8px] font-semibold text-slate-400">Información clara desde fuentes oficiales</p></div>
                    </div><i class="fas fa-shield-halved text-emerald-500"></i>
                </div>
            </div>` : ''}
            <div class="card-source-footer mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-850 flex items-center justify-between text-[9px] md:text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider font-poppins">
                <span>Fuente: SUNARP <a href="${SOURCE_URLS.vehiculo}" target="_blank" rel="noopener" class="inline-flex items-center gap-0.5 text-blue-500 hover:text-blue-655 dark:text-amber-400 dark:hover:text-amber-300 font-bold ml-1 normal-case hover:underline"><i class="fas fa-arrow-up-right-from-square text-[8px]"></i> Verificar</a></span>
                <span>Consultado: ${getFormattedTimestamp()}</span>
            </div>
            ${hasData ? `<div class="card-share-actions no-print mt-2 flex items-center justify-end gap-1.5">
                <button type="button" onclick="event.stopPropagation(); window.descargarSeccion('vehiculo', this)" class="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-wider text-white"><i class="fas fa-download"></i> Descargar</button>
                <button type="button" onclick="event.stopPropagation(); window.compartirSeccion('vehiculo', this)" class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-wider text-white"><i class="fab fa-whatsapp"></i> Compartir</button>
            </div>` : ''}
        </div>`;
}
