const informationalIds = new Set(['score-card-container', 'pnp_contacto-card-container', 'sat_deuda-card-container']);

export function reportReadiness(cards) {
    const sources = cards.filter(card => card.id.endsWith('-card-container') &&
        !card.id.startsWith('service-') && !informationalIds.has(card.id) &&
        card.status !== 'development');
    if (!sources.length || sources.some(card => card.skipped === 'invalid-plate')) return false;
    const resolved = sources.filter(card => card.status && card.status !== 'loading' && card.status !== 'waiting').length;
    return resolved >= Math.ceil(sources.length * .8);
}

export function isVehicleReportReady() {
    const wrapper = document.getElementById('results-cards-wrapper');
    if (!wrapper) return false;
    return reportReadiness(Array.from(wrapper.children).map(card => ({
        id: card.id, status: card.getAttribute('data-status'), skipped: card.getAttribute('data-skipped'),
    })));
}

let reportObserver;
export function setupVehicleReportReadiness() {
    reportObserver?.disconnect();
    const wrapper = document.getElementById('results-cards-wrapper');
    if (!wrapper) return;
    const update = () => {
        const button = document.getElementById('vehicle-report-pdf-button');
        if (!(button instanceof HTMLButtonElement)) return;
        button.disabled = !isVehicleReportReady();
        button.title = button.disabled
            ? 'Disponible cuando termine al menos el 80 % de las consultas'
            : 'Descargar / imprimir reporte en PDF';
    };
    reportObserver = new MutationObserver(update);
    reportObserver.observe(wrapper, {childList: true, subtree: true, attributes: true, attributeFilter: ['data-status', 'data-skipped']});
    update();
}
