import { openScannerModal } from '../../ui/scanner_modal.ts';
import { setSection, badgeLoading, badgeWaiting } from './dni-state.ts';
import { startDniStream, type DniDiagnostic } from './dni-stream-client.ts';
import { acquireConsultationSlot, waitForConsultationSlot, touchConsultationSlot, releaseConsultationSlot } from '../../services/consultation_queue.js';
import { setConsultationTicket } from '../../services/api.js';
import { backendBase } from './dni-stream-client.ts';

const BACKEND_URL = backendBase();

export function initDniConsultation(plateInput: HTMLInputElement | null) {
        let activeDniStream: ReturnType<typeof startDniStream> | null = null;
        let dniRequestId = 0;
        let activeDniTicket: string | null = null;
        let lastDniTicketForRetry: string | null = null;
        let activeDniHeartbeat: ReturnType<typeof setInterval> | null = null;
        let dniTraceStartedAt = 0;
        let activeDniTraceId = '';

        const recordDniDiagnostic = (event: DniDiagnostic) => {
            const allowed = [
                'source', 'request_id', 'backend_request_id', 'provider', 'stage', 'status',
                'elapsed_ms', 'provider_elapsed_ms', 'payload_bytes', 'reason',
                'providers_ok', 'providers_fail', 'position', 'estimated_wait_seconds', 'load_mode',
                'attempt', 'http', 'bytes', 'chars', 'solved', 'candidates', 'top_votes',
                'rejected', 'licenses', 'message_class',
                'route',
            ];
            const safe: Record<string, unknown> = {};
            for (const key of allowed) {
                const value = event[key];
                if (value === undefined || value === null || typeof value === 'object') continue;
                const text = String(value);
                safe[key] = /request_id|provider|stage|status|reason|source|load_mode/.test(key)
                    ? text.replace(/[^A-Za-z0-9_.:-]/g, '').slice(0, 80)
                    : value;
            }
            const elapsed = dniTraceStartedAt ? ((performance.now() - dniTraceStartedAt) / 1000).toFixed(2) : '0.00';
            // Eventos acotados y sin PII; el diagnóstico queda en DevTools,
            // nunca se renderiza como un terminal dentro de los resultados.
            console.log(`[DNI-TRACE] +${elapsed}s`, safe);
        };

        // Reintento de UNA sola sección DNI (ej. papeletas tras timeout).
        // Usa el ticket original dentro de la ventana de gracia manual del
        // backend; el caché responde al instante si ya quedó OK.
        const retryDniSection = async (section: string, btn: HTMLElement) => {
            const dniVal = (dniInput?.value || '').trim();
            const ticket = lastDniTicketForRetry || activeDniTicket;
            if (!section || !dniVal || !ticket) {
                console.warn('[DNI] retry sin datos', { section, hasDni: Boolean(dniVal), hasTicket: Boolean(ticket) });
                return;
            }
            const prevHtml = btn.innerHTML;
            const retryStartedAt = performance.now();
            recordDniDiagnostic({ source: 'frontend', request_id: activeDniTraceId, provider: section, stage: 'manual_retry_started', status: 'RUNNING' });
            btn.setAttribute('disabled', 'true');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin text-[10px]"></i> Reintentando...';
            try {
                const resp = await fetch(`${BACKEND_URL}/dni/seccion`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Consultation-Ticket': ticket, 'X-Manual-Retry': '1' },
                    body: JSON.stringify({ dni: dniVal, seccion: section }),
                });
                const payload = await resp.json().catch(() => ({}));
                if (!resp.ok) throw new Error(payload?.error || `HTTP ${resp.status}`);
                setSection(section, payload);
                recordDniDiagnostic({ source: 'frontend', request_id: activeDniTraceId, provider: section, stage: 'manual_retry_completed', status: payload.status || 'OK', elapsed_ms: performance.now() - retryStartedAt, reason: payload.error ? 'provider_error' : undefined });
                console.info('[DNI] section retried', { section, status: payload.status, elapsed_ms: payload.elapsed_ms, cached: payload.cached });
            } catch (error) {
                recordDniDiagnostic({ source: 'frontend', request_id: activeDniTraceId, provider: section, stage: 'manual_retry_failed', status: 'ERROR', reason: error instanceof Error ? error.name : 'RETRY_ERROR', elapsed_ms: performance.now() - retryStartedAt });
                console.warn('[DNI] section retry failed', { section, reason: error instanceof Error ? error.name : 'RETRY_ERROR' });
                setSection(section, { status: 'ERROR', data: {}, error: error instanceof Error ? error.message : String(error) });
            } finally {
                btn.removeAttribute('disabled');
                btn.innerHTML = prevHtml;
            }
        };
        document.addEventListener('click', (ev) => {
            const btn = (ev.target as HTMLElement)?.closest?.('[data-dni-retry]') as HTMLElement | null;
            if (!btn || btn.hasAttribute('disabled')) return;
            ev.preventDefault();
            void retryDniSection(btn.getAttribute('data-dni-retry') || '', btn);
        });

        const releaseDniTicket = async (ticket: string, reason: string) => {
            if (!ticket) return;
            if (activeDniTicket === ticket) {
                activeDniTicket = null;
                if (activeDniHeartbeat) clearInterval(activeDniHeartbeat);
                activeDniHeartbeat = null;
                setConsultationTicket(null);
            }
            try {
                const released = await releaseConsultationSlot(
                    BACKEND_URL, ticket, reason === 'pagehide', reason === 'pagehide' ? 'client_pagehide' : '', 'dni'
                );
                if (released) {
                    console.info('[DNI] ticket released', { reason });
                } else {
                    console.warn('[DNI] ticket release was not confirmed', { reason });
                }
            } catch (error) {
                console.warn('[DNI] ticket release failed', { reason, error_type: error instanceof Error ? error.name : 'RELEASE_ERROR' });
            }
        };

        // Evita conservar capacidad si se cierra o recarga la página durante
        // un stream. Si la red no permite completar el POST, el lease del
        // backend sigue siendo el último mecanismo de recuperación.
        window.addEventListener('pagehide', () => {
            activeDniStream?.close();
            if (activeDniTicket) void releaseDniTicket(activeDniTicket, 'pagehide');
        });
        // ====================================================
        // GESTOR DE MODOS UNIFICADO: PLACA O DNI
        // ====================================================
        let currentSearchMode: 'placa' | 'dni' = 'placa';
        const tabPlaca = document.getElementById('tab-mode-placa');
        const tabDni = document.getElementById('tab-mode-dni');
        const fieldIcon = document.getElementById('field-icon');
        const fieldText = document.getElementById('field-text');
        const plateInputContainer = document.getElementById('plate-input-container');
        const dniInputContainer = document.getElementById('dni-input-container');
        const dniInput = document.getElementById('dni-search-input') as HTMLInputElement;
        const scanCard = document.getElementById('scan-card');
        const scanTitle = document.getElementById('scan-title');
        const scanDesc = document.getElementById('scan-desc');
        const captchaRow = document.getElementById('captcha-row');
        const resultsSection = document.getElementById('results-section');
        const dniResultsSection = document.getElementById('dni-results-section');

        function setSearchMode(mode: 'placa' | 'dni') {
            // El cambio de pestaña no debe abrir el teclado virtual.
            const focusedInput = document.activeElement;
            if (focusedInput instanceof HTMLInputElement) focusedInput.blur();
            currentSearchMode = mode;
            const submitBtnText = document.getElementById('submit-btn-text');
            if (mode === 'placa') {
                if (submitBtnText) submitBtnText.textContent = 'Consultar Placa';
                tabPlaca?.classList.remove('tab-inactive-gold');
                tabPlaca?.classList.add('tab-active-gold');
                tabDni?.classList.remove('tab-active-gold');
                tabDni?.classList.add('tab-inactive-gold');

                if (fieldIcon) fieldIcon.className = 'fas fa-car text-[#a36b1d] text-xs';
                if (fieldText) fieldText.textContent = 'PLACA A CONSULTAR';
                plateInputContainer?.classList.remove('hidden');
                dniInputContainer?.classList.add('hidden');
                captchaRow?.classList.remove('hidden');

                if (scanTitle) scanTitle.textContent = 'Escanear placa';
                if (scanDesc) scanDesc.textContent = 'Usa la cámara para leer automáticamente';


                if (resultsSection) resultsSection.classList.remove('hidden');
                if (dniResultsSection) dniResultsSection.classList.add('hidden');

            } else {
                if (submitBtnText) submitBtnText.textContent = 'Consultar DNI';
                tabDni?.classList.remove('tab-inactive-gold');
                tabDni?.classList.add('tab-active-gold');
                tabPlaca?.classList.remove('tab-active-gold');
                tabPlaca?.classList.add('tab-inactive-gold');

                if (fieldIcon) fieldIcon.className = 'far fa-id-card text-[#a36b1d] text-xs';
                if (fieldText) fieldText.textContent = 'DNI A CONSULTAR';
                plateInputContainer?.classList.add('hidden');
                dniInputContainer?.classList.remove('hidden');
                // captchaRow stays visible for DNI too

                if (scanTitle) scanTitle.textContent = 'Escanear DNI';
                if (scanDesc) scanDesc.textContent = 'Voltea el DNI y enfoca el código de barras del reverso';


                if (resultsSection) resultsSection.classList.add('hidden');
                if (dniResultsSection) dniResultsSection.classList.remove('hidden');

            }

        }

        tabPlaca?.addEventListener('click', () => setSearchMode('placa'));
        tabDni?.addEventListener('click', () => setSearchMode('dni'));

        if (dniInput) {
            dniInput.addEventListener('input', () => {
                dniInput.value = dniInput.value.replace(/\D/g, '').slice(0, 8);
            });
        }

        scanCard?.addEventListener('click', () => {
            openScannerModal({
                mode: currentSearchMode,
                onSuccess: (val) => {
                    if (currentSearchMode === 'placa') {
                        if (plateInput) {
                            plateInput.value = val;
                            plateInput.dispatchEvent(new Event('input'));
                        }
                    } else {
                        if (dniInput) {
                            dniInput.value = val;
                            dniInput.dispatchEvent(new Event('input'));
                        }
                    }
                }
            });
        });

        (window as any).toggleDniAccordion = function(cardId: string) {
            const card = document.getElementById(cardId);
            if (!card) return;
            const body = card.querySelector('.accordion-body');
            const header = card.querySelector('.accordion-header');
            const chevron = card.querySelector('.accordion-chevron');
            if (body) body.classList.toggle('hidden');
            const isExpanded = Boolean(body && !body.classList.contains('hidden'));
            if (header) {
                header.classList.remove('bg-white', 'text-slate-900', 'bg-gradient-to-r', 'from-[#1a3a6b]', 'to-[#0b1c36]', 'text-white', 'border-b-2', 'border-slate-900');
                header.classList.add(...(isExpanded
                    ? ['bg-gradient-to-r', 'from-[#1a3a6b]', 'to-[#0b1c36]', 'text-white', 'border-b-2', 'border-slate-900']
                    : ['bg-white', 'text-slate-900']));
                const title = header.querySelector('h3');
                title?.classList.toggle('text-white', isExpanded);
                title?.classList.toggle('text-slate-900', !isExpanded);
                const subtitle = header.querySelector('p');
                subtitle?.classList.toggle('text-white/60', isExpanded);
                subtitle?.classList.toggle('text-slate-400', !isExpanded);
            }
            if (chevron) {
                chevron.classList.toggle('rotate-180', isExpanded);
                chevron.classList.toggle('text-white', isExpanded);
                chevron.classList.toggle('text-slate-400', !isExpanded);
            }
        };

        async function triggerDniConsultation(dni: string) {
            // Una búsqueda nueva invalida los eventos tardíos de la anterior.
            // El stream de placa utiliza otro flujo y no comparte este estado.
            activeDniStream?.close();
            if (activeDniTicket) void releaseDniTicket(activeDniTicket, 'superseded');
            const requestId = ++dniRequestId;
            dniTraceStartedAt = performance.now();
            const traceId = (() => {
                try { return crypto.randomUUID(); }
                catch { return `dni-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; }
            })();
            activeDniTraceId = traceId;
            recordDniDiagnostic({ source: 'frontend', request_id: traceId, provider: 'frontend', stage: 'consultation_started', status: 'RUNNING' });
            if (resultsSection) resultsSection.classList.add('hidden');
            if (dniResultsSection) {
                dniResultsSection.classList.remove('hidden');
                dniResultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            const dniInitialState = document.getElementById('dni-initial-state');
            const dniCardsContainer = document.getElementById('dni-cards-container');
            const dniLoadingOverlay = document.getElementById('dni-loading-overlay');
            const dniLoaderBadge = document.getElementById('dni-loader-badge');
            const dniLoaderStatus = document.getElementById('dni-loader-status');

            if (dniInitialState) dniInitialState.classList.add('hidden');
            if (dniCardsContainer) {
                dniCardsContainer.classList.remove('hidden');
                dniCardsContainer.classList.add('flex');
            }

            const allDniSections = [
                'identidad', 'sunat', 'jne_multas', 'transporte_licencias', 
                'transporte_record', 'transporte_papeletas', 'minedu', 'osce', 'infogob', 'webmii'
            ];
            const dniSequence = [
                'identidad', 'infogob', 'sunat', 'osce', 'webmii', 'minedu',
                'transporte_record', 'transporte_papeletas', 'transporte_licencias', 'jne_multas',
            ];

            allDniSections.forEach((sec) => {
                const card = document.getElementById(`dni-card-${sec}`);
                if (card) {
                    const badge = card.querySelector('.status-badge-container');
                    const skeleton = card.querySelector('.card-skeleton');
                    const bodyContent = card.querySelector('.card-body-content');
                    const body = card.querySelector('.accordion-body');
                    const header = card.querySelector('.accordion-header');
                    const chevron = card.querySelector('.accordion-chevron');

                    if (body) body.classList.add('hidden');
                    if (chevron) {
                        chevron.classList.remove('rotate-180', 'text-white');
                        chevron.classList.add('text-slate-400');
                    }
                    if (header) {
                        header.classList.remove('bg-gradient-to-r', 'from-[#1a3a6b]', 'to-[#0b1c36]', 'text-white', 'border-b-2', 'border-slate-900');
                        header.classList.add('bg-white', 'text-slate-900');
                        const title = header.querySelector('h3');
                        if (title) {
                            title.classList.remove('text-white');
                            title.classList.add('text-slate-900');
                        }
                        const sub = header.querySelector('p');
                        if (sub) {
                            sub.classList.remove('text-white/60');
                            sub.classList.add('text-slate-400');
                        }
                    }

                    if (badge) {
                        const position = dniSequence.indexOf(sec) + 1;
                        badge.innerHTML = sec === 'identidad' ? badgeLoading() : badgeWaiting(position);
                    }
                    if (skeleton) skeleton.classList.remove('hidden');
                    if (bodyContent) {
                        bodyContent.classList.add('hidden');
                        bodyContent.innerHTML = '';
                    }
                }
            });

            const hideDniModal = () => {
                if (!dniLoadingOverlay || dniLoadingOverlay.classList.contains('hidden')) return;
                dniLoadingOverlay.style.opacity = '0';
                setTimeout(() => {
                    dniLoadingOverlay.classList.remove('flex');
                    dniLoadingOverlay.classList.add('hidden');
                }, 300);
            };

            if (dniLoadingOverlay) {
                if (dniLoaderBadge) dniLoaderBadge.textContent = dni;
                if (dniLoaderStatus) dniLoaderStatus.textContent = 'Consultando fuentes oficiales en paralelo...';
                dniLoadingOverlay.classList.remove('hidden');
                dniLoadingOverlay.classList.add('flex');
                dniLoadingOverlay.style.opacity = '1';
            }

            const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement | null;
            const queryStatus = document.getElementById('query-status');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add('opacity-60', 'cursor-not-allowed', 'pointer-events-none');
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Consultando...';
            }

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
                description.textContent = `Tu turno está reservado en la posición ${queuePosition}. Iniciaremos la consulta de DNI automáticamente cuando exista capacidad, sin que tengas que recargar la página.`;
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

            let ticketId = '';
            let activeConsultationTicket = '';
            const queueStartedAt = performance.now();
            try {
                const turnstileToken = (window as any).__canitaTurnstileToken || '';
                const captchaProof = {
                    turnstileToken,
                    mode: 'turnstile',
                    valid: Boolean(turnstileToken),
                };
                if (queryStatus) {
                    queryStatus.innerHTML = '<i class="fas fa-ticket mr-1"></i> Reservando turno seguro para DNI...';
                    queryStatus.classList.remove('opacity-0');
                }
                recordDniDiagnostic({ source: 'frontend', request_id: traceId, provider: 'queue', stage: 'ticket_reservation_started', status: 'RUNNING' });
                let admission = await acquireConsultationSlot(BACKEND_URL, captchaProof);
                if (admission?.supported) {
                    activeConsultationTicket = admission.ticket_id;
                    admission = await waitForConsultationSlot(BACKEND_URL, admission, (state: any) => {
                        recordDniDiagnostic({ source: 'frontend', request_id: traceId, provider: 'queue', stage: state.status === 'queued' ? 'ticket_queued' : 'ticket_state_changed', status: String(state.status || 'UNKNOWN'), position: Number(state.position) || 0, estimated_wait_seconds: Number(state.estimated_wait_seconds) || 0, load_mode: String(state.load_mode || '') });
                        if (state.status === 'queued') {
                            const wait = Math.max(1, Math.round((state.estimated_wait_seconds || 0) / 60));
                            showConsultationQueueModal(state);
                            if (queryStatus) {
                                queryStatus.innerHTML = `<span class="text-amber-600 font-bold"><i class="fas fa-hourglass-half mr-1"></i> Alta demanda: estás en la posición ${state.position}. Espera estimada: ${wait} min. Tu consulta iniciará automáticamente.</span>`;
                            }
                            if (dniLoaderStatus) {
                                dniLoaderStatus.textContent = `Alta demanda · turno ${state.position} · aprox. ${wait} min`;
                            }
                        } else {
                            hideConsultationQueueModal();
                            const modeLabel = state.load_mode === 'fast' ? 'Modo rápido' : state.load_mode === 'balanced' ? 'Modo balanceado' : 'Modo protegido';
                            if (queryStatus) {
                                queryStatus.innerHTML = `<span class="text-emerald-600 font-bold"><i class="fas fa-bolt mr-1"></i> Turno confirmado · ${modeLabel}. Consultando fuentes oficiales...</span>`;
                            }
                        }
                    });
                    ticketId = admission?.ticket_id || activeConsultationTicket;
                    activeDniTicket = ticketId;
                    lastDniTicketForRetry = ticketId;
                    setConsultationTicket(ticketId);
                    recordDniDiagnostic({ source: 'frontend', request_id: traceId, provider: 'queue', stage: 'ticket_active', status: 'OK', elapsed_ms: performance.now() - queueStartedAt });
                    console.info('[DNI] ticket active', { requestId, request_id: traceId });
                    activeDniHeartbeat = setInterval(() => {
                        if (ticketId && document.visibilityState === 'visible') {
                            void touchConsultationSlot(BACKEND_URL, ticketId);
                        }
                    }, 45000);
                }
                if (queryStatus) {
                    queryStatus.innerHTML = '<span class="text-emerald-600 font-bold"><i class="fas fa-bolt mr-1"></i> Turno confirmado. Analizando fuentes oficiales...</span>';
                }
            } catch (ticketErr: any) {
                recordDniDiagnostic({ source: 'frontend', request_id: traceId, provider: 'queue', stage: 'ticket_reservation_failed', status: 'ERROR', reason: ticketErr?.code || ticketErr?.name || 'QUEUE_ERROR', elapsed_ms: performance.now() - queueStartedAt });
                console.warn('[DNI-QUEUE] Error reservando turno', { request_id: traceId, reason: ticketErr?.code || ticketErr?.name || 'QUEUE_ERROR' });
                hideDniModal();
                hideConsultationQueueModal();
                if (queryStatus) {
                    queryStatus.innerHTML = `<span class="text-rose-500 font-bold"><i class="fas fa-triangle-exclamation mr-1"></i>${ticketErr?.message || 'Error al reservar turno de consulta.'}</span>`;
                    queryStatus.classList.remove('opacity-0');
                }
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('opacity-60', 'cursor-not-allowed', 'pointer-events-none');
                    submitBtn.innerHTML = '<i class="fas fa-search text-xs"></i><span id="submit-btn-text">Consultar DNI</span><i class="fas fa-arrow-right text-xs ml-0.5"></i>';
                }
                return;
            }

            const cleanupStream = (reason: 'done' | 'error', detail?: unknown) => {
                const doneReason = detail && typeof detail === 'object' && 'reason' in detail ? String((detail as { reason?: unknown }).reason || '') : '';
                const identityStopped = reason === 'done' && doneReason === 'identity_not_found';
                const identityPartial = reason === 'done' && doneReason === 'identity_unverified_partial';
                recordDniDiagnostic({ source: 'frontend', request_id: traceId, provider: 'frontend', stage: 'consultation_finished', status: identityStopped ? 'STOPPED' : identityPartial ? 'PARTIAL' : reason === 'done' ? 'OK' : 'ERROR', reason: identityStopped || identityPartial ? 'identity_not_confirmed' : reason === 'error' ? (detail instanceof Error ? detail.message : 'STREAM_ERROR') : undefined, elapsed_ms: performance.now() - dniTraceStartedAt });
                void releaseDniTicket(ticketId, reason);
                if (requestId !== dniRequestId) return;
                hideDniModal();
                hideConsultationQueueModal();
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('opacity-60', 'cursor-not-allowed', 'pointer-events-none');
                    submitBtn.innerHTML = '<i class="fas fa-search text-xs"></i><span id="submit-btn-text">Consultar DNI</span><i class="fas fa-arrow-right text-xs ml-0.5"></i>';
                }
                if (queryStatus) {
                    if (identityStopped) {
                        queryStatus.textContent = 'No se pudo verificar la identidad con las fuentes disponibles. Las demás secciones se detuvieron; vuelve a intentarlo más tarde.';
                        queryStatus.className = 'text-rose-600 font-bold';
                    } else if (identityPartial) {
                        queryStatus.textContent = 'No se verificó el nombre. Se consultaron las fuentes que aceptan DNI; WebMii y MINEDU quedan sin confirmar.';
                        queryStatus.className = 'text-amber-700 font-bold';
                    } else if (reason === 'done') {
                        queryStatus.innerHTML = '<span class="text-emerald-700 font-bold"><i class="fas fa-circle-check mr-1"></i> Consulta de identidad completada.</span>';
                    } else {
                        const message = detail instanceof Error ? detail.message : 'La consulta se interrumpió. Puedes intentarlo nuevamente.';
                        queryStatus.textContent = message;
                        queryStatus.className = 'text-rose-600 font-bold';
                    }
                }
                console.info('[DNI] stream closed', { requestId, request_id: traceId, reason });
            };

            activeDniStream = startDniStream(
                dni,
                ticketId,
                (section, data) => {
                    if (requestId !== dniRequestId) return;
                    recordDniDiagnostic({ source: 'frontend', request_id: traceId, provider: section, stage: 'provider_result_received', status: (data as any)?.status || 'OK', elapsed_ms: Number((data as any)?.elapsed_ms) || 0, reason: (data as any)?.error ? 'provider_error' : undefined });
                    console.info('[DNI] provider completed', { requestId, request_id: traceId, section, status: (data as any)?.status || 'OK', elapsed_ms: (data as any)?.elapsed_ms });
                    if (dniLoaderStatus) {
                        const labels: Record<string, string> = {
                            identidad: 'INFORMACIÓN PERSONAL', sunat: 'SUNAT', jne_multas: 'JNE',
                            transporte_licencias: 'MTC · Licencias', transporte_record: 'MTC · Récord',
                            transporte_papeletas: 'MTC – Consulta de Papeletas / Sanciones', minedu: 'MINEDU',
                            osce: 'OECE - Proveedores Adjudicados', infogob: 'INFOGOB', webmii: 'WebMii / Presencia Digital'
                        };
                        dniLoaderStatus.textContent = `Sección completada: ${labels[section] || section}. Las demás consultas continúan en paralelo...`;
                    }
                    if (section === 'identidad') {
                        setSection(section, data);
                        hideDniModal();
                        // Las fuentes ya arrancan por carriles; indicar todas
                        // como consultando evita presentar una cola secuencial.
                        for (const providerId of dniSequence.slice(1)) {
                            const providerCard = document.getElementById(`dni-card-${providerId}`);
                            const providerBadge = providerCard?.querySelector('.status-badge-container');
                            if (providerBadge) providerBadge.innerHTML = badgeLoading();
                        }
                        return;
                    }
                    setSection(section, data);
                },
                (result) => cleanupStream('done', result),
                (error) => cleanupStream('error', error),
                (event) => recordDniDiagnostic(event),
                traceId,
            );
        }
    return {
        dniInput,
        setSearchMode,
        triggerDniConsultation,
        getCurrentSearchMode: () => currentSearchMode,
    };
}
