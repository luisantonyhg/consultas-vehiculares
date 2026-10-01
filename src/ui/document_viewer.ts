import { renderPdfInto } from './pdf_viewer.js';

export function setupDocumentViewer(backendUrl: string, getActiveTicket: () => string | null) {
        let currentPapeletaBlobUrl: string | null = null;
        (window as any).abrirModalPapeleta = async function(rawNroPapeleta: string, documentToken = '') {
            const modal = document.getElementById('papeleta-modal')!;
            const title = document.getElementById('modal-papeleta-title')!;
            const loading = document.getElementById('modal-loading')!;
            const error = document.getElementById('modal-error')!;
            const errorMsg = document.getElementById('modal-error-msg')!;
            const pdfViewer = document.getElementById('pdf-viewer') as HTMLIFrameElement;
            const pdfCanvasViewer = document.getElementById('pdf-canvas-viewer') as HTMLDivElement;
            const imgViewer = document.getElementById('image-viewer') as HTMLImageElement;

            const nroPapeleta = String(rawNroPapeleta || '').trim().split('/').pop()?.split('?')[0] || rawNroPapeleta;

            if (currentPapeletaBlobUrl) {
                URL.revokeObjectURL(currentPapeletaBlobUrl);
                currentPapeletaBlobUrl = null;
            }

            title.textContent = `Papeleta de Infracción N° ${nroPapeleta}`;
            modal.classList.remove('hidden');
            loading.classList.remove('hidden');
            error.classList.add('hidden');
            pdfViewer.classList.add('hidden');
            pdfCanvasViewer.classList.add('hidden');
            pdfCanvasViewer.replaceChildren();
            imgViewer.classList.add('hidden');
            pdfViewer.src = "";
            imgViewer.src = "";
            try {
                const secKey = import.meta.env.PUBLIC_CLIENT_SECRET || '';
                const res = await fetch(`${backendUrl}/callao/pdf/${encodeURIComponent(nroPapeleta)}`, {
                    headers: {
                        ...(secKey ? { 'X-Client-Secret': secKey } : {}),
                        ...(documentToken ? { 'X-Document-Access-Token': documentToken } : {}),
                    }
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const result = await res.json();
                if (result.success && result.data) {
                    loading.classList.add('hidden');
                    const base64Data = String(result.data).trim();

                    const isPdf = base64Data.startsWith('JVBER') || (result.tipo && String(result.tipo).toLowerCase().includes('pdf'));
                    const isJpg = base64Data.startsWith('/9j/') || (result.tipo && String(result.tipo).toLowerCase().includes('jpeg'));
                    const isPng = base64Data.startsWith('iVBOR') || (result.tipo && String(result.tipo).toLowerCase().includes('png'));

                    if (isPdf) {
                        try {
                            const byteCharacters = atob(base64Data);
                            const byteNumbers = new Uint8Array(byteCharacters.length);
                            for (let i = 0; i < byteCharacters.length; i++) {
                                byteNumbers[i] = byteCharacters.charCodeAt(i);
                            }
                            const blob = new Blob([byteNumbers], { type: 'application/pdf' });
                            currentPapeletaBlobUrl = URL.createObjectURL(blob);
                            await renderPdfInto(pdfCanvasViewer, blob);
                        } catch (bErr) {
                            throw new Error('No se pudo renderizar el PDF oficial. Puedes intentar descargarlo nuevamente.');
                        }
                    } else if (isPng || isJpg) {
                        const mime = isPng ? 'image/png' : 'image/jpeg';
                        imgViewer.src = `data:${mime};base64,${base64Data}`;
                        imgViewer.classList.remove('hidden');
                    } else {
                        if (nroPapeleta.endsWith('A') || nroPapeleta.endsWith('B')) {
                            imgViewer.src = `data:image/jpeg;base64,${base64Data}`;
                            imgViewer.classList.remove('hidden');
                        } else {
                            try {
                                const byteCharacters = atob(base64Data);
                                const byteNumbers = new Uint8Array(byteCharacters.length);
                                for (let i = 0; i < byteCharacters.length; i++) {
                                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                                }
                                const blob = new Blob([byteNumbers], { type: 'application/pdf' });
                                currentPapeletaBlobUrl = URL.createObjectURL(blob);
                                await renderPdfInto(pdfCanvasViewer, blob);
                            } catch (_) {
                                throw new Error('El documento no tiene un formato PDF o imagen reconocido.');
                            }
                        }
                    }
                } else {
                    throw new Error(result.error || 'No se obtuvieron datos de la papeleta');
                }
            } catch (err: any) {
                loading.classList.add('hidden');
                error.classList.remove('hidden');
                errorMsg.textContent = err.message || 'Error de conexión con el servidor.';
            }
        };

        (window as any).abrirModalImagen = function(imgSrc: string, titleText: string = 'Foto Probatoria') {
            const modal = document.getElementById('papeleta-modal')!;
            const title = document.getElementById('modal-papeleta-title')!;
            const loading = document.getElementById('modal-loading')!;
            const error = document.getElementById('modal-error')!;
            const pdfViewer = document.getElementById('pdf-viewer') as HTMLIFrameElement;
            const pdfCanvasViewer = document.getElementById('pdf-canvas-viewer') as HTMLDivElement;
            const imgViewer = document.getElementById('image-viewer') as HTMLImageElement;

            title.textContent = titleText;
            modal.classList.remove('hidden');
            loading.classList.add('hidden');
            error.classList.add('hidden');
            pdfViewer.classList.add('hidden');
            pdfCanvasViewer.classList.add('hidden');
            pdfCanvasViewer.replaceChildren();
            
            imgViewer.src = imgSrc;
            imgViewer.classList.remove('hidden');
        };

        (window as any).abrirModalFotoCinemometro = async function(nroPapeleta: string, fotoTarget: string, plate: string, documentToken = '') {
            const modal = document.getElementById('papeleta-modal')!;
            const title = document.getElementById('modal-papeleta-title')!;
            const loading = document.getElementById('modal-loading')!;
            const error = document.getElementById('modal-error')!;
            const errorMsg = document.getElementById('modal-error-msg')!;
            const pdfViewer = document.getElementById('pdf-viewer') as HTMLIFrameElement;
            const pdfCanvasViewer = document.getElementById('pdf-canvas-viewer') as HTMLDivElement;
            const imgViewer = document.getElementById('image-viewer') as HTMLImageElement;

            title.textContent = `Foto Probatoria - Papeleta N° ${nroPapeleta}`;
            modal.classList.remove('hidden');
            error.classList.add('hidden');
            pdfViewer.classList.add('hidden');
            pdfCanvasViewer.classList.add('hidden');
            pdfCanvasViewer.replaceChildren();
            imgViewer.classList.add('hidden');
            pdfViewer.src = "";
            imgViewer.src = "";

            const fotoDirect = (window as any).cinemometroFotos?.[nroPapeleta];
            if (fotoDirect && (fotoDirect.startsWith('data:') || fotoDirect.startsWith('http'))) {
                loading.classList.add('hidden');
                imgViewer.src = fotoDirect;
                imgViewer.classList.remove('hidden');
                return;
            }

            loading.classList.remove('hidden');

            try {
                const secKey = import.meta.env.PUBLIC_CLIENT_SECRET || '';
                const url = `${backendUrl}/cinemometro/foto/${plate}?target=${encodeURIComponent(fotoTarget)}`;
                const ticket = getActiveTicket();
                const res = await fetch(url, {
                    headers: {
                        ...(secKey ? { 'X-Client-Secret': secKey } : {}),
                        ...(documentToken ? { 'X-Document-Access-Token': documentToken } : {}),
                        // El identificador de consulta vive dentro del handler
                        // principal y no existe en este callback global del
                        // visor. El token efímero autoriza la foto incluso al
                        // terminar la consulta; mientras está activa, el
                        // ticket sí es una variable de este ámbito.
                        ...(ticket ? { 'X-Consultation-Ticket': ticket } : {}),
                    }
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const result = await res.json();
                loading.classList.add('hidden');

                if (result.success && result.foto) {
                    const fotoCache = (window as any).cinemometroFotos || ((window as any).cinemometroFotos = {});
                    fotoCache[nroPapeleta] = result.foto;
                    imgViewer.src = result.foto;
                    imgViewer.classList.remove('hidden');
                } else {
                    throw new Error(result.error || 'No se pudo obtener la foto probatoria de SUTRAN');
                }
            } catch (err: any) {
                loading.classList.add('hidden');
                error.classList.remove('hidden');
                errorMsg.textContent = err.message || 'Error al conectar con SUTRAN para obtener la foto.';
            }
        };

        (window as any).cerrarModalPapeleta = function() {
            const modal = document.getElementById('papeleta-modal')!;
            modal.classList.add('hidden');
            const pdfViewer = document.getElementById('pdf-viewer') as HTMLIFrameElement;
            const pdfCanvasViewer = document.getElementById('pdf-canvas-viewer') as HTMLDivElement;
            const imgViewer = document.getElementById('image-viewer') as HTMLImageElement;
            pdfViewer.src = "";
            pdfCanvasViewer.replaceChildren();
            pdfCanvasViewer.classList.add('hidden');
            imgViewer.src = "";
        };
}
