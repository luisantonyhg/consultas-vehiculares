import test from 'node:test';
import assert from 'node:assert/strict';

import { renderHistorialDuenos } from '../src/utils/renderers/historial_duenos.js';
import { renderSunarp } from '../src/utils/renderers/registrales.js';

const base = (overrides = {}) => ({
  status: 'OK',
  placa: 'AUF043',
  registro: { partida: '12345678', oficina: 'Lima' },
  vehiculo: { marca: 'TOYOTA', modelo: 'HILUX', estado: 'EN CIRCULACIÓN' },
  ownership_history: { actual_identified: [{ nombre: 'Titular V3' }], previous: [] },
  gravamenes: { status: 'VERIFIED_NONE', vigentes: [], historicos: [] },
  verification: { registry_record: 'VERIFIED', public_current_owner: 'VERIFIED', ownership_history: 'VERIFIED', seat_list: 'VERIFIED', encumbrances_history: 'VERIFIED' },
  resumen: { total_asientos: 4, etapas_titularidad: 4, transferencias: 3, cambios_caracteristicas: 1 },
  scope: { registry: 'SPRL', external_sources_checked: [] },
  timeline: [],
  ...overrides,
});

test('renderiza VERIFIED V3 y conserva etapas/transferencias del resumen', () => {
  const html = renderHistorialDuenos(base(), 'AUF043');
  assert.match(html, />4<\//);
  assert.match(html, />3<\//);
  assert.match(html, /Inteligencia Registral|Resumen y Diagnóstico/);
  assert.match(html, /No se identificaron afectaciones abiertas/);
});

test('V3 tiene precedencia sobre propiedad legacy contradictoria', () => {
  const html = renderHistorialDuenos(base({ propiedad: { actuales: [{ nombre: 'LEGACY INCORRECTO' }], anteriores: [] } }));
  assert.doesNotMatch(html, /LEGACY INCORRECTO/);
});

test('PARTIAL no convierte métricas desconocidas en cero', () => {
  const html = renderHistorialDuenos(base({
    verification: { ownership_history: 'PARTIAL', seat_list: 'PARTIAL', encumbrances_history: 'PARTIAL' },
    resumen: { total_asientos: null, etapas_titularidad: null, transferencias: null, cambios_caracteristicas: null },
    gravamenes: { status: 'PARTIAL', vigentes: [], historicos: [] },
  }));
  assert.match(html, /Verificación parcial de gravámenes/);
  assert.doesNotMatch(html, /Afectaciones vigentes[\s\S]{0,180}>0<\/div>/);
  assert.match(html, /Total Asientos[\s\S]{0,120}>—<\/strong>/);
  assert.match(html, /Transferencias[\s\S]{0,120}>—<\/strong>/);
  assert.doesNotMatch(html, /limpio de gravámenes/i);
});

test('FOUND muestra afectación abierta sin recalcular su ciclo', () => {
  const html = renderHistorialDuenos(base({
    gravamenes: { status: 'FOUND', vigentes: [{ tipo: 'EMBARGO', acto: 'Inscripción', fecha: '2025-01-02', asiento: 'D0001', lifecycle_status: 'OPEN' }], historicos: [] },
  }));
  assert.match(html, /EMBARGO/);
  assert.match(html, /Detectado/);
});

test('características no crea un titular y participantes vacíos tienen mensaje explícito', () => {
  const html = renderHistorialDuenos(base({ timeline: [{ asiento: 'B0001', family: 'CHARACTERISTICS', acto: 'Cambio de color', participantes_naturales: [], participantes_juridicos: [] }] }));
  assert.match(html, /Cambio de color/);
  assert.match(html, /Sin participantes identificados/);
});

test('cancelaciones se muestran cerradas y los antecedentes no se confunden con vigentes', () => {
  const html = renderHistorialDuenos(base({
    resumen: { total_asientos: 12, etapas_titularidad: 9, transferencias: 8, propietarios_unicos_historicos: 9 },
    gravamenes: {
      status: 'VERIFIED_NONE',
      vigentes: [],
      historicos: [{ tipo: 'Embargo', lifecycle_status: 'CLOSED' }],
    },
    alertas: [{ tipo: 'ROBO_CANCELADO' }],
    timeline: [
      { asiento: 1, acto: 'ANOTACION DE EMBARGO', family: 'LEGAL_RESTRICTION', legal_effect: 'CREATE', lifecycle_status: 'CLOSED' },
      { asiento: 2, acto: 'CANCELACION DE AFECTACION', family: 'LEGAL_RESTRICTION', legal_effect: 'CANCEL', lifecycle_status: 'CLOSED' },
    ],
  }));
  assert.match(html, /Antecedente cancelado/);
  assert.match(html, /bg-rose-50 text-rose-700/);
  assert.match(html, /no se identificaron afectaciones registrales abiertas/i);
  assert.match(html, /<strong>2 antecedente/);
  assert.doesNotMatch(html, /Afectación abierta/);
});

test('C9Q-434 no vuelve a convertir 12 asientos en 12 dueños y 11 transferencias', () => {
  const asientos = [
    { numero: 1, acto: 'ANOTACION DE EMBARGO', family: 'LEGAL_RESTRICTION', legal_effect: 'CREATE', lifecycle_status: 'CLOSED' },
    { numero: 2, acto: 'CANCELACION DE AFECTACION', family: 'LEGAL_RESTRICTION', legal_effect: 'CANCEL', lifecycle_status: 'CLOSED' },
    ...Array.from({ length: 4 }, (_, index) => ({
      numero: index + 3,
      acto: 'COMPRA VENTA',
      family: 'OWNERSHIP',
      ownership_effect: 'TRANSFER',
    })),
    { numero: 7, acto: 'ANOTACION DE ROBO', family: 'LEGAL_RESTRICTION', legal_effect: 'CREATE', lifecycle_status: 'CLOSED' },
    { numero: 8, acto: 'CANCELACION DE ANOTACION DE ROBO', family: 'LEGAL_RESTRICTION', legal_effect: 'CANCEL', lifecycle_status: 'CLOSED' },
    ...Array.from({ length: 4 }, (_, index) => ({
      numero: index + 9,
      acto: 'COMPRA VENTA',
      family: 'OWNERSHIP',
      ownership_effect: 'TRANSFER',
    })),
  ];
  const html = renderHistorialDuenos(base({
    placa: 'C9Q434',
    asientos,
    resumen: {
      total_asientos: 12,
      etapas_titularidad: 8,
      transferencias: 8,
      propietarios_unicos_historicos: 9,
    },
    gravamenes: { status: 'VERIFIED_NONE', vigentes: [], historicos: [{ lifecycle_status: 'CLOSED' }] },
    alertas: [{ tipo: 'ROBO_CANCELADO' }],
  }));
  assert.match(html, /Total Asientos[\s\S]{0,120}>12<\/strong>/);
  assert.match(html, /Etapas de titularidad[\s\S]{0,120}>8<\/strong>/);
  assert.match(html, /Transferencias[\s\S]{0,120}>8<\/strong>/);
  assert.doesNotMatch(html, /11 transferencia/i);
  assert.doesNotMatch(html, /12 propietario/i);
});

test('MISMATCH muestra advertencia neutral y titular público sin historial no se sobreafirma', () => {
  const html = renderHistorialDuenos(base({ ownership_history: { status: 'PARTIAL', current_owner_reconciliation: 'MISMATCH', actual_identified: [{ nombre: 'Titular V3' }], previous: [] }, verification: { public_current_owner: 'VERIFIED', ownership_history: 'NOT_VERIFIED' } }));
  assert.match(html, /Existe diferencia entre la titularidad identificada en SPRL y la Consulta Vehicular SUNARP/);
  assert.doesNotMatch(html, /Historial de titularidad verificado/);
});

test('no repite el titular actual porque ya aparece en Información SUNARP', () => {
  const html = renderHistorialDuenos(base(), 'AUF043');
  assert.doesNotMatch(html, /Titular actual identificado/);
  assert.doesNotMatch(html, /Titular V3/);
});

test('muestra todos los datos gratuitos de cada asiento de forma explícita', () => {
  const html = renderHistorialDuenos(base({
    asientos: [{
      numero: 9, anio: 2018, titulo: '2018 - 00476547', rubro_codigo: 'V',
      inscripcion_raw: '02/03/2018 16:59', presentacion_raw: '28/02/2018 13:46',
      rubro_raw: 'TRANSFERENCIA DE PROPIEDAD', acto_raw: 'COMPRA - VENTA',
      participantes_naturales: ['FERNANDEZ REYES, CARMEN ALICIA'], participantes_juridicos: [],
      paginas: ['1'], family: 'OWNERSHIP', ownership_effect: 'TRANSFER',
    }],
  }), 'C9Q434');
  for (const expected of ['Asiento N.° 9', 'N.° de Título SUNARP', '2018 - 00476547', 'Código de Rubro', 'Fecha de Presentación', '28/02/2018 13:46', 'Fecha de Inscripción', '02/03/2018 16:59', 'Participantes Naturales', 'FERNANDEZ REYES, CARMEN ALICIA']) {
    assert.match(html, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('el diagnóstico explica dinámicamente robo y cancelación posterior', () => {
  const html = renderHistorialDuenos(base({
    asientos: [
      { numero: 7, acto: 'ANOTACION DE ROBO', legal_effect: 'CREATE', lifecycle_status: 'CLOSED', inscripcion_raw: '01/01/2017' },
      { numero: 8, acto: 'CANCELACION DE ANOTACION DE ROBO', legal_effect: 'CANCEL', lifecycle_status: 'CLOSED', inscripcion_raw: '02/02/2018' },
    ],
  }));
  assert.match(html, /anotación de robo/i);
  assert.match(html, /posteriormente cancelado/i);
  assert.match(html, /antecedente cerrado/i);
});

test('NOT_VERIFIED no inventa cero afectaciones ni cero transferencias con asientos parciales', () => {
  const html = renderHistorialDuenos(base({
    ownership_history: { status: 'PARTIAL', actual_identified: [], previous: [] },
    verification: { ownership_history: 'PARTIAL', seat_list: 'PARTIAL', encumbrances_history: 'NOT_VERIFIED' },
    resumen: { total_asientos: null, etapas_titularidad: null, transferencias: null },
    gravamenes: { status: 'NOT_VERIFIED', vigentes: [], historicos: [] },
    asientos: [{ numero: 1, acto: 'COMPRA VENTA' }],
  }));
  assert.match(html, /Transferencias[\s\S]{0,120}>—<\/strong>/);
  assert.match(html, /Afectaciones pendientes de verificación/);
  assert.doesNotMatch(html, /0 vigentes/);
  assert.doesNotMatch(html, /No se identificaron afectaciones abiertas/);
});

test('flujo registral integra ficha vehicular y renderer V3', () => {
  const html = renderSunarp(base().vehiculo, 'AUF043') + renderHistorialDuenos(base(), 'AUF043');
  assert.match(html, /TOYOTA/);
  assert.match(html, /Trazabilidad registral oficial|Partida registral/);
});
