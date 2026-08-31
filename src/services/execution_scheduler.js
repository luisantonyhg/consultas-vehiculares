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
