import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../src/pages/consulta.astro', import.meta.url), 'utf8');
const state = readFileSync(new URL('../src/scripts/dni/dni-state.ts', import.meta.url), 'utf8');
const stream = readFileSync(new URL('../src/scripts/dni/dni-stream-client.ts', import.meta.url), 'utf8');
const controller = readFileSync(new URL('../src/scripts/dni/dni-controller.ts', import.meta.url), 'utf8');
const hero = readFileSync(new URL('../src/components/consulta/ConsultationHero.astro', import.meta.url), 'utf8');
const artwork = readFileSync(new URL('../src/components/consulta/ConsultationArtwork.astro', import.meta.url), 'utf8');
const home = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
const nav = readFileSync(new URL('../src/components/common/SiteNav.astro', import.meta.url), 'utf8');
const consultation = readFileSync(new URL('../src/scripts/consulta/consulta-controller.ts', import.meta.url), 'utf8');
const dniCards = readFileSync(new URL('../src/components/DniResults.astro', import.meta.url), 'utf8');

test('una sola ruta de consulta y selector local sin navegación', () => {
  assert.doesNotMatch(home + nav + hero, /\/consulta\?mode=/);
  assert.equal((home.match(/href="\/consulta"/g) ?? []).length, 1);
  assert.doesNotMatch(hero, /href="\/"|CAÑITA/);
  assert.doesNotMatch(controller, /replaceState|window\.location/);
  assert.match(consultation, /window\.history\.replaceState\(window\.history\.state, '', '\/consulta'\)/);
});

test('el nav se superpone al fondo y los autos no dependen de la altura de cada modo', () => {
  assert.match(nav, /\.canita-navwrap \{[^}]*position: absolute; top: 0;/);
  assert.match(home, /<main class="[^"]*relative"/);
  assert.match(page, /<main class="[^"]*relative"/);
  assert.doesNotMatch(hero + home, /top-1\/2 -translate-y-1\/2 w-\[/);
  assert.doesNotMatch(hero + home, />Consulta Integral</);
  assert.doesNotMatch(controller, /heroScriptMode|heroDescText/);
});

test('Consulta muestra los cuatro recursos encima del card e Inicio conserva su texto y botón', () => {
  assert.match(hero, /<ConsultationArtwork \/>[\s\S]*class="search-card-container/);
  for (const asset of ['iconodelcarro.png', 'iconodedni.png', 'iconovehiculo.png', 'iconoantecendetes.png']) {
    assert.match(artwork, new RegExp(asset.replace('.', '\\.')));
  }
  assert.doesNotMatch(hero, /autofondomovil|autofondoweb/);
  assert.match(home, />CAÑITA<\/h1>/);
  assert.match(home, />Ir a Consulta<\/span>/);
});

test('DNI permanece aislado visualmente de placa y conserva cards blancos', () => {
  assert.match(hero, /id="tab-mode-placa"/);
  assert.match(hero, /id="tab-mode-dni"/);
  assert.match(state, /const isExpanded = Boolean\(body && !body\.classList\.contains\('hidden'\)\)/);
  assert.match(state, /header\.classList\.add\(\.\.\.\(isExpanded/);
  assert.match(controller, /toggleDniAccordion[\s\S]*?header\.classList\.add\(\.\.\.\(isExpanded/);
  assert.doesNotMatch(state, /body\.classList\.remove\('hidden'\)/);
});

test('cambiar entre Placa y DNI no abre el teclado y explica el reverso del DNI', () => {
  const modeStart = controller.indexOf('function setSearchMode');
  const modeEnd = controller.indexOf('tabPlaca?.addEventListener', modeStart);
  const modeHandler = controller.slice(modeStart, modeEnd);
  assert.match(modeHandler, /document\.activeElement[\s\S]*?\.blur\(\)/);
  assert.doesNotMatch(modeHandler, /\.focus\(\)/);
  assert.match(modeHandler, /código de barras del reverso/);
});

test('las respuestas SSE de DNI actualizan tarjetas sin abrir los acordeones automáticamente', () => {
  const paintStart = state.indexOf('export function paintDniSection');
  const paintEnd = state.indexOf('\n}', paintStart);
  const paint = state.slice(paintStart, paintEnd);
  assert.match(paint, /const isExpanded = Boolean\(body && !body\.classList\.contains\('hidden'\)\)/);
  assert.doesNotMatch(paint, /body\.classList\.remove\('hidden'\)/);
  assert.match(controller, /if \(body\) body\.classList\.toggle\('hidden'\)/);
});

test('DNI procesa y notifica las secciones en el orden SSE recibido', () => {
  const expected = ['identidad', 'jne_multas', 'minedu', 'sunat', 'transporte_papeletas', 'transporte_record', 'osce', 'webmii', 'infogob', 'transporte_licencias'];
  const eventList = stream.match(/\["identidad"[\s\S]*?\]/)?.[0] ?? '';
  assert.deepEqual(JSON.parse(eventList), expected);
  assert.match(controller, /Consultando fuentes oficiales una por una/);
  assert.match(readFileSync(new URL('../src/scripts/consulta/consulta-controller.ts', import.meta.url), 'utf8'), /initDniConsultation\(plateInput\)/);
});

test('MINEDU y WebMii aceptan respuestas envueltas sin perder registros ni enlaces', () => {
  assert.match(state, /inner\.registros \|\| inner\.resultados/);
  assert.match(state, /nested\.tecnologicos/);
  assert.match(state, /inner\.enlaces_detectados \|\| inner\.enlaces \|\| inner\.resultados/);
});

test('DNI no convierte fallos de fuente en afirmaciones negativas', () => {
  assert.match(state, /providerStatus === 'ERROR' \|\| providerStatus === 'UNAVAILABLE' \|\| providerStatus === 'EMPTY'/);
  assert.match(state, /RESULTADO SIN CONFIRMAR/);
  assert.match(state, /consultaConfirmada/);
  assert.match(state, /montoConfirmado/);
  assert.match(state, /resultadoConfirmado/);
  assert.doesNotMatch(dniCards, /En cola/);
  assert.match(dniCards, /En espera/);
});
