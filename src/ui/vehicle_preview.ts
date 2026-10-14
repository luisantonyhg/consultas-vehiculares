type Catalog = Record<string, string>;
import { buildConsolidatedPayload, calculateVehicleScore } from '../services/vehicle_score.js';
let catalog: Promise<Catalog> | undefined;
const normalize = (value: unknown) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

export async function updateVehiclePreview(results: Record<string, any>) {
    const image = document.getElementById('vehicle-preview-image') as HTMLImageElement | null;
    if (!image) return;
    const fields: Record<string, unknown> = {};
    const collect = (value: any) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return;
        for (const [key, item] of Object.entries(value)) {
            if (item && typeof item === 'object') collect(item);
            else fields[normalize(key)] = item;
        }
    };
    collect(results.sunarp);
    const brand = normalize(fields.marca);
    let model = normalize(fields.modelo);
    if (model.startsWith('np300') || model.startsWith('frontier')) model = 'frontier';
    const rawColor = normalize(fields.color);
    const color = rawColor.includes('plata') || rawColor.includes('silver') ? 'plata'
        : rawColor.includes('gris') ? 'gris' : rawColor.includes('blanco') ? 'blanco'
        : rawColor.includes('negro') ? 'negro' : rawColor.includes('rojo') ? 'rojo' : '';
    catalog ??= fetch('/assets/vehicles/catalog.json').then(r => r.ok ? r.json() : {}).catch(() => ({}));
    const entries = Object.entries(await catalog).filter(([key]) => {
        const parts = key.split('|');
        return parts[0] === brand && parts[2] === color && (model === parts[1] || model.startsWith(parts[1]));
    }).sort(([a], [b]) => b.length - a.length);
    const asset = entries[0]?.[1];
    if (!image.isConnected) return;
    image.src = asset || '/assets/vehicles/default.png';
    const caption = document.getElementById('vehicle-preview-caption');
    const description = [fields.marca, fields.modelo, fields.color].filter(Boolean).join(' · ');
    if (caption) caption.textContent = description || 'Vehículo consultado';
    image.alt = description || 'Vehículo consultado';
    image.onerror = () => { image.onerror = null; image.src = '/assets/vehicles/default.png'; };
    const { score, verified, totalSources, coveragePercent } = calculateVehicleScore(buildConsolidatedPayload('', results));
    // El anillo parte en 0 % y crece según se resuelven las fuentes; al
    // terminar la consulta muestra la salud final.
    const done = (window as any).__canitaConsultationDone === true;
    const percentage = done
        ? (verified > 0 ? score : null)
        : (verified > 0 ? Math.round(score * coveragePercent / 100) : 0);
    const label = document.getElementById('vehicle-query-progress');
    if (label) label.textContent = percentage === null ? '—' : `${percentage}%`;
    const progress = document.getElementById('vehicle-query-progressbar');
    if (progress) {
        progress.style.setProperty('--health-value', `${percentage ?? 0}%`);
        progress.style.setProperty('--health-color', percentage === null ? '#94a3b8' : percentage >= 80 ? '#059669' : percentage >= 50 ? '#b7791f' : '#e11d48');
        if (percentage !== null) progress.setAttribute('aria-valuenow', String(percentage));
        else progress.removeAttribute('aria-valuenow');
    }
    const coverage = document.getElementById('vehicle-health-coverage');
    if (coverage) coverage.textContent = `${verified}/${totalSources} fuentes · ${coveragePercent}% cobertura`;
}
