/** Orden de lanzamiento estratégico de las 18 secciones habilitadas. */
export const ENABLED_EXECUTION_ORDER = Object.freeze([
    { position: 1, id: 'sunarp', phase: 'validation' },
    { position: 2, id: 'soat', phase: 'fast' },
    { position: 3, id: 'soat_detallado', phase: 'fast' },
    { position: 4, id: 'citv', phase: 'fast' },
    { position: 5, id: 'gnv', phase: 'fast' },
    { position: 6, id: 'callao', phase: 'fast' },
    { position: 7, id: 'sutran', phase: 'fast' },
    { position: 8, id: 'cinemometro', phase: 'fast' },
    { position: 9, id: 'municipal', phase: 'fast' },
    { position: 10, id: 'placas_pe', phase: 'fast' },
    { position: 11, id: 'valor_venal', phase: 'fast' },
    { position: 12, id: 'osinergmin', phase: 'fast' },
    { position: 13, id: 'lunas', phase: 'fast' },
    { position: 14, id: 'lima', phase: 'advanced' },
    { position: 15, id: 'sbs', phase: 'advanced' },
    { position: 16, id: 'historial_dueños', phase: 'registry' },
    { position: 17, id: 'sat_captura', phase: 'final' },
    { position: 18, id: 'sat_deposito', phase: 'final' },
]);

// LUNAS ya se lanzó en la fase rápida (posición 13), por lo que no debe esperar
// a Lima, SBS ni al historial registral. Las dos secciones SAT permanecen al final.
export const ADVANCED_EXECUTION_ORDER = Object.freeze([
    'lima',
    'sbs',
    'historial_dueños',
    'sat_captura',
    'sat_deposito',
]);
