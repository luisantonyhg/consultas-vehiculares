/**
 * Renderizadores de Servicios Financieros y Coberturas (SOAT, SBS, Valor Venal)
 */

export function renderSoat(data) {
    if (!data) return `<div class="p-4 text-center text-xs text-slate-400 font-poppins">Información de SOAT no disponible.</div>`;
    const aseguradora = data.aseguradora || data.compania || '-';
    const estado = data.estado || 'ACTIVO';
    const inicio = data.fechaInicio || '-';
    const fin = data.fechaFin || '-';
    const uso = data.tipoUso || '-';
    const clase = data.claseVehiculo || '-';
    const tipo = data.tipoSoat || 'ELECTRÓNICO';

    const esActivo = /vigente|activo|valido/i.test(estado);

    return `<div class="font-poppins">
        <div class="flex items-center justify-between p-3 rounded-xl ${esActivo ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'} mb-3">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg ${esActivo ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'} flex items-center justify-center text-base">
                    <i class="fas ${esActivo ? 'fa-shield-halved' : 'fa-triangle-exclamation'}"></i>
                </div>
                <div>
                    <p class="text-xs font-bold ${esActivo ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'} uppercase tracking-wide">Póliza SOAT ${estado}</p>
                    <p class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">${aseguradora}</p>
                </div>
            </div>
            <span class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${esActivo ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'}">${tipo}</span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/50">
                <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-0.5">Vigencia Inicio</span>
                <span class="font-bold text-slate-700 dark:text-slate-200">${inicio}</span>
            </div>
            <div class="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/50">
                <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-0.5">Vigencia Fin</span>
                <span class="font-bold text-slate-700 dark:text-slate-200">${fin}</span>
            </div>
        </div>
    </div>`;
}

export function renderSbs(data) {
    if (!data) return `<div class="p-4 text-center text-xs text-slate-400 font-poppins">Sin reporte de coberturas registrales SBS.</div>`;
    return `<div class="p-3 text-xs text-slate-600 dark:text-slate-300 font-poppins">Consulta de historial SBS procesada con éxito.</div>`;
}

export function renderValorVenal(data) {
    if (!data) return `<div class="p-4 text-center text-xs text-slate-400 font-poppins">Información de valor comercial no disponible.</div>`;
    const valorFmt = (data.valorReferencial || 0).toLocaleString();
    return `<div class="p-4 font-poppins">
        <div class="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20 mb-3">
            <div>
                <p class="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Valor Referencial Estimado (V.R.N.)</p>
                <p class="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5">US$ ${valorFmt} <span class="text-xs font-medium text-slate-400">Dólares</span></p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-md">
                <i class="fas fa-tag"></i>
            </div>
        </div>
    </div>`;
}
