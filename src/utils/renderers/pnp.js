/**
 * Renderizador para Requisitorias Policiales PNP e Historial de Dueños y Gravámenes
 */
import { fila } from '../renderers.js';

export function renderPNPRequisitorias(data, plate) {
    const tieneCaptura = !!(data && data.tiene_captura);
    const mensaje = (data && data.mensaje) ? data.mensaje : (tieneCaptura ? 'REGISTRA CAPTURA VEHICULAR' : 'NO TIENE CAPTURA VEHICULAR.');
    const detalles = (data && Array.isArray(data.detalles)) ? data.detalles : [];
    const placaFmt = (data && data.placa) || plate || '';

    if (tieneCaptura) {
        return `
        <div class="font-poppins space-y-3">
            <!-- Banner Alerta de Captura -->
            <div class="rounded-xl border border-rose-500/40 bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent p-4 sm:p-5">
                <div class="flex items-center gap-3.5">
                    <div class="w-11 h-11 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-500 text-2xl shadow-sm">
                        <i class="fas fa-triangle-exclamation"></i>
                    </div>
                    <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-center gap-2">
                            <h4 class="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                                ORDEN DE CAPTURA POLICIAL VIGENTE
                            </h4>
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white uppercase tracking-wider">
                                ALERTA PNP
                            </span>
                        </div>
                        <p class="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                            El vehículo con placa <strong class="font-mono text-slate-900 dark:text-white font-bold">${placaFmt}</strong> presenta requisitoria activa en la Dirección de Tránsito de la Policía Nacional del Perú.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Tabla de Órdenes si existen -->
            ${detalles.length > 0 ? `
            <div class="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                <div class="px-4 py-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <span class="font-bold text-slate-700 dark:text-slate-200">Detalles de la Orden Judicial / Policial</span>
                    <span class="text-[11px] font-mono text-rose-500 font-bold">${detalles.length} registro(s)</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs bg-white dark:bg-slate-900">
                        <thead class="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                ${Object.keys(detalles[0]).map(k => `<th class="px-3.5 py-2 font-semibold uppercase tracking-wider text-[11px]">${k}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                            ${detalles.map(row => `
                                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                    ${Object.values(row).map(val => `<td class="px-3.5 py-2.5 text-slate-700 dark:text-slate-200">${val || '-'}</td>`).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            ` : ''}

            <!-- Pie de Verificación -->
            <div class="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span class="inline-flex items-center gap-1.5">
                    <i class="fas fa-shield-halved text-rose-500"></i> Fuente: Sistema de Consulta de Captura PVR - PNP
                </span>
                <span class="font-mono text-slate-400">Verificado en tiempo real</span>
            </div>
        </div>
        `;
    }

    // Caso Negativo: Sin Requisitoria (Diseño unificado y elegante)
    return `
    <div class="font-poppins">
        <div class="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-4 sm:p-5 shadow-sm">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div class="flex items-center gap-3.5">
                    <div class="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-500 text-2xl shadow-sm">
                        <i class="fas fa-shield-check"></i>
                    </div>
                    <div>
                        <div class="flex flex-wrap items-center gap-2">
                            <h4 class="text-sm font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                                NO TIENE CAPTURA VEHICULAR
                            </h4>
                            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider">
                                <i class="fas fa-check text-[9px]"></i> Limpio
                            </span>
                        </div>
                        <p class="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                            No registra órdenes de captura policial ni requisitorias vigentes en el sistema oficial de la PNP para la placa <strong class="font-mono text-slate-900 dark:text-white">${placaFmt}</strong>.
                        </p>
                    </div>
                </div>
            </div>

            <div class="mt-4 pt-3 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span class="inline-flex items-center gap-1.5 font-medium">
                    <i class="fas fa-building-shield text-emerald-500"></i> Policía Nacional del Perú · Dirección de Tránsito
                </span>
                <span class="font-mono text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                    Consulta en tiempo real
                </span>
            </div>
        </div>
    </div>
    `;
}

/**
 * Renderizador para Historial de Dueño y Gravámenes (En desarrollo pronto)
 */
export function renderHistorialDueños(plate) {
    return `
    <div class="font-poppins">
        <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-4 sm:p-5">
            <div class="flex flex-col sm:flex-row items-center sm:items-start gap-3.5 text-center sm:text-left">
                <div class="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-500 text-xl">
                    <i class="fas fa-clock-rotate-left"></i>
                </div>
                <div class="space-y-1 min-w-0 flex-1">
                    <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                            Historial de Propietarios y Gravámenes
                        </h4>
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30 uppercase">
                            <i class="fas fa-wrench text-[8px]"></i> Próximamente
                        </span>
                    </div>
                    <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Este módulo integrará la trazabilidad cronológica de transferencias registrales, gravámenes y prendas vehiculares ante SUNARP.
                    </p>
                </div>
            </div>
        </div>
    </div>
    `;
}
