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
    renderSunarp,
    renderPlacasPE,
    renderValorVenal,
    renderOsinergmin
} from '../utils/renderers.js';

async function secureFetch(url, options = {}) {
    // El secreto SOLO se lee de la variable de entorno del build.
    // NUNCA se hardcodea un fallback aquí: acabaría en el bundle público.
    const clientSecret = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PUBLIC_CLIENT_SECRET) 
        ? import.meta.env.PUBLIC_CLIENT_SECRET 
        : "";
    if (!clientSecret && typeof window !== 'undefined' && !window._warnedClientSecret) {
        window._warnedClientSecret = true;
        console.warn("[API] PUBLIC_CLIENT_SECRET no configurado — las peticiones pueden ser rechazadas por el backend.");
    }
    const headers = {
        ...options.headers,
        ...(clientSecret ? {"X-Client-Secret": clientSecret} : {})
    };
    const res = await fetch(url, { ...options, headers });
    // Traducir el 429 del rate limiter (10/min por IP) a un mensaje claro. El wrapper
    // runFetchWithRetry ya reintenta con backoff, aquí solo se mejora el aviso.
    if (res.status === 429) {
        const e = new Error('Demasiadas consultas en poco tiempo (límite 10/min por IP). Reintentando...');
        e.name = 'RateLimited';
        throw e;
    }
    return res;
}

