const arrayLength = value => Array.isArray(value) ? value.length : 0;

export function calculateVehicleScore(results = {}) {
    const alerts = [];
    const add = (condition, label, points) => {
        if (condition) alerts.push({ label, points });
    };
    const r = results;

    // 1. Pólizas SOAT e Inspecciones Técnicas
    const soatFound = arrayLength(r.soat?.data) > 0 || arrayLength(r.soat_detallado?.certificados) > 0;
    const soatVerified = r.soat?.success === true || r.soat_detallado?.success === true;
    add(soatVerified && !soatFound, 'No se encontró SOAT registrado', 18);

    const citvList = Array.isArray(r.citv?.data) ? r.citv.data : [];
    const citvTieneVigente = citvList.some(c => {
        const est = (c.estado || '').toUpperCase();
        return est === 'VIGENTE' || est === 'APROBADO' || est === 'APROBADA';
    });
    add(r.citv?.success === true && (citvList.length === 0 || !citvTieneVigente), 'Inspección técnica vehicular vencida o no registrada', 15);

    // 2. Multas y Papeletas de Tránsito
    add(Boolean(r.municipal?.con_papeletas), 'Papeletas en municipalidades provinciales', 10);
    add(arrayLength(r.lima?.data) > 0, 'Papeletas SAT Lima', 10);
    add(arrayLength(r.callao?.data) > 0, 'Papeletas Callao', 8);
    add(arrayLength(r.sutran?.data) > 0 || arrayLength(r.cinemometro?.data) > 0, 'Infracciones SUTRAN', 10);

    // 3. Gravámenes, Garantías y Situación Registral
    add(Boolean(r.sigm?.tiene_garantias), 'Garantía mobiliaria en SIGM SUNARP', 25);

    // 4. Siniestros SBS
    const accidentTotal = [r.sbs?.soat, r.sbs?.vehicular, r.sbs?.cat]
        .reduce((sum, item) => sum + (Number(item?.total_accidentes) || 0), 0);
    add(accidentTotal > 0, `${accidentTotal} siniestro${accidentTotal === 1 ? '' : 's'} reportado${accidentTotal === 1 ? '' : 's'}`, 15);

    // 5. Medidas Coactivas y Capturas
    add(Boolean(r.sat_captura?.captura?.tiene), 'Orden de captura SAT', 30);
    add(Boolean(r.sat_deposito?.deposito?.internado), 'Internamiento en depósito SAT', 20);

    // 6. Deudas Financieras FISE y Gravámenes Registrales
    add(Number(r.fise?.data?.montoPendiente || 0) > 0, 'Saldo pendiente en Ahorro GNV (FISE)', 8);
    add(Number(r.historial_dueños?.resumen?.gravamenes_vigentes || 0) > 0, 'Gravámenes registrales vigentes', 25);

    const verified = Object.values(r).filter(item => item?.success !== false).length;
    const failed = Object.values(r).filter(item => item?.success === false).length;
    const evaluated = verified + failed;
    const coverageFactor = evaluated > 0 ? 0.7 + (0.3 * verified / evaluated) : 0.7;
    const riskScore = Math.max(1, 100 - alerts.reduce((sum, item) => sum + item.points, 0));
    return {
        score: Math.max(1, Math.round(riskScore * coverageFactor)),
        alerts,
        verified,
        failed,
    };
}
