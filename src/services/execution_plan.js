import { secureFetch } from './transport.js';

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
    // ATU permanece aislada hasta confirmar estabilidad del proxy/sesión y
    // de su consumo de memoria. No debe bloquear el carril rápido.
    { position: 10, id: 'atu_infracciones', phase: 'background' },
    { position: 11, id: 'citv', phase: 'background' },
    { position: 11, id: 'callao', phase: 'background' },
    { position: 13, id: 'sigm', phase: 'advanced' },
    // SAT conserva prioridad, pero no bloquea los proveedores independientes.
    { position: 14, id: 'sat', phase: 'advanced' },
    // Lima y Municipal se despachan con el límite avanzado compartido.
    { position: 15, id: 'lima', phase: 'background' },
    { position: 16, id: 'municipal', phase: 'advanced' },
    // Lunas y SBS avanzan antes que SPRL; Historial queda al final porque su
    // navegador puede demorar y no debe retener otras secciones.
    { position: 17, id: 'lunas', phase: 'final' },
    { position: 18, id: 'sbs', phase: 'post_final' },
    { position: 19, id: 'historial_dueños', phase: 'last' },
]);

// SPRL no participa en la cola avanzada: el controlador lo despacha cuando las
// demás fuentes y los portales municipales ya terminaron.
export const ADVANCED_EXECUTION_ORDER = Object.freeze([
    'sigm',
    'soat',
    'sat',  // SAT unificado
    'lima',
    'municipal',
    'sbs',
    'historial_dueños',
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
 * - SOAT y SBS pueden solicitar el mismo vuelo compartido. Single-flight
 *   coalescea la fuente y el bulkhead global mantiene un solo Chromium.
 *   SBS no debe esperar a que el endpoint SOAT termine, porque SOAT puede
 *   estar esperando precisamente el resultado temprano de ese vuelo.
 */
export const ADVANCED_DEPENDENCIES = Object.freeze({
    // SAT unificado corre de forma independiente sin esperar SBS.
    sat: Object.freeze([]),
    // Lima y Municipal consultan fuentes independientes: no heredan la
    // latencia/CAPTCHA del SAT. El dispatcher limita su concurrencia global.
    lima: Object.freeze([]),
    municipal: Object.freeze([]),
    historial_dueños: Object.freeze([]),
    // SBS corre al final absoluto, después de que Lunas haya completado.
    sbs: Object.freeze(['lunas']),
});

/**
 * Nodos listos para `runSectionsWithDependencies`.
 * Conserva el orden estratégico recibido y declara únicamente las dependencias
 * explícitas. Cada sección debe llegar al scheduler una sola vez.
 */
export function buildAdvancedNodes(standardOrder, executionPlan = null) {
    const seen = new Set();
    const members = new Set(standardOrder);
    const declared = new Map((executionPlan?.sections || []).map(section => [section.id, section]));
    return standardOrder.filter((id) => {
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
    }).map(id => ({
        id,
        // Dependencias de otras fases ya se satisfacen antes del dispatcher;
        // el plan del backend gobierna solo los nodos de esta fase.
        deps: [...(declared.get(id)?.depends_on || ADVANCED_DEPENDENCIES[id] || [])]
            .filter(dependency => members.has(dependency)),
    }));
}

/**
 * Lee la política que el backend calculó para el ticket actual. Una caída de
 * esta lectura nunca debe cancelar una consulta válida: el llamador conserva
 * el plan local conservador (un carril pesado) como fallback.
 */
export async function fetchExecutionPlan(backendUrl, ticketId) {
    if (!backendUrl || !ticketId) return null;
    const response = await secureFetch(
        `${backendUrl}/consultations/${encodeURIComponent(ticketId)}/execution-plan`,
    );
    if (!response.ok) throw new Error(`No se pudo obtener el plan de ejecución (HTTP ${response.status}).`);
    const plan = await response.json();
    if (!plan || !plan.limits || !Array.isArray(plan.sections)) {
        throw new Error('El plan de ejecución recibido no tiene un contrato válido.');
    }
    return plan;
}

export function resolveExecutionLimits(plan, admission = {}) {
    const mode = admission?.load_mode || plan?.load_mode || 'protected';
    const fallback = mode === 'fast'
        ? { fast_concurrency: 4, background_concurrency: 2, heavy_concurrency: 1, advanced_dispatch_concurrency: 2 }
        : mode === 'balanced'
            ? { fast_concurrency: 2, background_concurrency: 1, heavy_concurrency: 1, advanced_dispatch_concurrency: 2 }
            : { fast_concurrency: 1, background_concurrency: 1, heavy_concurrency: 1, advanced_dispatch_concurrency: 1 };
    const source = plan?.limits || {};
    return {
        fast_concurrency: Math.max(1, Math.min(4, Number(source.fast_concurrency) || fallback.fast_concurrency)),
        background_concurrency: Math.max(1, Math.min(2, Number(source.background_concurrency) || fallback.background_concurrency)),
        // Mantener el límite conservador hasta comparar memoria en canary.
        heavy_concurrency: 1,
        // Dos wrappers pueden iniciar/seguir un mismo vuelo SBS o esperar red.
        // El bulkhead del backend mantiene un único Chromium físico.
        advanced_dispatch_concurrency: Math.max(1, Math.min(2, Number(source.advanced_dispatch_concurrency) || fallback.advanced_dispatch_concurrency)),
    };
}