export async function runFetchSOAT(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('soat', 'SOAT', 'Seguro Obligatorio de Accidentes de Tránsito', 'fas fa-shield-halved', '', 'APESEG / SBS');
    const controller = new AbortController();
    // 75s: si APESEG está bloqueado (Cloudflare), el respaldo SBS (navegador) debe caber.
    const timeoutId = setTimeout(() => controller.abort(), 75000);
    try {
        let rawData = null;
        let isFromSBS = false;

        // Consulta PARALELA: APESEG (HTTP directo) + SBS Reporte SOAT (fuente alternativa
        // sin bloqueos de Cloudflare). Se prefiere APESEG si responde; si está bloqueado,
        // gana SBS sin esperar el timeout de 35s del intento anterior.
        const [resA, resS] = await Promise.allSettled([
            secureFetch(`${BACKEND_URL}/soat/${plate}`, { signal: controller.signal }),
            secureFetch(`${BACKEND_URL}/sbs/${plate}?tipos=SOAT`, { signal: controller.signal }),
        ]);

        if (resA.status === 'fulfilled' && resA.value && resA.value.ok) {
            try {
                const data = await resA.value.json();
                if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                    rawData = data.data;
                }
            } catch (_e) {}
        }

        // Respaldar con SBS Reporte SOAT (sin bloqueos de Cloudflare)
        if (!rawData && resS.status === 'fulfilled' && resS.value && resS.value.ok) {
            try {
                const dataSbs = await resS.value.json();
                if (dataSbs.success && dataSbs.soat && Array.isArray(dataSbs.soat.data) && dataSbs.soat.data.length > 0) {
                    isFromSBS = true;
                    rawData = dataSbs.soat.data.map(p => ({
                        NombreCompania: p["Compañía aseguradora"] || p.aseguradora || "Aseguradora Registrada",
                        NumeroPoliza: p["N.° de póliza"] || p["N.° de certificado"] || p.numPoliza || "—",
                        FechaInicio: p["Inicio de vigencia"] || p.fechaInicio || "—",
                        FechaFin: p["Fin de vigencia"] || p.fechaFin || "—",
                        NombreUsoVehiculo: p["Uso de vehículo"] || p.usoVehiculo || "Particular",
                        NombreClaseVehiculo: p["Clase del vehículo"] || p.claseVehiculo || "Automóvil",
                        Placa: plate,
                        Accidentes: p["N.° de accidentes"] || "0"
                    }));
                }
            } catch (_e2) {}
        }

        clearTimeout(timeoutId);

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
            callbacks.setCardData('soat', 'SOAT', '', 'fas fa-shield-halved', '', isFromSBS ? 'SBS Reporte SOAT' : 'APESEG', content, true, true, customBadge);
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
        callbacks.setCardError('soat', 'SOAT', '', 'fas fa-shield-halved', '', 'APESEG / SBS', msg, plate);
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
            // Usa el resumen oficial "N.° de accidentes coberturados" del portal SBS cuando existe;
            // si no, cae al conteo de pólizas devueltas.
            const totalSiniestros = sbsTipos.reduce(
                (acc, t) => acc + (typeof t.total_accidentes === 'number' ? t.total_accidentes : (t.data || []).length),
                0
            );
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
        if (!res.ok) throw new Error(res.status === 404 ? 'HTTP 404: Sección en actualización.' : `Error ${res.status}`);
        const data = await res.json();
        const items = Array.isArray(data.data) ? data.data : [];
        // Portal oficial de cada municipalidad para verificación manual
        const MUNI_URLS = {
            'Huánuco': 'https://www.munihuanuco.gob.pe/wp-content/servicios/transportes/gt_papeletas.php',
            'Chachapoyas': 'https://app.munichachapoyas.gob.pe/servicios/consulta_papeletas/app/papeletas.php',
            'Arequipa': 'https://www.muniarequipa.gob.pe/oficina-virtual/c0nInfrPermisos/faltas/papeletas.php',
            'Cajamarca': 'https://www.satcajamarca.gob.pe/#/',
            'Chiclayo': 'https://virtualsatch.satch.gob.pe/virtualsatch/record_infracciones/buscar_placa_',
            'Cusco': 'https://cusco.gob.pe/informatica/index.php/',
            'Ica': 'https://m.satica.gob.pe/consultapapeletas.php',
            'Piura': 'https://www.munipiura.gob.pe/',
            'Tacna': 'https://www.munitacna.gob.pe/',
            'Tarapoto': 'https://www.mpsm.gob.pe/'
        };
        const rows = items.map(m => {
            const err = !m.success;
            const con = !!m.tiene_papeletas;
            const cls = err ? 'text-slate-400 dark:text-slate-500' : (con ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-emerald-600 dark:text-emerald-400 font-bold');
            const icon = err ? 'fa-circle-minus' : (con ? 'fa-triangle-exclamation animate-pulse' : 'fa-circle-check');
            const estado = err ? 'No disponible' : (con ? `${m.total || 1} papeleta(s) registrada(s)` : 'Sin papeletas');
            const url = m.url || MUNI_URLS[m.municipio] || '';
            const verBtn = url
                ? `<a href="${url}" target="_blank" rel="noopener" title="Verificar en el portal oficial de ${m.municipio}"
                     class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold transition-all shadow-xs border border-slate-200/80 dark:border-slate-700 shrink-0">
                     <i class="fas fa-arrow-up-right-from-square text-[9px] text-brand-red"></i> Portal</a>`
                : '';

            // Detalle completo y responsivo de todas las papeletas de la municipalidad
            let detalleHTML = '';
            if (con && Array.isArray(m.data) && m.data.length > 0) {
                const totalCount = m.data.length;
                const pendientesCount = m.data.filter(d => (d['Situación'] || '').toUpperCase().includes('PENDIENTE')).length;
                const canceladasCount = totalCount - pendientesCount;

                const itemCards = m.data.map((d, idx) => {
                    const esPendiente = (d['Situación'] || '').toUpperCase().includes('PENDIENTE');
                    const badgeSit = esPendiente
                        ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-rose-500 text-white shadow-xs tracking-wider uppercase"><i class="fas fa-clock"></i> ${d['Situación']}</span>`
                        : `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-500 text-white shadow-xs tracking-wider uppercase"><i class="fas fa-check-double"></i> ${d['Situación']}</span>`;

                    return `
                        <div class="p-2.5 rounded-xl border ${esPendiente ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80'} shadow-xs font-poppins transition-all">
                            <div class="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-1.5 flex-wrap">
                                <div class="flex items-center gap-1.5">
                                    <span class="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] font-black flex items-center justify-center">${idx + 1}</span>
                                    <span class="text-xs font-black text-slate-900 dark:text-white font-mono">${d['Papeleta'] || 'S/N'}</span>
                                    <span class="px-1.5 py-0.5 rounded bg-brand-red/10 text-brand-red text-[9px] font-bold">${d['Infracción'] || ''}</span>
                                </div>
                                <div class="flex items-center gap-1.5">
                                    ${badgeSit}
                                    <span class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-semibold">${d['Estado'] || ''}</span>
                                </div>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 text-[10px] text-slate-600 dark:text-slate-300">
                                <div><strong class="text-slate-400 dark:text-slate-500 text-[9px] uppercase block">Fecha Infracción:</strong> ${d['Fecha'] || '—'}</div>
                                <div><strong class="text-slate-400 dark:text-slate-500 text-[9px] uppercase block">Conductor:</strong> <span class="uppercase font-semibold">${d['Conductor'] || '—'}</span></div>
                                <div class="sm:col-span-2 md:col-span-1"><strong class="text-slate-400 dark:text-slate-500 text-[9px] uppercase block">Lugar:</strong> <span class="capitalize">${d['Lugar'] || '—'}</span></div>
                            </div>
                        </div>`;
                }).join('');

                detalleHTML = `
                    <div class="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800">
                        <div class="flex items-center justify-between gap-2 mb-2 flex-wrap text-[11px] font-bold">
                            <span class="text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                <i class="fas fa-list-check text-brand-red"></i> Detalle de las ${totalCount} infracciones registradas:
                            </span>
                            <div class="flex items-center gap-2">
                                <span class="text-rose-600 dark:text-rose-400 font-bold bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-full text-[10px]">${pendientesCount} pendientes</span>
                                <span class="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full text-[10px]">${canceladasCount} canceladas</span>
                            </div>
                        </div>
                        <div class="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
                            ${itemCards}
                        </div>
                    </div>`;
            }

            return `<div class="flex flex-col py-3 px-2 border-b border-slate-100 dark:border-slate-800/80 last:border-0 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <div class="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                    <div class="min-w-0">
                        <p class="text-[13px] md:text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight flex items-center gap-1.5">
                            <i class="fas fa-city text-[11px] text-slate-400"></i> ${m.municipio || ''}
                        </p>
                        <p class="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold mt-0.5">${m.provincia || ''} · ${m.fuente || 'Gobierno Local'}</p>
                    </div>
                    <div class="flex items-center gap-2.5 shrink-0">
                        <span class="inline-flex items-center gap-1.5 text-[11px] md:text-xs ${cls}">
                            <i class="fas ${icon}"></i> ${estado}
                        </span>
                        ${verBtn}
                    </div>
                </div>
                ${m.mensaje && m.mensaje !== 'Sin papeletas registradas.' && !con ? `<p class="text-[10px] text-slate-400 dark:text-slate-500 mt-1 italic">${m.mensaje}</p>` : ''}
                ${detalleHTML}
            </div>`;
        }).join('');
        const content = `<div class="p-3 md:p-4">
            <div class="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-3 md:px-4 divide-y divide-slate-100 dark:divide-slate-800">${rows || '<p class="py-4 text-center text-sm text-slate-400">Sin datos.</p>'}</div>
            <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-2.5 flex items-center gap-1.5 px-1"><i class="fas fa-circle-info text-blue-500"></i> Cobertura en vivo: Huánuco, Chachapoyas, Arequipa, Cajamarca, Chiclayo, Cusco, Ica, Piura, Tacna, Tarapoto y Trujillo.</p>
        </div>`;
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
    callbacks.setCardLoading('sat_deuda', 'Deuda Imp. Vehicular (SAT)', 'Impuesto Vehicular', 'fas fa-file-invoice-dollar', '', 'SAT Lima');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 160000);

    const okBadge = (t) => `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-circle-check"></i> ${t}</span>`;
    const badBadge = (t) => `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-triangle-exclamation"></i> ${t}</span>`;
    const renderTablaDetalle = (detalle) => {
        if (!Array.isArray(detalle) || detalle.length === 0) return '';
        const headers = Object.keys(detalle[0]);
        if (headers.length === 0) return '';
        
        const ths = headers.map(h => `<th class="py-2 px-2.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wider border-r border-white/10 dark:border-slate-800 sticky top-0 bg-slate-900 dark:bg-slate-950 text-white whitespace-nowrap">${h}</th>`).join('');
        
        const rows = detalle.map(row => {
            const tds = headers.map(h => {
                const val = row[h] || '—';
                const isMonto = h.toLowerCase().includes('monto');
                const cls = isMonto ? 'font-bold text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300';
                return `<td class="py-2 px-2.5 text-[10px] md:text-xs border-r border-slate-100 dark:border-slate-800 leading-tight whitespace-nowrap ${cls}">${val}</td>`;
            }).join('');
            return `<tr class="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors font-poppins">${tds}</tr>`;
        }).join('');

        return `
            <div class="mt-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800/60 shadow-sm">
                <div class="overflow-x-auto max-h-[260px]">
                    <table class="w-full text-left border-collapse bg-white dark:bg-slate-900">
                        <thead>
                            <tr class="bg-slate-900 dark:bg-slate-950 text-white">${ths}</tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>`;
    };

    const bloque = (mensaje, fecha, resaltarRojo, detalle) => `
        <div class="p-3 md:p-4 font-poppins">
            <div class="flex items-start gap-3 rounded-xl border p-3 ${resaltarRojo ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20' : 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20'}">
                <i class="fas ${resaltarRojo ? 'fa-triangle-exclamation text-rose-500' : 'fa-circle-check text-emerald-500'} mt-0.5 text-base"></i>
                <div class="flex-1 min-w-0">
                    <p class="text-[13px] md:text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">${mensaje}</p>
                    ${fecha ? `<p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1"><i class="fas fa-calendar-day"></i>Informe actualizado al ${fecha}</p>` : ''}
                </div>
            </div>
            ${resaltarRojo && detalle ? renderTablaDetalle(detalle) : ''}
        </div>`;

    try {
        // SAT reintenta hasta 3 veces: el OCR del captcha del SAT falla de forma
        // probabilística (el backend hace su propio reintento interno por página).
        // Se conservan los sub-resultados ya resueltos y solo se vuelve a consultar
        // lo pendiente, sin mostrar error directo al primer fallo.
        let cap = null, dep = null, deu = null, satLastError = null;
        const MAX_SAT_ATTEMPTS = 3;
        const SAT_BUDGET_MS = 150000;
        const satStart = Date.now();

        for (let satAttempt = 1; satAttempt <= MAX_SAT_ATTEMPTS; satAttempt++) {
            const elapsed = Date.now() - satStart;
            if (elapsed >= SAT_BUDGET_MS) break;
            const satCtrl = new AbortController();
            const satTime = setTimeout(() => satCtrl.abort(), SAT_BUDGET_MS - elapsed);
            try {
                const res = await secureFetch(`${BACKEND_URL}/sat/${plate}`, { signal: satCtrl.signal });
                clearTimeout(satTime);
                if (!res.ok) throw new Error(res.status === 404 ? 'HTTP 404: Sección en actualización.' : `Error ${res.status}`);
                const data = await res.json();
                cap = data.captura; dep = data.deposito; deu = data.deuda;
                satLastError = null;
            } catch (err) {
                clearTimeout(satTime);
                satLastError = err.name === 'AbortError' ? 'Tiempo de espera agotado (SAT).' : (err.message || 'Error de conexión');
                if (satAttempt >= MAX_SAT_ATTEMPTS) break;
                await new Promise(r => setTimeout(r, 800 * satAttempt));
                continue;
            }
            const allSatOk = cap && cap.success && dep && dep.success && deu && deu.success;
            if (allSatOk || satAttempt >= MAX_SAT_ATTEMPTS) break;
        }

        if (cap && cap.success) {
            const tiene = !!cap.tiene;
            callbacks.setCardData('sat_captura', 'Orden de Captura (SAT)', 'Provincia de Lima', 'fas fa-gavel', '', 'SAT Lima',
                bloque(cap.mensaje, cap.fecha, tiene, cap.detalle), true, tiene, tiene ? badBadge('CON ORDEN') : okBadge('SIN ORDEN'));
        } else {
            callbacks.setCardError('sat_captura', 'Orden de Captura (SAT)', 'Provincia de Lima', 'fas fa-gavel', '', 'SAT Lima', (cap && cap.error) || satLastError || 'No se pudo consultar', plate);
        }

        if (dep && dep.success) {
            const internado = !!dep.internado;
            callbacks.setCardData('sat_deposito', 'Internamiento en Depósito (SAT)', '', 'fas fa-warehouse', '', 'SAT Lima',
                bloque(dep.mensaje, dep.fecha, internado, dep.detalle), true, internado, internado ? badBadge('INTERNADO') : okBadge('NO INTERNADO'));
        } else {
            callbacks.setCardError('sat_deposito', 'Internamiento en Depósito (SAT)', '', 'fas fa-warehouse', '', 'SAT Lima', (dep && dep.error) || satLastError || 'No se pudo consultar', plate);
        }

        if (deu && deu.success) {
            const neutralBadge = (t) => `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shadow-sm uppercase tracking-wider"><i class="fas fa-circle-info"></i> ${t}</span>`;
            if (deu.manual || deu.tiene_deuda === null || deu.tiene_deuda === undefined) {
                // No se pudo determinar automáticamente → tarjeta neutra + verificación manual (link en el footer)
                callbacks.setCardData('sat_deuda', 'Deuda Imp. Vehicular (SAT)', 'Impuesto Vehicular', 'fas fa-file-invoice-dollar', '', 'SAT Lima',
                    bloque(deu.mensaje, deu.fecha, false, null), true, false, neutralBadge('VERIFICAR MANUAL'));
            } else {
                const conDeuda = !!deu.tiene_deuda;
                callbacks.setCardData('sat_deuda', 'Deuda Imp. Vehicular (SAT)', 'Impuesto Vehicular', 'fas fa-file-invoice-dollar', '', 'SAT Lima',
                    bloque(deu.mensaje, deu.fecha, conDeuda, deu.detalle), true, conDeuda, conDeuda ? badBadge('CON DEUDA') : okBadge('SIN DEUDA'));
            }
        } else {
            callbacks.setCardError('sat_deuda', 'Deuda Imp. Vehicular (SAT)', 'Impuesto Vehicular', 'fas fa-file-invoice-dollar', '', 'SAT Lima', (deu && deu.error) || satLastError || 'No se pudo consultar', plate);
        }
        return { success: !!(cap && cap.success) || !!(dep && dep.success) || !!(deu && deu.success), error: satLastError, captura: cap, deposito: dep, deuda: deu };
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado (160s).' : (err.message || 'Error de conexión');
        callbacks.setCardError('sat_captura', 'Orden de Captura (SAT)', 'Provincia de Lima', 'fas fa-gavel', '', 'SAT Lima', msg, plate);
        callbacks.setCardError('sat_deposito', 'Internamiento en Depósito (SAT)', '', 'fas fa-warehouse', '', 'SAT Lima', msg, plate);
        callbacks.setCardError('sat_deuda', 'Deuda Imp. Vehicular (SAT)', 'Impuesto Vehicular', 'fas fa-file-invoice-dollar', '', 'SAT Lima', msg, plate);
        return { success: false, error: msg };
    }
}

