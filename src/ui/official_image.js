// Loading and failure states for official media. No provider consultation is
// repeated here; a broken/expired document is never treated as absent data.
export function initOfficialImageStates(container, timeoutMs = 12000) {
    for (const image of container.querySelectorAll('[data-official-image]')) {
        if (image.dataset.stateBound) continue;
        image.dataset.stateBound = '1';
        const wrapper = image.closest('[data-official-image-wrapper]');
        const status = wrapper?.querySelector('[data-official-image-status]');
        const download = wrapper?.querySelector('[data-official-image-download]');
        const caption = wrapper?.querySelector('[data-official-image-caption]');
        const fields = container.querySelector('[data-sunarp-fields]');
        let finished = false;
        let timer;
        const settle = (ok) => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            image.classList.toggle('hidden', !ok);
            download?.classList.toggle('hidden', !ok);
            caption?.classList.toggle('hidden', !ok);
            if (status) {
                status.classList.toggle('hidden', ok);
                status.textContent = ok ? '' : 'La imagen oficial no se pudo mostrar. Los datos disponibles se conservan.';
            }
            if (!ok) fields?.classList.remove('hidden');
            wrapper?.setAttribute('data-image-state', ok ? 'loaded' : 'error');
        };
        const loaded = () => settle(image.naturalWidth > 0);
        const failed = () => settle(false);
        image.addEventListener('load', loaded, { once: true });
        image.addEventListener('error', failed, { once: true });
        // Also cover data URLs loaded before event listeners were attached.
        if (image.complete) loaded();
        else timer = setTimeout(() => {
            if (image.isConnected) failed();
        }, timeoutMs);
    }
}
