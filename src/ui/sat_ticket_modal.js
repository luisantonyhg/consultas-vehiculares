export function setupSatTicketModal() {
    const modal = document.getElementById('sat-ticket-modal');
    const image = document.getElementById('sat-modal-img');
    const frame = document.getElementById('sat-modal-frame');
    const loader = document.getElementById('sat-modal-loader');
    const title = document.getElementById('sat-modal-doc-title');
    const download = document.getElementById('sat-modal-download-btn');

    function open(url, docNumber) {
        if (!modal) return;
        if (title) title.textContent = `N° Documento: ${docNumber || '—'}`;
        loader?.classList.remove('hidden');
        image?.classList.add('hidden');
        frame?.classList.add('hidden');
        if (download) {
            download.href = url;
            download.download = `Papeleta_SAT_${docNumber || 'oficial'}.jpg`;
        }
        if (url.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) && image) {
            image.src = url;
            image.onload = () => { loader?.classList.add('hidden'); image.classList.remove('hidden'); };
            image.onerror = () => {
                loader?.classList.add('hidden');
                if (frame) { frame.src = url; frame.classList.remove('hidden'); }
            };
        } else if (frame) {
            frame.src = url;
            frame.onload = () => { loader?.classList.add('hidden'); frame.classList.remove('hidden'); };
        }
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }

    function close() {
        if (!modal) return;
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        if (image) { image.src = ''; image.classList.add('hidden'); }
        if (frame) { frame.src = ''; frame.classList.add('hidden'); }
        document.body.style.overflow = '';
    }

    window.openSatTicketModal = open;
    window.closeSatTicketModal = close;
    document.getElementById('sat-modal-close-btn')?.addEventListener('click', close);
    document.getElementById('sat-modal-close-footer')?.addEventListener('click', close);
    modal?.addEventListener('click', event => { if (event.target === modal) close(); });
    window.addEventListener('keydown', event => {
        if (event.key === 'Escape' && modal && !modal.classList.contains('hidden')) close();
    });
}