export async function runFetchSATCaptura(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('sat_captura', 'Orden de Captura (SAT)', 'Provincia de Lima', 'fas fa-gavel', '', 'SAT Lima');
    const okBadge = (t) => `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-circle-check"></i> ${t}</span>`;
    const badBadge = (t) => `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-triangle-exclamation"></i> ${t}</span>`;
    const bloque = (mensaje, fecha, resaltarRojo, detalle) => `
        <div class="p-3 md:p-4 font-poppins">
            <div class="flex items-start gap-3 rounded-xl border p-3 ${resaltarRojo ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20' : 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20'}">
                <i class="fas ${resaltarRojo ? 'fa-triangle-exclamation text-rose-500' : 'fa-circle-check text-emerald-500'} mt-0.5 text-base"></i>
                <div class="flex-1 min-w-0">
                    <p class="text-[13px] md:text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">${mensaje}</p>
                    ${fecha ? `<p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1"><i class="fas fa-calendar-day"></i>Informe actualizado al ${fecha}</p>` : ''}
                </div>
            </div>
        </div>`;
    try {
        const res = await secureFetch(`${BACKEND_URL}/sat/captura/${plate}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const cap = data.captura;
        if (cap && cap.success) {
            const tiene = !!cap.tiene;
            callbacks.setCardData('sat_captura', 'Orden de Captura (SAT)', 'Provincia de Lima', 'fas fa-gavel', '', 'SAT Lima',
                bloque(cap.mensaje, cap.fecha, tiene, cap.detalle), true, tiene, tiene ? badBadge('CON ORDEN') : okBadge('SIN ORDEN'));
            return data;
        } else {
            throw new Error((cap && cap.error) || 'No se pudo consultar orden de captura');
        }
    } catch (err) {
        callbacks.setCardError('sat_captura', 'Orden de Captura (SAT)', 'Provincia de Lima', 'fas fa-gavel', '', 'SAT Lima', err.message || 'Error de conexión', plate);
        return { success: false, error: err.message };
    }
}

