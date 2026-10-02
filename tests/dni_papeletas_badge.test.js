import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const stateSource = fs.readFileSync(new URL('../src/scripts/dni/dni-state.ts', import.meta.url), 'utf8');
const controllerSource = fs.readFileSync(new URL('../src/scripts/dni/dni-controller.ts', import.meta.url), 'utf8');

test('papeletas ERROR no usa plomo: deriva a negro NO VERIFICADO', () => {
  assert.match(stateSource, /name === 'transporte_papeletas'/);
  assert.match(stateSource, /badgePill\('dark', 'NO VERIFICADO · REINTENTAR'\)/);
  assert.match(stateSource, /badgePill\(type: 'success' \| 'danger' \| 'warning' \| 'neutral' \| 'dark'/);
  assert.match(stateSource, /bg-black text-white/);
});

test('papeletas ofrece reintentar solo esa sección', () => {
  assert.match(stateSource, /data-dni-retry="transporte_papeletas"/);
  assert.match(controllerSource, /\/dni\/seccion/);
  assert.match(controllerSource, /X-Manual-Retry/);
});

test('cada tarjeta imprime su velocidad con el número del backend', () => {
  assert.match(stateSource, /elapsed_ms/);
  assert.match(stateSource, /⚡/);
});

test('papeletas sin confirmar tampoco usa plomo', () => {
  const elseBranch = stateSource.slice(stateSource.indexOf("case 'transporte_papeletas'"));
  const block = elseBranch.slice(0, elseBranch.indexOf("case 'minedu'"));
  assert.doesNotMatch(block, /badgePill\('neutral'/);
});

test('un fallo técnico de papeletas jamás afirma CON SANCIONES', () => {
  // El único CON SANCIONES permitido es el de hallazgo confirmado.
  assert.equal((stateSource.match(/CON SANCIONES \(\$\{total\}\)/g) || []).length, 1);
  // Las rutas no confirmadas usan el negro de reintento, con descargo.
  assert.equal((stateSource.match(/badgePill\('dark', 'NO VERIFICADO · REINTENTAR'\)/g) || []).length, 2);
  assert.match(stateSource, /No se afirma que existan ni que no existan sanciones/);
});

test('verde SIN SANCIONES sigue exigiendo resultado confirmado', () => {
  assert.match(stateSource, /resultadoConfirmado = inner\.resultado_confirmado === true && providerStatus === 'OK'/);
  assert.match(stateSource, /badgePill\('success', 'SIN SANCIONES'\)/);
});

test('MTC papeletas positivas también exige respuesta confirmada', () => {
  assert.match(stateSource, /else if \(tieneInfracciones && resultadoConfirmado\)/);
});

test('MTC récord no afirma ausencia sin confirmación ni ignora sanciones', () => {
  assert.match(stateSource, /inner\.consulta_confirmada === true && providerStatus === 'OK'/);
  assert.match(stateSource, /puntos === 0 && sancionesCountKnown && sancionesCount === 0/);
  assert.match(stateSource, /badgePill\('neutral', 'RESULTADO SIN CONFIRMAR'\)/);
});
