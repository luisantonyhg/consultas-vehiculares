import {
    parseDateDDMMYYYY,
    renderSOAT,
    renderCITV,
    renderLunas,
    renderCallao,
    renderSutran,
    renderAtu,
    renderGNV
} from '../utils/renderers.js';

export async function runFetchSOAT(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('soat', 'SOAT', 'Seguro Obligatorio de Accidentes de Tránsito', 'fas fa-shield-halved', '', 'APESEG');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
        const res = await fetch(`${BACKEND_URL}/soat/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
            callbacks.processVehicleInfo('soat', data.data);

            if (Array.isArray(data.data)) {
                data.data.sort((a, b) => {
                    const dateA = parseDateDDMMYYYY(a.FechaFin || a.FechaFinS);
                    const dateB = parseDateDDMMYYYY(b.FechaFin || b.FechaFinS);
                    return dateB.getTime() - dateA.getTime();
                });
            }

            let customBadge = '';
            if (data.data && data.data.length > 0) {
                const latestSOAT = data.data[0];
                const estado = (latestSOAT.Estado || '').toUpperCase().trim();
                const now = new Date();
                now.setHours(0,0,0,0);
                const endDate = parseDateDDMMYYYY(latestSOAT.FechaFin);
                const isExpiredByDate = endDate < now;
                const isVigente = (estado === 'VIGENTE' || estado === 'ACTIVO') && !isExpiredByDate;
                if (isVigente) {
                    customBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider">
                        <i class="fas fa-circle-check"></i> ACTIVO
                    </span>`;
                } else {
                    const label = estado === 'ANULADO' ? 'ANULADO' : 'VENCIDO';
                    customBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-500 text-white shadow-sm uppercase tracking-wider">
                        <i class="fas fa-circle-xmark"></i> ${label}
                    </span>`;
                }
            }

            const content = renderSOAT(data.data, plate);
            callbacks.setCardData('soat', 'SOAT', '', 'fas fa-shield-halved', '', 'APESEG', content, true, data.data?.length > 0, customBadge);
            return data;
        } else {
            callbacks.setCardError('soat', 'SOAT', '', 'fas fa-shield-halved', '', 'APESEG', data.error || 'Error desconocido', plate);
            return data;
        }
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado (30s).' : (err.message || 'Error de conexión');
        callbacks.setCardError('soat', 'SOAT', '', 'fas fa-shield-halved', '', 'APESEG', msg, plate);
        return { success: false, error: msg };
    }
}

export async function runFetchCITV(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('citv', 'Inspección Técnica Vehicular', '', 'fas fa-clipboard-check', '', 'MTC');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 130000);
    try {
        const res = await fetch(`${BACKEND_URL}/citv/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
            callbacks.processVehicleInfo('citv', data.data);

            if (Array.isArray(data.data)) {
                data.data.sort((a, b) => {
                    const dateA = parseDateDDMMYYYY(a.fechaVencimiento || a.fechaInspeccion);
                    const dateB = parseDateDDMMYYYY(b.fechaVencimiento || b.fechaInspeccion);
                    return dateB.getTime() - dateA.getTime();
                });
            }

            let customBadge = '';
            if (data.data && data.data.length > 0) {
                const latestCITV = data.data[0];
                const estado = (latestCITV.estado || latestCITV.resultado || '').toUpperCase().trim();
                const now = new Date();
                now.setHours(0,0,0,0);
                const vencimientoDate = parseDateDDMMYYYY(latestCITV.fechaVencimiento);
                const isExpiredByDate = vencimientoDate < now;
                const isVigente = (estado === 'VIGENTE' || estado === 'APROBADO' || estado === 'APROBADA') && !isExpiredByDate;
                if (isVigente) {
                    customBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider">
                        <i class="fas fa-circle-check"></i> VIGENTE
                    </span>`;
                } else {
                    customBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-500 text-white shadow-sm uppercase tracking-wider">
                        <i class="fas fa-circle-xmark"></i> VENCIDO
                    </span>`;
                }
            }

            const content = renderCITV(data.data, plate);
            callbacks.setCardData('citv', 'Inspección Técnica Vehicular', '', 'fas fa-clipboard-check', '', 'MTC', content, true, data.data?.length > 0, customBadge);
            return data;
        } else {
            callbacks.setCardError('citv', 'Inspección Técnica Vehicular', '', 'fas fa-clipboard-check', '', 'MTC', data.error || 'Error de captcha MTC', plate);
            return data;
        }
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado en el navegador (130s).' : (err.message || 'Error de conexión');
        callbacks.setCardError('citv', 'Inspección Técnica Vehicular', '', 'fas fa-clipboard-check', '', 'MTC', msg, plate);
        return { success: false, error: msg };
    }
}

