/**
 * Modal visualizador oficial de papeletas SAT Lima en formato A4 interactivo.
 * Incluye zoom dinámico (+, -, Ajustar A4), arrastre/pan, descarga directa de imagen/PDF e impresión.
 */
import { secureDocumentFetch } from '../services/transport.js';
export const documentExtension = media => ({ 'application/pdf': 'pdf', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp' }[media] || 'jpg');
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
    let objectUrl = '';
    let request = null;
    let generation = 0;

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
        const targetW = sheet.offsetWidth || 750;
        const targetH = sheet.offsetHeight || 1060;
        const scaleW = vW / targetW;
        const scaleH = vH / targetH;
        const fitScale = Math.min(scaleW, scaleH, 1.0);
        zoomLevel = Math.max(0.1, Math.min(fitScale, 1.15));
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

    async function open(url, docNumber) {
        if (!modal) return;
        request?.abort();
        const ownGeneration = ++generation;
        request = new AbortController();
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = '';
        currentDocUrl = url || '';
        currentDocNumber = docNumber || '';

        if (title) title.textContent = `N° Documento: ${docNumber || '—'}`;
        if (loader) loader.innerHTML = '<i class="fas fa-circle-notch fa-spin text-3xl text-slate-600"></i><span class="text-xs font-semibold text-slate-700">Cargando copia oficial…</span>';
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
        if (download) {
            download.removeAttribute('href');
            download.setAttribute('aria-disabled', 'true');
        }

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';

        try {
            const response = await secureDocumentFetch(proxyBase, { signal: request.signal });
            if (!response.ok) throw new Error(response.status === 401 || response.status === 403
                ? 'La sesión de esta consulta expiró. Actualiza la consulta y vuelve a abrir la copia.'
                : 'El SAT no pudo entregar la copia. Vuelve a abrirla para reintentar.');
            const blob = await response.blob();
            if (!blob.type.startsWith('image/') && blob.type !== 'application/pdf') throw new Error('La fuente no devolvió una imagen o PDF válido. Reintenta la copia.');
            if (ownGeneration !== generation) return;
            objectUrl = URL.createObjectURL(blob);
            if (download) {
                download.href = objectUrl;
                download.download = `Papeleta_SAT_${String(docNumber || 'oficial').replace(/[^\w-]/g, '')}.${documentExtension(blob.type)}`;
                download.removeAttribute('aria-disabled');
            }
            if (blob.type === 'application/pdf') {
                if (frame) { frame.src = objectUrl; frame.classList.remove('hidden'); }
                loader?.classList.add('hidden');
                sheet.style.width = '750px';
                requestAnimationFrame(() => calculateFit());
                return;
            }
            image.onload = () => {
                loader?.classList.add('hidden');
                image.classList.remove('hidden');
                frame?.classList.add('hidden');
                sheet.style.width = `${Math.min(image.naturalWidth || 750, 750)}px`;
                requestAnimationFrame(() => calculateFit());
            };
            image.src = objectUrl;
        } catch (error) {
            if (error.name === 'AbortError' || ownGeneration !== generation) return;
            loader?.replaceChildren();
            const message = document.createElement('p');
            message.className = 'p-6 text-center text-sm font-semibold text-slate-800';
            message.textContent = error.message;
            loader?.append(message);
        }
    }

    function close() {
        if (!modal) return;
        request?.abort(); generation++;
        if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = ''; }
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
