import { toCanvas } from 'html-to-image';

/** Descarga y comparte resultados sin consumir recursos del backend. */
export function setupSectionExport() {
    const exportFileName = (value: string) => value
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');

    function currentExportPlate() {
        return document.getElementById('results-cards-wrapper')?.getAttribute('data-plate') || 'PLACA';
    }

    function showExportNotice(message: string, isError = false) {
        document.getElementById('canita-export-notice')?.remove();
        const notice = document.createElement('div');
        notice.id = 'canita-export-notice';
        notice.className = `fixed bottom-5 left-1/2 z-[99999] -translate-x-1/2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-2xl ${isError ? 'bg-rose-600' : 'bg-slate-900'}`;
        notice.textContent = message;
        document.body.appendChild(notice);
        setTimeout(() => notice.remove(), 3200);
    }

    const EXPORT_WIDTH = 1440;
    const EXPORT_PAGE_CONTENT_HEIGHT = 1680;
    const EXPORT_FOOTER_HEIGHT = 116;
    const EXPORT_MAX_PIXELS = 24_000_000;

    async function waitForExportAssets(card: HTMLElement) {
        await (document as any).fonts?.ready;
        const images = Array.from(card.querySelectorAll('img')) as HTMLImageElement[];
        await Promise.all(images.map(async image => {
            if (!image.complete) {
                await new Promise<void>(resolve => {
                    image.addEventListener('load', () => resolve(), { once: true });
                    image.addEventListener('error', () => resolve(), { once: true });
                });
            }
            try { await image.decode(); } catch { /* La captura continúa sin bloquearse. */ }
        }));
    }

    function exportScale(card: HTMLElement) {
        const rect = card.getBoundingClientRect();
        const width = Math.max(1, rect.width);
        const height = Math.max(1, rect.height);
        const sharpScale = Math.min(4, Math.max(1.5, EXPORT_WIDTH / width));
        const memoryScale = Math.sqrt(EXPORT_MAX_PIXELS / (width * height));
        return Math.max(1, Math.min(sharpScale, memoryScale));
    }

    function exportBreakpoints(card: HTMLElement, scale: number, canvasHeight: number) {
        const cardTop = card.getBoundingClientRect().top;
        const candidates = new Set<number>();
        card.querySelectorAll('.accordion-body > *, tr, [data-export-break-after]').forEach(node => {
            const rect = (node as HTMLElement).getBoundingClientRect();
            const position = Math.round((rect.bottom - cardTop) * scale);
            if (position > 0 && position < canvasHeight) candidates.add(position);
        });
        return Array.from(candidates).sort((a, b) => a - b);
    }

    function exportSegments(canvasHeight: number, breakpoints: number[]) {
        if (canvasHeight <= EXPORT_PAGE_CONTENT_HEIGHT) return [[0, canvasHeight]];
        const segments: number[][] = [];
        let start = 0;
        while (start < canvasHeight) {
            const target = Math.min(start + EXPORT_PAGE_CONTENT_HEIGHT, canvasHeight);
            let end = target;
            if (target < canvasHeight) {
                const minimumUsefulCut = start + Math.round(EXPORT_PAGE_CONTENT_HEIGHT * 0.62);
                const safeCuts = breakpoints.filter(point => point >= minimumUsefulCut && point <= target);
                if (safeCuts.length) end = safeCuts[safeCuts.length - 1];
            }
            if (end <= start + 200) end = target;
            segments.push([start, end]);
            start = end;
        }
        return segments;
    }

    async function exportLogo() {
        const image = new Image();
        image.src = '/assets/logocanita.jpeg';
        await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject(new Error('No se pudo cargar el logo de Cañita.'));
        });
        try { await image.decode(); } catch { /* onload ya confirmó la imagen. */ }
        return image;
    }

    function canvasBlob(canvas: HTMLCanvasElement) {
        return new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('No se pudo crear la imagen.')), 'image/png');
        });
    }

    async function brandedExportPages(source: HTMLCanvasElement, card: HTMLElement, title: string, plate: string) {
        const cssWidth = Math.max(1, card.getBoundingClientRect().width);
        const scale = source.width / cssWidth;
        const segments = exportSegments(source.height, exportBreakpoints(card, scale, source.height));
        const logo = await exportLogo();
        const pages: Blob[] = [];

        for (let index = 0; index < segments.length; index++) {
            const [start, end] = segments[index];
            const contentHeight = end - start;
            const page = document.createElement('canvas');
            page.width = source.width;
            page.height = contentHeight + EXPORT_FOOTER_HEIGHT;
            const context = page.getContext('2d');
            if (!context) throw new Error('El dispositivo no permitió preparar la imagen.');

            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, page.width, page.height);
            context.drawImage(source, 0, start, source.width, contentHeight, 0, 0, source.width, contentHeight);

            const footerY = contentHeight;
            context.fillStyle = '#ffffff';
            context.fillRect(0, footerY, page.width, EXPORT_FOOTER_HEIGHT);
            context.fillStyle = '#e2e8f0';
            context.fillRect(0, footerY, page.width, 2);

            const logoHeight = 62;
            const logoWidth = Math.round(logo.width * (logoHeight / logo.height));
            context.drawImage(logo, 38, footerY + 25, logoWidth, logoHeight);

            context.fillStyle = '#0f172a';
            context.font = '700 23px Arial, sans-serif';
            context.textBaseline = 'middle';
            context.fillText(`${title} · ${plate}`, 38 + logoWidth + 28, footerY + 47);
            context.fillStyle = '#64748b';
            context.font = '600 19px Arial, sans-serif';
            context.fillText('Resultado consultado en Cañita', 38 + logoWidth + 28, footerY + 76);

            context.textAlign = 'right';
            context.fillStyle = '#334155';
            context.font = '700 21px Arial, sans-serif';
            context.fillText(`Página ${index + 1} de ${segments.length}`, page.width - 38, footerY + 60);
            context.textAlign = 'left';

            pages.push(await canvasBlob(page));
            page.width = 1;
            page.height = 1;
        }
        source.width = 1;
        source.height = 1;
        return pages;
    }

    async function sectionImages(cardId: string, title: string, plate: string) {
        const card = document.getElementById(`${cardId}-card-container`) as HTMLElement | null;
        if (!card || card.getAttribute('data-status') !== 'funciona') {
            throw new Error('Esta sección todavía no tiene un resultado disponible.');
        }
        const body = card.querySelector('.accordion-body') as HTMLElement | null;
        const wasHidden = !!body?.classList.contains('hidden');
        const hadDark = document.documentElement.classList.contains('dark');
        const originalInlineStyle = card.getAttribute('style');
        if (wasHidden) body?.classList.remove('hidden');
        if (hadDark) document.documentElement.classList.remove('dark');
        card.setAttribute('data-exporting', 'true');
        // Capturar con un ancho de reporte estable. Aumentar solo pixelRatio
        // conserva el layout angosto del móvil y produce títulos amontonados.
        card.style.width = '720px';
        card.style.minWidth = '720px';
        card.style.maxWidth = '720px';
        card.style.margin = '0';
        try {
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            await waitForExportAssets(card);
            const canvas = await toCanvas(card, {
                backgroundColor: '#ffffff',
                cacheBust: true,
                pixelRatio: exportScale(card),
                fontEmbedCSS: '',
                filter: (node: HTMLElement) => {
                    const classes = node.classList;
                    const isFontAwesomeIcon = node.tagName === 'I' &&
                        ['fa', 'fas', 'far', 'fab'].some(name => classes?.contains(name));
                    return !classes?.contains('card-share-actions') &&
                        !classes?.contains('no-print') &&
                        !classes?.contains('canita-export-brand') &&
                        !classes?.contains('card-source-footer') &&
                        !isFontAwesomeIcon;
                },
            });
            if (!canvas.width || !canvas.height) throw new Error('No se pudo crear la imagen.');
            return await brandedExportPages(canvas, card, title, plate);
        } finally {
            card.removeAttribute('data-exporting');
            if (originalInlineStyle === null) card.removeAttribute('style');
            else card.setAttribute('style', originalInlineStyle);
            if (wasHidden) body?.classList.add('hidden');
            if (hadDark) document.documentElement.classList.add('dark');
        }
    }

    function downloadBlob(blob: Blob, filename: string) {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
    }

    async function withExportButton(button: HTMLButtonElement | null, task: () => Promise<void>) {
        const old = button?.innerHTML || '';
        if (button) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Preparando';
        }
        try { await task(); }
        catch (error) { showExportNotice((error as Error).message || 'No se pudo generar la imagen.', true); }
        finally {
            if (button) {
                button.disabled = false;
                button.innerHTML = old;
            }
        }
    }

    (window as any).descargarSeccion = function(cardId: string, button?: HTMLButtonElement) {
        return withExportButton(button || null, async () => {
            const card = document.getElementById(`${cardId}-card-container`)!;
            const title = card.getAttribute('data-export-title') || cardId;
            const plate = currentExportPlate();
            const pages = await sectionImages(cardId, title, plate);
            pages.forEach((blob, index) => {
                const suffix = pages.length > 1 ? `_pagina_${index + 1}_de_${pages.length}` : '';
                downloadBlob(blob, `Canita_${exportFileName(title)}_${exportFileName(plate)}${suffix}.png`);
            });
            showExportNotice(pages.length > 1 ? `${pages.length} imágenes nítidas descargadas.` : 'Resultado nítido descargado con la marca Cañita.');
        });
    };

    (window as any).compartirSeccion = function(cardId: string, button?: HTMLButtonElement) {
        return withExportButton(button || null, async () => {
            const card = document.getElementById(`${cardId}-card-container`)!;
            const title = card.getAttribute('data-export-title') || cardId;
            const plate = currentExportPlate();
            const pages = await sectionImages(cardId, title, plate);
            const files = pages.map((blob, index) => {
                const suffix = pages.length > 1 ? `_pagina_${index + 1}_de_${pages.length}` : '';
                return new File([blob], `Canita_${exportFileName(title)}_${exportFileName(plate)}${suffix}.png`, { type: 'image/png' });
            });
            const shareData = { title: `Cañita · ${title}`, text: `Resultado vehicular de la placa ${plate}, consultado en Cañita.`, files };
            if (navigator.share && (!navigator.canShare || navigator.canShare({ files }))) {
                try {
                    await navigator.share(shareData);
                    showExportNotice(files.length > 1 ? `${files.length} imágenes nítidas listas para compartir.` : 'Resultado nítido listo para compartir.');
                    return;
                } catch (error) {
                    // Cancelar el selector es una decisión del usuario, no un fallo.
                    if ((error as DOMException)?.name === 'AbortError') return;
                    // Algunos navegadores anuncian soporte pero rechazan varios archivos.
                    // En ese caso continuamos con la descarga + apertura de WhatsApp.
                    console.warn('[COMPARTIR] El selector nativo rechazó los archivos; usando respaldo.', error);
                }
            }
            files.forEach(file => downloadBlob(file, file.name));
            const text = encodeURIComponent(`Te comparto el resultado “${title}” de la placa ${plate}, consultado en Cañita. Las imágenes se descargaron en mi dispositivo.`);
            window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
            showExportNotice(`${files.length} imagen${files.length === 1 ? '' : 'es'} descargada${files.length === 1 ? '' : 's'}. Selecciónala${files.length === 1 ? '' : 's'} en WhatsApp.`);
        });
    };


}
