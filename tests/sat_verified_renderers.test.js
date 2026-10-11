import test from 'node:test';
import assert from 'node:assert/strict';
import { renderSatCaptura, renderSatDeposito } from '../src/utils/renderers/municipales.js';

test('SAT no convierte consultas sin confirmar en resultados limpios', () => {
    for (const confirmed of [undefined, false]) {
        const capture = renderSatCaptura({ confirmed, tiene: false }, 'APJ479');
        assert.match(capture, /no verificada/);
        assert.doesNotMatch(capture, /Sin Orden de Captura Registrada/);
        const deposit = renderSatDeposito({ confirmed, internado: false }, 'APJ479');
        assert.match(deposit, /no verificado/);
        assert.doesNotMatch(deposit, /No Internado en Depósito/);
    }
});

test('SAT conserva resultados negativos y positivos confirmados', () => {
    assert.match(renderSatCaptura({ captura: { confirmed: true, tiene: false } }, 'APJ479'), /Sin Orden de Captura Registrada/);
    assert.match(renderSatDeposito({ deposito: { confirmed: true, internado: false } }, 'APJ479'), /No Internado en Depósito/);
    assert.match(renderSatCaptura({ confirmed: true, tiene: true }, 'APJ479'), /TIENE ORDEN DE CAPTURA/);
});
