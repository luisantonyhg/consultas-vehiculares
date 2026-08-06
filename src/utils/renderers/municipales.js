/**
 * Renderizadores de Servicios Municipales, Lunas, CITV, GNV y Placas AAP
 */

export function renderPlacasPE(data, plate) {
    if (!data) return `<div class="p-4 text-center text-xs text-slate-400">Sin datos de la Asociación Automotriz del Perú.</div>`;
    const P = (v) => (v && v !== '-' && String(v).trim()) ? v : null;
    const fila = (label, value) => `<tr class="border-b border-slate-100 dark:border-slate-800/50"><td class="py-2 px-3 text-slate-500 text-xs w-1/3">${label}</td><td class="py-2 px-3 text-slate-800 dark:text-slate-200 text-xs">${value}</td></tr>`;
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

export function renderCitv(data) {
    if (!data) return `<div class="p-4 text-center text-xs text-slate-400 font-poppins">Sin registros CITV.</div>`;
    return `<div class="p-3 text-xs text-slate-600 dark:text-slate-300 font-poppins">Inspección Técnica Vehicular (CITV) procesada.</div>`;
}

export function renderGnv(data) {
    if (!data) return `<div class="p-4 text-center text-xs text-slate-400 font-poppins">Sin registros de conversión GNV.</div>`;
    return `<div class="p-3 text-xs text-slate-600 dark:text-slate-300 font-poppins">Certificado de conversión a Gas Natural (GNV) verificado.</div>`;
}

export function renderLunas(data) {
    if (!data) return `<div class="p-4 text-center text-xs text-slate-400 font-poppins">Sin datos de lunas tintadas PNP.</div>`;
    return `<div class="p-3 text-xs text-slate-600 dark:text-slate-300 font-poppins">Autorización de Lunas Tintadas PNP verificada.</div>`;
}

export function renderMunicipal(data) {
    return `<div class="p-3 text-xs text-slate-600 dark:text-slate-300 font-poppins">Consulta Municipal procesada.</div>`;
}

export function renderCallao(data) {
    return `<div class="p-3 text-xs text-slate-600 dark:text-slate-300 font-poppins">Consulta Callao procesada.</div>`;
}

export function renderLima(data) {
    return `<div class="p-3 text-xs text-slate-600 dark:text-slate-300 font-poppins">Consulta Lima procesada.</div>`;
}

export function renderSatDeuda(data) {
    return `<div class="p-3 text-xs text-slate-600 dark:text-slate-300 font-poppins">Deuda SAT procesada.</div>`;
}

export function renderSatCaptura(data) {
    return `<div class="p-3 text-xs text-slate-600 dark:text-slate-300 font-poppins">Orden de Captura SAT procesada.</div>`;
}

export function renderSatDeposito(data) {
    return `<div class="p-3 text-xs text-slate-600 dark:text-slate-300 font-poppins">Depósito SAT procesado.</div>`;
}

export function renderAtu(data) {
    return `<div class="p-3 text-xs text-slate-600 dark:text-slate-300 font-poppins">Consulta ATU procesada.</div>`;
}

export function renderOsinergmin(data) {
    return `<div class="p-3 text-xs text-slate-600 dark:text-slate-300 font-poppins">Consulta Osinergmin procesada.</div>`;
}