export async function runFetchSATDeposito(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('sat_deposito', 'Internamiento en Depósito (SAT)', '', 'fas fa-warehouse', '', 'SAT Lima');
    const okBadge = (t) => `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-circle-check"></i> ${t}</span>`;
    const badBadge = (t) => `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-triangle-exclamation"></i> ${t}</span>`;
    const bloque = (mensaje, fecha, resaltarRojo, detalle) => `
        <div class="p-3 md:p-4 font-poppins">
            <div class="flex items-start gap-3 rounded-xl border p-3 ${resaltarRojo ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20' : 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20'}">
                <i class="fas ${resaltarRojo ? 'fa-triangle-exclamation text-rose-500' : 'fa-circle-check text-emerald-500'} mt-0.5 text-base"></i>
                <div class="flex-1 min-w-0">
                    <p class="text-[13px] md:text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">${mensaje}</p>
                    ${fecha ? `<p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1"><i class="fas fa-calendar-day"></i>Informe actualizado al ${fecha}</p>` : ''}
                </div>
            </div>
        </div>`;
    try {
        const res = await secureFetch(`${BACKEND_URL}/sat/deposito/${plate}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const dep = data.deposito;
        if (dep && dep.success) {
            const internado = !!dep.internado;
            callbacks.setCardData('sat_deposito', 'Internamiento en Depósito (SAT)', '', 'fas fa-warehouse', '', 'SAT Lima',
                bloque(dep.mensaje, dep.fecha, internado, dep.detalle), true, internado, internado ? badBadge('INTERNADO') : okBadge('NO INTERNADO'));
            return data;
        } else {
            throw new Error((dep && dep.error) || 'No se pudo consultar internamiento en depósito');
        }
    } catch (err) {
        callbacks.setCardError('sat_deposito', 'Internamiento en Depósito (SAT)', '', 'fas fa-warehouse', '', 'SAT Lima', err.message || 'Error de conexión', plate);
        return { success: false, error: err.message };
    }
}

