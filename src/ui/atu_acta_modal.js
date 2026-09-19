/**
 * Modal visualizador para actas de fiscalización e infracciones ATU en PDF.
 * Utiliza secureFetch para descargar el blob protegido y mostrarlo sin fricción de headers.
 */
import { secureFetch } from '../services/transport.js';
import { renderPdfInto } from './pdf_viewer.js';

let activeBlobUrl = null;

export function setupAtuActaModal(backendUrl = '') {
    const modal = document.getElementById('atu-acta-modal');
    const frame = document.getElementById('atu-modal-frame');
    const canvasViewer = document.getElementById('atu-modal-canvas-viewer');
    const loader = document.getElementById('atu-modal-loader');
    const errorBox = document.getElementById('atu-modal-error');
    const errorMsg = document.getElementById('atu-modal-error-msg');
    const title = document.getElementById('atu-modal-doc-title');
    const download = document.getElementById('atu-modal-download-btn');

    async function open(actaId, docNumber) {
        if (!modal) return;
        if (title) title.textContent = `Acta oficial ATU: ${docNumber || actaId || '—'}`;
        loader?.classList.remove('hidden');
        errorBox?.classList.add('hidden');
        errorBox?.classList.remove('flex');
        frame?.classList.add('hidden');
        canvasViewer?.classList.add('hidden');
        canvasViewer?.replaceChildren();

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';

        if (activeBlobUrl) {
            URL.revokeObjectURL(activeBlobUrl);
            activeBlobUrl = null;
        }

        const pdfUrl = `${backendUrl}/atu-infracciones/actas/${encodeURIComponent(actaId)}`;

        try {
            const res = await secureFetch(pdfUrl);
            if (!res.ok) {
                let msg = `HTTP ${res.status}`;
                try {
                    const errData = await res.json();
                    msg = errData.detail || errData.error || msg;
                } catch {}
                throw new Error(msg);
            }
            const blob = await res.blob();
            if (blob.size < 100) {
                throw new Error('El documento no contiene datos válidos.');
            }
            activeBlobUrl = URL.createObjectURL(blob);

            if (download) {
                download.href = activeBlobUrl;
                download.download = `Acta_ATU_${docNumber || actaId || 'oficial'}.pdf`;
            }

            if (canvasViewer) {
                await renderPdfInto(canvasViewer, blob);
                loader?.classList.add('hidden');
                canvasViewer.classList.remove('hidden');
            } else if (frame) {
                frame.src = activeBlobUrl;
                loader?.classList.add('hidden');
                frame.classList.remove('hidden');
            }
        } catch (err) {
            console.error('[ATU-ACTA-MODAL] Error al cargar acta PDF:', err);
            loader?.classList.add('hidden');
            if (errorMsg) errorMsg.textContent = err.message || 'No se pudo cargar la vista previa del acta.';
            errorBox?.classList.remove('hidden');
            errorBox?.classList.add('flex');
        }
    }

    function close() {
        if (!modal) return;
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        if (frame) {
            frame.src = 'about:blank';
            frame.classList.add('hidden');
        }
        canvasViewer?.replaceChildren();
        canvasViewer?.classList.add('hidden');
        if (activeBlobUrl) {
            URL.revokeObjectURL(activeBlobUrl);
            activeBlobUrl = null;
        }
        document.body.style.overflow = '';
    }

    window.openAtuInfraccionActa = open;
    window.closeAtuInfraccionActa = close;

    document.getElementById('atu-modal-close-btn')?.addEventListener('click', close);
    document.getElementById('atu-modal-close-footer')?.addEventListener('click', close);
    modal?.addEventListener('click', (event) => {
        if (event.target === modal) close();
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal && !modal.classList.contains('hidden')) close();
    });

    // Delegación global de clicks para los botones renderizados dinámicamente
    document.addEventListener('click', (event) => {
        const target = event.target;
        if (!target || typeof target.closest !== 'function') return;
        const btn = target.closest('[data-canita-action="atu-infracciones-acta"]');
        if (btn) {
            event.preventDefault();
            const actaId = btn.getAttribute('data-acta-id');
            const acta = btn.getAttribute('data-acta');
            if (actaId) {
                open(actaId, acta);
            }
        }
    });
}
