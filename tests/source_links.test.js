import test from 'node:test';
import assert from 'node:assert/strict';

import { ENABLED_EXECUTION_ORDER } from '../src/services/execution_plan.js';
import { MUNICIPAL_SOURCE_URLS } from '../src/services/providers/energy_municipal.js';
import { SOURCE_URLS } from '../src/utils/renderers.js';


test('las 20 secciones automáticas habilitadas tienen una fuente oficial verificable', () => {
  assert.equal(ENABLED_EXECUTION_ORDER.length, 20);
  for (const { id } of ENABLED_EXECUTION_ORDER) {
    if (id === 'municipal') {
      assert.equal(Object.keys(MUNICIPAL_SOURCE_URLS).length, 12);
      continue;
    }
    assert.ok(SOURCE_URLS[id], `Falta la fuente oficial de ${id}`);
    assert.match(SOURCE_URLS[id], /^https:\/\//, `${id} debe abrir una fuente HTTPS`);
  }
});

test('las fuentes sensibles apuntan al formulario usado por la consulta', () => {
  assert.equal(SOURCE_URLS.sunarp, 'https://consultavehicular.sunarp.gob.pe/consulta-vehicular/inicio');
  assert.equal(SOURCE_URLS.historial_dueños, 'https://sprl.sunarp.gob.pe/sprl/ingreso');
  assert.equal(SOURCE_URLS.lima, 'https://www.sat.gob.pe/VirtualSAT/modulos/papeletas.aspx');
  assert.equal(SOURCE_URLS.callao, 'https://pagopapeletascallao.pe/public/');
  assert.equal(SOURCE_URLS.sigm, 'https://sigm.sunarp.gob.pe/garantias-mobiliarias/inicio');
  assert.equal(SOURCE_URLS.fise, 'https://fise.minem.gob.pe:23308/consulta-taller/pages/consultaTaller/inicio');
  assert.equal(SOURCE_URLS.sat_captura, 'https://www.sat.gob.pe/VirtualSAT/modulos/Capturas.aspx');
  assert.equal(SOURCE_URLS.sat_deposito, 'https://www.sat.gob.pe/VirtualSAT/modulos/ConsultaDeposito.aspx');
});
