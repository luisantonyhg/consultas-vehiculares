/**
 * vehicle_score.js — Motor Inteligente de Análisis y Scoring Vehicular Multifuente
 *
 * Cumple con Fase 2 (Puntos 6, 7 y 8):
 * - Contrato único normalizado: recibe { vehicle, timestamp, sources: [...] } o map de resultados.
 * - Matriz de análisis por fuente estricta:
 *     SOAT vencido: ALTO (-10)
 *     CITV vencido: ALTO (-8)
 *     Lunas PNP sin autorización: INFORMATIVO (-2 máximo)
 *     SAT Captura: CRÍTICO (-25), SAT Depósito: CRÍTICO (-20)
 *     SUNARP Gravamen: CRÍTICO (-20), Garantía SIGM: CRÍTICO (-20), Transferencias frecuentes: MEDIO (-5)
 *     SBS Siniestros: ALTO (-10)
 *     FISE Deuda: MEDIO (-5)
 *     Papeletas (Lima -8, Callao -6, SUTRAN/Cinemómetro -8, Municipal -6)
 * - Separación estricta entre Riesgo del Vehículo (Salud 0-100) y Cobertura de Datos (%)
 * - Límite mínimo: Math.max(0, score)
 */

const arrayLength = value => Array.isArray(value) ? value.length : 0;

export function buildConsolidatedPayload(plate, rawResults = {}) {
    const sources = [];
    const knownKeys = [
        'sunarp', 'soat', 'soat_detallado', 'citv', 'lunas',
        'lima', 'callao', 'sutran', 'cinemometro', 'municipal',
        'sat_captura', 'sat_deposito', 'sigm', 'sbs', 'historial_dueños',
        'gnv', 'fise', 'osinergmin', 'placas_pe', 'valor_venal', 'atu'
    ];

    knownKeys.forEach(name => {
        const item = rawResults[name];
        const explicitStatus = String(item?.status || '').toLowerCase();
        const status = item === undefined
            ? 'pending'
            : explicitStatus === 'not_found'
                ? 'not_found'
                : item?.success === false || ['error', 'timeout', 'unavailable'].includes(explicitStatus)
                    ? (explicitStatus || 'error')
                    : 'success';
        sources.push({ name, status, data: item || {} });
    });

    return {
        vehicle: String(plate || '').toUpperCase().replace(/[^A-Z0-9]/g, ''),
        timestamp: new Date().toISOString(),
        sources
    };
}

