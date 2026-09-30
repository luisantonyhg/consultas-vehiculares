import { openScannerModal } from '../../ui/scanner_modal.ts';
import { setSection, badgeLoading, badgeWaiting } from './dni-state.ts';
import { startDniStream } from './dni-stream-client.ts';
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
                console.info('[DNI] section retried', { section, status: payload.status, elapsed_ms: payload.elapsed_ms, cached: payload.cached });
            } catch (error) {
                console.warn('[DNI] section retry failed', { section, error });
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
                const released = await releaseConsultationSlot(BACKEND_URL, ticket);
                if (released) {
                    console.info('[DNI] ticket released', { reason, ticket: ticket.slice(0, 8) });
                } else {
                    console.warn('[DNI] ticket release was not confirmed', { reason, ticket: ticket.slice(0, 8) });
                }
            } catch (error) {
                console.warn('[DNI] ticket release failed', { reason, ticket: ticket.slice(0, 8), error });
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
            console.info('[DNI] consultation started', { requestId });
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
                if (dniLoaderStatus) dniLoaderStatus.textContent = 'Consultando fuentes oficiales una por una...';
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
                let admission = await acquireConsultationSlot(BACKEND_URL, captchaProof);
                if (admission?.supported) {
                    activeConsultationTicket = admission.ticket_id;
                    admission = await waitForConsultationSlot(BACKEND_URL, admission, (state: any) => {
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
                    console.info('[DNI] ticket active', { requestId, ticket: ticketId.slice(0, 8) });
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
                console.warn('[DNI-QUEUE] Error reservando turno:', ticketErr);
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
                    if (reason === 'done') {
                        queryStatus.innerHTML = '<span class="text-emerald-700 font-bold"><i class="fas fa-circle-check mr-1"></i> Consulta de identidad completada.</span>';
                    } else {
                        const message = detail instanceof Error ? detail.message : 'La consulta se interrumpió. Puedes intentarlo nuevamente.';
                        queryStatus.textContent = message;
                        queryStatus.className = 'text-rose-600 font-bold';
                    }
                }
                console.info('[DNI] stream closed', { requestId, reason });
            };

            activeDniStream = startDniStream(
                dni,
                ticketId,
                (section, data) => {
                    if (requestId !== dniRequestId) return;
                    console.info('[DNI] provider completed', { requestId, section, status: (data as any)?.status || 'OK' });
                    if (dniLoaderStatus) {
                        const labels: Record<string, string> = {
                            identidad: 'INFORMACIÓN PERSONAL', sunat: 'SUNAT', jne_multas: 'JNE',
                            transporte_licencias: 'MTC · Licencias', transporte_record: 'MTC · Récord',
                            transporte_papeletas: 'MTC – Consulta de Papeletas / Sanciones', minedu: 'MINEDU',
                            osce: 'OECE - Proveedores Adjudicados', infogob: 'INFOGOB', webmii: 'WebMii / Presencia Digital'
                        };
                        dniLoaderStatus.textContent = `Sección completada: ${labels[section] || section}. Continuando con la siguiente...`;
                    }
                    if (section === 'identidad') {
                        setSection(section, data);
                        hideDniModal();
                        const nextCard = document.getElementById(`dni-card-${dniSequence[1]}`);
                        const nextBadge = nextCard?.querySelector('.status-badge-container');
                        if (nextBadge) nextBadge.innerHTML = badgeLoading();
                        return;
                    }
                    setSection(section, data);
                    const sequenceIndex = dniSequence.indexOf(section);
                    const nextSection = dniSequence[sequenceIndex + 1];
                    const nextCard = nextSection ? document.getElementById(`dni-card-${nextSection}`) : null;
                    const nextBadge = nextCard?.querySelector('.status-badge-container');
                    if (nextBadge) nextBadge.innerHTML = badgeLoading();
                },
                () => cleanupStream('done'),
                (error) => cleanupStream('error', error)
            );
        }
    return {
        dniInput,
        setSearchMode,
        triggerDniConsultation,
        getCurrentSearchMode: () => currentSearchMode,
    };
}
