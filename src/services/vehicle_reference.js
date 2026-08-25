/**
 * Elige los datos más completos para APESEG. AAP tiene prioridad cuando
 * responde, pero SUNARP/SOAT/CITV acumulados cubren sus campos ausentes.
 */
export function resolveVehicleReference(registryData = {}, accumulatedData = {}) {
    const pick = (...values) => values.find(value => {
        if (value === undefined || value === null) return false;
        const normalized = String(value).trim().toUpperCase();
        return normalized && !['-', '—', 'N/A', 'NULL', 'UNDEFINED'].includes(normalized);
    }) || '';

    return {
        marca: pick(registryData.marca, registryData.Marca, accumulatedData.marca),
        modelo: pick(registryData.modelo, registryData.Modelo, accumulatedData.modelo),
        anio: pick(
            registryData.anio,
            registryData.anioFabricacion,
            registryData['Año'],
            registryData['Año Fabricación'],
            accumulatedData.anio,
        ),
    };
}
