import test from 'node:test';
import assert from 'node:assert/strict';
import { renderAtuInfracciones } from '../src/utils/renderers/atu_infracciones.js';

const ACTA = {
    id_acta: 'official-row-1', placa: 'D1J751', tipo_acta: 'ACTA DE FISCALIZACIÓN',
    reglamento: 'Servicio Regular', acta_fiscalizacion: 'ENC0058157', falta: 'RE1',
    tipo_infractor: 'PROPIETARIO', fecha_infraccion: '03/09/2026', reincidencia: 'NO',
    total_pagar: '5,500.00', estado: 'PENDIENTE', acta_document_available: true,
};

test('ATU infracciones renderer shows official values and a safe acta action', () => {
    const html = renderAtuInfracciones([ACTA], 'D1J751', '5,500.00');
    assert.match(html, /ENC0058157/);
    assert.match(html, /S\/ 5,500.00/);
    assert.match(html, /data-canita-action="atu-infracciones-acta"/);
    assert.match(html, /PENDIENTE/);
    assert.doesNotMatch(html, /window\.open\(/);
});

test('ATU infracciones renderer does not invent documents', () => {
    const html = renderAtuInfracciones([{ ...ACTA, id_acta: null, acta_document_available: false }], 'D1J751');
    assert.match(html, /Acta no disponible/);
    assert.doesNotMatch(html, /atu-infracciones-acta/);
});
