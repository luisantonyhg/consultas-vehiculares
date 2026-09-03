/** Orden de lanzamiento estratégico de las 20 consultas automáticas habilitadas. */
export const ENABLED_EXECUTION_ORDER = Object.freeze([
    { position: 1, id: 'sunarp', phase: 'validation' },
    { position: 2, id: 'soat', phase: 'fast' },
    { position: 3, id: 'soat_detallado', phase: 'fast' },
    { position: 4, id: 'citv', phase: 'fast' },
    { position: 5, id: 'gnv', phase: 'fast' },
    { position: 6, id: 'fise', phase: 'fast' },
    { position: 7, id: 'callao', phase: 'fast' },
    { position: 8, id: 'sutran', phase: 'fast' },
    { position: 9, id: 'cinemometro', phase: 'fast' },
    { position: 10, id: 'municipal', phase: 'fast' },
    { position: 11, id: 'placas_pe', phase: 'fast' },
    { position: 12, id: 'valor_venal', phase: 'fast' },
    { position: 13, id: 'osinergmin', phase: 'fast' },
    { position: 14, id: 'lunas', phase: 'fast' },
    { position: 15, id: 'lima', phase: 'advanced' },
    { position: 16, id: 'sbs', phase: 'advanced' },
    { position: 17, id: 'sigm', phase: 'advanced' },
    { position: 18, id: 'historial_dueños', phase: 'registry' },
    { position: 19, id: 'sat_captura', phase: 'final' },
    { position: 20, id: 'sat_deposito', phase: 'final' },
]);

// LUNAS ya se lanzó en la fase rápida (posición 13), por lo que no debe esperar
// a Lima, SBS ni al historial registral. Las dos secciones SAT permanecen al final.
export const ADVANCED_EXECUTION_ORDER = Object.freeze([
    'lima',
    'sbs',
    'sigm',
    'historial_dueños',
    'sat_captura',
    'sat_deposito',
]);