export async function runFetchLunas(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('lunas', 'Lunas Oscurecidas', '', 'fas fa-eye-slash', '', 'PNP');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 165000);
    try {
        const res = await fetch(`${BACKEND_URL}/lunas/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
            const content = renderLunas(data.data, plate);
            callbacks.setCardData('lunas', 'Lunas Oscurecidas', '', 'fas fa-eye-slash', '', 'PNP', content, true, data.data && data.data.length > 0);
            return data;
        } else {
            callbacks.setCardError('lunas', 'Lunas Oscurecidas', '', 'fas fa-eye-slash', '', 'PNP', data.error || 'Error en consulta de lunas PNP', plate);
            return data;
        }
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado (165s).' : (err.message || 'Error de conexión');
        callbacks.setCardError('lunas', 'Lunas Oscurecidas', '', 'fas fa-eye-slash', '', 'PNP', msg, plate);
        return { success: false, error: msg };
    }
}

export async function runFetchCallao(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('callao', 'Papeletas Callao', '', 'fas fa-ticket', '', 'Mun. Callao');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 165000);
    try {
        const res = await fetch(`${BACKEND_URL}/callao/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
            const content = renderCallao(data.data, plate, data.total);
            callbacks.setCardData('callao', 'Papeletas Callao', '', 'fas fa-ticket', '', 'Mun. Callao', content, true, data.data?.length > 0);
            return data;
        } else {
            callbacks.setCardError('callao', 'Papeletas Callao', '', 'fas fa-ticket', '', 'Mun. Callao', data.error || 'Error al consultar papeletas', plate);
            return data;
        }
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado.' : (err.message || 'Error de conexión');
        callbacks.setCardError('callao', 'Papeletas Callao', '', 'fas fa-ticket', '', 'Mun. Callao', msg, plate);
        return { success: false, error: msg };
    }
}

export async function runFetchSutran(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('sutran', 'Papeletas SUTRAN', '', 'fas fa-road', '', 'SUTRAN');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    try {
        const res = await fetch(`${BACKEND_URL}/sutran/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
            const content = renderSutran(data.data, plate, data.info_reporte || '');
            callbacks.setCardData('sutran', 'Papeletas SUTRAN', '', 'fas fa-road', '', 'SUTRAN', content, true, data.data?.length > 0);
            return data;
        } else {
            callbacks.setCardError('sutran', 'Papeletas SUTRAN', '', 'fas fa-road', '', 'SUTRAN', data.error || 'Error al consultar SUTRAN', plate);
            return data;
        }
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado.' : (err.message || 'Error de conexión');
        callbacks.setCardError('sutran', 'Papeletas SUTRAN', '', 'fas fa-road', '', 'SUTRAN', msg, plate);
        return { success: false, error: msg };
    }
}

export async function runFetchATU(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('atu', 'Habilitación Taxi ATU', '', 'fas fa-taxi', '', 'ATU');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);
    try {
        const res = await fetch(`${BACKEND_URL}/atu/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
            callbacks.processVehicleInfo('atu', data.data);
            const content = renderAtu(data.data, plate);
            const hasData = data.data && data.data.fuenteDato !== 'NOREGISTRADO' && data.data.estadoCertificado === 1;
            callbacks.setCardData('atu', 'Habilitación Taxi ATU', '', 'fas fa-taxi', '', 'ATU', content, true, hasData);
            return data;
        } else {
            callbacks.setCardError('atu', 'Habilitación Taxi ATU', '', 'fas fa-taxi', '', 'ATU', data.error || 'Error al consultar habilitación', plate);
            return data;
        }
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado en el navegador (120s).' : (err.message || 'Error de conexión');
        callbacks.setCardError('atu', 'Habilitación Taxi ATU', '', 'fas fa-taxi', '', 'ATU', msg, plate);
        return { success: false, error: msg };
    }
}

export async function runFetchGNV(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('gnv', 'Gas Natural Vehicular (GNV)', '', 'fas fa-fire-flame-curved', '', 'Infogas');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);
    try {
        const res = await fetch(`${BACKEND_URL}/gnv/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
            const content = renderGNV(data.data, plate);
            const hasData = Array.isArray(data.data) && data.data.length > 0;
            let customBadge = '';
            if (hasData) {
                const cert = data.data[0];
                const habilitado = (cert.vehiculoHabilitado || '').toLowerCase();
                const esHabilitado = habilitado === 'sí' || habilitado === 'si';
                customBadge = esHabilitado
                    ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider">
                        <i class="fas fa-circle-check"></i> HABILITADO
                       </span>`
                    : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-500 text-white shadow-sm uppercase tracking-wider">
                        <i class="fas fa-circle-xmark"></i> NO HABILITADO
                       </span>`;
            }
            callbacks.setCardData('gnv', 'Gas Natural Vehicular (GNV)', '', 'fas fa-fire-flame-curved', '', 'Infogas', content, true, hasData, customBadge);
            return data;
        } else {
            callbacks.setCardError('gnv', 'Gas Natural Vehicular (GNV)', '', 'fas fa-fire-flame-curved', '', 'Infogas', data.error || 'Error al consultar GNV', plate);
            return data;
        }
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado (120s).' : (err.message || 'Error de conexión');
        callbacks.setCardError('gnv', 'Gas Natural Vehicular (GNV)', '', 'fas fa-fire-flame-curved', '', 'Infogas', msg, plate);
        return { success: false, error: msg };
    }
}
