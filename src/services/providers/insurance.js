import { parseDateDDMMYYYY, renderSOAT, renderSOATDetallado, renderCITV } from '../../utils/renderers.js';
import { secureFetch } from '../transport.js';

export async function runFetchSOAT(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('soat', 'SOAT', '', 'fas fa-shield-halved', '', 'SBS Reporte SOAT');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 75000);
    try {
        let rawData = null;

        const res = await secureFetch(`${BACKEND_URL}/soat/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
            rawData = data.data;
        } else if (!data.success) {
            throw new Error(data.error || 'Error al consultar SOAT');
        }

        if (rawData && Array.isArray(rawData) && rawData.length > 0) {
            rawData.sort((a, b) => {
                const dateA = parseDateDDMMYYYY(a.FechaFin || a.FechaFinS);
                const dateB = parseDateDDMMYYYY(b.FechaFin || b.FechaFinS);
                return dateB.getTime() - dateA.getTime();
            });

            callbacks.processVehicleInfo('soat', rawData);

            const latestSOAT = rawData[0];
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const endDate = parseDateDDMMYYYY(latestSOAT.FechaFin);
            const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const isVigente = diffDays >= 0;

            let customBadge = '';
            if (isVigente) {
                latestSOAT.Estado = 'VIGENTE';
                customBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider">
                    <i class="fas fa-circle-check"></i> VIGENTE (${diffDays} días)
                </span>`;
            } else {
                latestSOAT.Estado = 'VENCIDO';
                const diasVencido = Math.abs(diffDays);
                customBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-500 text-white shadow-sm uppercase tracking-wider">
                    <i class="fas fa-circle-xmark"></i> VENCIDO (${diasVencido} ${diasVencido === 1 ? 'día' : 'días'})
                </span>`;
            }

            const content = renderSOAT(rawData, plate);
            callbacks.setCardData('soat', 'SOAT', '', 'fas fa-shield-halved', '', 'SBS Reporte SOAT', content, true, true, customBadge);
            return { success: true, data: rawData };
        } else {
            const emptyBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-sm uppercase tracking-wider">
                <i class="fas fa-circle-xmark"></i> SIN SOAT REGISTRADO
            </span>`;
            const content = renderSOAT([], plate);
            callbacks.setCardData('soat', 'SOAT', '', 'fas fa-shield-halved', '', 'SBS Reporte SOAT', content, true, false, emptyBadge);
            return { success: true, data: [] };
        }
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado (75s).' : (err.message || 'Error de conexión');
        callbacks.setCardError('soat', 'SOAT', '', 'fas fa-shield-halved', '', 'SBS Reporte SOAT', msg, plate);
        return { success: false, error: msg };
    }
}

export async function runFetchSOATDetallado(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('soat_detallado', 'SOAT APESEG Detallado', 'Historial de certificados y siniestros', 'fas fa-clock-rotate-left', '', 'APESEG');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);
    try {
        const res = await secureFetch(`${BACKEND_URL}/soat-detallado/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'No se pudo consultar el historial APESEG');
        const certificados = Array.isArray(data.certificados) ? data.certificados : [];
        const siniestros = Array.isArray(data.siniestros) ? data.siniestros : [];

        let badge = '';
        if (certificados.length === 0) {
            badge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-circle-xmark"></i> SIN SOAT REGISTRADO</span>`;
        } else {
            const sortedCerts = [...certificados].sort((a, b) => {
                const dateA = parseDateDDMMYYYY(a.fin || a.fechaFin || a.FechaFin);
                const dateB = parseDateDDMMYYYY(b.fin || b.fechaFin || b.FechaFin);
                return dateB.getTime() - dateA.getTime();
            });

            const activeCert = sortedCerts.find(c => {
                const st = String(c.estado || '').toLowerCase();
                return st === 'activo' || st === 'vigente';
            });

            const targetCert = activeCert || sortedCerts[0];
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const endDate = parseDateDDMMYYYY(targetCert.fin || targetCert.fechaFin || targetCert.FechaFin);
            const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const isVigente = activeCert ? true : diffDays >= 0;

            if (isVigente) {
                const diasText = diffDays >= 0 ? ` (${diffDays} días)` : '';
                badge = `<span class="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm"><i class="fas fa-circle-check"></i> VIGENTE${diasText}</span>`;
            } else {
                const diasVencido = Math.abs(diffDays);
                const diasText = !isNaN(diasVencido) && diasVencido < 10000 ? ` (${diasVencido} ${diasVencido === 1 ? 'día' : 'días'})` : '';
                badge = `<span class="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm"><i class="fas fa-circle-xmark"></i> VENCIDO${diasText}</span>`;
            }
        }

        callbacks.setCardData('soat_detallado', 'SOAT APESEG Detallado', 'Historial de certificados y siniestros', 'fas fa-clock-rotate-left', '', 'APESEG', renderSOATDetallado(data, plate), true, certificados.length > 0 || siniestros.length > 0, badge);
        return data;
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'APESEG detallado tardó demasiado.' : (err.message || 'Error de conexión');
        callbacks.setCardError('soat_detallado', 'SOAT APESEG Detallado', 'Historial de certificados y siniestros', 'fas fa-clock-rotate-left', '', 'APESEG', msg, plate);
        return { success: false, error: msg };
    }
}

export async function runFetchCITV(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('citv', 'Inspección Técnica Vehicular', '', 'fas fa-clipboard-check', '', 'MTC');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 130000);
    try {
        const res = await secureFetch(`${BACKEND_URL}/citv/${plate}`, { signal: controller.signal });
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


