/** Orden de lanzamiento estratégico de las 21 consultas automáticas habilitadas. */
export const ENABLED_EXECUTION_ORDER = Object.freeze([
    { position: 1, id: 'sunarp', phase: 'validation' },
    { position: 2, id: 'soat_detallado', phase: 'fast' },
    { position: 3, id: 'placas_pe', phase: 'fast' },
    { position: 4, id: 'osinergmin', phase: 'fast' },
    { position: 4, id: 'sutran', phase: 'fast' },
    { position: 6, id: 'fise', phase: 'fast' },
    { position: 7, id: 'gnv', phase: 'fast' },
    { position: 8, id: 'cinemometro', phase: 'fast' },
    { position: 9, id: 'valor_venal', phase: 'fast' },
    { position: 10, id: 'citv', phase: 'background' },
    // Callao es corto si OCR remoto falla rápido; Lunas es costoso y queda al
    // final de este carril para no retrasar una fuente municipal útil.
    { position: 11, id: 'callao', phase: 'background' },
    { position: 12, id: 'lunas', phase: 'background' },
    { position: 13, id: 'sigm', phase: 'advanced' },
    { position: 14, id: 'lima', phase: 'advanced' },
    { position: 15, id: 'municipal', phase: 'advanced' },
    { position: 16, id: 'historial_dueños', phase: 'registry' },
    { position: 17, id: 'sat', phase: 'advanced' },  // SAT unificado (captura + deposito en una sola sesión)
    { position: 18, id: 'sbs', phase: 'final' },  // SBS ya incluye SOAT en su vuelo compartido
]);

// LUNAS ya se lanzó en segundo plano. SBS queda al final porque su navegador
// fue la consulta avanzada más lenta que bloqueaba resultados más útiles.
export const ADVANCED_EXECUTION_ORDER = Object.freeze([
    'sigm',
    'lima',
    'soat',
    'historial_dueños',
    'sbs',
    'sat',  // SAT unificado
    'municipal',
]);

/**
 * P0.3: separa secciones prioritarias (carril propio) del resto del orden.
 * No reordena nada: `priority` conserva el orden relativo de `priorityIds`
 * presentes en `order`, y `standard` conserva el orden original sin ellas.
 * Cada id aparece exactamente una vez entre ambas listas.
 */
export function splitPrioritySections(order, priorityIds = []) {
    const wanted = new Set(priorityIds);
    const priority = [];
    const standard = [];
    for (const id of order) {
        (wanted.has(id) ? priority : standard).push(id);
    }
    return { priority, standard };
}

/**
 * P0.4.1: dependencias de la fase avanzada (DAG mínimo).
 * - sbs espera a soat: SBS reutiliza la caché granular que SOAT acaba de
 *   poblar → un solo Chromium SBS por placa, nunca simultáneos.
 * La espera es por FINALIZACIÓN, no por reserva de worker: al terminar una
 * sección su slot se libera y el dependiente compite al final de la cola.
 */
export const ADVANCED_DEPENDENCIES = Object.freeze({
    // Railway opera con un único navegador global. Estas dependencias no
    // eliminan ninguna fuente: hacen explícito el orden que la cola ya estaba
    // imponiendo de forma accidental, dejando primero los resultados de mayor
    // valor y evitando que SPRL bloquee Lima desde el inicio.
    historial_dueños: Object.freeze(['lima']),
    sbs: Object.freeze(['soat', 'historial_dueños']),
    sat: Object.freeze(['sbs']),
    municipal: Object.freeze(['sat']),
});

/**
 * Nodos listos para `runSectionsWithDependencies`.
 * Conserva el orden estratégico recibido y declara únicamente las dependencias
 * explícitas. Cada sección debe llegar al scheduler una sola vez.
 */
export function buildAdvancedNodes(standardOrder) {
    const seen = new Set();
    return standardOrder.filter((id) => {
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
    }).map(id => ({
        id,
        deps: [...(ADVANCED_DEPENDENCIES[id] || [])],
    }));
}
