/** Orden de lanzamiento estratégico de las 21 consultas automáticas habilitadas. */
export const ENABLED_EXECUTION_ORDER = Object.freeze([
    { position: 1, id: 'sunarp', phase: 'validation' },
    { position: 2, id: 'soat_detallado', phase: 'fast' },
    { position: 3, id: 'placas_pe', phase: 'fast' },
    { position: 4, id: 'osinergmin', phase: 'fast' },
    { position: 5, id: 'sutran', phase: 'fast' },
    { position: 6, id: 'fise', phase: 'fast' },
    { position: 7, id: 'gnv', phase: 'fast' },
    { position: 8, id: 'cinemometro', phase: 'fast' },
    { position: 9, id: 'valor_venal', phase: 'fast' },
    { position: 10, id: 'citv', phase: 'background' },
    { position: 11, id: 'lunas', phase: 'background' },
    { position: 12, id: 'callao', phase: 'background' },
    { position: 13, id: 'sigm', phase: 'advanced' },
    { position: 14, id: 'lima', phase: 'advanced' },
    { position: 15, id: 'atu', phase: 'advanced' },
    { position: 16, id: 'municipal', phase: 'advanced' },
    { position: 17, id: 'soat', phase: 'advanced' },
    { position: 18, id: 'historial_dueños', phase: 'registry' },
    { position: 19, id: 'sat_captura', phase: 'advanced' },
    { position: 20, id: 'sat_deposito', phase: 'advanced' },
    { position: 21, id: 'sbs', phase: 'final' },
]);

// LUNAS ya se lanzó en segundo plano. SBS queda al final porque su navegador
// fue la consulta avanzada más lenta que bloqueaba resultados más útiles.
export const ADVANCED_EXECUTION_ORDER = Object.freeze([
    'atu',
    'sigm',
    'lima',
    'municipal',
    'soat',
    'historial_dueños',
    'sat_captura',
    'sat_deposito',
    'sbs',
]);
