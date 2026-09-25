/**
 * Elige los datos más completos para APESEG. AAP tiene prioridad cuando
 * responde, pero SUNARP/SOAT/CITV acumulados cubren sus campos ausentes.
 */
export function resolveVehicleReference(registryData = {}, accumulatedData = {}, ...extraSources) {
    const pick = (...values) => values.find(value => {
        if (value === undefined || value === null) return false;
        const normalized = String(value).trim().toUpperCase();
        return normalized && !['-', '—', 'N/A', 'NULL', 'UNDEFINED'].includes(normalized);
    }) || '';

    const allSources = [registryData, accumulatedData, ...extraSources].filter(
        s => s && typeof s === 'object'
    );

    const pickField = (...keys) => {
        for (const src of allSources) {
            for (const key of keys) {
                const val = pick(src[key]);
                if (val) return val;
            }
        }
        return '';
    };

    return {
        marca: pickField('marca', 'Marca', 'MARCA'),
        modelo: pickField('modelo', 'Modelo', 'MODELO', 'ModeloVehiculo', 'modeloVehiculo', 'modelo_vehiculo'),
        anio: pickField(
            'anio',
            'Anio',
            'anioFabricacion',
            'AnioFabricacion',
            'anio_fab',
            'anio_modelo',
            'anioModelo',
            'Año',
            'Año Fabricación',
            'Año Modelo',
            'Año de Modelo',
        ),
    };
}
