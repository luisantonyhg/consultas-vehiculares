/**
 * Modal visualizador oficial de papeletas SAT Lima en formato A4 interactivo.
 * Incluye zoom dinámico (+, -, Ajustar A4), arrastre/pan, descarga directa de imagen/PDF e impresión.
 */
export function setupSatTicketModal(backendUrl = '') {
    const modal = document.getElementById('sat-ticket-modal');
    const viewport = document.getElementById('sat-modal-viewport');
    const sheet = document.getElementById('sat-a4-sheet');
    const image = document.getElementById('sat-modal-img');
    const frame = document.getElementById('sat-modal-frame');
    const loader = document.getElementById('sat-modal-loader');
    const title = document.getElementById('sat-modal-doc-title');
    const download = document.getElementById('sat-modal-download-btn');
    const printBtn = document.getElementById('sat-modal-print-btn');
    const zoomInBtn = document.getElementById('sat-modal-zoom-in');
    const zoomOutBtn = document.getElementById('sat-modal-zoom-out');
    const zoomFitBtn = document.getElementById('sat-modal-zoom-fit');
    const zoomLevelBadge = document.getElementById('sat-modal-zoom-level');

    const apiBase = backendUrl || (typeof window !== 'undefined' && window.BACKEND_URL) || '';

    // Estado de Zoom y Arrastre (Pan)
    let zoomLevel = 1.0;
    let minZoom = 0.35;
    let maxZoom = 3.5;
    let panX = 0;
    let panY = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let currentDocUrl = '';
    let currentDocNumber = '';

    function applyTransform(animate = false) {
        if (sheet) {
            sheet.style.transition = animate ? 'transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none';
            sheet.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
        }
        if (zoomLevelBadge) {
            zoomLevelBadge.textContent = `${Math.round(zoomLevel * 100)}%`;
        }
    }

    function calculateFit() {
        if (!viewport || !sheet) return;
        const vW = viewport.clientWidth - 28;
        const vH = viewport.clientHeight - 28;
        // Dimensiones estándar A4 (ratio 1 : 1.414)
        const targetW = 750;
        const targetH = 1060;
        const scaleW = vW / targetW;
        const scaleH = vH / targetH;
        const fitScale = Math.min(scaleW, scaleH, 1.0);
        zoomLevel = Math.max(minZoom, Math.min(fitScale, 1.15));
        panX = 0;
        panY = 0;
        applyTransform(true);
    }

    function zoomIn() {
        zoomLevel = Math.min(maxZoom, Math.round((zoomLevel + 0.25) * 100) / 100);
        applyTransform(true);
    }

    function zoomOut() {
        zoomLevel = Math.max(minZoom, Math.round((zoomLevel - 0.25) * 100) / 100);
        applyTransform(true);
    }

    function open(url, docNumber) {
        if (!modal) return;
        currentDocUrl = url || '';
        currentDocNumber = docNumber || '';

        if (title) title.textContent = `N° Documento: ${docNumber || '—'}`;
        loader?.classList.remove('hidden');
        image?.classList.add('hidden');
        frame?.classList.add('hidden');

        // Reset transform
        zoomLevel = 1.0;
        panX = 0;
        panY = 0;
        applyTransform(false);

        // Configurar URLs del proxy backend
        const proxyBase = apiBase
            ? `${apiBase}/lima/papeleta-img?url=${encodeURIComponent(url)}&doc_number=${encodeURIComponent(docNumber || '')}`
            : url;
        const downloadUrl = apiBase
            ? `${proxyBase}&download=true`
            : url;

        if (download) {
            download.href = downloadUrl;
            download.download = `Papeleta_SAT_${docNumber || 'oficial'}.jpg`;
        }

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';

        function fallbackToFrame(frameUrl) {
            loader?.classList.add('hidden');
            image?.classList.add('hidden');
            if (frame) {
                frame.src = frameUrl;
                frame.classList.remove('hidden');
                requestAnimationFrame(() => calculateFit());
            }
        }

        // Intento 1: Extraer y renderizar la imagen real vía proxy oficial
        if (image) {
            image.src = proxyBase;
            image.onload = () => {
                loader?.classList.add('hidden');
                image.classList.remove('hidden');
                frame?.classList.add('hidden');
                requestAnimationFrame(() => calculateFit());
            };
            image.onerror = () => {
                // Si el proxy falla, verificar si es imagen directa o caer a iframe
                if (url && url.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i)) {
                    image.src = url;
                    image.onload = () => {
                        loader?.classList.add('hidden');
                        image.classList.remove('hidden');
                        requestAnimationFrame(() => calculateFit());
                    };
                    image.onerror = () => fallbackToFrame(url);
                } else {
                    fallbackToFrame(url);
                }
            };
        } else {
            fallbackToFrame(url);
        }
    }

    function close() {
        if (!modal) return;
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        if (image) { image.src = ''; image.classList.add('hidden'); }
        if (frame) { frame.src = 'about:blank'; frame.classList.add('hidden'); }
        document.body.style.overflow = '';
    }

    // Controles de Zoom
    zoomInBtn?.addEventListener('click', (e) => { e.stopPropagation(); zoomIn(); });
    zoomOutBtn?.addEventListener('click', (e) => { e.stopPropagation(); zoomOut(); });
    zoomFitBtn?.addEventListener('click', (e) => { e.stopPropagation(); calculateFit(); });
    zoomLevelBadge?.addEventListener('click', (e) => { e.stopPropagation(); zoomLevel = 1.0; panX = 0; panY = 0; applyTransform(true); });

    // Impresión limpia de la papeleta
    printBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (image && !image.classList.contains('hidden') && image.src) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html lang="es">
                    <head>
                        <meta charset="UTF-8">
                        <title>Papeleta SAT Lima - ${currentDocNumber || 'Copia Oficial'}</title>
                        <style>
                            @page { size: A4; margin: 10mm; }
                            body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; background: white; }
                            img { max-width: 100%; height: auto; display: block; box-shadow: none; }
                        </style>
                    </head>
                    <body onload="window.print(); window.close();">
                        <img src="${image.src}" alt="Papeleta oficial" />
                    </body>
                    </html>
                `);
                printWindow.document.close();
                return;
            }
        }
        window.print();
    });

    // Interacción Mouse: Arrastre / Pan
    if (viewport) {
        viewport.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            isDragging = true;
            startX = e.clientX - panX;
            startY = e.clientY - panY;
            viewport.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            panX = e.clientX - startX;
            panY = e.clientY - startY;
            applyTransform(false);
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                if (viewport) viewport.style.cursor = 'grab';
            }
        });

        // Zoom con Rueda del Ratón
        viewport.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 0.15 : -0.15;
            zoomLevel = Math.max(minZoom, Math.min(maxZoom, Math.round((zoomLevel + delta) * 100) / 100));
            applyTransform(false);
        }, { passive: false });

        // Touch: Pinch-to-zoom y Arrastre táctil en móviles
        let initialDistance = 0;
        let initialTouchZoom = 1.0;

        viewport.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                isDragging = true;
                startX = e.touches[0].clientX - panX;
                startY = e.touches[0].clientY - panY;
            } else if (e.touches.length === 2) {
                isDragging = false;
                initialDistance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                initialTouchZoom = zoomLevel;
            }
        }, { passive: true });

        viewport.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && isDragging) {
                panX = e.touches[0].clientX - startX;
                panY = e.touches[0].clientY - startY;
                applyTransform(false);
            } else if (e.touches.length === 2 && initialDistance > 0) {
                const dist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                const factor = dist / initialDistance;
                zoomLevel = Math.max(minZoom, Math.min(maxZoom, Math.round(initialTouchZoom * factor * 100) / 100));
                applyTransform(false);
            }
        }, { passive: true });

        viewport.addEventListener('touchend', () => {
            isDragging = false;
            initialDistance = 0;
        });
    }

    // Resize de ventana -> recalcular ajuste
    window.addEventListener('resize', () => {
        if (modal && !modal.classList.contains('hidden') && zoomLevel <= 1.05) {
            calculateFit();
        }
    });

    window.openSatTicketModal = open;
    window.closeSatTicketModal = close;
    document.getElementById('sat-modal-close-btn')?.addEventListener('click', close);
    document.getElementById('sat-modal-close-footer')?.addEventListener('click', close);
    modal?.addEventListener('click', (event) => {
        if (event.target === modal) close();
    });
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal && !modal.classList.contains('hidden')) close();
    });
}
