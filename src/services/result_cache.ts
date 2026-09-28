import { renderResultsSkeleton } from '../ui/vehicle_results.ts';

type CacheDependencies = {
    getValidation: () => string;
    setValidation: (value: 'found') => void;
    getVehicleData: () => Record<string, any>;
    restoreVehicleData: (value: Record<string, any>) => void;
    whatsappNumber: string;
};

export function createResultCache({ getValidation, setValidation, getVehicleData, restoreVehicleData, whatsappNumber }: CacheDependencies) {
        const resultCache = new Map<string, any>();
        const maxCachedReports = 8;
        const cachePlateToken = (plate: string) => {
            let hash = 2166136261;
            for (const char of plate.replace(/[-\s]/g, '').toUpperCase()) {
                hash ^= char.charCodeAt(0);
                hash = Math.imul(hash, 16777619);
            }
            return (hash >>> 0).toString(16).padStart(8, '0');
        };
        function saveToCache(plate: string) {
            // Solo se reutiliza un informe si SUNARP confirmó la existencia. Así una
            // falla temporal nunca se convierte en una validación persistente.
            if (getValidation() !== 'found') return;
            const cards = [
                'sunarp', 'historial_dueños', 'placas_pe', 'soat', 'soat_detallado',
                'citv', 'valor_venal', 'sbs', 'lima', 'callao', 'sutran',
                'cinemometro', 'municipal', 'gnv', 'fise', 'osinergmin', 'sat_captura',
                'sat_deposito', 'lunas', 'atu', 'atu_infracciones'
            ];
            const cacheData: any = {
                version: 3,
                timestamp: Date.now(),
                sunarpValidation: getValidation(),
                vehicleData: getVehicleData(),
                cards: {}
            };
            cards.forEach(cardId => {
                const container = document.getElementById(`${cardId}-card-container`);
                if (container) {
                    cacheData.cards[cardId] = {
                        status: container.getAttribute('data-status'),
                        className: container.className,
                        innerHTML: container.innerHTML
                    };
                }
            });
            resultCache.set(plate, cacheData);
            while (resultCache.size > maxCachedReports) {
                const oldestPlate = resultCache.keys().next().value;
                if (oldestPlate === undefined) break;
                resultCache.delete(oldestPlate);
            }
            console.info('[CACHE-DECISION]', {
                source: 'frontend-memory',
                action: 'WRITE',
                plate_hash: cachePlateToken(plate),
                sections: Object.keys(cacheData.cards).length,
                ttl_ms: 5 * 60 * 1000,
            });
        }

        // Una consulta reciente se devuelve sin red. Una vencida pero aún útil
        // se muestra de inmediato y el flujo normal la actualiza en segundo
        // plano; así no ocultamos evidencia ya obtenida mientras un portal
        // lento (SPRL, FISE, SAT) vuelve a responder.
        function loadFromCache(plate: string): 'fresh' | 'stale' | 'miss' {
            const cacheData = resultCache.get(plate);
            if (!cacheData) {
                console.info('[CACHE-DECISION]', { source: 'frontend-memory', action: 'MISS', plate_hash: cachePlateToken(plate) });
                return 'miss';
            }
            try {
                if (cacheData.version !== 3 || cacheData.sunarpValidation !== 'found' || !cacheData.cards?.sunarp) {
                    resultCache.delete(plate);
                    console.info('[CACHE-DECISION]', { source: 'frontend-memory', action: 'SKIP_INVALID', plate_hash: cachePlateToken(plate) });
                    return 'miss';
                }
                const age = Date.now() - cacheData.timestamp;
                const freshTtlMs = 5 * 60 * 1000;
                const staleRetentionMs = 30 * 60 * 1000;
                if (age > staleRetentionMs) {
                    resultCache.delete(plate);
                    console.info('[CACHE-DECISION]', { source: 'frontend-memory', action: 'EXPIRED', plate_hash: cachePlateToken(plate), age_ms: age, ttl_ms: staleRetentionMs });
                    return 'miss';
                }
                const cacheState = age > freshTtlMs ? 'stale' : 'fresh';
                
                // Restore vehicleData
                restoreVehicleData(cacheData.vehicleData || {});
                setValidation('found');
                
                // Build results container
                renderResultsSkeleton(plate, whatsappNumber, true); // true = from cache
                
                // Restore cards
                Object.keys(cacheData.cards).forEach(cardId => {
                    const container = document.getElementById(`${cardId}-card-container`);
                    if (container) {
                        const cardCache = cacheData.cards[cardId];
                        container.setAttribute('data-status', cardCache.status);
                        container.className = cardCache.className;
                        container.innerHTML = cardCache.innerHTML;
                    }
                });
                
                // Set the last query time with a note
                const lastQueryTimeEl = document.getElementById('last-query-time');
                if (lastQueryTimeEl) {
                    const dateStr = new Date(cacheData.timestamp).toLocaleString('es-PE');
                    lastQueryTimeEl.innerHTML = cacheState === 'fresh'
                        ? `${dateStr} <span class="text-emerald-500 font-bold ml-1">(Desde Caché ⚡)</span>`
                        : `${dateStr} <span class="text-amber-600 font-bold ml-1">(Mostrando último resultado · actualizando…)</span>`;
                }

                console.info('[CACHE-DECISION]', {
                    source: 'frontend-memory',
                    action: cacheState === 'fresh' ? 'HIT' : 'STALE_REFRESH',
                    plate_hash: cachePlateToken(plate),
                    age_ms: age,
                    ttl_ms: freshTtlMs,
                });
                
                return cacheState;
            } catch (e) {
                console.error("Error loading cache", e);
                return 'miss';
            }
        }
    return { saveToCache, loadFromCache, invalidate: (plate: string) => resultCache.delete(plate) };
}
