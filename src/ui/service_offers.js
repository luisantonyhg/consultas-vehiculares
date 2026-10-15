import offers from '../data/service-offers.json';

const escape = (value) => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function renderServiceOffers(kind, reference = '') {
    return offers.filter(offer => offer.kind === kind).map(offer => {
        const message = `Hola Cañita, quiero solicitar: ${offer.title}.${reference ? ` Mi ${kind === 'dni' ? 'DNI' : 'placa'} es ${reference}.` : ''} Por favor, indíquenme los requisitos y el costo.`;
        const href = `https://wa.me/51928701061?text=${encodeURIComponent(message)}`;
        return `<details id="service-${offer.id}-card-container" class="service-offer" data-service-kind="${kind}">
            <summary class="service-offer-header">
                <span class="service-offer-logo"><img src="/assets/${offer.logo}" alt="${offer.entity}" width="48" height="48" loading="lazy" /></span>
                <span class="service-offer-label"><strong>${offer.title}</strong><span>${offer.subtitle}</span></span>
                <i class="fas fa-chevron-down service-offer-chevron" aria-hidden="true"></i>
            </summary>
            <div class="service-offer-body">
                <div class="service-offer-intro"><img src="/assets/${offer.logo}" alt="${offer.entity}" width="48" height="48" loading="lazy" /><h4>${offer.heading}</h4></div>
                <p class="service-offer-description">${offer.description}</p>
                <ul class="service-offer-benefits">${offer.benefits.map(item => `<li><span class="service-offer-benefit-icon"><i class="fas fa-${item.icon}" aria-hidden="true"></i></span><div><strong>${item.title}</strong><p>${item.text}</p></div></li>`).join('')}</ul>
                <p class="service-offer-note">${offer.note} <a href="${offer.source}" target="_blank" rel="noopener noreferrer">Ver información oficial <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i></a></p>
                <div class="service-offer-actions">
                    <a class="service-offer-request" href="${escape(href)}" data-offer-title="${escape(offer.title)}" target="_blank" rel="noopener noreferrer" aria-label="Solicitar ${escape(offer.title)} por WhatsApp">Solicitar <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
                    <a class="service-offer-contact" href="${escape(href)}" data-offer-title="${escape(offer.title)}" target="_blank" rel="noopener noreferrer"><i class="fab fa-whatsapp" aria-hidden="true"></i><span>Atención por WhatsApp<strong>+51 928 701 061</strong></span><i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i></a>
                </div>
            </div>
        </details>`;
    }).join('');
}

// Use the completed DNI consultation, not an input that may have been edited.
export function bindServiceOfferLinks() {
    document.addEventListener('click', event => {
        const link = event.target instanceof Element ? event.target.closest('a[data-offer-title]') : null;
        if (!(link instanceof HTMLAnchorElement)) return;
        const card = link.closest('[data-service-kind]');
        const kind = card?.getAttribute('data-service-kind');
        const reference = kind === 'dni' ? document.getElementById('dni-cards-container')?.dataset.dni : link.closest('[data-plate]')?.getAttribute('data-plate');
        const message = `Hola Cañita, quiero solicitar: ${link.dataset.offerTitle}.${reference ? ` Mi ${kind === 'dni' ? 'DNI' : 'placa'} es ${reference}.` : ''} Por favor, indíquenme los requisitos y el costo.`;
        link.href = `https://wa.me/51928701061?text=${encodeURIComponent(message)}`;
    });
}
