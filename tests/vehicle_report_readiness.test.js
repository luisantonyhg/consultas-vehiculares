import test from 'node:test';
import assert from 'node:assert/strict';
import { reportReadiness } from '../src/ui/vehicle_report_state.js';

const cards = (resolved) => Array.from({length: 10}, (_, index) => ({
    id: `source-${index}-card-container`, status: index < resolved ? 'funciona' : 'waiting',
}));
test('PDF waits for 80% of actual sources', () => {
    assert.equal(reportReadiness([]), false);
    assert.equal(reportReadiness(cards(7)), false);
    assert.equal(reportReadiness(cards(8)), true);
});
test('failures count as resolved and do not prevent exporting', () => {
    const values = cards(8);
    values[0].status = 'no-funciona';
    values[1].status = 'mantenimiento';
    assert.equal(reportReadiness(values), true);
    values[1].status = 'loading';
    assert.equal(reportReadiness(values), false);
});
test('services, score, contact and future cards do not inflate readiness', () => {
    const values = [...cards(7),
        {id: 'service-tive-card-container'},
        {id: 'score-card-container', status: 'funciona'},
        {id: 'pnp_contacto-card-container', status: 'funciona'},
        {id: 'sat_deuda-card-container', status: 'development'},
        {id: 'atu-card-container', status: 'development'},
    ];
    assert.equal(reportReadiness(values), false);
    values[7].status = 'funciona';
    assert.equal(reportReadiness(values), true);
});
test('a rejected plate cannot export a report', () => {
    const values = cards(10);
    values[0].skipped = 'invalid-plate';
    assert.equal(reportReadiness(values), false);
});
