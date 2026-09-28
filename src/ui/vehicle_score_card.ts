import { calculateVehicleScore, buildConsolidatedPayload } from '../services/vehicle_score.js';
import { setCardData } from '../utils/renderers.js';

        export function renderVehicleScoreCard(plate: string, sectionResults: Record<string, any>) {
            const payload = buildConsolidatedPayload(plate, sectionResults);
            const { score, coveragePercent, alerts, verified, totalSources, criticalCount, highCount, mediumCount, totalPapeletas, totalDeductions } = calculateVehicleScore(payload);
            const tone = score >= 80
                ? { bg: 'bg-emerald-500', soft: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900', text: 'text-emerald-700 dark:text-emerald-400', label: 'Excelente condición global', icon: 'fa-circle-check' }
                : score >= 50
                    ? { bg: 'bg-amber-500', soft: 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900', text: 'text-amber-700 dark:text-amber-400', label: 'Requiere revisión puntual', icon: 'fa-triangle-exclamation' }
                    : { bg: 'bg-rose-600', soft: 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900', text: 'text-rose-700 dark:text-rose-400', label: 'Riesgo / Alertas críticas', icon: 'fa-circle-xmark' };

            const categoryBadge = (cat: string) => {
                if (cat === 'CRÍTICO') return '<span class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">CRÍTICO</span>';
                if (cat === 'ALTO') return '<span class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400">ALTO</span>';
                if (cat === 'MEDIO') return '<span class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">MEDIO</span>';
                return '<span class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">INFORMATIVO</span>';
            };

            const alertHtml = alerts.length
                ? alerts.map(item => `<li class="flex items-center justify-between gap-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 px-3 py-2 text-xs"><div class="flex items-center gap-2">${categoryBadge(item.category)}<span>${item.label}</span></div><strong class="text-rose-600 dark:text-rose-400 font-mono">-${item.points} pts</strong></li>`).join('')
                : '<li class="rounded-lg bg-white dark:bg-slate-900 border border-emerald-200/70 dark:border-emerald-900 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300"><i class="fas fa-circle-check mr-2"></i>Sin observaciones detectadas en todas las fuentes evaluadas.</li>';

            // Resumen ejecutivo de hallazgos
            const summaryParts = [];
            if (criticalCount > 0) summaryParts.push(`<strong class="text-rose-600 dark:text-rose-400">${criticalCount} crítico(s)</strong>`);
            if (highCount > 0) summaryParts.push(`<strong class="text-orange-600 dark:text-orange-400">${highCount} alto(s)</strong>`);
            if (mediumCount > 0) summaryParts.push(`<strong class="text-amber-600 dark:text-amber-400">${mediumCount} medio(s)</strong>`);
            if (totalPapeletas > 0) summaryParts.push(`<strong class="text-slate-700 dark:text-slate-300">${totalPapeletas} papeleta(s)</strong>`);
            const summaryHtml = summaryParts.length > 0 ? summaryParts.join(', ') : 'Sin alertas';

            const content = `<div class="rounded-2xl border p-4 font-poppins ${tone.soft}"><div class="grid items-center gap-4 sm:grid-cols-[150px_1fr]"><div class="mx-auto flex h-32 w-32 flex-col items-center justify-center rounded-full border-[10px] border-white dark:border-slate-800 shadow-lg ${tone.bg} text-white"><strong class="text-4xl font-black leading-none">${score}%</strong><span class="mt-1 text-[10px] font-black uppercase tracking-widest">Salud Vehicular</span></div><div><span class="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-900 px-3 py-1 text-[10px] font-black uppercase shadow-xs ${tone.text}"><i class="fas ${tone.icon}"></i>${tone.label}</span><h4 class="mt-3 text-lg font-black text-slate-900 dark:text-white">Diagnóstico Integral para ${plate}</h4><p class="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">Evaluación consolidada en tiempo real: <strong>${verified} de ${totalSources}</strong> fuentes verificadas con éxito (${coveragePercent}% de cobertura). Hallazgos: ${summaryHtml}. Deducción total: -${totalDeductions} pts.</p></div></div><ul class="mt-4 grid gap-2 sm:grid-cols-2">${alertHtml}</ul><p class="mt-3 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400"><strong>Nota de peritaje:</strong> la salud administrativa del vehículo evalúa SOAT, CITV, lunas, SAT (captura/depósito), SUNARP (gravámenes/grantías/transferencias), SBS (siniestros), FISE (deuda GNV), GNV, OSINERGMIN, papeletas (Lima/Callao/SUTRAN/Cinemómetro/Municipal), habilitación ATU y valor venal. Las fuentes no disponibles no penalizan el score.</p></div>`;
            const badge = `<span class="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-black uppercase text-white ${tone.bg}"><i class="fas ${tone.icon}"></i> ${score}% SALUD</span>`;
            setCardData('score', 'ANÁLISIS INTELIGENTE DEL VEHÍCULO', 'Evaluación consolidada y porcentaje de salud integral', 'fas fa-brain-circuit', '', 'Cañita AI', content, true, alerts.length > 0, badge);
        }