export async function runFetchSATDeuda(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('sat_deuda', 'Deuda Imp. Vehicular (SAT)', 'Impuesto Vehicular', 'fas fa-file-invoice-dollar', '', 'SAT Lima');
    const okBadge = (t) => `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-circle-check"></i> ${t}</span>`;
    const badBadge = (t) => `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-triangle-exclamation"></i> ${t}</span>`;
    const neutralBadge = (t) => `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shadow-sm uppercase tracking-wider"><i class="fas fa-circle-info"></i> ${t}</span>`;
    const bloque = (mensaje, fecha, resaltarRojo, detalle) => `
        <div class="p-3 md:p-4 font-poppins">
            <div class="flex items-start gap-3 rounded-xl border p-3 ${resaltarRojo ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20' : 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20'}">
                <i class="fas ${resaltarRojo ? 'fa-triangle-exclamation text-rose-500' : 'fa-circle-check text-emerald-500'} mt-0.5 text-base"></i>
                <div class="flex-1 min-w-0">
                    <p class="text-[13px] md:text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">${mensaje}</p>
                    ${fecha ? `<p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1"><i class="fas fa-calendar-day"></i>Informe actualizado al ${fecha}</p>` : ''}
                </div>
            </div>
        </div>`;
    try {
        const res = await secureFetch(`${BACKEND_URL}/sat/deuda/${plate}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const deu = data.deuda;
        if (deu && deu.success) {
            if (deu.manual || deu.tiene_deuda === null || deu.tiene_deuda === undefined) {
                callbacks.setCardData('sat_deuda', 'Deuda Imp. Vehicular (SAT)', 'Impuesto Vehicular', 'fas fa-file-invoice-dollar', '', 'SAT Lima',
                    bloque(deu.mensaje, deu.fecha, false, null), true, false, neutralBadge('VERIFICAR MANUAL'));
            } else {
                const conDeuda = !!deu.tiene_deuda;
                callbacks.setCardData('sat_deuda', 'Deuda Imp. Vehicular (SAT)', 'Impuesto Vehicular', 'fas fa-file-invoice-dollar', '', 'SAT Lima',
                    bloque(deu.mensaje, deu.fecha, conDeuda, deu.detalle), true, conDeuda, conDeuda ? badBadge('CON DEUDA') : okBadge('SIN DEUDA'));
            }
            return data;
        } else {
            throw new Error((deu && deu.error) || 'No se pudo consultar deuda');
        }
    } catch (err) {
        callbacks.setCardError('sat_deuda', 'Deuda Imp. Vehicular (SAT)', 'Impuesto Vehicular', 'fas fa-file-invoice-dollar', '', 'SAT Lima', err.message || 'Error de conexión', plate);
        return { success: false, error: err.message };
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
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado (95s). El navegador está ocupado, pulse Reintentar.' : (err.message || 'Error de conexión');
        callbacks.setCardError('sunarp', 'Gravámenes y Registro (SUNARP)', 'Superintendencia de los Registros Públicos', 'fas fa-file-contract', '', 'SUNARP', msg, plate);
        return { success: false, error: msg };
    }
}

