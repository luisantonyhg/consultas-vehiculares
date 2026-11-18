type Catalog = Record<string, string>;
import { buildConsolidatedPayload, calculateVehicleScore } from '../services/vehicle_score.js';

interface CatalogEntry {
    brand: string;
    model: string;
    color: string;
    asset: string;
}

interface CatalogIndex {
    exact: Map<string, string>;
    byBrandModel: Map<string, CatalogEntry[]>;
    byBrandColor: Map<string, string>;
    byBrand: Map<string, string>;
    byColor: Map<string, string>;
    entries: CatalogEntry[];
}

let catalogIndexPromise: Promise<CatalogIndex> | undefined;
const normalize = (value: unknown) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

const BRANDS = ['toyota', 'kia', 'hyundai', 'nissan', 'chevrolet', 'suzuki', 'volkswagen', 'mazda', 'honda', 'chery'];

function isRealValue(value: unknown): boolean {
    if (value === undefined || value === null) return false;
    const s = String(value).trim().toUpperCase();
    return Boolean(s) && !['-', '—', 'N/A', 'NULL', 'UNDEFINED', 'NONE'].includes(s);
}

function detectBrand(raw: unknown): string {
    const b = normalize(raw);
    if (!b) return '';
    if (b === 'vw' || b.includes('volkswagen')) return 'volkswagen';
    for (const candidate of BRANDS) {
        if (b.includes(candidate)) return candidate;
    }
    return b;
}

function detectModel(raw: unknown): string {
    let m = normalize(raw);
    if (!m) return '';
    if (m.startsWith('np300') || m.includes('frontier')) return 'frontier';
    return m;
}

function detectColor(raw: unknown): string {
    const c = normalize(raw);
    if (!c) return '';
    if (c.includes('plata') || c.includes('plateado') || c.includes('silver')) return 'plata';
    if (c.includes('gris') || c.includes('gray') || c.includes('plomo') || c.includes('grafito') || c.includes('ceniza')) return 'gris';
    if (c.includes('blanco') || c.includes('white') || c.includes('perla') || c.includes('marfil')) return 'blanco';
    if (c.includes('negro') || c.includes('black')) return 'negro';
    if (c.includes('rojo') || c.includes('red') || c.includes('granate') || c.includes('vino') || c.includes('guinda')) return 'rojo';
    return '';
}

function buildIndex(rawCatalog: Catalog): CatalogIndex {
    const exact = new Map<string, string>();
    const byBrandModel = new Map<string, CatalogEntry[]>();
    const byBrandColor = new Map<string, string>();
    const byBrand = new Map<string, string>();
    const byColor = new Map<string, string>();
    const entries: CatalogEntry[] = [];

    for (const [key, asset] of Object.entries(rawCatalog)) {
        const parts = key.split('|');
        if (parts.length !== 3 || !asset) continue;
        const [brand, model, color] = parts;
        const item: CatalogEntry = { brand, model, color, asset };
        entries.push(item);
        exact.set(key, asset);
        const bmKey = `${brand}|${model}`;
        const bmList = byBrandModel.get(bmKey) || [];
        bmList.push(item);
        byBrandModel.set(bmKey, bmList);
        const bcKey = `${brand}|${color}`;
        if (!byBrandColor.has(bcKey)) byBrandColor.set(bcKey, asset);
        if (!byBrand.has(brand)) byBrand.set(brand, asset);
        if (!byColor.has(color)) byColor.set(color, asset);
    }
    // Priorizar modelos más específicos (ej. yariscross antes que yaris)
    entries.sort((a, b) => b.model.length - a.model.length);
    return { exact, byBrandModel, byBrandColor, byBrand, byColor, entries };
}

function getCatalogIndex(): Promise<CatalogIndex> {
    catalogIndexPromise ??= fetch('/assets/vehicles/catalog.json')
        .then(r => r.ok ? r.json() : {})
        .catch(() => ({}))
        .then(buildIndex);
    return catalogIndexPromise;
}

export function resolveVehicleAsset(index: CatalogIndex, brand: string, model: string, color: string): string {
    if (brand && model && color) {
        const direct = index.exact.get(`${brand}|${model}|${color}`);
        if (direct) return direct;
    }
    if (brand && model) {
        const modelMatches = index.entries.filter(
            e => e.brand === brand && (e.model === model || model.includes(e.model) || e.model.includes(model))
        );
        if (modelMatches.length > 0) {
            if (color) {
                const withColor = modelMatches.find(e => e.color === color);
                if (withColor) return withColor.asset;
            }
            return modelMatches[0].asset;
        }
    }
    if (brand && color) {
        const bc = index.byBrandColor.get(`${brand}|${color}`);
        if (bc) return bc;
    }
    if (brand) {
        const b = index.byBrand.get(brand);
        if (b) return b;
    }
    if (color) {
        const c = index.byColor.get(color);
        if (c) return c;
    }
    return '/assets/vehicles/default.png';
}

export async function updateVehiclePreview(results: Record<string, any>) {
    const image = document.getElementById('vehicle-preview-image') as HTMLImageElement | null;
    if (!image) return;
    const fields: Record<string, unknown> = {};
    const collect = (value: any) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return;
        for (const [key, item] of Object.entries(value)) {
            if (item && typeof item === 'object') collect(item);
            else if (isRealValue(item)) {
                const nk = normalize(key);
                if (fields[nk] === undefined) fields[nk] = item;
            }
        }
    };
    for (const sourceKey of ['sunarp', 'historial_dueños', 'placas_pe', 'soat_detallado', 'soat', 'citv']) {
        if (results?.[sourceKey]) collect(results[sourceKey]);
    }
    const brand = detectBrand(fields.marca);
    const model = detectModel(fields.modelo);
    const color = detectColor(fields.color);
    const index = await getCatalogIndex();
    const asset = resolveVehicleAsset(index, brand, model, color);
    if (!image.isConnected) return;
    if (image.getAttribute('src') !== asset) {
        image.src = asset;
    }
    const caption = document.getElementById('vehicle-preview-caption');
    const description = [fields.marca, fields.modelo, fields.color].filter(isRealValue).join(' · ');
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
        progress.style.setProperty('--health-track', !done ? '#d1fae5' : '#e2e8f0');
        progress.style.setProperty('--health-color', !done ? '#059669' : percentage === null ? '#94a3b8' : percentage >= 80 ? '#059669' : percentage >= 50 ? '#b7791f' : '#e11d48');
        if (percentage !== null) progress.setAttribute('aria-valuenow', String(percentage));
        else progress.removeAttribute('aria-valuenow');
    }
    const coverage = document.getElementById('vehicle-health-coverage');
    if (coverage) coverage.textContent = `${verified}/${totalSources} fuentes · ${coveragePercent}% cobertura`;
}
