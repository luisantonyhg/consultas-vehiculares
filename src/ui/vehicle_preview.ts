type Catalog = Record<string, string>;
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
    image.onerror = () => { image.onerror = null; image.src = '/assets/vehicles/default.png'; };
    const cards = [...document.querySelectorAll<HTMLElement>('#results-cards-wrapper > [data-status]')];
    const finished = cards.filter(card => !['loading', 'waiting'].includes(card.dataset.status || '')).length;
    const percentage = cards.length ? Math.round(100 * finished / cards.length) : 0;
    const label = document.getElementById('vehicle-query-progress');
    if (label) label.textContent = `${percentage}%`;
    const progress = document.getElementById('vehicle-query-progressbar') as HTMLProgressElement | null;
    if (progress) progress.value = percentage;
}