export async function runFetchPlacasPE(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('placas_pe', 'Consulta Estado de Placa (AAP)', 'Estado de Placa', 'fas fa-car', '', 'AAP');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
        const res = await secureFetch(`${BACKEND_URL}/placas_pe/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
            callbacks.processVehicleInfo('placas_pe', data.data);
            const content = renderPlacasPE(data.data, plate);
            const d = data.data || {};
            const tieneReg = !!(d.propietario || d.marca || d.modelo || d.estado || (d.serie && d.serie !== '-'));
            const badge = tieneReg
                ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-circle-check"></i> CON REGISTRO</span>`
                : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shadow-sm uppercase tracking-wider"><i class="fas fa-circle-info"></i> SIN REGISTRO</span>`;
            callbacks.setCardData('placas_pe', 'Consulta Estado de Placa (AAP)', 'Estado de Placa', 'fas fa-car', '', 'AAP', content, true, tieneReg, badge);
            return data;
        } else {
            callbacks.setCardError('placas_pe', 'Consulta Estado de Placa (AAP)', 'Estado de Placa', 'fas fa-car', '', 'AAP', data.error || 'Error al consultar placas.pe', plate);
            return data;
        }
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado (30s).' : (err.message || 'Error de conexión');
        callbacks.setCardError('placas_pe', 'Consulta Estado de Placa (AAP)', 'Estado de Placa', 'fas fa-car', '', 'AAP', msg, plate);
        return { success: false, error: msg };
    }
}

