import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/legacy/build/pdf.worker.mjs',
    import.meta.url,
).toString();

/**
 * Renderiza PDF en canvas para no depender del visor nativo del navegador.
 * Android suele bloquear PDFs creados mediante blob: dentro de un iframe.
 */
export async function renderPdfInto(container, blob) {
    if (!(container instanceof HTMLElement)) throw new Error('Contenedor PDF no disponible.');
    const bytes = new Uint8Array(await blob.arrayBuffer());
    if (bytes.length < 5 || String.fromCharCode(...bytes.slice(0, 5)) !== '%PDF-') {
        throw new Error('El archivo recibido no es un PDF válido.');
    }
    const documentProxy = await pdfjsLib.getDocument({ data: bytes }).promise;
    container.replaceChildren();
    container.classList.remove('hidden');
    const scale = Math.min(1.65, Math.max(1, (container.clientWidth || 720) / 650));
    for (let number = 1; number <= documentProxy.numPages; number += 1) {
        const page = await documentProxy.getPage(number);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.className = 'mx-auto mb-3 block max-w-full rounded-lg bg-white shadow-sm';
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) throw new Error('El navegador no puede preparar el lienzo PDF.');
        await page.render({ canvasContext: context, viewport }).promise;
        container.appendChild(canvas);
    }
    return documentProxy.numPages;
}
