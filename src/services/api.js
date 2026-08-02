import {
    parseDateDDMMYYYY,
    renderSOAT,
    renderCITV,
    renderLunas,
    renderCallao,
    renderSutran,
    renderCinemometro,
    renderAtu,
    renderGNV,
    renderSBS,
    renderSunarp
} from '../utils/renderers.js';

async function secureFetch(url, options = {}) {
    const headers = {
        ...options.headers,
        "X-Client-Secret": "VehicularPESecretSecure2026"
    };
    return fetch(url, { ...options, headers });
}

export async function runFetchSOAT(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('soat', 'SOAT', 'Seguro Obligatorio de Accidentes de Tránsito', 'fas fa-shield-halved', '', 'APESEG');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
        const res = await secureFetch(`${BACKEND_URL}/soat/${plate}`, { signal: controller.signal });
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
    callbacks.setCardLoading('cinemometro', 'Cinemómetro SUTRAN', 'Papeletas de velocidad', 'fas fa-gauge-high', '', 'SUTRAN');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 65000);
    try {
        const res = await secureFetch(`${BACKEND_URL}/cinemometro/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
            const content = renderCinemometro(data.data, plate, data.info_reporte || '');
            callbacks.setCardData('cinemometro', 'Cinemómetro SUTRAN', 'Papeletas de velocidad', 'fas fa-gauge-high', '', 'SUTRAN', content, true, data.data?.length > 0);
            return data;
        } else {
            callbacks.setCardError('cinemometro', 'Cinemómetro SUTRAN', 'Papeletas de velocidad', 'fas fa-gauge-high', '', 'SUTRAN', data.error || 'Error al consultar Cinemómetro', plate);
            return data;
        }
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado.' : (err.message || 'Error de conexión');
        callbacks.setCardError('cinemometro', 'Cinemómetro SUTRAN', 'Papeletas de velocidad', 'fas fa-gauge-high', '', 'SUTRAN', msg, plate);
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
        const res = await secureFetch(`${BACKEND_URL}/sbs/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
            const sbsData = { soat: data.soat, vehicular: data.vehicular, cat: data.cat };
            const totalSiniestros = [data.soat, data.vehicular, data.cat]
                .filter(Boolean)
                .reduce((acc, t) => acc + ((t.data || []).length), 0);
            let customBadge = '';
            if (totalSiniestros > 0) {
                customBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-500 text-white shadow-sm uppercase tracking-wider">
                    <i class="fas fa-triangle-exclamation"></i> ${totalSiniestros} SINIESTRO${totalSiniestros > 1 ? 'S' : ''}
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

export async function runFetchGNV(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('gnv', 'Gas Natural Vehicular (GNV)', '', 'fas fa-fire-flame-curved', '', 'Infogas');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);
    try {
        const res = await secureFetch(`${BACKEND_URL}/gnv/${plate}`, { signal: controller.signal });
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

export async function runFetchMunicipal(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('municipal', 'Papeletas Otras Municipalidades', 'Provincias del Perú', 'fas fa-building-columns', '', 'Municipalidades');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 40000);
    try {
        const res = await secureFetch(`${BACKEND_URL}/municipal/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const items = Array.isArray(data.data) ? data.data : [];
        const rows = items.map(m => {
            const err = !m.success;
            const con = !!m.tiene_papeletas;
            const cls = err ? 'text-slate-400' : (con ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400');
            const icon = err ? 'fa-circle-minus' : (con ? 'fa-triangle-exclamation' : 'fa-circle-check');
            const estado = err ? 'No disponible' : (con ? `${m.total || ''} papeleta(s)`.trim() : 'Sin papeletas');
            return `<div class="flex items-center justify-between gap-3 py-2.5 px-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div class="min-w-0">
                    <p class="text-[13px] md:text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">${m.municipio || ''}</p>
                    <p class="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">${m.provincia || ''}</p>
                </div>
                <span class="inline-flex items-center gap-1.5 text-[11px] md:text-xs font-bold ${cls} shrink-0">
                    <i class="fas ${icon}"></i> ${estado}
                </span>
            </div>`;
        }).join('');
        const content = `<div class="p-3 md:p-4"><div class="rounded-xl border border-slate-200 dark:border-slate-800 px-3">${rows || '<p class="py-4 text-center text-sm text-slate-400">Sin datos.</p>'}</div>
            <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1"><i class="fas fa-circle-info"></i> Municipalidades provinciales fuera de Lima y Callao. Se irán agregando más.</p></div>`;
        const conPapeletas = items.some(m => m.tiene_papeletas);
        let badge = conPapeletas
            ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-triangle-exclamation"></i> CON PAPELETAS</span>`
            : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-circle-check"></i> SIN PAPELETAS</span>`;
        callbacks.setCardData('municipal', 'Papeletas Otras Municipalidades', 'Provincias del Perú', 'fas fa-building-columns', '', 'Municipalidades', content, true, conPapeletas, badge);
        return data;
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado.' : (err.message || 'Error de conexión');
        callbacks.setCardError('municipal', 'Papeletas Otras Municipalidades', 'Provincias del Perú', 'fas fa-building-columns', '', 'Municipalidades', msg, plate);
        return { success: false, error: msg };
    }
}

export async function runFetchSAT(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('sat_captura', 'Orden de Captura (SAT)', 'Provincia de Lima', 'fas fa-gavel', '', 'SAT Lima');
    callbacks.setCardLoading('sat_deposito', 'Internamiento en Depósito (SAT)', '', 'fas fa-warehouse', '', 'SAT Lima');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 160000);

    const okBadge = (t) => `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-circle-check"></i> ${t}</span>`;
    const badBadge = (t) => `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-triangle-exclamation"></i> ${t}</span>`;
    const bloque = (mensaje, fecha, resaltarRojo) => `
        <div class="p-3 md:p-4">
            <div class="flex items-start gap-3 rounded-xl border p-3 ${resaltarRojo ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20' : 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20'}">
                <i class="fas ${resaltarRojo ? 'fa-triangle-exclamation text-rose-500' : 'fa-circle-check text-emerald-500'} mt-0.5"></i>
                <div>
                    <p class="text-[13px] md:text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">${mensaje}</p>
                    ${fecha ? `<p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1"><i class="fas fa-calendar-day mr-1"></i>Informe actualizado al ${fecha}</p>` : ''}
                </div>
            </div>
        </div>`;

    try {
        const res = await secureFetch(`${BACKEND_URL}/sat/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const cap = data.captura;
        if (cap && cap.success) {
            const tiene = !!cap.tiene;
            callbacks.setCardData('sat_captura', 'Orden de Captura (SAT)', 'Provincia de Lima', 'fas fa-gavel', '', 'SAT Lima',
                bloque(cap.mensaje, cap.fecha, tiene), true, tiene, tiene ? badBadge('CON ORDEN') : okBadge('SIN ORDEN'));
        } else {
            callbacks.setCardError('sat_captura', 'Orden de Captura (SAT)', 'Provincia de Lima', 'fas fa-gavel', '', 'SAT Lima', (cap && cap.error) || 'No se pudo consultar', plate);
        }

        const dep = data.deposito;
        if (dep && dep.success) {
            const internado = !!dep.internado;
            callbacks.setCardData('sat_deposito', 'Internamiento en Depósito (SAT)', '', 'fas fa-warehouse', '', 'SAT Lima',
                bloque(dep.mensaje, dep.fecha, internado), true, internado, internado ? badBadge('INTERNADO') : okBadge('NO INTERNADO'));
        } else {
            callbacks.setCardError('sat_deposito', 'Internamiento en Depósito (SAT)', '', 'fas fa-warehouse', '', 'SAT Lima', (dep && dep.error) || 'No se pudo consultar', plate);
        }
        return data;
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado (160s).' : (err.message || 'Error de conexión');
        callbacks.setCardError('sat_captura', 'Orden de Captura (SAT)', 'Provincia de Lima', 'fas fa-gavel', '', 'SAT Lima', msg, plate);
        callbacks.setCardError('sat_deposito', 'Internamiento en Depósito (SAT)', '', 'fas fa-warehouse', '', 'SAT Lima', msg, plate);
        return { success: false, error: msg };
    }
}

export async function runFetchSUNARP(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('sunarp', 'Gravámenes y Registro (SUNARP)', 'Superintendencia de los Registros Públicos', 'fas fa-file-contract', '', 'SUNARP');
    const controller = new AbortController();
    // 95s: SUNARP ya tiene su PROPIO navegador (no espera a ATU/SBS). El backend corta
    // a los 90s (HARD_TIMEOUT), así que 95s da un pequeño margen para recibir la respuesta.
    // Antes eran 180s → la tarjeta giraba hasta 3 min cuando Turnstile no daba token.
    const timeoutId = setTimeout(() => controller.abort(), 95000);
    try {
        const res = await secureFetch(`${BACKEND_URL}/sunarp/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
            if (data.datos && Object.keys(data.datos).length > 0) {
                callbacks.processVehicleInfo('sunarp', data.datos);
            }
            const hasData = Boolean(data.datos && Object.keys(data.datos).length > 0);
            let customBadge = '';
            if (hasData) {
                customBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-600 text-white shadow-sm uppercase tracking-wider">
                    <i class="fas fa-circle-check"></i> REGISTRADO
                </span>`;
            } else {
                customBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-400 text-white shadow-sm uppercase tracking-wider">
                    <i class="fas fa-info-circle"></i> SIN GRAVAMEN
                </span>`;
            }
            const content = renderSunarp(data.datos, plate);
            callbacks.setCardData('sunarp', 'Gravámenes y Registro (SUNARP)', 'Superintendencia de los Registros Públicos', 'fas fa-file-contract', '', 'SUNARP', content, true, hasData, customBadge);
            return data;
        } else {
            callbacks.setCardError('sunarp', 'Gravámenes y Registro (SUNARP)', 'Superintendencia de los Registros Públicos', 'fas fa-file-contract', '', 'SUNARP', data.error || 'Error al consultar SUNARP', plate);
            return data;
        }
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado (180s). El navegador está ocupado, pulse Reintentar.' : (err.message || 'Error de conexión');
        callbacks.setCardError('sunarp', 'Gravámenes y Registro (SUNARP)', 'Superintendencia de los Registros Públicos', 'fas fa-file-contract', '', 'SUNARP', msg, plate);
        return { success: false, error: msg };
    }
}