const USD_PEN_CACHE_KEY = 'usd_pen_rate_cache';
const USD_PEN_TTL_MS = 6 * 60 * 60 * 1000; // 6h: el tipo de cambio se refresca ~diario

// Tipo de cambio USD -> PEN del día, desde fuente abierta (ExchangeRate-API, sin API key).
// Se cachea en localStorage (TTL 6h) para no golpear el endpoint en cada consulta.
async function getUSD_PEN() {
    try {
        const cachedRaw = localStorage.getItem(USD_PEN_CACHE_KEY);
        if (cachedRaw) {
            const c = JSON.parse(cachedRaw);
            if (c && Number(c.rate) > 0 && (Date.now() - c.ts) < USD_PEN_TTL_MS) {
                return Number(c.rate);
            }
        }
    } catch (e) { /* ignore */ }
    try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (res.ok) {
            const j = await res.json();
            const rate = Number(j && j.rates && j.rates.PEN);
            if (rate && isFinite(rate)) {
                try { localStorage.setItem(USD_PEN_CACHE_KEY, JSON.stringify({ rate, ts: Date.now() })); } catch (e) { /* ignore */ }
                return rate;
            }
        }
    } catch (e) { /* ignore */ }
    return 3.75; // fallback aproximado si la API no responde
}

// Rellena el monto en soles junto al valor en dólares dentro de la tarjeta de Valor Venal.
export async function fillValorVenalSoles() {
    const el = document.getElementById('valor-venal-soles');
    if (!el) return;
    const usd = Number(el.getAttribute('data-usd'));
    if (!usd) return;
    const rate = await getUSD_PEN();
    const soles = Math.round(usd * rate);
    const amountEl = el.querySelector('.vrn-soles-amount');
    const rateEl = el.querySelector('.vrn-rate');
    if (amountEl) amountEl.textContent = `S/ ${soles.toLocaleString('es-PE')}`;
    if (rateEl) rateEl.textContent = `T.C. S/ ${rate.toFixed(2)}`;
}

