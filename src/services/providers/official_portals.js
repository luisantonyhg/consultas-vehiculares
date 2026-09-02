import { renderLunas, renderCallao, renderSutran, renderCinemometro, renderAtu, renderSBS } from '../../utils/renderers.js';
import { secureFetch } from '../transport.js';

export async function runFetchLunas(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('lunas', 'Lunas Oscurecidas', '', 'fas fa-eye-slash', '', 'PNP');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 165000);
    try {
        const res = await secureFetch(`${BACKEND_URL}/lunas/${plate}`, { signal: controller.signal });
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
        const res = await secureFetch(`${BACKEND_URL}/callao/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
            if (data.mantenimiento) {
                callbacks.setCardError('callao', 'Papeletas Callao', '', 'fas fa-ticket', '', 'Mun. Callao', data.mensaje || 'El portal oficial de la Municipalidad del Callao se encuentra temporalmente en mantenimiento.', plate);
                return data;
            }
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
        const res = await secureFetch(`${BACKEND_URL}/sutran/${plate}`, { signal: controller.signal });
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

export async function runFetchCinemometro(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('cinemometro', 'Papeletas y Cinemómetro SUTRAN', 'Fotos e Infracciones de velocidad', 'fas fa-gauge-high', '', 'SUTRAN');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 65000);
    try {
        const res = await secureFetch(`${BACKEND_URL}/cinemometro/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
            const content = renderCinemometro(data.data, plate, data.info_reporte || '');
            callbacks.setCardData('cinemometro', 'Papeletas y Cinemómetro SUTRAN', 'Fotos e Infracciones de velocidad', 'fas fa-gauge-high', '', 'SUTRAN', content, true, data.data?.length > 0);
            return data;
        } else {
            callbacks.setCardError('cinemometro', 'Papeletas y Cinemómetro SUTRAN', 'Fotos e Infracciones de velocidad', 'fas fa-gauge-high', '', 'SUTRAN', data.error || 'Error al consultar Cinemómetro', plate);
            return data;
        }
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado.' : (err.message || 'Error de conexión');
        callbacks.setCardError('cinemometro', 'Papeletas y Cinemómetro SUTRAN', 'Fotos e Infracciones de velocidad', 'fas fa-gauge-high', '', 'SUTRAN', msg, plate);
        return { success: false, error: msg };
    }
}

export async function runFetchATU(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('atu', 'Habilitación Taxi ATU', '', 'fas fa-taxi', '', 'ATU');
    const controller = new AbortController();
    // 160s: ATU comparte el navegador con SBS (1 a la vez). Margen para que, sin importar
    // cuál tome el navegador primero, el segundo en cola tenga tiempo de ejecutarse.
    const timeoutId = setTimeout(() => controller.abort(), 160000);
    try {
        const res = await secureFetch(`${BACKEND_URL}/atu/${plate}`, { signal: controller.signal });
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
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado en el navegador (160s).' : (err.message || 'Error de conexión');
        callbacks.setCardError('atu', 'Habilitación Taxi ATU', '', 'fas fa-taxi', '', 'ATU', msg, plate);
        return { success: false, error: msg };
    }
}

export async function runFetchSBS(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('sbs', 'Siniestralidad Vehicular', 'SOAT · Vehicular · CAT', 'fas fa-car-burst', '', 'SBS');
    const controller = new AbortController();
    // 160s: SBS comparte el navegador con ATU (1 a la vez). Si ATU lo usa primero,
    // SBS espera; este margen evita el timeout cuando se ejecutan en serie.
    const timeoutId = setTimeout(() => controller.abort(), 160000);
    try {
        const res = await secureFetch(`${BACKEND_URL}/sbs/${plate}?tipos=SOAT,Vehicular,CAT`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
            const sbsData = { soat: data.soat, vehicular: data.vehicular, cat: data.cat };
            const sbsTipos = [data.soat, data.vehicular, data.cat].filter(Boolean);
            const tiposConError = sbsTipos.filter((tipo) => tipo.error);
            const officialAccidentTotal = (tipo) => {
                if (typeof tipo?.total_accidentes === 'number') return tipo.total_accidentes;
                if (!tipo?.error && (tipo?.sin_registros || (Array.isArray(tipo?.data) && tipo.data.length === 0))) return 0;
                return null;
            };
            // Sólo el resumen oficial de accidentes puede contarse como
            // siniestro. Una fila de póliza nunca equivale a un accidente.
            const totalSiniestros = sbsTipos.reduce(
                (acc, t) => acc + (officialAccidentTotal(t) ?? 0),
                0
            );
            const tiposSinTotal = sbsTipos.filter(
                (tipo) => !tipo.error && officialAccidentTotal(tipo) === null
            );
            let customBadge = '';
            if (totalSiniestros > 0) {
                customBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-500 text-white shadow-sm uppercase tracking-wider">
                    <i class="fas fa-triangle-exclamation"></i> ${totalSiniestros} SINIESTRO${totalSiniestros > 1 ? 'S' : ''}
                </span>`;
            } else if (tiposConError.length > 0 || tiposSinTotal.length > 0) {
                customBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500 text-white shadow-sm uppercase tracking-wider">
                    <i class="fas fa-circle-exclamation"></i> PARCIAL · ${tiposConError.length + tiposSinTotal.length} SIN TOTAL OFICIAL
                </span>`;
            } else {
                customBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider">
                    <i class="fas fa-circle-check"></i> SIN SINIESTROS
                </span>`;
            }
            const content = renderSBS(sbsData, plate);
            callbacks.setCardData('sbs', 'Siniestralidad Vehicular', 'SOAT · Vehicular · CAT', 'fas fa-car-burst', '', 'SBS', content, true, totalSiniestros > 0, customBadge);
            return data;
        } else {
            callbacks.setCardError('sbs', 'Siniestralidad Vehicular', 'SOAT · Vehicular · CAT', 'fas fa-car-burst', '', 'SBS', data.error || 'Error al consultar SBS', plate);
            return data;
        }
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado (160s). El navegador está ocupado, pulse Reintentar.' : (err.message || 'Error de conexión');
        callbacks.setCardError('sbs', 'Siniestralidad Vehicular', 'SOAT · Vehicular · CAT', 'fas fa-car-burst', '', 'SBS', msg, plate);
        return { success: false, error: msg };
    }
}
