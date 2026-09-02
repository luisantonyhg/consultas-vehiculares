import test from 'node:test';
import assert from 'node:assert/strict';

import { MUNICIPAL_SOURCE_URLS, runFetchMunicipal } from '../src/services/providers/energy_municipal.js';


test('sin registros municipales mantiene badge verde aunque alguna fuente no esté disponible', async () => {
  const originalFetch = globalThis.fetch;
  let rendered = null;
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({
      success: true,
      coverage_status: 'PARTIAL',
      municipios_total: 11,
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
    assert.match(rendered.badge, /SIN REGISTROS/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('cada municipalidad tiene un formulario público explícito para verificar', () => {
  assert.equal(Object.keys(MUNICIPAL_SOURCE_URLS).length, 11);
  for (const [municipio, url] of Object.entries(MUNICIPAL_SOURCE_URLS)) {
    assert.ok(url.startsWith('https://'), `${municipio} debe usar HTTPS`);
  }
  assert.equal(MUNICIPAL_SOURCE_URLS.Cajamarca, 'https://www.satcajamarca.gob.pe/consultas');
  assert.equal(MUNICIPAL_SOURCE_URLS.Piura, 'https://fiscalizacionelectronica.munipiura.gob.pe/');
});
