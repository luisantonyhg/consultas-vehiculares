/**
 * Ejecuta trabajos en el orden declarado, con concurrencia acotada y sin la
 * barrera artificial de los lotes. Cuando termina un trabajo, inicia el
 * siguiente inmediatamente aunque otro trabajo anterior siga procesando.
 */
export async function runOrderedWithConcurrency(jobs, concurrency = 4, hooks = {}) {
    const limit = Math.max(1, Math.min(Number(concurrency) || 1, jobs.length || 1));
    const results = new Array(jobs.length);
    const queuedAt = performance.now();
    let nextIndex = 0;

    async function worker() {
        while (true) {
            const index = nextIndex++;
            if (index >= jobs.length) return;
            const startedAt = performance.now();
            hooks.onStart?.({ index, queue_wait_ms: startedAt - queuedAt });
            try {
                const value = await jobs[index]();
                results[index] = { status: 'fulfilled', value };
            } catch (reason) {
                results[index] = { status: 'rejected', reason };
            } finally {
                hooks.onFinish?.({
                    index,
                    queue_wait_ms: startedAt - queuedAt,
                    processing_ms: performance.now() - startedAt,
                    status: results[index].status,
                });
            }
        }
    }

    await Promise.all(Array.from({ length: limit }, () => worker()));
    return results;
}

/**
 * P0.4.1: scheduler por SECCIÓN con dependencias (DAG).
 * Cada worker toma UNA sección, la ejecuta y LIBERA el slot al terminar.
 * Un nodo es READY cuando todos sus `deps` finalizaron; los recién
 * desbloqueados compiten al FINAL de la cola (FIFO = fairness, sin
 * reservas). `concurrency` = máximo de SECCIONES activas, nunca de cadenas.
 * Sin ciclos: si la cola se vacía con nodos pendientes (dependencias
 * incumplibles), se marcan `skipped` en vez de colgar.
 */
export async function runSectionsWithDependencies(nodes, concurrency = 2, hooks = {}) {
    const limit = Math.max(1, Number(concurrency) || 1);
    const byId = new Map(nodes.map(node => [node.id, node]));
    const launched = new Set();
    const finished = new Set();
    const queued = new Set();
    const ready = [];
    for (const node of nodes) {
        if (!node.deps?.length) {
            ready.push(node.id);
            queued.add(node.id);
        }
    }
    const results = {};
    const running = new Map();
    let activeSections = 0;
    let peakActiveSections = 0;
    const queuedAt = performance.now();

    const unblockDependents = () => {
        for (const node of nodes) {
            if (finished.has(node.id) || launched.has(node.id) || queued.has(node.id)) continue;
            if ((node.deps || []).every(dep => finished.has(dep))) {
                ready.push(node.id);
                queued.add(node.id);
            }
        }
    };

    while (finished.size < byId.size) {
        while (ready.length > 0 && running.size < limit) {
            const id = ready.shift();
            queued.delete(id);
            if (finished.has(id) || launched.has(id)) continue;
            launched.add(id);
            activeSections++;
            peakActiveSections = Math.max(peakActiveSections, activeSections);
            const startedAt = performance.now();
            hooks.onStart?.({ id, index: nodes.findIndex(node => node.id === id), queue_wait_ms: startedAt - queuedAt });
            const task = Promise.resolve()
                .then(() => byId.get(id).run())
                .then(
                    value => ({ id, status: 'fulfilled', value }),
                    reason => ({ id, status: 'rejected', reason }),
                )
                .then(outcome => {
                    running.delete(id);
                    activeSections--;
                    finished.add(id);
                    results[id] = outcome;
                    unblockDependents();
                    hooks.onFinish?.({
                        id,
                        index: nodes.findIndex(node => node.id === id),
                        queue_wait_ms: startedAt - queuedAt,
                        processing_ms: performance.now() - startedAt,
                        status: outcome.status,
                    });
                });
            running.set(id, task);
        }
        if (finished.size < byId.size) {
            if (running.size === 0) {
                for (const node of nodes) {
                    if (finished.has(node.id) || launched.has(node.id)) continue;
                    launched.add(node.id);
                    finished.add(node.id);
                    results[node.id] = { status: 'skipped', reason: 'unmet-dependencies' };
                }
                break;
            }
            await Promise.race(running.values());
        }
    }
    return { results, peakActiveSections };
}