export async function runFetchValorVenal(plate, BACKEND_URL, callbacks, marca, modelo, anio) {
    const TIT = 'Valor Comercial Referencial (APESEG)';
    callbacks.setCardLoading('valor_venal', TIT, 'APESEG', 'fas fa-tag', '', 'APESEG');
    const neutralBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shadow-sm uppercase tracking-wider"><i class="fas fa-circle-info"></i> REQUIERE MARCA/MODELO</span>`;

    const clean = (v) => (v && v !== '-' && String(v).trim()) ? String(v).trim() : '';
    marca = clean(marca); modelo = clean(modelo);
    // Sin marca/modelo real (dependen de Estado de Placa / SUNARP) → honesto, sin precios falsos
    if (!marca || !modelo) {
        const content = `<div class="p-4 text-center font-poppins">
            <i class="fas fa-circle-info text-slate-400 text-xl mb-2"></i>
            <p class="text-sm font-semibold text-slate-600 dark:text-slate-300">Requiere la marca y el modelo del vehículo.</p>
            <p class="text-xs text-slate-400 mt-1">Se calcula automáticamente cuando la <b>Consulta de Estado de Placa</b> (o SUNARP) devuelva marca y modelo. Mientras, verifícalo con el botón <b>Verificar</b>.</p></div>`;
        callbacks.setCardData('valor_venal', TIT, 'APESEG', 'fas fa-tag', '', 'APESEG', content, true, false, neutralBadge);
        return { success: true, sinDatos: true };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
        const qs = `marca=${encodeURIComponent(marca)}&modelo=${encodeURIComponent(modelo)}${anio ? `&anio=${encodeURIComponent(anio)}` : ''}`;
        const res = await secureFetch(`${BACKEND_URL}/apeseg/precio?${qs}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
            const content = renderValorVenal(data);
            callbacks.setCardData('valor_venal', TIT, 'APESEG', 'fas fa-tag', '', 'APESEG', content, true, true);
            fillValorVenalSoles(); // rellena el monto en soles al tipo de cambio del día
            return data;
        } else {
            callbacks.setCardError('valor_venal', TIT, 'APESEG', 'fas fa-tag', '', 'APESEG', data.error || 'Error al consultar valor venal', plate);
            return data;
        }
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado (30s).' : (err.message || 'Error de conexión');
        callbacks.setCardError('valor_venal', TIT, 'APESEG', 'fas fa-tag', '', 'APESEG', msg, plate);
        return { success: false, error: msg };
    }
}

export async function runFetchOsinergmin(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('osinergmin', 'Registro Oficial de Tanque / Hidrocarburos', 'OSINERGMIN', 'fas fa-gas-pump', '', 'OSINERGMIN');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
        const res = await secureFetch(`${BACKEND_URL}/osinergmin/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
            const content = renderOsinergmin(data, plate);
            const hasData = !!data.registrado;
            callbacks.setCardData('osinergmin', 'Registro Oficial de Tanque / Hidrocarburos', 'OSINERGMIN', 'fas fa-gas-pump', '', 'OSINERGMIN', content, true, hasData);
            return data;
        } else {
            callbacks.setCardError('osinergmin', 'Registro Oficial de Tanque / Hidrocarburos', 'OSINERGMIN', 'fas fa-gas-pump', '', 'OSINERGMIN', data.error || 'Error al consultar OSINERGMIN', plate);
            return data;
        }
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado (30s).' : (err.message || 'Error de conexión');
        callbacks.setCardError('osinergmin', 'Registro Oficial de Tanque / Hidrocarburos', 'OSINERGMIN', 'fas fa-gas-pump', '', 'OSINERGMIN', msg, plate);
        return { success: false, error: msg };
    }
}

export async function runFetchLima(plate, BACKEND_URL, callbacks) {
    callbacks.setCardLoading('lima', 'Papeletas Lima', 'Infracciones de tránsito', 'fas fa-traffic-light', '', 'SAT Lima');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 160000);
    const LIMA_URL = 'https://www.sat.gob.pe/VirtualSAT/modulos/papeletas.aspx';
    try {
        const res = await secureFetch(`${BACKEND_URL}/lima/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
            const papeletas = Array.isArray(data.data) ? data.data : [];
            const hasData = papeletas.length > 0;
            const content = renderLima(plate, data.message || '', LIMA_URL, papeletas);
            const badge = hasData
                ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-triangle-exclamation"></i> CON PAPELETAS</span>`
                : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider"><i class="fas fa-circle-check"></i> SIN PAPELETAS</span>`;
            callbacks.setCardData('lima', 'Papeletas Lima', 'Infracciones de tránsito', 'fas fa-traffic-light', '', 'SAT Lima', content, true, hasData, badge);
            return data;
        } else {
            callbacks.setCardError('lima', 'Papeletas Lima', 'Infracciones de tránsito', 'fas fa-traffic-light', '', 'SAT Lima', data.error || 'Error al consultar papeletas SAT Lima', plate);
            return data;
        }
    } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado (160s). El navegador está ocupado, pulse Reintentar.' : (err.message || 'Error de conexión');
        callbacks.setCardError('lima', 'Papeletas Lima', 'Infracciones de tránsito', 'fas fa-traffic-light', '', 'SAT Lima', msg, plate);
        return { success: false, error: msg };
    }
}

