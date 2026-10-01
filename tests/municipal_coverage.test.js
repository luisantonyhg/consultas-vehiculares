import test from 'node:test';
import assert from 'node:assert/strict';

import { MUNICIPAL_SOURCE_URLS, runFetchMunicipal } from '../src/services/providers/energy_municipal.js';


test('cobertura municipal parcial informa cuántas fuentes fueron verificadas', async () => {
  const originalFetch = globalThis.fetch;
  let rendered = null;
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({
      success: true,
      coverage_status: 'PARTIAL',
      municipios_total: 12,
      municipios_verificados: 7,
      municipios_no_disponibles: 4,
      data: [
        { municipio: 'Cusco', success: true, verification_status: 'VERIFIED_NONE', tiene_papeletas: false, total: 0 },
        { municipio: 'Trujillo', success: false, verification_status: 'UNAVAILABLE', tiene_papeletas: false, error: 'Requiere autenticación' },
      ],
    }), { status: 200, headers: { 'content-type': 'application/json' } });

    const result = await runFetchMunicipal('AWH565', 'https://backend.test', {
      setCardLoading() {},
      setCardError() { assert.fail('No debe renderizar error global'); },
      setCardData(...args) { rendered = { html: args[6], badge: args[9] }; },
    });

    assert.equal(result.coverage_status, 'PARTIAL');
    assert.doesNotMatch(rendered.html, /Cobertura parcial/i);
    assert.match(rendered.html, /Verificar portal/);
    assert.match(rendered.html, /target="_blank"/);
    assert.match(rendered.html, /rel="noopener noreferrer"/);
    assert.match(rendered.badge, /bg-emerald-500/);
    assert.match(rendered.badge, /7\/12 VERIFICADAS/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Huancayo se pinta antes del agregado y distingue deuda pendiente de estado desconocido', async () => {
  const originalFetch = globalThis.fetch;
  let finishAggregate;
  const renders = [];
  const huancayo = {
    municipio: 'Huancayo', provincia: 'Junín', fuente: 'SATH Huancayo', success: true,
    verification_status: 'VERIFIED_POSITIVE', tiene_papeletas: true, total: 1,
    data: [{
      Papeleta: '20-363886', Placa: 'W4N068', Código: 'L7',
      Infracción: 'Usar <b>bocina</b> innecesariamente', Fecha: '27/10/2022',
      Conductor: 'Fierro Vilca', Propietario: 'Titular de prueba', Importe: 215.4,
      Cargo: 552.5, Descuento: 495, Saldo: 57.5,
      Situación: 'REGISTRADA', Estado: 'REGISTRADA', EstadoRegistro: 'REGISTRADA', EstadoPago: 'UNKNOWN',
    }],
  };
  try {
    globalThis.fetch = async url => {
      if (String(url).includes('/municipal/huancayo/')) {
        return new Response(JSON.stringify({ success: true, data: [huancayo], municipios_total: 1, municipios_verificados: 1 }), { status: 200 });
      }
      return await new Promise(resolve => {
        finishAggregate = () => resolve(new Response(JSON.stringify({
          success: true, coverage_status: 'PARTIAL', municipios_total: 11,
          municipios_verificados: 7, municipios_no_disponibles: 4,
          data: [{ municipio: 'Cusco', provincia: 'Cusco', fuente: 'Portal Cusco', success: true, verification_status: 'VERIFIED_NONE', tiene_papeletas: false }],
        }), { status: 200 }));
      });
    };
    const resultPromise = runFetchMunicipal('W4N068', 'https://backend.test', {
      setCardLoading() {}, setCardError(_id, _title, _subtitle, _icon, _logo, _provider, message) { assert.fail(message); },
      setCardData(...args) { renders.push(args); },
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(renders.length, 1, 'Huancayo debe pintarse mientras las otras fuentes siguen pendientes');
    assert.match(renders[0][6], /20-363886/);
    finishAggregate();
    const result = await resultPromise;
    assert.equal(result.coverage_status, 'PARTIAL');
    assert.equal(result.municipios_total, 12);
    const html = renders.at(-1)[6];
    assert.match(html, /S\/ 215\.40/);
    assert.match(html, /Cargo:<\/strong> <span>S\/ 552\.50/);
    assert.match(html, /Descuento:<\/strong> <span>S\/ 495\.00/);
    assert.match(html, /Saldo:<\/strong> <span class="font-black text-rose-600 dark:text-rose-400">S\/ 57\.50/);
    assert.match(renders[0][9], /role="status"/);
    assert.match(renders[0][9], /fa-spinner fa-spin/);
    assert.doesNotMatch(renders[0][9], /bg-amber-500/);
    assert.match(html, /Titular de prueba/);
    assert.match(html, /0 pagadas/);
    assert.match(html, /1 desconocidas/);
    assert.match(html, /&lt;b&gt;bocina&lt;\/b&gt;/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('cada municipalidad tiene un formulario público explícito para verificar', () => {
  assert.equal(Object.keys(MUNICIPAL_SOURCE_URLS).length, 12);
  for (const [municipio, url] of Object.entries(MUNICIPAL_SOURCE_URLS)) {
    assert.ok(url.startsWith('https://'), `${municipio} debe usar HTTPS`);
  }
  assert.equal(MUNICIPAL_SOURCE_URLS.Cajamarca, 'https://www.satcajamarca.gob.pe/consultas');
  assert.equal(MUNICIPAL_SOURCE_URLS.Piura, 'https://fiscalizacionelectronica.munipiura.gob.pe/');
  assert.equal(MUNICIPAL_SOURCE_URLS.Huancayo, 'https://estadocuentavirtual.sath.gob.pe/papeletastransito');
});
