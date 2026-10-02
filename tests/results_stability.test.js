import test from 'node:test';
import assert from 'node:assert/strict';

const { reorderCards } = await import('../src/utils/renderers.js');

test('reorderCards does not move any result card when a section changes status', () => {
    const ids = [
        'sunarp-card-container', 'historial_dueños-card-container', 'placas_pe-card-container',
        'soat-card-container', 'soat_detallado-card-container', 'citv-card-container',
        'atu-card-container', 'valor_venal-card-container', 'sbs-card-container',
        'lima-card-container', 'callao-card-container', 'sutran-card-container',
        'cinemometro-card-container', 'municipal-card-container', 'atu_infracciones-card-container',
        'sigm-card-container', 'gnv-card-container', 'fise-card-container',
        'osinergmin-card-container', 'sat_captura-card-container', 'sat_deposito-card-container',
        'lunas-card-container', 'pnp_contacto-card-container', 'score-card-container',
        'sat_deuda-card-container'
    ];
    const cards = ids.map((id, index) => ({
        id,
        status: index % 2 ? 'loading' : 'funciona',
        getAttribute(name) { return name === 'data-status' ? this.status : null; }
    }));
    let moves = 0;
    const wrapper = {
        children: cards,
        insertBefore(card, before) {
            moves += 1;
            this.children.splice(this.children.indexOf(card), 1);
            const index = before ? this.children.indexOf(before) : this.children.length;
            this.children.splice(index, 0, card);
        },
        appendChild(card) {
            moves += 1;
            this.children.splice(this.children.indexOf(card), 1);
            this.children.push(card);
        }
    };
    globalThis.document = {
        getElementById(id) { return id === 'results-cards-wrapper' ? wrapper : null; }
    };

    try {
        cards[0].status = 'loading';
        reorderCards();
        assert.equal(moves, 0, 'a section update must not detach/reinsert cards');
        assert.deepEqual(wrapper.children.map(card => card.id), ids);
    } finally {
        delete globalThis.document;
    }
});
