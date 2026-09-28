import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const renderer = readFileSync(new URL('../src/utils/renderers/infracciones.js', import.meta.url), 'utf8');
const actions = readFileSync(new URL('../src/utils/renderers.js', import.meta.url), 'utf8');
const page = readFileSync(new URL('../src/ui/document_viewer.ts', import.meta.url), 'utf8');

test('la foto de Cinemómetro envía el token temporal en header y no lo expone en la URL', () => {
  assert.match(renderer, /data-access-token=/);
  assert.match(actions, /button\.dataset\.accessToken/);
  assert.match(page, /'X-Document-Access-Token': documentToken/);
  assert.doesNotMatch(page, /access_token=\$\{encodeURIComponent\(documentToken\)\}/);
  assert.match(page, /X-Consultation-Ticket/);
  const modalHandler = page.slice(page.indexOf('abrirModalFotoCinemometro'));
  assert.doesNotMatch(modalHandler, /activeConsultationId/);
});
