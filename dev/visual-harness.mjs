import { mkdir, writeFile } from 'node:fs/promises';
import { renderHistorialDuenos, initHistorialDuenosEvents } from '../src/utils/renderers/historial_duenos.js';
import { renderSunarp } from '../src/utils/renderers/registrales.js';

const base = {
  status: 'OK', placa: 'C9Q434', registro: { partida: '50422083', oficina: 'Lima', area: 'SPRL' },
  vehiculo: { marca: 'TOYOTA', modelo: 'YARIS', estado: 'EN CIRCULACIÓN' },
  ownership_history: { actual_identified: [{ nombre: 'TITULAR ACTUAL OMITIDO EN ESTE BLOQUE', tipo: 'persona_natural', desde: '2022' }], previous: [{ nombre: 'FERNANDEZ REYES, CARMEN ALICIA', asiento: 9, desde: '02/03/2018', periodo: '2018 - 2022' }] },
  gravamenes: { status: 'VERIFIED_NONE', vigentes: [], historicos: [{ tipo: 'ROBO', lifecycle_status: 'CLOSED' }] },
  verification: { registry_record: 'VERIFIED', public_current_owner: 'VERIFIED', ownership_history: 'VERIFIED', seat_list: 'VERIFIED', seat_details: 'VERIFIED', encumbrances_history: 'VERIFIED' },
  resumen: { total_asientos: 5, etapas_titularidad: 3, transferencias: 3, cambios_caracteristicas: 0, propietarios_unicos_historicos: 4 },
  scope: { registry: 'SPRL_PARTIDA_SEATS', coverage_complete_for_source: true, external_sources_checked: [] },
  timeline: [
    { asiento: 7, anio: 2017, titulo: '2017 - 00962303', rubro_codigo: 'W', family: 'LEGAL_RESTRICTION', legal_effect: 'CREATE', lifecycle_status: 'CLOSED', acto: 'ANOTACIÓN DE ROBO', inscripcion_raw: '15/11/2017 10:20', presentacion_raw: '14/11/2017 09:10', rubro_raw: 'AFECTACIONES', participantes_naturales: [], participantes_juridicos: [] },
    { asiento: 8, anio: 2018, titulo: '2018 - 00120507', rubro_codigo: 'W', family: 'LEGAL_RESTRICTION', legal_effect: 'CANCEL', lifecycle_status: 'CLOSED', acto: 'CANCELACIÓN DE ANOTACIÓN DE ROBO', inscripcion_raw: '12/01/2018 12:10', presentacion_raw: '10/01/2018 08:30', rubro_raw: 'AFECTACIONES', participantes_naturales: [], participantes_juridicos: [] },
    { asiento: 9, anio: 2018, titulo: '2018 - 00476547', rubro_codigo: 'V', family: 'OWNERSHIP', ownership_effect: 'TRANSFER', acto: 'COMPRA - VENTA', inscripcion_raw: '02/03/2018 16:59', presentacion_raw: '28/02/2018 13:46', rubro_raw: 'TRANSFERENCIA DE PROPIEDAD', paginas: ['1'], participantes_naturales: ['FERNANDEZ REYES, CARMEN ALICIA'], participantes_juridicos: [] },
    { asiento: 10, anio: 2020, titulo: '2020 - 00800112', rubro_codigo: 'V', family: 'OWNERSHIP', ownership_effect: 'TRANSFER', acto: 'COMPRA - VENTA', inscripcion_raw: '20/08/2020 10:25', presentacion_raw: '17/08/2020 11:00', rubro_raw: 'TRANSFERENCIA DE PROPIEDAD', paginas: ['1'], participantes_naturales: ['PROPIETARIO INTERMEDIO'], participantes_juridicos: [] },
    { asiento: 12, anio: 2022, titulo: '2022 - 01101335', rubro_codigo: 'V', family: 'OWNERSHIP', ownership_effect: 'TRANSFER', acto: 'COMPRA - VENTA', inscripcion_raw: '27/04/2022 17:25', presentacion_raw: '18/04/2022 11:13', rubro_raw: 'TRANSFERENCIA DE PROPIEDAD', paginas: ['1'], participantes_naturales: ['VICTORIO GONZALES, EDUARDO BENJAMIN'], participantes_juridicos: [] },
  ],
};
const states = {
  verified: base,
  partial: { ...base, verification: { ...base.verification, seat_details: 'PARTIAL', ownership_history: 'PARTIAL', encumbrances_history: 'PARTIAL' }, resumen: { ...base.resumen, transferencias: null, gravamenes_vigentes: null }, gravamenes: { status: 'PARTIAL', vigentes: [], historicos: [] } },
  found: { ...base, gravamenes: { status: 'FOUND', vigentes: [{ tipo: 'EMBARGO', observacion: 'Inscripción de embargo de prueba', fecha: '2025-01-02', asiento: 'D0001', estado: 'OPEN', lifecycle_status: 'OPEN' }], historicos: [] } },
  mismatch: { ...base, verification: { ...base.verification, current_owner_reconciliation: 'MISMATCH' }, ownership_history: { ...base.ownership_history, actual_identified: [{ nombre: 'Titular público A' }], previous: [{ nombre: 'Titular SPRL B' }] } },
  long_name: { ...base, ownership_history: { ...base.ownership_history, actual_identified: [{ nombre: 'SOCIEDAD ARTIFICIAL DE RESPONSABILIDAD LIMITADA PARA CERTIFICACIÓN DE NOMBRES JURÍDICOS EXTREMADAMENTE LARGOS S.A.C.' }] } },
};
const state = process.argv[2] || 'verified';
const selected = states[state] || base;
// La capa registral se invoca en la misma preparación de producción; su ficha
// vehicular no se monta aquí porque el diseño aprobado ya la muestra en otra sección.
renderSunarp(selected.vehiculo, 'C9Q434');
const html = renderHistorialDuenos(selected, 'C9Q434');
await mkdir('artifacts/frontend_step13/final', { recursive: true });
await writeFile('dev/visual-harness.html', `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Harness SPRL V3 - ${state}</title><script src="https://cdn.tailwindcss.com"></script><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"><style>body{margin:0;background:#f8fafc;font-family:Arial,sans-serif}.sprl-timeline-item{min-width:0}button:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}</style></head><body><main class="mx-auto max-w-5xl p-3 sm:p-6"><div class="mb-3 rounded-xl bg-slate-900 p-3 text-xs font-bold text-white">HARNESS DEV · Fixture: ${state.toUpperCase()}</div>${html}</main><script>(${initHistorialDuenosEvents.toString()})();</script></body></html>`);
console.log(`Generated dev/visual-harness.html for ${state}`);
