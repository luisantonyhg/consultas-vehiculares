import { setCardWaiting, setCardComingSoon, setCardData, setCardLoading } from '../utils/renderers.js';

        export function renderResultsSkeleton(plate: string, whatsappNumber: string, fromCache: boolean = false) {
            const cleanPlate = (plate || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
            const formattedPlate = cleanPlate.length === 6 ? `${cleanPlate.slice(0, 3)}-${cleanPlate.slice(3)}` : (plate || '---');
            const rc = document.getElementById('results-container')!;
            rc.className = 'w-full bg-transparent p-0 shadow-none border-0 text-left text-slate-900 dark:text-white';
            rc.innerHTML = `
                <div class="flex flex-col items-center justify-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800 font-poppins w-full text-center">
                    <p class="text-[10px] md:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Placa consultada</p>

                    <!-- Marco de Placa Peruana Centrado -->
                    <div class="loader-license-plate relative w-full max-w-[210px] sm:max-w-[240px] overflow-hidden rounded-xl shadow-md border border-slate-200 dark:border-slate-700 mx-auto my-1">
                        <img src="/assets/PERU-PLACA-REGULAR.png" alt="Placa vehicular peruana" class="block h-auto w-full" />
                        <div class="absolute left-[4.5%] right-[4.5%] top-[27%] bottom-[11%] flex items-center justify-center bg-white">
                            <span class="font-archivo whitespace-nowrap text-[clamp(1.85rem,6vw,2.55rem)] font-black leading-none tracking-[-.06em] text-black">${formattedPlate}</span>
                        </div>
                        <div class="absolute right-[4.5%] top-[9%] flex h-[16%] min-w-[18%] items-center justify-center rounded-sm bg-slate-200 px-1">
                            <span class="text-[8px] sm:text-[9px] font-black tracking-tight text-slate-600">${formattedPlate}</span>
                        </div>
                    </div>

                    <!-- Botones de Acción Centrados -->
                    <div class="flex items-center justify-center gap-2.5 mt-3 flex-wrap">
                        <button onclick="window.refreshPlateData('${plate}')"
                                class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all duration-200 active:scale-95 shadow-sm shrink-0 border border-slate-200/80 dark:border-slate-700 cursor-pointer"
                                title="Actualizar datos desde las fuentes oficiales">
                            <i class="fas fa-rotate"></i> Actualizar
                        </button>
                        <button onclick="window.imprimirReporte('${plate}')"
                                class="no-print inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-all duration-200 active:scale-95 shadow-sm shrink-0 border border-slate-700 cursor-pointer"
                                title="Descargar / imprimir reporte en PDF">
                            <i class="fas fa-file-arrow-down text-sm"></i> Descargar PDF
                        </button>
                    </div>
                </div>
                <div id="results-cards-wrapper" data-plate="${plate}" class="flex flex-col gap-3 md:gap-4 w-full">
                    <!-- 1. SUNARP Información Registral -->
                    <div id="sunarp-card-container" data-status="${fromCache ? 'funciona' : 'loading'}"></div>
                    <!-- 2. Historial de Dueños y Gravámenes (SUNARP SPRL) -->
                    <div id="historial_dueños-card-container" data-status="${fromCache ? 'funciona' : 'loading'}"></div>
                    <!-- 3. Registro Vehicular AAP -->
                    <div id="placas_pe-card-container" data-status="${fromCache ? 'funciona' : 'loading'}"></div>
                    <!-- 4. Pólizas, Inspecciones Técnicas y Habilitaciones -->
                    <div id="soat-card-container" data-status="${fromCache ? 'funciona' : 'loading'}"></div>
                    <div id="soat_detallado-card-container" data-status="${fromCache ? 'funciona' : 'loading'}"></div>
                    <div id="citv-card-container" data-status="${fromCache ? 'funciona' : 'loading'}"></div>
                    <div id="atu-card-container" data-status="${fromCache ? 'funciona' : 'waiting'}"></div>
                    <div id="valor_venal-card-container" data-status="${fromCache ? 'funciona' : 'loading'}"></div>
                    <div id="sbs-card-container" data-status="${fromCache ? 'funciona' : 'loading'}"></div>
                    <!-- 5. Papeletas de Tránsito -->
                    <div id="lima-card-container" data-status="${fromCache ? 'funciona' : 'loading'}"></div>
                    <div id="callao-card-container" data-status="${fromCache ? 'funciona' : 'loading'}"></div>
                    <div id="sutran-card-container" data-status="${fromCache ? 'funciona' : 'loading'}"></div>
                    <div id="cinemometro-card-container" data-status="${fromCache ? 'funciona' : 'loading'}"></div>
                    <div id="municipal-card-container" data-status="${fromCache ? 'funciona' : 'loading'}"></div>
                    <div id="atu_infracciones-card-container" data-status="${fromCache ? 'funciona' : 'loading'}"></div>
                    <div id="sigm-card-container" data-status="${fromCache ? 'funciona' : 'waiting'}"></div>
                    <!-- 6. Seguridad y Combustible -->
                    <div id="gnv-card-container" data-status="${fromCache ? 'funciona' : 'loading'}"></div>
                    <div id="fise-card-container" data-status="${fromCache ? 'funciona' : 'loading'}"></div>
                    <div id="osinergmin-card-container" data-status="${fromCache ? 'funciona' : 'loading'}"></div>
                    <div id="sat_captura-card-container" data-status="${fromCache ? 'funciona' : 'loading'}"></div>
                    <div id="sat_deposito-card-container" data-status="${fromCache ? 'funciona' : 'loading'}"></div>
                    <div id="lunas-card-container" data-status="${fromCache ? 'funciona' : 'loading'}"></div>
                    <div id="pnp_contacto-card-container" data-status="funciona"></div>

                    <!-- 7. ANÁLISIS INTELIGENTE DEL VEHÍCULO (Evaluación integral de todas las secciones) -->
                    <div id="score-card-container" data-status="${fromCache ? 'funciona' : 'waiting'}"></div>

                    <!-- 8. Secciones en desarrollo / informativas -->
                    <div id="sat_deuda-card-container" data-status="development"></div>
                </div>
                <div class="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 font-poppins">
                    <i class="fas fa-circle-info text-slate-300 dark:text-slate-600 text-xs"></i>
                    <p class="text-[11px] text-slate-400 dark:text-slate-500">Datos obtenidos en tiempo real · Última consulta: <strong class="text-slate-600 dark:text-slate-400 font-poppins">${plate}</strong> · <span id="last-query-time"></span></p>
                </div>`;
            
            setCardWaiting(
                'atu',
                '¿Está inscrito como taxi en ATU?',
                'Autorización vehicular por placa · Lima y Callao',
                'fas fa-taxi',
                '',
                'ATU',
                'En espera (Fase avanzada)'
            );
            // Secciones futuras: visibles, sin solicitudes al backend y siempre al final.
            setCardComingSoon(
                'sat_deuda',
                'Deuda Imp. Vehicular (SAT)',
                'Impuesto Vehicular',
                'fas fa-file-invoice-dollar',
                'SAT Lima',
                'Esta verificación estará disponible próximamente. Actualmente no se ejecuta para proteger la velocidad y estabilidad de las demás consultas.'
            );
            const contactText = encodeURIComponent(`Hola, solicito validar si el vehículo de placa ${plate} tiene una requisitoria vehicular policial vigente en 2026.`);
            const contactHref = `https://wa.me/${whatsappNumber}?text=${contactText}`;
            setCardData('pnp_contacto', 'Requisitoria Vehicular Policiales PNP', 'Validación policial vigente 2026', 'fab fa-whatsapp', '', 'Fuente policial cerrada',
                `<div class="rounded-2xl border-2 border-rose-500 bg-rose-50/60 p-5 text-center font-poppins"><div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-600 text-2xl text-white shadow-md"><i class="fas fa-shield-halved"></i></div><h4 class="mt-3 text-sm font-black text-rose-900">Validación de requisitoria vehicular</h4><p class="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-slate-700">Si deseas saber si el vehículo de placa <strong>${plate}</strong> tiene una requisitoria vehicular policial vigente en 2026, escríbenos para asesorarte y apoyarte con la información correspondiente. Esta información proviene de una fuente cerrada.</p><a href="${contactHref}" target="_blank" rel="noopener noreferrer" class="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-[#128C7E]"><i class="fab fa-whatsapp text-base"></i> Solicitar validación</a></div>`,
                true, false, `<span class="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2.5 py-1 text-[10px] font-bold uppercase text-white"><i class="fas fa-lock"></i> FUENTE CERRADA</span>`);

            if (!fromCache) {
                setCardLoading('sunarp', 'Información Registro SUNARP', 'Superintendencia de los Registros Públicos', 'fas fa-file-contract', '', 'SUNARP');
                setCardLoading('historial_dueños', 'Historial de Dueños y Gravámenes', 'Trazabilidad registral', 'fas fa-clock-rotate-left', '', 'SUNARP / Registral');
                
                // Mostrar inmediatamente las secciones iniciales
                setCardLoading('soat', 'SOAT', '', 'fas fa-shield-halved', '', 'APESEG');
                setCardLoading('soat_detallado', 'SOAT APESEG Detallado', 'Historial de certificados y siniestros', 'fas fa-clock-rotate-left', '', 'APESEG');
                setCardLoading('citv', 'Inspección Técnica Vehicular', '', 'fas fa-clipboard-check', '', 'MTC');
                setCardLoading('gnv', 'Gas Natural Vehicular (GNV)', '', 'fas fa-fire-flame-curved', '', 'Infogas');
                setCardLoading('fise', 'Deuda GNV (FISE Ahorro GNV)', 'Programa Ahorro GNV - MINEM', 'fas fa-gas-pump', '', 'FISE MINEM');
                setCardLoading('callao', 'Papeletas Callao', '', 'fas fa-ticket', '', 'Mun. Callao');
                setCardLoading('sutran', 'Papeletas SUTRAN', '', 'fas fa-road', '', 'SUTRAN');
                setCardLoading('cinemometro', 'Cinemómetro SUTRAN', 'Papeletas de velocidad', 'fas fa-gauge-high', '', 'SUTRAN');
                setCardLoading('municipal', 'Papeletas Otras Municipalidades', 'Provincias del Perú', 'fas fa-building-columns', '', 'Municipalidades');
                setCardLoading('atu_infracciones', 'Papeletas e Infracciones ATU', 'Actas de fiscalización oficial · Lima y Callao', 'fas fa-receipt', '', 'ATU');
                setCardLoading('placas_pe', 'Registro Vehicular AAP', 'Estado de Placa', 'fas fa-car', '', 'AAP');
                setCardLoading('valor_venal', 'Valor Comercial Referencial', 'APESEG', 'fas fa-tag', '', 'APESEG');
                setCardLoading('osinergmin', 'Registro Oficial de Tanque / Hidrocarburos', 'OSINERGMIN', 'fas fa-gas-pump', '', 'OSINERGMIN');
                setCardWaiting('sigm', 'Vehículo Prendado · Garantías Mobiliarias SUNARP', 'Consulta gratuita por bien', 'fas fa-file-shield', '', 'SIGM SUNARP', 'En espera (Fase avanzada)');
                setCardWaiting('score', 'ANÁLISIS INTELIGENTE DEL VEHÍCULO', 'Diagnóstico Integral y Confianza', 'fas fa-gauge-high', '', 'Cañita', 'Consolidando fuentes');

                setCardWaiting('sbs', 'Siniestralidad Vehicular', 'SOAT · Vehicular · CAT', 'fas fa-car-burst', '', 'SBS', 'En espera (Turno 1)');
                setCardWaiting('lima', 'Papeletas Lima (SAT)', 'reCAPTCHA v2', 'fas fa-traffic-light', '', 'SAT Lima', 'En espera (Turno 2)');
                setCardWaiting('lunas', 'Lunas Oscurecidas', 'Captcha PNP', 'fas fa-eye-slash', '', 'PNP', 'En espera (Turno 3)');
                setCardWaiting('sat_captura', 'Orden de Captura (SAT)', 'Provincia de Lima', 'fas fa-gavel', '', 'SAT Lima', 'En espera (Turno final)');
                setCardWaiting('sat_deposito', 'Internamiento en Depósito (SAT)', '', 'fas fa-warehouse', '', 'SAT Lima', 'En espera (Turno final)');

                const lastQueryTimeEl = document.getElementById('last-query-time');
                if (lastQueryTimeEl) {
                    lastQueryTimeEl.textContent = new Date().toLocaleString('es-PE');
                }
            }
        }