export function calculateVehicleScore(input = {}) {
    let r = {};
    // Soporte para contrato unificado { vehicle, sources: [...] } o map directo
    if (Array.isArray(input.sources)) {
        input.sources.forEach(src => {
            if (src && src.name) {
                r[src.name] = { ...(src.data || {}), _contractStatus: src.status || 'pending' };
            }
        });
    } else {
        r = input;
    }

    const alerts = [];
    const add = (condition, category, label, points, detail = '') => {
        if (condition) {
            alerts.push({
                category, // 'CRÍTICO', 'ALTO', 'MEDIO', 'INFORMATIVO'
                label,
                points,
                detail
            });
        }
    };

    // 1. SOAT (Condición: vencido / no registrado -> ALTO, -10 pts)
    const soatData = r.soat?.data || [];
    const certsApeseg = r.soat_detallado?.certificados || r.soat_detallado?.data?.certificados || [];
    const soatEvaluated = r.soat?.success === true || r.soat_detallado?.success === true;

    let hasActiveSoat = false;
    if (Array.isArray(certsApeseg) && certsApeseg.length > 0) {
        hasActiveSoat = certsApeseg.some(c => ['ACTIVO', 'VIGENTE'].includes(String(c?.estado || c?.Estado || '').toUpperCase()));
    } else if (Array.isArray(soatData) && soatData.length > 0) {
        hasActiveSoat = soatData.some(p => String(p?.estado || '').toUpperCase() === 'VIGENTE' || String(p?.estado || '').toUpperCase() === 'ACTIVO');
    }
    add(soatEvaluated && !hasActiveSoat, 'ALTO', 'Póliza SOAT vencida o no registrada', 10, 'El vehículo no cuenta con seguro obligatorio vigente.');

    // 2. CITV (Condición: vencido / desaprobado -> ALTO, -8 pts)
    const citvList = Array.isArray(r.citv?.data) ? r.citv.data : [];
    const citvTieneVigente = citvList.some(c => {
        const est = (c?.estado || '').toUpperCase();
        return est === 'VIGENTE' || est === 'APROBADO' || est === 'APROBADA';
    });
    add(r.citv?.success === true && (citvList.length === 0 || !citvTieneVigente), 'ALTO', 'Inspección técnica vehicular (CITV) vencida', 8, 'Sin certificado de inspección técnica vehicular aprobado.');

    // 3. Lunas PNP (Condición: sin autorización -> INFORMATIVO, -2 pts máximo)
    const lunasRes = r.lunas?.data;
    const lunasSinAutorizacion = r.lunas?.success === true && (
        !lunasRes ||
        lunasRes.tiene_autorizacion === false ||
        String(lunasRes.estado || '').toLowerCase().includes('no registra') ||
        String(r.lunas?.message || '').toLowerCase().includes('no registra')
    );
    add(lunasSinAutorizacion, 'INFORMATIVO', 'Sin autorización de lunas oscurecidas', 2, 'No todos los vehículos requieren o portan lunas oscurecidas.');

    // 4. SAT Medidas Coactivas (Captura: CRÍTICO, -25 pts | Depósito: CRÍTICO, -20 pts)
    add(Boolean(r.sat_captura?.captura?.tiene || r.sat_captura?.data?.captura?.tiene), 'CRÍTICO', 'Orden de captura vehicular SAT', 25, 'Existe orden de captura y secuestro coactivo.');
    add(Boolean(r.sat_deposito?.deposito?.internado || r.sat_deposito?.data?.deposito?.internado), 'CRÍTICO', 'Internamiento en depósito vehicular SAT', 20, 'Unidad internada físicamente en depósito.');

    // 5. SUNARP Gravámenes, Garantías y Transferencias
    const gravamenesCount = Number(r.historial_dueños?.resumen?.gravamenes_vigentes || 0);
    add(gravamenesCount > 0, 'CRÍTICO', 'Gravámenes registrales vigentes', 20, `${gravamenesCount} gravamen(es) registrado(s) en SUNARP.`);

    add(Boolean(r.sigm?.tiene_garantias), 'CRÍTICO', 'Garantía Mobiliaria en SIGM SUNARP', 20, 'Garantía mobiliaria inscrita en el registro formal.');

    const transferenciasRecientes = Number(r.historial_dueños?.resumen?.transferencias_recientes || 0);
    const transferenciasTotales = Number(r.historial_dueños?.resumen?.total_propietarios || 0);
    add(transferenciasRecientes >= 2 || (transferenciasTotales >= 5 && transferenciasRecientes >= 1), 'MEDIO', 'Transferencias vehiculares frecuentes', 5, 'Rotación inusual de propietarios en periodos cortos.');

    // 6. SBS Siniestros (Condición: siniestros reportados -> ALTO, -10 pts)
    const accidentTotal = [r.sbs?.soat, r.sbs?.vehicular, r.sbs?.cat]
        .reduce((sum, item) => sum + (Number(item?.total_accidentes) || 0), 0);
    add(accidentTotal > 0, 'ALTO', `${accidentTotal} siniestro(s) vehicular(es) reportado(s)`, 10, 'Registros de siniestralidad ante aseguradoras de SBS.');

    // 7. FISE Deuda (Condición: saldo pendiente Ahorro GNV -> MEDIO, -5 pts)
    add(Number(r.fise?.data?.montoPendiente || 0) > 0, 'MEDIO', 'Saldo de deuda pendiente en Ahorro GNV (FISE)', 5, 'Financiamiento pendiente de regularización.');

    // 8. Papeletas y Multas (SAT Lima -8, Callao -6, SUTRAN/Cinemómetro -8, Provincias -6)
    add(arrayLength(r.lima?.data) > 0, 'MEDIO', 'Papeletas de tránsito en SAT Lima', 8);
    add(arrayLength(r.callao?.data) > 0, 'MEDIO', 'Papeletas de tránsito en Callao', 6);
    add(arrayLength(r.sutran?.data) > 0 || arrayLength(r.cinemometro?.data) > 0, 'MEDIO', 'Infracciones de tránsito SUTRAN / Cinemómetro', 8);
    add(Boolean(r.municipal?.con_papeletas), 'MEDIO', 'Papeletas en municipalidades provinciales', 6);

    // 9. Habilitación de Taxi ATU (Lima y Callao - Servicio Público)
    const atuData = r.atu?.data;
    if (r.atu?.success === true && atuData) {
        const esNoRegistrado = atuData.fuenteDato === 'NOREGISTRADO' || !atuData.estadoCertificado;
        const estadoCert = Number(atuData.estadoCertificado);
        const modalidad = String(atuData.modalidad || 'Taxi').trim();

        if (estadoCert === 1) {
            add(true, 'MEDIO', `Vehículo habilitado como Taxi en ATU (${modalidad})`, 6,
                'Cuenta con autorización y credencial vehicular vigente para servicio de taxi en Lima y Callao. Implica mayor kilometraje, desgaste mecánico acelerado y uso comercial.');
        } else if (estadoCert === 2) {
            add(true, 'MEDIO', `Habilitación ATU de Taxi SUSPENDIDA (${modalidad})`, 8,
                'La autorización de taxi ante ATU se encuentra en estado suspendido administrativamente.');
        } else if (estadoCert === 3 || (!esNoRegistrado && estadoCert > 0)) {
            add(true, 'INFORMATIVO', `Historial de Taxi en ATU (Baja / Cese de Servicio)`, 3,
                'El vehículo registra antecedentes de haber operado como servicio de taxi en Lima y Callao.');
        }
    }

    // 10. Separación de Métricas: Salud del Vehículo vs Cobertura de Fuentes
    const totalDeductions = alerts.reduce((sum, item) => sum + item.points, 0);
    const rawVehicleScore = Math.max(0, 100 - totalDeductions);

    const isVerified = item => item && (
        ['success', 'not_found'].includes(item._contractStatus) ||
        (!item._contractStatus && item.success !== false)
    );
    const verified = Object.values(r).filter(isVerified).length;
    const failed = Object.values(r).filter(item => item && !isVerified(item)).length;
    const totalSources = Math.max(1, verified + failed);
    const coveragePercent = Math.min(100, Math.round((verified / totalSources) * 100));

    return {
        score: Math.max(0, Math.min(100, rawVehicleScore)), // Salud del vehículo: NUNCA se degrada por caídas de red externas
        coveragePercent,                                     // Calidad de información independiente (85%, 90%, etc.)
        alerts,
        verified,
        failed,
        totalSources
    };
}
