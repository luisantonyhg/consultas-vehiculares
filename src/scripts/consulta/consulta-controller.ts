        import { setupSectionExport } from '../../ui/section_export';
        import { renderResultsSkeleton } from '../../ui/vehicle_results.ts';
        import { renderVehicleScoreCard } from '../../ui/vehicle_score_card.ts';
        import { setupDocumentViewer } from '../../ui/document_viewer.ts';
        import { createResultCache } from '../../services/result_cache.ts';
        import {
            LOGO_MAPPING,
            SOURCE_URLS,
            SERVICE_COLORS,
            getFormattedTimestamp,
            parseDateDDMMYYYY,
            fila,
            estadoBadge,
            cardHeaderAccordion,
            skeletonBody,
            reorderCards,
            setCardLoading,
            setCardWaiting,
            setCardDevelopment,
            setCardComingSoon,
            setCardMaintenance,
            setCardData,
            setCardError,
            renderSOAT,
            renderCITV,
            renderLunas,
            renderCallao,
            renderLima,
            renderSutran,
            renderAtu,
            renderGNV,
            renderSBS,
            renderSunarp,
            renderVehicleInfoCard
        } from '../../utils/renderers.js';

        import {
            runFetchSOAT,
            runFetchSOATDetallado,
            runFetchCITV,
            runFetchLunas,
            runFetchCallao,
            runFetchSutran,
            runFetchCinemometro,
            runFetchGNV,
            runFetchATU,
            runFetchAtuInfracciones,
            runFetchSBS,
            runFetchSUNARP,
            runFetchSAT,
            runFetchSATCaptura,
            runFetchSATDeposito,
            runFetchMunicipal,
            runFetchFISE,
            runFetchSIGM,
            runFetchPlacasPE,
            runFetchValorVenal,
            fillValorVenalSoles,
            runFetchOsinergmin,
            runFetchLima,
            runFetchHistorialDuenos,
            // Requisitorias PNP permanece implementado en services/api.js,
            // pero no se importa mientras la sección esté retirada.
            acquireConsultationSlot,
            waitForConsultationSlot,
            touchConsultationSlot,
            waitForHeavyPhase,
            releaseHeavyPhase,
            releaseConsultationSlot,
            createConsultationId,
            setConsultationId,
            setConsultationTicket,
            setManualRetrySection
        } from '../../services/api.js';
        import { initVisits } from '../../ui/visits.js';
        import { setupCaptcha } from '../../ui/captcha.js';
        import { setupSatTicketModal } from '../../ui/sat_ticket_modal.js';
        import { setupAtuActaModal } from '../../ui/atu_acta_modal.js';
        import { resolveVehicleReference } from '../../services/vehicle_reference.js';
        import { ADVANCED_EXECUTION_ORDER, ENABLED_EXECUTION_ORDER, buildAdvancedNodes, fetchExecutionPlan, resolveExecutionLimits } from '../../services/execution_plan.js';
        import { runOrderedWithConcurrency, runSectionsWithDependencies } from '../../services/execution_scheduler.js';
        import { shouldAutoRetry } from '../../services/sat_retry_policy.js';
        import { initDniConsultation } from '../../scripts/dni/dni-controller.ts';

        // ====================================================
        // CONFIG
        // ====================================================
        // En local usa localhost; en producción (Vercel HTTPS) usa el hostname HTTPS del VPS.
        // Esto evita "mixed content" (una página HTTPS NO puede llamar a un backend HTTP).
        const BACKEND_URL = import.meta.env.PUBLIC_BACKEND_URL || (
            (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
                ? 'http://localhost:8000/api/v1'
                : 'https://backend-consultarvehiculos-production.up.railway.app/api/v1'
        );
        const WHATSAPP_NUMBER = String(import.meta.env.PUBLIC_WHATSAPP_NUMBER || '51928701061').replace(/\D/g, '') || '51928701061';
        /* Modal de Novedades y Actualizaciones (Desactivado/Comentado)
        const updatesModal = document.getElementById('updates-modal');
        const closeUpdatesModal = () => {
            updatesModal?.classList.add('hidden');
            updatesModal?.classList.remove('flex');
            document.body.style.overflow = '';
            try { sessionStorage.setItem('canita_updates_2026_09', 'seen'); } catch {}
        };
        if (updatesModal) {
            try {
                if (!sessionStorage.getItem('canita_updates_2026_09')) {
                    updatesModal.classList.remove('hidden');
                    updatesModal.classList.add('flex');
                    document.body.style.overflow = 'hidden';
                }
            } catch {}
            document.getElementById('updates-modal-close')?.addEventListener('click', closeUpdatesModal);
            document.getElementById('updates-modal-accept')?.addEventListener('click', closeUpdatesModal);
            updatesModal.addEventListener('click', (event) => { if (event.target === updatesModal) closeUpdatesModal(); });
        }
        */
        let activeConsultationTicket: string | null = null;
        // ====================================================================================
  // GESTIÓN DE TICKETS Y PERSISTENCIA DE SESIÓN PARA REINTENTOS (ZERO 422 POLICY)
  // ====================================================================================
  // - activeConsultationTicket: Ticket activo durante la ejecución concurrente inicial.
  // - completedConsultationTicket: Al liberarse la consulta, el ticket se preserva aquí en
  //   lugar de borrarse. Esto permite que los reintentos manuales de tarjetas individuales
  //   (SBS, SAT, SUTRAN, etc.) utilicen la ventana de gracia de 15 min del backend sin
  //   disparar un error 422 (Turnstile token consumido).
  // ====================================================================================
  let completedConsultationTicket: string | null = null;
        let consultationHeartbeat: ReturnType<typeof setInterval> | null = null;
        let consultationGeneration = 0;
        let consultationLifecycle: 'idle' | 'active' | 'completed' | 'cancelled' | 'superseded' = 'idle';

        // Liberación best-effort si el usuario cierra o abandona la página. Si
        // el navegador no alcanza a enviarla, el lease expira en el backend.
        window.addEventListener('pagehide', () => {
            consultationLifecycle = 'cancelled';
            if (activeConsultationTicket) {
                void releaseConsultationSlot(BACKEND_URL, activeConsultationTicket, true);
            }
        });

        initVisits(
            BACKEND_URL,
            import.meta.env.PUBLIC_CLIENT_SECRET || ''
        );

        // ====================================================
        // MODAL SAT LIMA - VISUALIZADOR DE COPIA DE PAPELETA
        // ====================================================
        setupSatTicketModal(BACKEND_URL);

        // ====================================================
        // MODAL ATU - VISUALIZADOR DE ACTA DE FISCALIZACIÓN
        // ====================================================
        setupAtuActaModal(BACKEND_URL);

        // ====================================================
        // CAPTCHA DE SEGURIDAD
        // ====================================================
        const captcha = setupCaptcha(BACKEND_URL, import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || '');
        const drawCaptcha = captcha.refresh;

        // ====================================================
        // FORMATO DE PLACA Y REPLICACIÓN EN MINI HOLOGRAMA
        // ====================================================
        const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
        const plateInput = document.getElementById('plate-search-input') as HTMLInputElement;
        const plateMini = document.getElementById('plate-search-mini');

        function updateSubmitButtonState() {
            if (!submitBtn || isSubmitting) return;
            const mode = getCurrentSearchMode();
            const hasTurnstile = Boolean((window as any).__canitaTurnstileToken);
            let isComplete = false;

            if (mode === 'placa') {
                const clean = (plateInput?.value || '').replace(/[^A-Za-z0-9]/g, '');
                isComplete = clean.length === 6;
            } else {
                const dniInp = document.getElementById('dni-search-input') as HTMLInputElement | null;
                const clean = (dniInp?.value || '').replace(/\D/g, '');
                isComplete = clean.length === 8;
            }

            if (isComplete && hasTurnstile) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
            } else {
                submitBtn.disabled = true;
                submitBtn.classList.add('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
            }
        }
        if (plateInput) {
            plateInput.addEventListener('input', () => {
                // Se aceptan exactamente 6 caracteres alfanuméricos. El guion
                // es únicamente visual y no cuenta como carácter de la placa.
                const cleanVal = plateInput.value
                    .replace(/[^A-Za-z0-9]/g, '')
                    .toUpperCase()
                    .slice(0, 6);
                const twoLetterPlate = /^[A-Za-z]{2}\d{4}$/.test(cleanVal);
                const letterDigitPlate = /^[A-Za-z]\d{5}$/.test(cleanVal);
                const splitAt = twoLetterPlate || letterDigitPlate ? 2 : 3;
                const formatted = cleanVal.length > splitAt
                    ? `${cleanVal.slice(0, splitAt)}-${cleanVal.slice(splitAt)}`
                    : cleanVal;
                plateInput.value = formatted;
                if (plateMini) {
                    plateMini.textContent = formatted || 'ABC-123';
                }
            });
        }

        const { dniInput, setSearchMode, triggerDniConsultation, getCurrentSearchMode } = initDniConsultation(plateInput);

        if (plateInput) {
            plateInput.addEventListener('input', () => {
                updateSubmitButtonState();
            });
        }
        if (dniInput) {
            dniInput.addEventListener('input', () => {
                updateSubmitButtonState();
            });
        }
        window.addEventListener('turnstile-token-changed', () => {
            updateSubmitButtonState();
        });
        document.getElementById('tab-mode-placa')?.addEventListener('click', () => {
            setTimeout(updateSubmitButtonState, 50);
        });
        document.getElementById('tab-mode-dni')?.addEventListener('click', () => {
            setTimeout(updateSubmitButtonState, 50);
        });

        // Compatibilidad con enlaces anteriores: se conserva el modo o placa inicial,
        // pero la vista queda en la única URL canónica sin recargar la página.
        const urlParams = new URLSearchParams(window.location.search);
        const initialMode = urlParams.get('mode');
        const initialPlaca = urlParams.get('placa');
        const pendingDni = sessionStorage.getItem('canita_pending_dni');
        if (window.location.search && window.history.replaceState) {
            window.history.replaceState(window.history.state, '', '/consulta');
        }

        if (initialMode === 'dni' || pendingDni) {
            setSearchMode('dni');
            if (pendingDni && dniInput) {
                dniInput.value = pendingDni;
                sessionStorage.removeItem('canita_pending_dni');
                triggerDniConsultation(pendingDni);
            }
        } else {
            setSearchMode('placa');
            if (initialPlaca && plateInput) {
                plateInput.value = initialPlaca;
                plateInput.dispatchEvent(new Event('input'));
            }
        }


        // ====================================================
        // VEHICLE DATA ACCUMULATION
        // ====================================================
        let vehicleData: Record<string, any> = {};
        let sectionResults: Record<string, any> = {};
        let activeScorePlate = '';
        let queryAttempts: Record<string, number> = {};
        let currentSunarpValidation: 'found' | 'not_found' | 'indeterminate' = 'indeterminate';

        function processVehicleInfo(cardId: string, data: any) {
            if (!data) return;
            let updated = false;

            const isValEmpty = (val: any) => {
                if (val === undefined || val === null) return true;
                const clean = String(val).trim().toUpperCase();
                return clean === '' || clean === '—' || clean === 'N/A' || clean === 'NULL' || clean === 'UNDEFINED';
            };

            const setIfBetter = (key: string, val: any) => {
                if (val !== undefined && val !== null && String(val).trim() !== '') {
                    const currentVal = vehicleData[key];
                    if (isValEmpty(currentVal) && !isValEmpty(val)) {
                        vehicleData[key] = String(val).trim();
                        return true;
                    }
                }
                return false;
            };

            if (cardId === 'soat' && Array.isArray(data) && data.length > 0) {
                const cert = data[0];
                if (setIfBetter('marca', cert.Marca)) updated = true;
                if (setIfBetter('modelo', cert.ModeloVehiculo)) updated = true;
                if (setIfBetter('categoria', cert.NombreClaseVehiculo)) updated = true;
                if (setIfBetter('uso', cert.NombreUsoVehiculo)) updated = true;
            }

            if (cardId === 'citv' && Array.isArray(data) && data.length > 0) {
                const cert = data[0];
                if (setIfBetter('marca', cert.marca)) updated = true;
                if (setIfBetter('modelo', cert.modelo)) updated = true;
                if (setIfBetter('categoria', cert.clase)) updated = true;
                if (setIfBetter('anio', cert.anio)) updated = true;
            }

            if (cardId === 'atu' && data) {
                if (data.fuenteDato !== 'NOREGISTRADO') {
                    if (setIfBetter('marca', data.marcaSunarp)) updated = true;
                    if (setIfBetter('modelo', data.modeloSunarp)) updated = true;
                    if (setIfBetter('color', data.color)) updated = true;
                    if (setIfBetter('serie', data.serie)) updated = true;
                    if (setIfBetter('motor', data.motor)) updated = true;
                    if (setIfBetter('propietario', data.propietario)) updated = true;
                } else {
                    if (setIfBetter('marca', data.marcaSunarp)) updated = true;
                    if (setIfBetter('modelo', data.modeloSunarp)) updated = true;
                    if (setIfBetter('color', data.color)) updated = true;
                    if (setIfBetter('serie', data.serie)) updated = true;
                    if (setIfBetter('motor', data.motor)) updated = true;
                }
            }

            if (cardId === 'sunarp' && data) {
                if (setIfBetter('marca', data.Marca || data.marca)) updated = true;
                if (setIfBetter('modelo', data.Modelo || data.modelo)) updated = true;
                if (setIfBetter('color', data.Color || data.color)) updated = true;
                if (setIfBetter('anio', data['Año Modelo'] || data.anio_modelo || data.Año || data['Año Fabricación'] || data.anio)) updated = true;
                if (setIfBetter('propietario', data.Propietarios || data.propietarios || data.Titular || data.Propietario || data.propietario)) updated = true;
                if (setIfBetter('sede', data.Sede || data.sede)) updated = true;
            }

            if (cardId === 'soat_detallado' && data) {
                const certs = Array.isArray(data) ? data : (data.certificados || data.data?.certificados || []);
                if (certs.length > 0) {
                    const cert = certs[0];
                    if (setIfBetter('marca', cert.Marca || cert.marca)) updated = true;
                    if (setIfBetter('modelo', cert.ModeloVehiculo || cert.Modelo || cert.modelo)) updated = true;
                    if (setIfBetter('categoria', cert.NombreClaseVehiculo || cert.Clase || cert.clase)) updated = true;
                    if (setIfBetter('uso', cert.NombreUsoVehiculo || cert.Uso || cert.uso)) updated = true;
                    if (setIfBetter('anio', cert.AnioFabricacion || cert.AñoFabricacion || cert.anio)) updated = true;
                }
            }

            if (cardId === 'placas_pe' && data) {
                if (setIfBetter('marca', data.marca)) updated = true;
                if (setIfBetter('modelo', data.modelo)) updated = true;
                if (setIfBetter('serie', data.serie)) updated = true;
                if (setIfBetter('propietario', data.propietario)) updated = true;
                if (setIfBetter('uso', data.tipoUso)) updated = true;
            }

            // Si valor_venal quedó en estado 'requiere marca/modelo' pero una sección posterior
            // (SOAT Detallado, CITV, etc.) obtuvo la marca y modelo oficiales, re-ejecutar valor_venal automáticamente
            if (updated && vehicleData.marca && vehicleData.modelo) {
                const vvCard = sectionResults.valor_venal;
                if (vvCard && (vvCard.sinDatos || !vvCard.success) && activeScorePlate) {
                    console.info('[VALOR-VENAL-REACTIVE] Marca y modelo confirmados tras consulta inicial; actualizando cotización APESEG...', {
                        marca: vehicleData.marca,
                        modelo: vehicleData.modelo,
                        anio: vehicleData.anio,
                    });
                    void fetchValorVenal(activeScorePlate, vehicleData.marca, vehicleData.modelo, vehicleData.anio);
                }
            }
            void updated;
        }

        // ====================================================
        // WRAPPER DE REINTENTOS PARA QUERIES
        // ====================================================
        async function runFetchWithRetry(
            cardId: string, 
            fetchCall: (callbacks: any) => Promise<any>, 
            plate: string, 
            attempt: number = 1,
            // Los servicios ya tienen reintentos internos. Repetir por defecto
            // desde el navegador multiplicaba la carga durante una saturación.
            maxAttempts: number = 1
        ): Promise<any> {
            if (attempt === 1) {
                queryAttempts[cardId] = 1;
            }

            let resolveFn: any;
            let rejectFn: any;
            const promise = new Promise((resolve, reject) => {
                resolveFn = resolve;
                rejectFn = reject;
            });
            let retryScheduled = false;
            let terminalResult: any = null;
            const retryGeneration = consultationGeneration;

            const customCallbacks = {
                setCardLoading: (id: string, title: string, sub: string, iconClass: string, bgColorClass: string, sourceName: string) => {
                    if (attempt > 1) {
                        setCardLoading(id, title, sub, iconClass, bgColorClass, `${sourceName} (Reintentando${attempt > 2 ? ' auto' : ''}...)`);
                    } else {
                        setCardLoading(id, title, sub, iconClass, bgColorClass, sourceName);
                    }
                },
                setCardData: (id: string, title: string, sub: string, iconClass: string, bgColorClass: string, sourceName: string, htmlContent: string, isSuccess: boolean, hasData: boolean, customBadge?: string) => {
                    setCardData(id, title, sub, iconClass, bgColorClass, sourceName, htmlContent, isSuccess, hasData, customBadge);
                },
                setCardError: async (id: string, title: string, sub: string, iconClass: string, bgColorClass: string, sourceName: string, errorMessage: string, plate: string, errorMeta?: any) => {
                    const retryDecision = shouldAutoRetry({ cardId, error: errorMeta || errorMessage, attempt, maxAttempts });
                    const is404Error = (errorMessage || '').includes('404') || (errorMessage || '').includes('actualización') || (errorMessage || '').includes('no encontrada');
                    const isConnError = (errorMessage || '').includes('Failed to fetch') || (errorMessage || '').includes('NetworkError') || (errorMessage || '').includes('CONNECTION_REFUSED');

                    // Solo errores 404 (sección inexistente) se eximen de reintento.
                    // Saturación del gateway y cortes de transporte sí se recuperan
                    // automáticamente con backoff, aunque el proveedor use un solo
                    // intento normal. Errores permanentes no se multiplican.
                    const normalizedError = (errorMessage || '').toLowerCase();
                    const isBackpressure = normalizedError.includes('429') ||
                        normalizedError.includes('503') ||
                        normalizedError.includes('demasiadas consultas') ||
                        normalizedError.includes('servidor ocupado') ||
                        normalizedError.includes('alta demanda');
                    const isTimeout = normalizedError.includes('tiempo de espera') ||
                        normalizedError.includes('tiempo límite') ||
                        normalizedError.includes('timeout');
                    const isPermanentProxyConfig = normalizedError.includes('configure fise_proxy') ||
                        normalizedError.includes('no permite connect al puerto 23308');
                    const errText = (errorMessage || '').toLowerCase();
                    const isMantenimiento = errText.includes('mantenimiento') ||
                        errText.includes('desarrollo') ||
                        errText.includes('no responde') ||
                        errText.includes('no disponible') ||
                        errText.includes('fuera de servicio') ||
                        errText.includes('no se pudo conectar') ||
                        errText.includes('servidor ocupado') ||
                        errText.includes('timeout') ||
                        errText.includes('502') ||
                        errText.includes('503') ||
                        errText.includes('504');
                    const retryableTimeoutProviders = new Set(['sunarp', 'lima', 'fise']);
                    const noRetry = !retryDecision.retry && retryDecision.effectiveMaxAttempts === maxAttempts;
                    if (noRetry) {
                        console.warn(`[INFO] Consulta ${cardId} finalizada sin reintento: ${errorMessage}`);
                        setCardError(id, title, sub, iconClass, bgColorClass, sourceName, errorMessage, plate);
                        // No resolver todavía: fetchCall puede estar por devolver
                        // datos hermanos válidos (SAT Captura/Depósito). Resolver
                        // aquí hacía que el scheduler perdiera ese resultado.
                        terminalResult = {
                            ...(errorMeta && typeof errorMeta === 'object' ? errorMeta : {}),
                            success: false,
                            error: errorMessage,
                        };
                        return;
                    }
                    queryAttempts[id] = attempt;
                    const effectiveMaxAttempts = retryDecision.effectiveMaxAttempts;
                    if (attempt < effectiveMaxAttempts) {
                        retryScheduled = true;
                        const requestedRetryAfter = Number(errorMeta?.retry_after_seconds || 0) * 1000;
                        const delay = requestedRetryAfter > 0
                            ? Math.min(Math.max(requestedRetryAfter, 1000), 15000)
                            : isBackpressure
                            ? Math.min(5000 * attempt, 10000)
                            : attempt === 1 ? 1500 : 3500;
                        const scheduledAt = Date.now();
                        const expectedRunAt = scheduledAt + delay;
                        const retryTicket = activeConsultationTicket;
                        console.warn(`[RETRY] Consulta ${cardId} falló (Intento ${attempt}/${effectiveMaxAttempts}): ${errorMessage}. Reintentando en ${delay / 1000}s...`);
                        setCardLoading(id, title, sub, iconClass, bgColorClass, `${sourceName} (Reintentando ${attempt + 1}/${effectiveMaxAttempts}...)`);
                        setTimeout(async () => {
                            const now = Date.now();
                            const latenessMs = Math.max(0, now - expectedRunAt);
                            const staleWindowMs = Math.max(10000, delay * 4);
                            let skipReason: string | null = null;
                            if (latenessMs > staleWindowMs) skipReason = 'stale_timer';
                            else if (retryGeneration !== consultationGeneration || retryTicket !== activeConsultationTicket) skipReason = 'consultation_changed';
                            else if (consultationLifecycle === 'completed') skipReason = 'completed';
                            else if (consultationLifecycle === 'cancelled') skipReason = 'cancelled';
                            if (skipReason) {
                                console.warn(`[RETRY-SKIP] section=${cardId} reason=${skipReason} lateness_ms=${Math.round(latenessMs)}`);
                                resolveFn({ success: false, skipped: true, reason: skipReason });
                                return;
                            }
                            try {
                                const retryResult = await runFetchWithRetry(cardId, fetchCall, plate, attempt + 1, effectiveMaxAttempts);
                                resolveFn(retryResult);
                            } catch (e) {
                                rejectFn(e);
                            }
                        }, delay);
                    } else {
                        console.error(`[FINAL] Consulta ${cardId} falló definitivamente tras ${attempt} intentos: ${errorMessage}`);
                        setCardError(id, title, sub, iconClass, bgColorClass, sourceName, errorMessage, plate);
                        terminalResult = { success: false, error: errorMessage };
                    }
                },
                processVehicleInfo: (id: string, data: any) => {
                    processVehicleInfo(id, data);
                }
            };

            try {
                const res = await fetchCall(customCallbacks);
                if (attempt > 1 && res?.success) {
                    console.info(
                        `[RECOVERY] Consulta ${cardId} recuperada correctamente ` +
                        `en intento frontend ${attempt}/${maxAttempts}`
                    );
                }
                if (!retryScheduled) resolveFn(res || terminalResult || { success: false });
            } catch (err) {
                console.error(`[CRASH] runFetchWithRetry catch error for ${cardId}:`, err);
                await customCallbacks.setCardError(
                    cardId, 
                    cardId.toUpperCase(), 
                    '', 
                    'fas fa-circle-exclamation', 
                    '', 
                    'Error', 
                    (err as any).message || 'Error inesperado', 
                    plate
                );
                if (!retryScheduled) resolveFn(terminalResult || { success: false, error: (err as any).message || 'Error inesperado' });
            }

            return promise;
        }

        async function runInBatches(
            jobs: Array<() => Promise<any>>,
            batchSize: number = 4,
            queueLabel: string = 'trabajo rápido'
        ): Promise<any[]> {
            return runOrderedWithConcurrency(jobs, batchSize, {
                onStart: async ({ index, queue_wait_ms }: { index: number; queue_wait_ms: number }) => {
                    console.info(
                        `[COLA-FRONTEND] ${queueLabel} ${index + 1}/${jobs.length} inicia tras ${Math.round(queue_wait_ms)}ms`
                    );
                    // La métrica queda en consola. Este endpoint exige una
                    // credencial administrativa y no debe llamarse desde el
                    // navegador público (evita 422 y telemetría no confiable).
                },
                onFinish: ({ index, processing_ms, status }: { index: number; processing_ms: number; status: string }) => console.info(
                    `[PROCESO-FRONTEND] ${queueLabel} ${index + 1}/${jobs.length} ${status} en ${Math.round(processing_ms)}ms`
                ),
            });
        }

        async function runSectionSafely(sectionId: string, job: () => Promise<any>): Promise<any> {
            const startedAt = performance.now();
            console.info(`[SECCION-INICIO] ${sectionId}`);
            try {
                const result = await job();
                sectionResults[sectionId] = result;
                if (activeScorePlate && sectionResults.sunarp && document.getElementById('score-card-container')) {
                    renderVehicleScore(activeScorePlate);
                    const diagnosticStatus = result?.status || result?.provider_status ||
                        (result?.outcome === 'CAPTCHA_ERROR' || result?.code === 'LUNAS_CAPTCHA_ERROR' ? 'captcha_error' :
                            result?.outcome === 'TIMEOUT' || result?.code === 'LUNAS_TIMEOUT' ? 'timeout' :
                                result?.success === false ? 'error' : 'unknown');
                    console.info('[SCORE-UPDATE]', {
                        section: sectionId,
                        success: result?.success !== false,
                        status: diagnosticStatus,
                        sources_ready: Object.values(sectionResults).filter((item: any) => item && item.success !== false).length,
                    });
                }
                console.info(`[SECCION-FIN] ${sectionId}`, {
                    processing_ms: Math.round((performance.now() - startedAt) * 10) / 10,
                    success: result?.success !== false,
                });
                return result;
            } catch (error) {
                // Una fuente externa defectuosa nunca debe impedir que las
                // secciones posteriores continúen su turno.
                console.error(`[SECCION ${sectionId}] Falló sin detener el informe:`, error);
                const failedResult = { success: false, error: (error as any)?.message || 'Error inesperado' };
                sectionResults[sectionId] = failedResult;
                console.info(`[SECCION-FIN] ${sectionId}`, {
                    processing_ms: Math.round((performance.now() - startedAt) * 10) / 10,
                    success: false,
                });
                if (activeScorePlate && sectionResults.sunarp && document.getElementById('score-card-container')) {
                    renderVehicleScore(activeScorePlate);
                    console.info('[SCORE-UPDATE]', {
                        section: sectionId,
                        success: false,
                        status: 'error',
                        sources_ready: Object.values(sectionResults).filter((item: any) => item && item.success !== false).length,
                    });
                }
                return failedResult;
            }
        }

        // ====================================================
        // MUTEX / SERIALIZADOR DE PETICIONES POR ORIGEN
        // ====================================================
        const exclusiveQueues: Record<string, Promise<any>> = {};
        // Resultado de la petición SAT combinada de la fase automática. Está
        // ligado a placa, ticket y generación; jamás se usa para un reintento
        // manual ni para una consulta posterior.
        let prefetchedSatCombined: { plate: string, ticket: string | null, generation: number, data: any } | null = null;
        async function runExclusive<T>(key: string, fn: () => Promise<T>): Promise<T> {
            const previous = exclusiveQueues[key] || Promise.resolve();
            const current = (async () => {
                try {
                    await previous;
                } catch {}
                return await fn();
            })();
            exclusiveQueues[key] = current.catch(() => {});
            return current;
        }

        function rememberSatCombined(plate: string, data: any) {
            if (!data || (!data.captura && !data.deposito)) return;
            prefetchedSatCombined = {
                plate,
                ticket: activeConsultationTicket,
                generation: consultationGeneration,
                data,
            };
        }

        function getPrefetchedSatDeposito(plate: string) {
            const cached = prefetchedSatCombined;
            if (!cached || cached.plate !== plate || cached.ticket !== activeConsultationTicket || cached.generation !== consultationGeneration) return null;
            return cached.data?.deposito?.success ? cached.data : null;
        }

        // ====================================================
        // PETICIONES INDEPENDIENTES
        // ====================================================
        async function fetchSOAT(plate: string) {
            // La ruta /soat recibe el ticket activo y abre el vuelo SBS
            // compartido; /sbs se sumará luego como follower del mismo browser.
            // SBS ya tiene su propio vuelo compartido y presupuesto. Reintentar
            // desde el navegador crea un segundo follower cuando el primero aún
            // está cerrando, prolonga el ticket y puede duplicar la presión de
            // Chromium. El usuario conserva el reintento manual independiente.
            return runFetchWithRetry('soat', (callbacks) => runFetchSOAT(plate, BACKEND_URL, callbacks), plate);
        }

        async function fetchSOATDetallado(plate: string) {
            return runFetchWithRetry('soat_detallado', (callbacks) => runFetchSOATDetallado(plate, BACKEND_URL, callbacks), plate, 1, 2);
        }

        async function fetchCITV(plate: string) {
            return runFetchWithRetry('citv', (callbacks) => runFetchCITV(plate, BACKEND_URL, callbacks), plate, 1, 2);
        }

        async function fetchLunas(plate: string, { forceRefresh = false }: { forceRefresh?: boolean } = {}) {
            return runExclusive('lunas', () =>
                // El proveedor ya agota un presupuesto interno de CAPTCHA. No
                // volver a repetirlo automáticamente desde la UI: el siguiente
                // intento debe ser consciente y manual.
                runFetchWithRetry('lunas', (callbacks) => runFetchLunas(plate, BACKEND_URL, callbacks, { forceRefresh }), plate));
        }

        async function fetchCallao(plate: string, { forceRefresh = false }: { forceRefresh?: boolean } = {}) {
            // Callao ya tiene un ciclo interno de CAPTCHA. Repetirlo desde el
            // navegador duplicaba hasta seis CAPTCHA y retenía la consulta por
            // casi dos minutos. El siguiente intento debe ser explícito del
            // usuario y forzar una llamada nueva a la fuente oficial.
            return runFetchWithRetry(
                'callao',
                (callbacks) => runFetchCallao(plate, BACKEND_URL, callbacks, { forceRefresh }),
                plate,
                1,
                1,
            );
        }

        async function fetchLima(plate: string) {
            return runExclusive('lima', () =>
                runFetchWithRetry('lima', (callbacks) => runFetchLima(plate, BACKEND_URL, callbacks), plate, 1, 2));
        }

        async function fetchSutran(plate: string) {
            return runFetchWithRetry('sutran', (callbacks) => runFetchSutran(plate, BACKEND_URL, callbacks), plate);
        }

        async function fetchCinemometro(plate: string) {
            return runFetchWithRetry('cinemometro', (callbacks) => runFetchCinemometro(plate, BACKEND_URL, callbacks), plate, 1, 2);
        }

        async function fetchMunicipal(plate: string) {
            return runFetchWithRetry('municipal', (callbacks) => runFetchMunicipal(plate, BACKEND_URL, callbacks), plate);
        }

        async function fetchFISE(plate: string) {
            // El backend ya realiza el único reintento seguro del POST usando
            // la misma sesión oficial. Repetir desde el navegador consume otro
            // CAPTCHA y puede prolongar la consulta casi un minuto.
            return runFetchWithRetry('fise', (callbacks) => runFetchFISE(plate, BACKEND_URL, callbacks), plate, 1, 1);
        }

        async function fetchSIGM(plate: string) {
            return runFetchWithRetry('sigm', (callbacks) => runFetchSIGM(plate, BACKEND_URL, callbacks), plate);
        }

        async function fetchPlacasPE(plate: string) {
            return runFetchWithRetry('placas_pe', (callbacks) => runFetchPlacasPE(plate, BACKEND_URL, callbacks), plate, 1, 2);
        }

        async function fetchValorVenal(plate: string, marca?: string, modelo?: string, anio?: string) {
            return runFetchWithRetry('valor_venal', (callbacks) => runFetchValorVenal(plate, BACKEND_URL, callbacks, marca, modelo, anio), plate);
        }

        async function fetchEstadoPlacaYValor(plate: string) {
            let d: any = {};
            try {
                const pd = await fetchPlacasPE(plate);
                d = (pd && pd.data) ? pd.data : {};
            } catch (_e) {}
            const reference = resolveVehicleReference(d, vehicleData);
            await fetchValorVenal(plate, reference.marca, reference.modelo, reference.anio);
        }

        async function fetchOsinergmin(plate: string) {
            return runFetchWithRetry('osinergmin', (callbacks) => runFetchOsinergmin(plate, BACKEND_URL, callbacks), plate);
        }

        async function fetchHistorialDuenos(plate: string, oficina: string = '') {
            // Un PARTIAL de SPRL puede costar varios minutos. No se debe iniciar
            // una segunda sesión automáticamente: dejar la tarjeta en estado
            // recuperable para que el usuario decida el reintento manual.
            return runFetchWithRetry('historial_dueños', (callbacks) => runFetchHistorialDuenos(plate, BACKEND_URL, callbacks, oficina), plate);
        }

        async function fetchGNV(plate: string) {
            return runFetchWithRetry('gnv', (callbacks) => runFetchGNV(plate, BACKEND_URL, callbacks), plate);
        }

        async function fetchATU(plate: string) {
            return runFetchWithRetry('atu', (callbacks) => runFetchATU(plate, BACKEND_URL, callbacks), plate);
        }

        async function fetchAtuInfracciones(plate: string, { forceRefresh = false }: { forceRefresh?: boolean } = {}) {
            return runFetchWithRetry('atu_infracciones', (callbacks) => runFetchAtuInfracciones(plate, BACKEND_URL, callbacks, { forceRefresh }), plate);
        }

        async function fetchSBS(plate: string) {
            return runExclusive('sbs', () =>
                runFetchWithRetry('sbs', (callbacks) => runFetchSBS(plate, BACKEND_URL, callbacks), plate));
        }

        async function fetchSUNARP(plate: string) {
            return runExclusive('sunarp', () =>
                runFetchWithRetry('sunarp', (callbacks) => runFetchSUNARP(plate, BACKEND_URL, callbacks), plate, 1, 2));
        }

        async function fetchSAT(plate: string) {
            const callbacks = {
                setCardLoading: (id: string, t: string, s: string, i: string, b: string, src: string) => setCardLoading(id, t, s, i, b, src),
                setCardData: (id: string, t: string, s: string, i: string, b: string, src: string, html: string, ok: boolean, has: boolean, badge?: string) => setCardData(id, t, s, i, b, src, html, ok, has, badge),
                setCardError: (id: string, t: string, s: string, i: string, b: string, src: string, err: string, pl: string) => setCardError(id, t, s, i, b, src, err, pl),
            };
            return runExclusive('sat', () => runFetchSAT(plate, BACKEND_URL, callbacks));
        }

        async function fetchSATCaptura(plate: string) {
            const callbacks = {
                setCardLoading: (id: string, t: string, s: string, i: string, b: string, src: string) => setCardLoading(id, t, s, i, b, src),
                setCardData: (id: string, t: string, s: string, i: string, b: string, src: string, html: string, ok: boolean, has: boolean, badge?: string) => setCardData(id, t, s, i, b, src, html, ok, has, badge),
                setCardError: (id: string, t: string, s: string, i: string, b: string, src: string, err: string, pl: string) => setCardError(id, t, s, i, b, src, err, pl),
            };
            return runExclusive('sat_captura', () => runFetchSATCaptura(plate, BACKEND_URL, callbacks));
        }

        async function fetchSATDeposito(plate: string) {
            const callbacks = {
                setCardLoading: (id: string, t: string, s: string, i: string, b: string, src: string) => setCardLoading(id, t, s, i, b, src),
                setCardData: (id: string, t: string, s: string, i: string, b: string, src: string, html: string, ok: boolean, has: boolean, badge?: string) => setCardData(id, t, s, i, b, src, html, ok, has, badge),
                setCardError: (id: string, t: string, s: string, i: string, b: string, src: string, err: string, pl: string) => setCardError(id, t, s, i, b, src, err, pl),
            };
            return runExclusive('sat_deposito', () => runFetchSATDeposito(plate, BACKEND_URL, callbacks));
        }

        const isRetryingCard: Record<string, boolean> = {};
        const retryQueue: Array<{ cardId: string; plate: string }> = [];
        let isProcessingRetryQueue = false;

        function showRetryNotice(html: string) {
            const status = document.getElementById('query-status');
            if (!status) return;
            status.innerHTML = html;
            status.classList.remove('opacity-0');
        }

        async function processRetryQueue() {
            if (isProcessingRetryQueue || retryQueue.length === 0) return;
            isProcessingRetryQueue = true;
            const next = retryQueue.shift();
            if (!next) {
                isProcessingRetryQueue = false;
                return;
            }
            try {
                const container = document.getElementById(`${next.cardId}-card-container`);
                if (container) {
                    const buttons = container.querySelectorAll('button');
                    buttons.forEach(btn => {
                        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Reintentando carga...';
                    });
                }
                await executeReintentarSeccion(next.cardId, next.plate);
            } finally {
                isProcessingRetryQueue = false;
                if (retryQueue.length > 0) {
                    window.setTimeout(processRetryQueue, 150);
                }
            }
        }

        (window as any).reintentarSeccion = async function(cardId: string, plate: string) {
            if (isRetryingCard[cardId]) {
                console.warn(`[RETRY-UI] Ya se está procesando el reintento para ${cardId}`);
                return;
            }
            const container = document.getElementById(`${cardId}-card-container`);
            if (container) {
                const buttons = container.querySelectorAll('button');
                buttons.forEach(btn => {
                    btn.disabled = true;
                    btn.setAttribute('data-prev-html', btn.innerHTML);
                    btn.classList.add('opacity-75', 'cursor-not-allowed');
                    if (isProcessingRetryQueue) {
                        btn.innerHTML = '<i class="fas fa-hourglass-half mr-1"></i> En espera en cola...';
                    } else {
                        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Reintentando carga...';
                    }
                });
            }

            isRetryingCard[cardId] = true;
            retryQueue.push({ cardId, plate });
            void processRetryQueue();
        };

        // ====================================================================================
  // FLUJO DE REINTENTO MANUAL DE SECCIÓN INDIVIDUAL (CON CONTROL DE TICKET Y COLA)
  // ====================================================================================
  // 1. ¿QUÉ HACE? Reejecuta la consulta de un solo proveedor (SBS, SAT, etc.) sin volver
  //    a consultar los proveedores que ya tuvieron éxito.
  // 2. TICKET EFECTIVO: Reutiliza activeConsultationTicket || completedConsultationTicket
  //    junto con los headers 'X-Manual-Retry': '1' y 'X-Manual-Retry-Section'.
  // 3. FAIL-SAFE ANTICOLISIÓN: Si el backend rechaza la petición con 422 (ej. si pasaron
  //    más de 15 min y expiró el ticket), se vacía inmediatamente la cola de reintentos
  //    (retryQueue.length = 0) para evitar una tormenta de errores en pantalla.
  // ====================================================================================
  async function executeReintentarSeccion(cardId: string, plate: string) {
            queryAttempts[cardId] = 0;
            let ownsRetryTicket = false;
            let currentRetryTicket: string | null = null;
            const container = document.getElementById(`${cardId}-card-container`);

            try {
                // Un ticket completado ya no autoriza llamadas. Reservar uno nuevo
                // con una prueba anti-bot válida y no continuar jamás si falla la
                // admisión (antes se ignoraba el 422 y la fuente recibía un 403).
                // Reutilizar el ticket completado de la consulta si existe: el backend
                // autoriza tickets completados con X-Manual-Retry: 1 durante 15 minutos
                // sin requerir un nuevo Turnstile anti-bot ni generar errores 422.
                const effectiveTicket = activeConsultationTicket || completedConsultationTicket;
                const needsFreshRetryTicket = !effectiveTicket;
                if (needsFreshRetryTicket) {
                    const retryCaptchaInput = document.getElementById('captcha-input') as HTMLInputElement | null;
                    captcha.consumeProof?.();
                    let retryProof = captcha.getProof(retryCaptchaInput?.value || '');
                    if (!retryProof.valid) {
                        showRetryNotice('<span class="text-amber-600 font-bold"><i class="fas fa-shield-halved mr-1"></i>Verificando turno de seguridad para el reintento...</span>');
                        document.getElementById('query-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        retryProof = await captcha.waitForProof(retryCaptchaInput?.value || '', 120000, { forceReset: true });
                        if (!retryProof.valid) {
                            showRetryNotice('<span class="text-rose-600 font-bold"><i class="fas fa-circle-exclamation mr-1"></i>La verificación expiró. Pulsa Reintentar para generar un nuevo desafío.</span>');
                            return;
                        }
                    }

                    let admission = await acquireConsultationSlot(BACKEND_URL, retryProof);
                    captcha.consumeProof?.();
                    void drawCaptcha();
                    admission = await waitForConsultationSlot(BACKEND_URL, admission, (state: any) => {
                        if (state.status === 'queued') {
                            showRetryNotice(`<span class="text-amber-600 font-bold"><i class="fas fa-hourglass-half mr-1"></i>Reintento en cola · posición ${state.position || 1}.</span>`);
                        }
                    });
                    if (!admission?.ticket_id || (admission.supported && admission.status !== 'active')) {
                        throw new Error('No se pudo activar un turno válido para el reintento.');
                    }
                    activeConsultationTicket = admission.ticket_id;
                    currentRetryTicket = admission.ticket_id;
                    ownsRetryTicket = true;
                    consultationLifecycle = 'active';
                }

                // ====================================================================
                // NOTA CRÍTICA PARA DESARROLLADORES E IA (BYPASS DE GATE EN REINTENTOS):
                // En el backend, el ConsultationGate retiene las consultas de secciones
                // hijas hasta que SUNARP valida la placa. Si el usuario pulsa 'Reintentar'
                // en una tarjeta individual (como CITV, Lunas, Callao o GNV), no se debe
                // vincular el ticket del Gate si la sección es independiente de SUNARP.
                // Si se vincula, el backend espera 65s por un SUNARP que nunca correrá,
                // produciendo el error GATE-WAIT-TIMEOUT (65s desperdiciados).
                // `directRetrySections` lista todas las secciones que se ejecutan directamente.
                // ====================================================================
                const directRetrySections = new Set(['fise', 'callao', 'atu', 'atu_infracciones', 'lunas', 'soat', 'soat_detallado', 'citv', 'sutran', 'cinemometro', 'municipal', 'gnv', 'osinergmin', 'placas_pe', 'valor_venal', 'sat', 'sat_captura', 'sat_deposito', 'lima', 'sbs', 'historial_dueños']);
                const preGateSections = new Set(['sunarp', ...directRetrySections]);
                if (ownsRetryTicket && !preGateSections.has(cardId) && !vehicleData) {
                    showRetryNotice('<span class="text-sky-700 font-bold"><i class="fas fa-shield-halved mr-1"></i>Validando el nuevo turno con SUNARP...</span>');
                    const gateResult = await fetchSUNARP(plate);
                    if (gateResult?.validation_status === 'not_found') {
                        throw new Error('SUNARP no encontró la placa; no se puede ejecutar esta sección.');
                    }
                }
                // SIEMPRE enviar el ticket válido en X-Consultation-Ticket para que verify_consultation_ticket
                // no rechace con 403 Forbidden. El backend detecta X-Manual-Retry: 1 y omite el Gate automáticamente.
                setConsultationTicket(effectiveTicket || activeConsultationTicket || currentRetryTicket);

                setManualRetrySection(cardId);
                console.info('[MANUAL-RETRY]', {
                    plate,
                    section: cardId,
                    consultationTicket: activeConsultationTicket,
                    newTicket: ownsRetryTicket,
                });
                showRetryNotice(`<span class="text-sky-700 font-bold"><i class="fas fa-rotate-right mr-1"></i>Reintentando ${cardId.replaceAll('_', ' ')}…</span>`);
                if (cardId === 'sunarp')           await fetchSUNARP(plate);
                else if (cardId === 'historial_dueños') {
                    const rawRetryOffice = (
                        vehicleData?.Sede || vehicleData?.sede ||
                        vehicleData?.datos?.Sede || vehicleData?.datos?.sede || 'LIMA'
                    );
                    const sedecaptadodelaseccionsunarp = String(rawRetryOffice).toUpperCase().trim();
                    console.log('sedecaptadodelaseccionsunarp =', sedecaptadodelaseccionsunarp);
                    await fetchHistorialDuenos(plate, sedecaptadodelaseccionsunarp);
                }
                else if (cardId === 'soat')        await fetchSOAT(plate);
                else if (cardId === 'fise')        await fetchFISE(plate);
                else if (cardId === 'soat_detallado') await fetchSOATDetallado(plate);
                else if (cardId === 'citv')        await fetchCITV(plate);
                else if (cardId === 'callao')      await fetchCallao(plate, { forceRefresh: true });
                else if (cardId === 'sutran')      await fetchSutran(plate);
                else if (cardId === 'cinemometro') await fetchCinemometro(plate);
                else if (cardId === 'municipal')   await fetchMunicipal(plate);
                else if (cardId === 'gnv')         await fetchGNV(plate);
                else if (cardId === 'osinergmin')  await fetchOsinergmin(plate);
                else if (cardId === 'placas_pe')   await fetchPlacasPE(plate);
                else if (cardId === 'valor_venal') await fetchEstadoPlacaYValor(plate);
                else if (cardId === 'sbs')         await fetchSBS(plate);
                else if (cardId === 'atu')         await fetchATU(plate);
                else if (cardId === 'atu_infracciones') await fetchAtuInfracciones(plate, { forceRefresh: true });
                else if (cardId === 'sat')         await fetchSAT(plate);
                else if (cardId === 'sat_captura') await fetchSATCaptura(plate);
                else if (cardId === 'sat_deposito') await fetchSATDeposito(plate);
                else if (cardId === 'lima')        await fetchLima(plate);
                else if (cardId === 'lunas')       await fetchLunas(plate, { forceRefresh: true });
            } catch (e) {
                console.error(`[RETRY-ERROR] Error en reintento manual de ${cardId}:`, e);
                showRetryNotice(`<span class="text-rose-600 font-bold"><i class="fas fa-circle-exclamation mr-1"></i>${(e as any)?.message || 'No se pudo reintentar la sección.'}</span>`);
                if ((e as any)?.status === 422 || (e as any)?.name === 'ConsultationQueueError') {
                    retryQueue.length = 0;
                }
            } finally {
                setManualRetrySection(null);
                if (ownsRetryTicket && currentRetryTicket) {
                    // Un retry que abrió su propio turno solo puede limpiar ese turno.
                    // Mientras tanto otra consulta pudo haber empezado y reemplazado
                    // activeConsultationTicket; no debemos borrar su credencial.
                    if (activeConsultationTicket === currentRetryTicket) {
                        activeConsultationTicket = null;
                    }
                    await releaseConsultationSlot(BACKEND_URL, currentRetryTicket);
                }
                // secureFetch mantiene un ticket global compartido por los proveedores.
                // Restaurarlo desde el estado vigente evita que el finally de un retry
                // anule los requests concurrentes de la consulta principal.
                setConsultationTicket(activeConsultationTicket || completedConsultationTicket);
                // Si salimos antes de volver a renderizar la tarjeta (por ejemplo,
                // falta de CAPTCHA), restaurar sus botones para permitir otro clic.
                if (container?.isConnected) {
                    container.querySelectorAll('button[data-prev-html]').forEach((button) => {
                        const btn = button as HTMLButtonElement;
                        btn.innerHTML = btn.getAttribute('data-prev-html') || 'Reintentar';
                        btn.removeAttribute('data-prev-html');
                        btn.disabled = false;
                        btn.classList.remove('opacity-75', 'cursor-not-allowed');
                    });
                }
                isRetryingCard[cardId] = false;
            }
        }
        // ====================================================
        // ACCORDION TOGGLE
        // ====================================================
        (window as any).toggleAccordion = function(containerId: string) {
            const container = document.getElementById(containerId);
            if (!container) return;
            const body = container.querySelector('.accordion-body');
            const header = container.querySelector('.accordion-header');
            const chevron = container.querySelector('.accordion-chevron');
            if (!body || !header || !chevron) return;

            const isHidden = body.classList.contains('hidden');
            if (isHidden) {
                // Expand
                body.classList.remove('hidden');
                header.classList.remove('bg-white', 'dark:bg-slate-900', 'text-slate-900', 'dark:text-white');
                header.classList.add('bg-gradient-to-r', 'from-[#1a3a6b]', 'to-[#0b1c36]', 'text-white', 'border-b-2', 'border-slate-900', 'dark:border-slate-800');
                chevron.classList.add('rotate-180', 'text-white');
                chevron.classList.remove('text-slate-400', 'dark:text-slate-500');

                // Adjust header text classes
                const title = header.querySelector('h3');
                if (title) {
                    title.classList.add('text-white', 'font-bold', 'temp-white-title');
                    title.classList.remove('text-slate-900', 'dark:text-white');
                }
                const sub = header.querySelector('p');
                if (sub) {
                    sub.classList.add('text-white/60', 'font-semibold', 'temp-white-sub');
                    sub.classList.remove('text-slate-400', 'dark:text-slate-500');
                }

                // Adjust icon wrapper if it's not a logo
                const logoWrapper = header.querySelector('div[data-is-logo="true"]');
                if (!logoWrapper) {
                    const iconWrapper = header.querySelector('div[data-orig-class]');
                    if (iconWrapper) {
                        iconWrapper.className = "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 bg-white/10 ring-1 ring-white/20 text-white";
                        const icon = iconWrapper.querySelector('i');
                        if (icon) {
                            icon.className = icon.getAttribute('data-orig-class') || '';
                            icon.classList.add('text-white');
                        }
                    }
                }
            } else {
                // Collapse
                body.classList.add('hidden');
                header.classList.add('bg-white', 'dark:bg-slate-900', 'text-slate-900', 'dark:text-white');
                header.classList.remove('bg-gradient-to-r', 'from-[#1a3a6b]', 'to-[#0b1c36]', 'text-white', 'border-b-2', 'border-slate-900', 'dark:border-slate-800');
                chevron.classList.remove('rotate-180', 'text-white');
                chevron.classList.add('text-slate-400', 'dark:text-slate-500');

                // Restore header text classes
                const title = header.querySelector('h3');
                if (title) {
                    title.classList.remove('text-white', 'temp-white-title');
                    title.classList.add('text-slate-900', 'dark:text-white');
                }
                const sub = header.querySelector('p');
                if (sub) {
                    sub.classList.remove('text-white/60', 'temp-white-sub');
                    sub.classList.add('text-slate-400', 'dark:text-slate-500');
                }

                // Restore icon wrapper if it's not a logo
                const logoWrapper = header.querySelector('div[data-is-logo="true"]');
                if (!logoWrapper) {
                    const iconWrapper = header.querySelector('div[data-orig-class]');
                    if (iconWrapper) {
                        iconWrapper.className = iconWrapper.getAttribute('data-orig-class') || '';
                    }
                }
            }
        };

        // ====================================================
        // Caché efímera en memoria (TTL 5 min): no persiste placas ni HTML.
        // ====================================================
        const { saveToCache, loadFromCache, invalidate: invalidateCachedPlate } = createResultCache({
            getValidation: () => currentSunarpValidation,
            setValidation: (value) => { currentSunarpValidation = value; },
            getVehicleData: () => vehicleData,
            restoreVehicleData: (value) => { vehicleData = value; },
            whatsappNumber: WHATSAPP_NUMBER,
        });

        (window as any).refreshPlateData = function(plate: string) {
            invalidateCachedPlate(plate);
            // Trigger form submit
            const input = document.getElementById('plate-search-input') as HTMLInputElement;
            if (input) {
                input.value = plate;
            }
            const form = document.getElementById('query-form') as HTMLFormElement;
            if (form) {
                form.dispatchEvent(new Event('submit', { cancelable: true }));
            }
        };

        // ====================================================
        // 📄 REPORTE PDF (vía impresión del navegador → "Guardar como PDF")
        // ====================================================
        (window as any).imprimirReporte = function(_plate: string) {
            // Expandir todas las tarjetas para que salgan completas en el PDF
            const bodies = Array.from(document.querySelectorAll('.accordion-body')) as HTMLElement[];
            const wasHidden = bodies.map(b => b.classList.contains('hidden'));
            bodies.forEach(b => b.classList.remove('hidden'));
            
            // Eliminar cualquier cabecera previa si existiese
            document.getElementById('print-report-header')?.remove();

            setTimeout(() => {
                window.print();
                // Restaurar el estado de las tarjetas tras imprimir
                setTimeout(() => bodies.forEach((b, i) => { if (wasHidden[i]) b.classList.add('hidden'); }), 400);
            }, 200);
        };

        // ====================================================
        // DESCARGA Y COMPARTIR POR SECCIÓN — se genera en el cliente y no
        // consume CPU, cola ni navegadores del backend.
        // ====================================================
        setupSectionExport();

        // ====================================================
        // LOADER OVERLAY Y CONTROL DE BÚSQUEDA
        // ====================================================
        let isSubmitting = false;

        function showConsultationQueueModal(state: any) {
            const modal = document.getElementById('consultation-queue-modal');
            const position = document.getElementById('consultation-queue-position');
            const wait = document.getElementById('consultation-queue-wait');
            const description = document.getElementById('consultation-queue-description');
            const queuePosition = Math.max(1, Number(state?.position) || 1);
            const seconds = Math.max(0, Number(state?.estimated_wait_seconds) || 0);
            const minutes = Math.max(1, Math.ceil(seconds / 60));
            if (position) position.textContent = String(queuePosition);
            if (wait) wait.textContent = `${minutes} min`;
            if (description) {
                description.textContent = `Tu turno está reservado en la posición ${queuePosition}. Iniciaremos automáticamente cuando exista capacidad, sin que tengas que recargar la página.`;
            }
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        }

        function hideConsultationQueueModal() {
            const modal = document.getElementById('consultation-queue-modal');
            if (!modal) return;
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }

        function showLoadingOverlay(plate: string) {
            const overlay = document.getElementById('loading-overlay');
            const badge = document.getElementById('loader-plate-badge');
            const miniBadge = document.getElementById('loader-plate-mini');
            const statusText = document.getElementById('loader-status-text');
            const cleanPlate = plate.replace(/[^A-Z0-9]/gi, '').toUpperCase();
            const formattedPlate = cleanPlate.length === 6 ? `${cleanPlate.slice(0, 3)}-${cleanPlate.slice(3)}` : plate.toUpperCase();
            if (badge) badge.textContent = formattedPlate;
            if (miniBadge) miniBadge.textContent = formattedPlate;
            if (statusText) statusText.textContent = 'Preparando consulta segura...';
            if (overlay) {
                overlay.classList.remove('hidden');
                requestAnimationFrame(() => {
                    overlay.classList.remove('opacity-0');
                    overlay.classList.add('opacity-100', 'flex');
                });
                document.body.style.overflow = 'hidden';
            }
        }

        function updateLoadingStatus(text: string, _step?: string) {
            const statusText = document.getElementById('loader-status-text');
            if (statusText && text) statusText.textContent = text;
        }

        function hideLoadingOverlay() {
            const overlay = document.getElementById('loading-overlay');
            if (!overlay) return;
            overlay.classList.remove('opacity-100');
            overlay.classList.add('opacity-0');
            document.body.style.overflow = '';
            setTimeout(() => {
                overlay.classList.add('hidden');
                overlay.classList.remove('flex');
            }, 350);
        }

        function scrollToResults() {
            const resultsSection = document.getElementById('results-section');
            if (resultsSection) {
                const y = resultsSection.getBoundingClientRect().top + window.scrollY - 15;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        }

        function showInvalidPlateAlert(plate: string) {
            const wrapper = document.getElementById('results-cards-wrapper');
            if (!wrapper) return;
            document.getElementById('sunarp-invalid-plate-alert')?.remove();
            const safePlate = plate.replace(/[^A-Z0-9-]/g, '');
            const alert = document.createElement('section');
            alert.id = 'sunarp-invalid-plate-alert';
            alert.className = 'card-animate mb-4 overflow-hidden rounded-2xl border-2 border-slate-900 bg-white shadow-lg font-poppins';
            alert.innerHTML = `
                <div class="flex flex-col items-center gap-4 bg-gradient-to-br from-white via-white to-slate-100 px-5 py-7 text-center sm:px-8">
                    <div class="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-md">
                        <img src="/assets/logocañitaoficial2026.png" alt="Cañita" class="h-11 w-14 object-contain" />
                    </div>
                    <div>
                        <span class="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-[.14em] text-white">
                            <i class="fas fa-shield-halved"></i> Validación SUNARP
                        </span>
                        <h3 class="mt-3 text-xl font-black text-slate-950 sm:text-2xl">No encontramos la placa ${safePlate}</h3>
                        <p class="mx-auto mt-2 max-w-xl text-xs font-medium leading-relaxed text-slate-500 sm:text-sm">
                            Revisa que las seis letras y números estén escritos correctamente. SUNARP confirmó que la placa ingresada no tiene registro vehicular.
                        </p>
                    </div>
                    <button type="button" id="invalid-plate-edit-button" class="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:bg-black active:scale-95">
                        <i class="fas fa-pen"></i> Corregir placa
                    </button>
                    <p class="text-[10px] font-semibold text-slate-400">Las demás fuentes no se ejecutaron para proteger la velocidad y capacidad de Cañita.</p>
                </div>`;
            wrapper.parentElement?.insertBefore(alert, wrapper);
            // Una ausencia confirmada no es un resultado parcial: la única
            // tarjeta visible debe ser el aviso de SUNARP, incluida su tarjeta
            // técnica que pudo haberse renderizado durante la validación.
            Array.from(wrapper.children).forEach(card => {
                (card as HTMLElement).classList.add('hidden');
                (card as HTMLElement).setAttribute('data-skipped', 'invalid-plate');
            });
            document.getElementById('invalid-plate-edit-button')?.addEventListener('click', () => {
                plateInput?.focus();
                plateInput?.select();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // ====================================================
        // SUBMIT DEL FORMULARIO
        // ====================================================
        const queryForm = document.getElementById('query-form');
        const queryStatus = document.getElementById('query-status');

        if (queryForm && plateInput && queryStatus) {
            queryForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                if (getCurrentSearchMode() === 'dni') {
                    const dniInp = document.getElementById('dni-search-input') as HTMLInputElement;
                    const dniVal = (dniInp?.value || '').replace(/\D/g, '').trim().slice(0, 8);
                    if (dniVal.length !== 8) {
                        queryStatus.innerHTML = '<span class="text-rose-500 font-bold"><i class="fas fa-circle-exclamation mr-1"></i>Ingresa un DNI válido de 8 dígitos numéricos.</span>';
                        queryStatus.classList.remove('opacity-0');
                        return;
                    }
                    await triggerDniConsultation(dniVal);
                    return;
                }

                if (isSubmitting) return;

                if ((window as any).__maintenanceMode) {
                    (window as any).showMaintenanceModal?.();
                    return;
                }

                const plate = plateInput.value.trim().toUpperCase();
                if (!plate) return;

                // Validar formato de placa peruana (ej. ABC-123 o A1B-234)
                const cleanPlate = plate.replace(/-/g, '').replace(/\s/g, '');
                const plateRegex = /^[A-Z0-9]{6}$/;
                if (!plateRegex.test(cleanPlate)) {
                    queryStatus.innerHTML = '<span class="text-rose-500 font-bold"><i class="fas fa-circle-exclamation mr-1"></i>Placa inválida. Formato esperado: ABC-123 o A1B-234</span>';
                    queryStatus.classList.remove('opacity-0');
                    return;
                }

                const captchaInput = document.getElementById('captcha-input') as HTMLInputElement;

                // Reutilizar únicamente la caché efímera de esta pestaña.
                const cacheState = loadFromCache(plate);
                if (cacheState === 'fresh') {
                    if (captchaInput) captchaInput.value = '';
                    void drawCaptcha();
                    fillValorVenalSoles();
                    queryStatus.classList.add('opacity-0');
                    scrollToResults();
                    return;
                }
                const isRefreshingStaleCache = cacheState === 'stale';

                isSubmitting = true;
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.classList.add('opacity-60', 'cursor-not-allowed');
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Consultando...';
                }
                queryStatus.textContent = isRefreshingStaleCache
                    ? 'Mostrando el último resultado mientras actualizamos fuentes oficiales...'
                    : 'Iniciando consulta multiorigen...';
                queryStatus.classList.remove('opacity-0');

                // Un resultado vencido sigue siendo útil para el usuario. No
                // taparlo con el overlay: cada tarjeta se reemplaza cuando su
                // fuente oficial termina la actualización.
                if (!isRefreshingStaleCache) showLoadingOverlay(plate);
                else scrollToResults();

                // Al refrescar una copia visible preservamos su referencia
                // vehicular hasta que SUNARP/placas.pe la reemplacen.
                if (!isRefreshingStaleCache) vehicleData = {};
                sectionResults = {};
                activeScorePlate = plate;
                currentSunarpValidation = 'indeterminate';
                consultationGeneration += 1;
                consultationLifecycle = 'active';
                const activeConsultationId = createConsultationId();
                const consultationStartedAt = performance.now();
                setConsultationId(activeConsultationId);

                const captchaProof = captcha.getProof(captchaInput?.value || '');
                if (!captchaProof.valid) {
                    queryStatus.innerHTML = '<span class="text-rose-500 font-bold"><i class="fas fa-shield-check mr-1"></i>Completa la verificación anti-bots antes de consultar.</span>';
                    queryStatus.classList.remove('opacity-0');
                    isSubmitting = false;
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.classList.remove('opacity-60', 'cursor-not-allowed');
                        submitBtn.innerHTML = '<i class="fas fa-search text-xs"></i><span id="submit-btn-text">Consultar Placa</span><i class="fas fa-arrow-right text-xs ml-0.5"></i>'; updateSubmitButtonState();
                    }
                    hideLoadingOverlay();
                    setConsultationId(null);
                    return;
                }
                if (captchaInput) captchaInput.value = '';

                if (!isRefreshingStaleCache) renderResultsSkeleton(plate, WHATSAPP_NUMBER, false);

                // Si SUNARP demora, mantener el loader e informar. Nunca ocultarlo
                // por reloj: debe cerrarse solo cuando la tarjeta ya esté renderizada.
                const safetyLoaderTimeout = setTimeout(() => {
                    updateLoadingStatus('SUNARP está demorando más de lo habitual. Seguimos validando...');
                }, 8000);

                // ====================================================
                // EJECUCIÓN EN 2 FASES
                // Fase 1: Servicios ligeros (HTTP directo) → en paralelo
                // Fase 2: Servicios pesados (Chromium) → secuencial
                // ====================================================
                (async () => {
                    let queueError = false;
                    let municipalElapsedMs = 0;
                    let historialElapsedMs = 0;
                    let backgroundStatusNotice: ReturnType<typeof setTimeout> | null = null;
                    try {
                        // Un turno representa a la persona y protege el fan-out
                        queryStatus.innerHTML = '<i class="fas fa-ticket mr-1"></i> Reservando turno de consulta...';
                        updateLoadingStatus('Preparando tu consulta...');

                        let admission = await acquireConsultationSlot(BACKEND_URL, captchaProof);
                    captcha.consumeProof?.();
                        void drawCaptcha();
                        if (admission.supported) {
                            activeConsultationTicket = admission.ticket_id;
                            admission = await waitForConsultationSlot(BACKEND_URL, admission, (state: any) => {
                                if (state.status === 'queued') {
                                    const wait = Math.max(1, Math.round((state.estimated_wait_seconds || 0) / 60));
                                    showConsultationQueueModal(state);
                                    queryStatus.innerHTML = `<span class="text-amber-600 font-bold"><i class="fas fa-hourglass-half mr-1"></i> Alta demanda: estás en la posición ${state.position}. Espera estimada: ${wait} min. Tu consulta iniciará automáticamente.</span>`;
                                    updateLoadingStatus(`Alta demanda · turno ${state.position} · aprox. ${wait} min`);
                                } else {
                                    hideConsultationQueueModal();
                                    const modeLabel = state.load_mode === 'fast' ? 'Modo rápido' : state.load_mode === 'balanced' ? 'Modo balanceado' : 'Modo protegido';
                                    queryStatus.innerHTML = `<span class="text-emerald-600 font-bold"><i class="fas fa-bolt mr-1"></i> Turno confirmado · ${modeLabel}. Iniciando consulta...</span>`;
                                }
                            });
                            setConsultationTicket(activeConsultationTicket);
                            consultationHeartbeat = setInterval(() => {
                                // El ticket dura 12 minutos. Evitar touches de
                                // pestañas ocultas reduce polling duplicado;
                                // pagehide sigue liberando el turno de forma
                                // best-effort y la pestaña visible lo renueva.
                                if (activeConsultationTicket && consultationLifecycle === 'active' && document.visibilityState === 'visible') {
                                    void touchConsultationSlot(BACKEND_URL, activeConsultationTicket);
                                }
                            }, 45000);
                        }

                        // El backend es la fuente de verdad de los límites de
                        // ejecución. Si su lectura falla, el fallback local es
                        // restrictivo y no abre más de un carril pesado.
                        let executionPlan: any = null;
                        if (activeConsultationTicket) {
                            try {
                                executionPlan = await fetchExecutionPlan(BACKEND_URL, activeConsultationTicket);
                                console.info('[ORCHESTRATOR-PLAN]', {
                                    consultation_id: activeConsultationId,
                                    version: executionPlan.version,
                                    load_mode: executionPlan.load_mode,
                                    limits: executionPlan.limits,
                                    sections: executionPlan.sections.map((section: any) => section.id),
                                });
                            } catch (planError) {
                                console.warn('[ORCHESTRATOR-PLAN] fallback=local reason=', (planError as any)?.message || 'unknown');
                            }
                        }
                        const executionLimits = resolveExecutionLimits(executionPlan, admission);

                        // Verificación rápida de disponibilidad del backend
                        try {
                            const baseUrl = BACKEND_URL.replace(/\/api\/v1\/?$/, '');
                            const healthRes = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(10000) });
                            if (!healthRes.ok) throw new Error("HTTP Status " + healthRes.status);
                        } catch (_healthErr) {
                            console.warn("[CONEXION] Health check aviso (continuando consulta):", _healthErr);
                        }

                        // SUNARP comienza junto a las fuentes rápidas. Las rápidas
                        // avanzan detrás del modal, pero la pantalla principal solo se
                        // revela cuando la sección registral llegó a un estado terminal.
                        queryStatus.textContent = 'Validando primero la información registral SUNARP...';
                        updateLoadingStatus('Validando la placa en SUNARP...');
                        setCardWaiting('sunarp', 'Consulta Vehicular SUNARP', 'Datos registrales oficiales', 'fas fa-car-side', '', 'SUNARP', 'Consultando en segundo plano...');
                        const sunarpPromise = runSectionSafely('sunarp', () => fetchSUNARP(plate));
                        // ====================================================================
                        // NOTA CRÍTICA PARA DESARROLLADORES E IA (TIMEOUT VISUAL SUNARP):
                        // SUNARP (con Cloudflare Turnstile / CapSolver) tarda entre 25s y 35s
                        // en resolver en producción. NUNCA REDUCIR este timeout a valores bajos
                        // (como 8s). Un timeout de 8s cierra el modal de espera 20 segundos antes
                        // de que SUNARP devuelva los datos, haciendo que el usuario vea la tarjeta
                        // incompleta y piense erróneamente que la consulta falló.
                        // El valor está configurado en 40s (40000ms) para garantizar que el modal
                        // permanezca visible hasta que SUNARP confirme la placa o expire limpiamente.
                        // ====================================================================
                        let resultsRevealed = false;
                        const revealResults = (trigger: string, validation = 'pending') => {
                            if (resultsRevealed) return;
                            resultsRevealed = true;
                            clearTimeout(safetyLoaderTimeout);
                            hideLoadingOverlay();
                            scrollToResults();
                            console.info('[UI-RESULTS-REVEALED]', {
                                elapsed_ms: Math.round(performance.now() - consultationStartedAt),
                                trigger,
                                validation_status: validation,
                                cache_refresh: isRefreshingStaleCache,
                                consultation_id: activeConsultationId,
                            });
                        };
                        const sunarpVisualTimeout = window.setTimeout(() => {
                            queryStatus.textContent = 'SUNARP está tardando más de lo habitual. Mostramos el informe y continuamos verificando...';
                            updateLoadingStatus('La validación registral continúa en segundo plano...');
                            revealResults('sunarp_visual_budget', 'pending');
                        }, 40000);

                        const sunarpReadyPromise = sunarpPromise.then(async (result: any) => {
                            clearTimeout(sunarpVisualTimeout);
                            const validation = result?.validation_status;
                            queryStatus.textContent = validation === 'found'
                                ? 'SUNARP confirmado. Las demás fuentes continúan actualizándose...'
                                : validation === 'not_found'
                                    ? 'SUNARP terminó la validación. Conservando resultados parciales...'
                                    : 'SUNARP no fue concluyente. Conservando resultados y reintentos independientes...';
                            updateLoadingStatus(
                                validation === 'found'
                                    ? 'Registro SUNARP confirmado. Mostrando resultados...'
                                    : validation === 'not_found'
                                        ? 'SUNARP terminó la validación de la placa.'
                                        : 'SUNARP terminó con una respuesta no concluyente.'
                            );
                            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                            revealResults('sunarp_terminal', validation || 'indeterminate');
                            return result;
                        });

                        // SUNARP es el único proveedor que puede decidir que
                        // una placa no existe. Esperar su veredicto antes de
                        // lanzar cualquier otra fuente evita consultas, 409 y
                        // tarjetas de reintento para una placa inexistente.
                        const sunarpResult = await sunarpReadyPromise;
                        currentSunarpValidation = sunarpResult?.validation_status === 'found'
                            ? 'found'
                            : sunarpResult?.validation_status === 'not_found'
                                ? 'not_found'
                                : 'indeterminate';

                        if (currentSunarpValidation === 'not_found') {
                            consultationLifecycle = 'completed';
                            showInvalidPlateAlert(plate);
                            queryStatus.innerHTML = '<span class="font-bold text-slate-700"><i class="fas fa-circle-xmark mr-1"></i> Placa no encontrada en SUNARP.</span>';
                            queryStatus.classList.remove('opacity-0');
                            return;
                        }

                        // FASE 1A: la placa existe o SUNARP quedó indeterminado;
                        // recién ahora pueden ejecutarse fuentes independientes.
                        const fastBatchSize = executionLimits.fast_concurrency;
                        const fastSectionsPromise = runInBatches([
                            // Grupo inmediato: normalmente entrega tarjetas antes o
                            // alrededor de la confirmación SUNARP.
                            () => runSectionSafely('soat_detallado', () => fetchSOATDetallado(plate)),
                            () => runSectionSafely('placas_pe', async () => fetchPlacasPE(plate)),
                            () => runSectionSafely('osinergmin', () => fetchOsinergmin(plate)),
                            () => runSectionSafely('sutran', () => fetchSutran(plate)),
                            () => runSectionSafely('fise', () => fetchFISE(plate)),
                            () => runSectionSafely('gnv', () => fetchGNV(plate)),
                            () => runSectionSafely('cinemometro', () => fetchCinemometro(plate)),
                            () => runSectionSafely('valor_venal', async () => {
                                const pdData = sectionResults.placas_pe?.data || {};
                                const sunarpData = sunarpResult?.datos || sectionResults.sunarp?.datos || {};
                                const soatData = sectionResults.soat_detallado?.certificados?.[0] || sectionResults.soat?.[0] || {};
                                const citvData = (Array.isArray(sectionResults.citv) ? sectionResults.citv[0] : sectionResults.citv?.data?.[0]) || {};
                                const reference = resolveVehicleReference(pdData, vehicleData, sunarpData, soatData, citvData);
                                return await fetchValorVenal(plate, reference.marca, reference.modelo, reference.anio);
                            }),
                        ], fastBatchSize);

                        // FASE 1B: fuentes independientes de prioridad secundaria.
                        // Lunas se deja deliberadamente para el cierre: un CAPTCHA
                        // difícil no puede retrasar Lima/SBS/SAT ni Historial.
                        const variableBatchSize = executionLimits.background_concurrency;
                        const variableSectionsPromise = runInBatches([
                            () => runSectionSafely('citv', () => fetchCITV(plate)),
                        ], variableBatchSize, 'fuente HTTP/OCR en segundo plano');

                        // ATU queda aislada del lote rápido hasta confirmar su
                        // estabilidad en producción. Sigue ejecutándose dentro
                        // del mismo ticket, pero no bloquea el inicio de la
                        // fase pesada ni la aparición de resultados principales.
                        const atuInfraccionesPromise = runSectionSafely(
                            'atu_infracciones',
                            () => fetchAtuInfracciones(plate),
                        );

                        queryStatus.textContent = currentSunarpValidation === 'found'
                            ? 'Placa confirmada. Preparando secciones avanzadas...'
                            : 'SUNARP no pudo confirmar temporalmente. Continuando con las demás fuentes...';

                        const rawOffice = (
                            sunarpResult?.datos?.Sede || sunarpResult?.datos?.sede ||
                            sunarpResult?.datos?.Oficina || sunarpResult?.datos?.oficina ||
                            sunarpResult?.Sede || sunarpResult?.sede ||
                            vehicleData?.Sede || vehicleData?.sede || 'LIMA'
                        );
                        const detectedOffice = String(rawOffice).toUpperCase().trim();
                        console.log('sedecaptadodelaseccionsunarp =', detectedOffice);
                        setCardWaiting('historial_dueños', 'Historial de Dueños y Gravámenes', 'Trazabilidad registral', 'fas fa-clock-rotate-left', '', 'SUNARP / Registral', 'En espera (Fase avanzada)');
                        setCardWaiting('lunas', 'Lunas Oscurecidas', 'Permiso policial de lunas', 'fas fa-car-side', '', 'PNP', 'En espera (Verificación final)');

                        // P0.2: heavy-phase se SOLICITA en cuanto el Gate efectivo es
                        // OPEN (found) o degradado permitido (indeterminate), sin
                        // esperar a que termine FASE 1A (Cinemómetro/SUTRAN/FISE/GNV/
                        // valor_venal). Gate CLOSED retornó arriba y nunca llega aquí.
                        // El backend es idempotente: repetir el POST no duplica la fase.
                        const heavyGateKnownAt = Date.now();
                        const capturedGeneration = consultationGeneration;
                        const capturedTicket = activeConsultationTicket;
                        let heavyPhasePromise: Promise<any> | null = null;
                        if (capturedTicket && consultationLifecycle === 'active' && capturedGeneration === consultationGeneration && capturedTicket === activeConsultationTicket) {
                            console.info(`[HEAVY-PHASE] gate efectivo conocido (${currentSunarpValidation}) a las ${new Date(heavyGateKnownAt).toISOString()}; solicitando sin esperar FASE 1A`);
                            heavyPhasePromise = waitForHeavyPhase(BACKEND_URL, capturedTicket, (state: any) => {
                                if (state.heavy_status === 'queued') {
                                    const minutes = Math.max(1, Math.ceil((state.heavy_estimated_wait_seconds || 0) / 60));
                                    queryStatus.innerHTML = `<span class="text-amber-600 font-bold"><i class="fas fa-list-ol mr-1"></i> Resultados rápidos listos. Secciones avanzadas en posición ${state.heavy_position}; espera estimada ${minutes} min.</span>`;
                                } else {
                                    const modeLabel = state.load_mode === 'fast' ? 'capacidad rápida' : state.load_mode === 'balanced' ? 'capacidad balanceada' : 'capacidad protegida';
                                    queryStatus.innerHTML = `<span class="text-emerald-600 font-bold"><i class="fas fa-gears mr-1"></i> Iniciando secciones avanzadas con ${modeLabel}...</span>`;
                                }
                            });
                            console.info(`[HEAVY-PHASE] requested_at=${new Date().toISOString()} (gate_known_at=${new Date(heavyGateKnownAt).toISOString()})`);
                        } else {
                            const reason = consultationLifecycle !== 'active' ? consultationLifecycle :
                                capturedGeneration !== consultationGeneration ? 'generation_changed' :
                                    capturedTicket !== activeConsultationTicket ? 'ticket_changed' : 'ticket_missing';
                            console.warn(`[HEAVY-PHASE-SKIP] reason=${reason}`);
                            await fastSectionsPromise;
                            await variableSectionsPromise;
                            renderVehicleScore(plate);
                            return;
                        }

                        // FASE 2: servicios avanzados secuenciales. Siniestralidad SBS
                        // queda al final porque en la medición real tomó 37.4 s.
                        // Se espera el slot heavy (ya solicitado arriba) antes de lanzar.
                        if (heavyPhasePromise) {
                            await heavyPhasePromise;
                        }
                        queryStatus.textContent = 'Fase 2: Consultando servicios avanzados...';

                        // Estado visual bonito para la cola secuencial
                        setCardWaiting('historial_dueños', 'Historial de Dueños y Gravámenes', 'Trazabilidad registral', 'fas fa-clock-rotate-left', '', 'SUNARP / Registral', 'En espera (Verificación avanzada final)');
                        setCardWaiting('lima', 'Papeletas Lima (SAT)', 'reCAPTCHA v2', 'fas fa-traffic-light', '', 'SAT Lima', 'En espera (Turno 1)');
                        setCardWaiting('municipal', 'Papeletas Otras Municipalidades', 'Provincias del Perú', 'fas fa-building-columns', '', 'Municipalidades', 'En espera (Fase pesada)');
                        setCardWaiting('soat', 'Historial SOAT', 'Pólizas y vigencia', 'fas fa-shield-halved', '', 'SBS', 'En espera (Fase pesada)');
                        setCardComingSoon('atu', '¿Está inscrito como taxi en ATU?', 'Autorización vehicular por placa · Lima y Callao', 'fas fa-taxi', 'ATU', 'Consulta de inscripción/autorización para servicio de taxi. Esta función estará disponible próximamente.');
                        setCardWaiting('sbs', 'Siniestralidad Vehicular', 'SOAT · Vehicular · CAT', 'fas fa-car-burst', '', 'SBS', 'En espera (Verificación final post-lunas)');
                        setCardWaiting('sat_captura', 'Orden de Captura (SAT)', 'Provincia de Lima', 'fas fa-gavel', '', 'SAT Lima', 'En espera (Turno 4)');
                        setCardWaiting('sat_deposito', 'Internamiento en Depósito (SAT)', '', 'fas fa-warehouse', '', 'SAT Lima', 'En espera (Turno 5)');

                        console.info('[ORDEN-CONSULTA] 21 consultas automáticas:', ENABLED_EXECUTION_ORDER);
                        const advancedJobs: Record<string, () => Promise<any>> = {
                            sbs: () => fetchSBS(plate),
                            soat: () => fetchSOAT(plate),
                            lima: () => {
                                setCardLoading('lima', 'Papeletas Lima (SAT)', 'Consultando papeletas SAT...', 'fas fa-traffic-light', '', 'SAT Lima');
                                return fetchLima(plate);
                            },
                            sigm: () => fetchSIGM(plate),
                            historial_dueños: () => {
                                queryStatus.textContent = 'Analizando historial de dueños y asientos registrales...';
                                setCardLoading('historial_dueños', 'Historial de Dueños y Gravámenes', 'Analizando asientos y transferencias oficiales...', 'fas fa-clock-rotate-left', '', 'SUNARP / Registral');
                                return fetchHistorialDuenos(plate, detectedOffice);
                            },
                            municipal: () => fetchMunicipal(plate),
                            sat: () => fetchSAT(plate),
                        };
                        // Aunque SIGM tenga tramos HTTP, las fuentes avanzadas
                        // terminan usando el mismo Chromium, OCR o CAPTCHA. Un
                        // solo carril evita que una consulta abra trabajos
                        // pesados solapados dentro de su propio ticket.
                        // Esto limita wrappers de red, no Chromium. El backend
                        // mantiene GLOBAL_BROWSER_CAPACITY=1; permitir dos
                        // wrappers deja que SOAT/SBS compartan un single-flight
                        // mientras SIGM espera su red/CAPTCHA.
                        const advancedConcurrency = executionLimits.advanced_dispatch_concurrency;
                        const runAdvancedSection = async (sectionId: string) => {
                            const startedAt = performance.now();
                            console.info(`[ORDEN-CONSULTA] Inicio ${sectionId}`);
                            const result = await runSectionSafely(sectionId, advancedJobs[sectionId]);
                            console.info(`[ORDEN-CONSULTA] Fin ${sectionId}: ${Math.round(performance.now() - startedAt)}ms`);
                            return result;
                        };
                        const advancedNodes = buildAdvancedNodes(ADVANCED_EXECUTION_ORDER);
                        // SPRL no comparte la ruta crítica visual. Se programa
                        // deliberadamente después del resto de la cola pesada,
                        // pero el ticket y heartbeat siguen vivos hasta su final.
                        // Municipal puede abrir Playwright para algunos portales.
                        // Igual que SPRL, no debe retener la experiencia principal.
                        const coreAdvancedNodes = advancedNodes.filter((node: any) => !['sbs', 'lima', 'municipal', 'historial_dueños'].includes(node.id));
                        const sbsNode = advancedNodes.find((node: any) => node.id === 'sbs');
                        const limaNode = advancedNodes.find((node: any) => node.id === 'lima');
                        const municipalNode = advancedNodes.find((node: any) => node.id === 'municipal');
                        const historialNode = advancedNodes.find((node: any) => node.id === 'historial_dueños');
                        const advancedBatchStartedAt = Date.now();
                        console.info(`[ADVANCED-SCHEDULE] consultation_id=${activeConsultationId} heavy_ready order=${coreAdvancedNodes.map((node: any) => node.id).join(',')} then=lima,municipal,historial_dueños deps=${advancedNodes.filter((node: any) => node.deps.length).map((node: any) => `${node.id}<-${node.deps.join('+')}`).join(',') || 'none'} concurrency=${advancedConcurrency} started_at=${new Date(advancedBatchStartedAt).toISOString()}`);
                        const advancedPromise = runSectionsWithDependencies(
                            coreAdvancedNodes.map((node: any) => ({
                                ...node,
                                run: () => runAdvancedSection(node.id),
                            })),
                            advancedConcurrency,
                            {
                                onStart: async ({ id, index, queue_wait_ms }: { id: string; index: number; queue_wait_ms: number }) => {
                                    console.info(
                                        `[COLA-FRONTEND] sección avanzada ${index + 1}/${advancedNodes.length} ${id} inicia tras ${Math.round(queue_wait_ms)}ms`
                                    );
                                    // La espera queda registrada localmente;
                                    // no se envía una métrica administrativa
                                    // desde el cliente público.
                                },
                                onFinish: ({ id, index, processing_ms, status }: { id: string; index: number; processing_ms: number; status: string }) => console.info(
                                    `[PROCESO-FRONTEND] sección avanzada ${index + 1}/${advancedNodes.length} ${id} ${status} en ${Math.round(processing_ms)}ms`
                                ),
                            },
                        );
                        await advancedPromise;
                        if (activeConsultationTicket) {
                            void releaseHeavyPhase(BACKEND_URL, activeConsultationTicket);
                        }

                        // P0.3 (corrige P0.2): el score necesita TODAS las secciones,
                        // incluida FASE 1A, antes de renderizar y completar.
                        await fastSectionsPromise;
                        await variableSectionsPromise;
                        renderVehicleScore(plate);

                        // El informe principal ya está listo: no ocultar sus
                        // tarjetas por verificaciones lentas (Lunas/SPRL).
                        // El ticket permanece activo para los trabajos de fondo.
                        queryStatus.textContent = 'Resultados principales listos. Verificando historial registral avanzado...';
                        hideLoadingOverlay();
                        saveToCache(plate);
                        console.info('[UI-MAIN-READY]', {
                            elapsed_ms: Math.round(performance.now() - consultationStartedAt),
                            last_core_provider: 'sat',
                            consultation_id: activeConsultationId,
                        });

                        // Callao es HTTP/OCR, no Chromium. Corre tras SAT con
                        // la interfaz disponible y no bloquea Lima/Municipal.
                        const callaoBackgroundPromise = (async () => {
                            const startedAt = performance.now();
                            console.info('[SCHEDULER] provider=callao priority=85 reason=background_after_sat state=started');
                            const result = await runSectionSafely('callao', () => fetchCallao(plate));
                            console.info(
                                '[SCHEDULER] provider=callao priority=85 state=finished success=%s duration_ms=%d',
                                Boolean(result?.success),
                                Math.round(performance.now() - startedAt),
                            );
                            renderVehicleScore(plate);
                            saveToCache(plate);
                            return result;
                        })();

                        const limaBackgroundPromise = (async () => {
                            if (!limaNode) return null;
                            const startedAt = performance.now();
                            console.info('[SCHEDULER] provider=lima priority=88 reason=background_after_sat state=started');
                            const result = await runSectionsWithDependencies([{ ...limaNode, deps: [], run: () => runAdvancedSection(limaNode.id) }], 1);
                            console.info('[SCHEDULER] provider=lima priority=88 state=finished duration_ms=%d', Math.round(performance.now() - startedAt));
                            renderVehicleScore(plate);
                            saveToCache(plate);
                            return result;
                        })();

                        // Lunas se programa al final, después de Municipal y
                        // SPRL. Nunca se inicia dos veces automáticamente: su
                        // única ejecución usa el presupuesto interno del proveedor.
                        let lunasDeferredRetry: Promise<any> = Promise.resolve();
                        backgroundStatusNotice = setTimeout(() => {
                            if (consultationLifecycle === 'active') {
                                queryStatus.textContent = 'La verificación registral está tardando más de lo esperado. Puedes seguir viendo los resultados principales.';
                                queryStatus.classList.remove('opacity-0');
                            }
                        }, 45000);

                        await limaBackgroundPromise;

                        // SPRL es independiente de Municipal y tarda ~49s en
                        // una consulta real. Despacharlo apenas termina Lima
                        // evita sumar la espera de ATU y Municipal antes de
                        // siquiera entrar a la cola del navegador.
                        let historialPromise: Promise<any> = Promise.resolve();
                        if (historialNode) {
                            const historialStartedAt = performance.now();
                            console.info('[SCHEDULER] provider=historial_dueños priority=89 reason=after_lima state=queued');
                            historialPromise = runSectionsWithDependencies([
                                { ...historialNode, deps: [], run: () => runAdvancedSection(historialNode.id) },
                            ], 1, {
                                onStart: async ({ id, queue_wait_ms }: { id: string; queue_wait_ms: number }) => console.info(
                                    `[SCHEDULER] provider=${id} priority=89 state=started queue_ms=${Math.round(queue_wait_ms)}`
                                ),
                                onFinish: ({ id, processing_ms, status }: { id: string; processing_ms: number; status: string }) => console.info(
                                    `[SCHEDULER] provider=${id} priority=89 state=${status} duration_ms=${Math.round(processing_ms)}`
                                ),
                            }).then((result) => {
                                historialElapsedMs = Math.round(performance.now() - historialStartedAt);
                                renderVehicleScore(plate);
                                saveToCache(plate);
                                return result;
                            });
                        }

                        if (municipalNode) {
                            const municipalStartedAt = performance.now();
                            console.info('[SCHEDULER] provider=municipal priority=90 reason=background_after_sat state=queued');
                            await runSectionsWithDependencies([
                                {
                                    ...municipalNode,
                                    // SAT terminó en el lote principal; este
                                    // scheduler independiente no conoce sus
                                    // dependencias ya satisfechas.
                                    deps: [],
                                    run: () => runAdvancedSection(municipalNode.id),
                                },
                            ], 1, {
                                onStart: async ({ id, queue_wait_ms }: { id: string; queue_wait_ms: number }) => console.info(
                                    `[SCHEDULER] provider=${id} priority=90 state=started queue_ms=${Math.round(queue_wait_ms)}`
                                ),
                                onFinish: ({ id, processing_ms, status }: { id: string; processing_ms: number; status: string }) => console.info(
                                    `[SCHEDULER] provider=${id} priority=90 state=${status} duration_ms=${Math.round(processing_ms)}`
                                ),
                            });
                            municipalElapsedMs = Math.round(performance.now() - municipalStartedAt);
                        }

                        // ATU no usa Chromium. Su ciclo sigue formando parte
                        // de la consulta, pero ya no retrasa el despacho SPRL.
                        await atuInfraccionesPromise;
                        renderVehicleScore(plate);
                        // La llamada registral ya corre mientras se resuelve
                        // Municipal; el error de una no cancela a la otra.
                        await historialPromise;
                        if (consultationLifecycle === 'active' && activeConsultationTicket) {
                            lunasDeferredRetry = (async () => {
                                const startedAt = performance.now();
                                console.info('[SCHEDULER] provider=lunas priority=110 reason=final_after_historial state=started');
                                setCardLoading('lunas', 'Lunas Oscurecidas', 'Verificando permiso policial...', 'fas fa-car-side', '', 'PNP');
                                const result = await runSectionSafely('lunas', () => fetchLunas(plate));
                                console.info('[SCHEDULER] provider=lunas priority=110 state=finished success=%s duration_ms=%d', Boolean(result?.success), Math.round(performance.now() - startedAt));
                                renderVehicleScore(plate);
                                saveToCache(plate);
                                return result;
                            })();
                        }
                        await lunasDeferredRetry;
                        await callaoBackgroundPromise;

                        // ============================================================================
                        // ARQUITECTURA DIFERIDA SBS: AISLAMIENTO TOTAL DE LATENCIA
                        // ============================================================================
                        // 1. ¿QUÉ SE HIZO AQUÍ?
                        //    SBS (historial de siniestros SOAT) requiere DrissionPage + Headed Browser
                        //    bajo Xvfb. Puede demorar entre 25s y 70s según la respuesta de Imperva.
                        // 2. AISLAMIENTO: Para que el usuario vea SUNARP, Papeletas SAT, ATU, MTC
                        //    y Lunas Polarizadas de inmediato (<3 segundos), SBS se ejecuta de forma
                        //    DIFERIDA (deferred promise) en segundo plano.
                        // 3. TOLERANCIA A FALLOS: Si SBS excede el tiempo o falla, solo se marca
                        //    su tarjeta individual con opción a "Reintentar", sin afectar en lo absoluto
                        //    el score vehicular ni las demás secciones ya exitosas.
                        // ============================================================================
                        // FASE FINAL ABSOLUTA: SBS Siniestralidad Vehicular.
                        // Corre AL ÚLTIMO, únicamente después de que Lunas Polarizadas y el resto
                        // de consultas hayan terminado o estén resueltas. Sus demoras, reintentos
                        // o timeouts nunca retrasan ni bloquean ninguna otra consulta.
                        let sbsDeferredPromise: Promise<any> = Promise.resolve();
                        if (consultationLifecycle === 'active' && activeConsultationTicket) {
                            sbsDeferredPromise = (async () => {
                                const startedAt = performance.now();
                                console.info('[SCHEDULER] provider=sbs priority=120 reason=final_after_lunas state=started');
                                setCardLoading('sbs', 'Siniestralidad Vehicular', 'Consultando historial de siniestros...', 'fas fa-car-burst', '', 'SBS');
                                const result = await runSectionSafely('sbs', () => fetchSBS(plate));
                                console.info(
                                    '[SCHEDULER] provider=sbs priority=120 state=finished success=%s duration_ms=%d',
                                    Boolean(result?.success),
                                    Math.round(performance.now() - startedAt),
                                );
                                renderVehicleScore(plate);
                                saveToCache(plate);
                                return result;
                            })();
                        }
                        await sbsDeferredPromise;
                    } catch (err) {
                        console.error('[FASES] Error general en ejecución por fases:', err);
                        clearTimeout(safetyLoaderTimeout);
                        hideConsultationQueueModal();
                        hideLoadingOverlay();
                        queueError = (err as any)?.name?.startsWith('ConsultationQueue') || false;
                        if (queueError) {
                            queryStatus.innerHTML = `<span class="text-rose-600 font-bold"><i class="fas fa-users mr-1"></i> ${(err as any).message || 'Estamos atendiendo muchas consultas. Inténtalo nuevamente en unos segundos.'}</span>`;
                            queryStatus.classList.remove('opacity-0');
                        }
                    } finally {
                        if (backgroundStatusNotice) clearTimeout(backgroundStatusNotice);
                        hideConsultationQueueModal();
                        console.info('[CONSULTATION-FULL-COMPLETE]', {
                            consultation_id: activeConsultationId,
                            total_ms: Math.round(performance.now() - consultationStartedAt),
                            municipal_ms: municipalElapsedMs,
                            sprl_ms: historialElapsedMs,
                        });
                        consultationLifecycle = 'completed';
                        clearTimeout(safetyLoaderTimeout);
                        hideLoadingOverlay();
                        if (activeConsultationTicket) {
                            const ticketToRelease = activeConsultationTicket;
                            completedConsultationTicket = ticketToRelease;
                            activeConsultationTicket = null;
                            await releaseConsultationSlot(BACKEND_URL, ticketToRelease);
                            setConsultationTicket(null);
                        }
                        setConsultationId(null);
                        if (consultationHeartbeat) {
                            clearInterval(consultationHeartbeat);
                            consultationHeartbeat = null;
                        }
                        if (!queueError) queryStatus.classList.add('opacity-0');
                        if (submitBtn) {
                            let cooldown = 5;
                            const interval = setInterval(() => {
                                if (cooldown > 0) {
                                    submitBtn.disabled = true;
                                    submitBtn.classList.add('opacity-60', 'cursor-not-allowed');
                                    submitBtn.innerHTML = `<i class="fas fa-clock"></i> Esperar ${cooldown}s`;
                                    cooldown--;
                                } else {
                                    clearInterval(interval);
                                    submitBtn.disabled = false;
                                    submitBtn.classList.remove('opacity-60', 'cursor-not-allowed');
                                    submitBtn.innerHTML = '<i class="fas fa-search text-xs"></i><span id="submit-btn-text">Consultar Placa</span><i class="fas fa-arrow-right text-xs ml-0.5"></i>'; updateSubmitButtonState();
                                    isSubmitting = false;
                                }
                            }, 1000);
                            submitBtn.disabled = true;
                            submitBtn.classList.add('opacity-60', 'cursor-not-allowed');
                            submitBtn.innerHTML = `<i class="fas fa-clock"></i> Esperar ${cooldown}s`;
                            cooldown--;
                        } else {
                            isSubmitting = false;
                        }
                    }
                })();
            });
        }


        function renderVehicleScore(plate: string) {
            renderVehicleScoreCard(plate, sectionResults);
        }

        setupDocumentViewer(BACKEND_URL, () => activeConsultationTicket);

        // ====================================================
