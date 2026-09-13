/**
 * vehicle_score.js — Motor Inteligente de Análisis y Scoring Vehicular Multifuente
 *
 * Evalúa TODAS las secciones del informe vehicular y genera un score de salud 0-100.
 * Cada fuente verificada aporta datos al diagnóstico; las fuentes no disponibles
 * NO penalizan el score (solo afectan la cobertura de información).
 *
 * Categorías de alerta:
 *   CRÍTICO  → Impacto severo en el vehículo o su estatus legal
 *   ALTO     → Restricciones importantes que requieren atención
 *   MEDIO    → Infracciones, deudas o condiciones que afectan el valor
 *   INFORMATIVO → Datos contextuales sin impacto directo en la salud
 */

const arrayLength = value => Array.isArray(value) ? value.length : 0;
const safeNum = (v, def = 0) => Number(v) || def;

export function buildConsolidatedPayload(plate, rawResults = {}) {
    const sources = [];
    const knownKeys = [
        'sunarp', 'soat', 'soat_detallado', 'citv', 'lunas',
        'lima', 'callao', 'sutran', 'cinemometro', 'municipal',
        'sat_captura', 'sat_deposito', 'sigm', 'sbs', 'historial_dueños',
        'gnv', 'fise', 'osinergmin', 'placas_pe', 'valor_venal', 'atu',
        'sat'
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
            alerts.push({ category, label, points, detail });
        }
    };

    // ─── 1. SOAT (Seguro Obligatorio) ─────────────────────────────────────
    const soatData = r.soat?.data || [];
    const certsApeseg = r.soat_detallado?.certificados || r.soat_detallado?.data?.certificados || [];
    const soatEvaluated = r.soat?.success === true || r.soat_detallado?.success === true;

    let hasActiveSoat = false;
    let soatProxVencimiento = null;
    if (Array.isArray(certsApeseg) && certsApeseg.length > 0) {
        hasActiveSoat = certsApeseg.some(c => {
            const est = String(c?.estado || c?.Estado || '').toUpperCase();
            return est === 'ACTIVO' || est === 'VIGENTE';
        });
        // Buscar fecha de fin más próxima
        certsApeseg.forEach(c => {
            const fin = c?.fechaFin || c?.FechaFin || c?.fin_vigencia;
            if (fin) {
                const d = new Date(fin);
                if (!isNaN(d.getTime())) {
                    if (!soatProxVencimiento || d < soatProxVencimiento) soatProxVencimiento = d;
                }
            }
        });
    } else if (Array.isArray(soatData) && soatData.length > 0) {
        hasActiveSoat = soatData.some(p => {
            const est = String(p?.estado || '').toUpperCase();
            return est === 'VIGENTE' || est === 'ACTIVO';
        });
    }
    add(soatEvaluated && !hasActiveSoat, 'ALTO', 'Póliza SOAT vencida o no registrada', 10,
        'El vehículo no cuenta con seguro obligatorio vigente.');

    // Alerta si SOAT vence en menos de 30 días
    if (hasActiveSoat && soatProxVencimiento) {
        const diasRestantes = Math.ceil((soatProxVencimiento - new Date()) / (1000 * 60 * 60 * 24));
        if (diasRestantes > 0 && diasRestantes <= 30) {
            add(true, 'MEDIO', `SOAT vence en ${diasRestantes} día(s)`, 3,
                `Vigencia hasta ${soatProxVencimiento.toLocaleDateString('es-PE')}.`);
        }
    }

    // ─── 2. CITV (Inspección Técnica Vehicular) ──────────────────────────
    const citvList = Array.isArray(r.citv?.data) ? r.citv.data : [];
    const citvTieneVigente = citvList.some(c => {
        const est = (c?.estado || '').toUpperCase();
        return est === 'VIGENTE' || est === 'APROBADO' || est === 'APROBADA';
    });
    add(r.citv?.success === true && (citvList.length === 0 || !citvTieneVigente), 'ALTO',
        'Inspección técnica vehicular (CITV) vencida', 8,
        'Sin certificado de inspección técnica vehicular aprobado.');

    // ─── 3. Lunas Oscurecidas PNP ────────────────────────────────────────
    const lunasRes = r.lunas?.data;
    const lunasSinAutorizacion = r.lunas?.success === true && (
        !lunasRes ||
        lunasRes.tiene_autorizacion === false ||
        String(lunasRes.estado || '').toLowerCase().includes('no registra') ||
        String(r.lunas?.message || '').toLowerCase().includes('no registra')
    );
    add(lunasSinAutorizacion, 'INFORMATIVO', 'Sin autorización de lunas oscurecidas', 2,
        'No todos los vehículos requieren o portan lunas oscurecidas.');

    // ─── 4. SAT Medidas Coactivas ────────────────────────────────────────
    const tieneCaptura = Boolean(r.sat_captura?.captura?.tiene || r.sat_captura?.data?.captura?.tiene);
    const tieneDeposito = Boolean(r.sat_deposito?.deposito?.internado || r.sat_deposito?.data?.deposito?.internado);
    add(tieneCaptura, 'CRÍTICO', 'Orden de captura vehicular SAT', 25,
        'Existe orden de captura y secuestro coactivo.');
    add(tieneDeposito, 'CRÍTICO', 'Internamiento en depósito vehicular SAT', 20,
        'Unidad internada físicamente en depósito.');

    // SAT sección principal (si tiene datos propios)
    const satData = r.sat?.data;
    if (satData && typeof satData === 'object') {
        const satCaptura = satData.captura || satData.ordenCaptura;
        const satDep = satData.deposito || satData.internamiento;
        if (satCaptura && !tieneCaptura) {
            add(Boolean(satCaptura.tiene), 'CRÍTICO', 'Orden de captura vehicular SAT', 25,
                'Existe orden de captura y secuestro coactivo.');
        }
        if (satDep && !tieneDeposito) {
            add(Boolean(satDep.internado), 'CRÍTICO', 'Internamiento en depósito vehicular SAT', 20,
                'Unidad internada físicamente en depósito.');
        }
    }

    // ─── 5. SUNARP Registral ─────────────────────────────────────────────
    const gravamenesCount = safeNum(r.historial_dueños?.resumen?.gravamenes_vigentes);
    add(gravamenesCount > 0, 'CRÍTICO', 'Gravámenes registrales vigentes', 20,
        `${gravamenesCount} gravamen(es) registrado(s) en SUNARP.`);

    add(Boolean(r.sigm?.tiene_garantias), 'CRÍTICO', 'Garantía Mobiliaria en SIGM SUNARP', 20,
        'Garantía mobiliaria inscrita en el registro formal.');

    const transferenciasRecientes = safeNum(r.historial_dueños?.resumen?.transferencias_recientes);
    const transferenciasTotales = safeNum(r.historial_dueños?.resumen?.total_propietarios);
    add(transferenciasRecientes >= 2 || (transferenciasTotales >= 5 && transferenciasRecientes >= 1), 'MEDIO',
        'Transferencias vehiculares frecuentes', 5,
        'Rotación inusual de propietarios en periodos cortos.');

    // Estado del vehículo en SUNARP
    const sunarpData = r.sunarp?.data;
    if (sunarpData && typeof sunarpData === 'object') {
        const estadoVehiculo = String(sunarpData.estado || sunarpData.situacion || '').toUpperCase();
        add(estadoVehiculo.includes('BAJA') || estadoVehiculo.includes('SUSPENS'), 'CRÍTICO',
            'Vehículo con baja o suspensión en SUNARP', 15,
            `Estado registral: ${estadoVehiculo}.`);
        add(estadoVehiculo.includes('ROBO'), 'CRÍTICO',
            'Vehículo reportado como robado', 30,
            'Reporte de robo registrado en SUNARP.');

        // Verificar antigüedad del vehículo
        const anioFab = safeNum(sunarpData.anioFabricacion || sunarpData.anio || sunarpData.año);
        if (anioFab > 0) {
            const antiguedad = new Date().getFullYear() - anioFab;
            if (antiguedad >= 20) {
                add(true, 'INFORMATIVO', `Vehículo con ${antiguedad} años de antigüedad`, 0,
                    `Año de fabricación: ${anioFab}. Sin penalización, pero considerar desgaste.`);
            }
        }
    }

    // Placas PE (AAP)
    if (r.placas_pe?.success === true) {
        const placasData = r.placas_pe?.data;
        if (placasData && typeof placasData === 'object') {
            const estadoPlaca = String(placasData.estado || '').toUpperCase();
            add(estadoPlaca.includes('RESTRICCION') || estadoPlaca.includes('BLOQUE'), 'ALTO',
                'Restricción o bloqueo en AAP (Placas PE)', 8,
                `Estado: ${estadoPlaca}.`);
        }
    }

    // ─── 6. SBS Siniestralidad ───────────────────────────────────────────
    const accidentTotal = [r.sbs?.soat, r.sbs?.vehicular, r.sbs?.cat]
        .reduce((sum, item) => sum + safeNum(item?.total_accidentes), 0);
    add(accidentTotal > 0, 'ALTO', `${accidentTotal} siniestro(s) vehicular(es) reportado(s)`, 10,
        'Registros de siniestralidad ante aseguradoras de SBS.');

    // Verificar si tiene seguro vehicular activo en SBS
    if (r.sbs?.vehicular) {
        const siniestrosVehicular = safeNum(r.sbs.vehicular.total_accidentes);
        const montoReclamado = safeNum(r.sbs.vehicular.total_monto_reclamado);
        if (montoReclamado > 0) {
            add(true, 'ALTO', `SBS: monto reclamado S/ ${montoReclamado.toFixed(2)}`, 5,
                `Total reclamado en siniestros vehiciales.`);
        }
    }

    // ─── 7. FISE Deuda GNV ───────────────────────────────────────────────
    const fiseMonto = safeNum(r.fise?.data?.montoPendiente || r.fise?.data?.saldo);
    add(fiseMonto > 0, 'MEDIO', 'Saldo de deuda pendiente en Ahorro GNV (FISE)', 5,
        'Financiamiento pendiente de regularización.');

    // ─── 8. GNV (Gas Natural Vehicular) ──────────────────────────────────
    if (r.gnv?.success === true) {
        const gnvData = r.gnv?.data;
        if (gnvData && typeof gnvData === 'object') {
            const gnvStatus = String(gnvData.estado || gnvData.status || '').toUpperCase();
            add(gnvStatus.includes('VENCIDO') || gnvStatus.includes('NO VIGENTE'), 'MEDIO',
                'Certificado GNV vencido o no vigente', 4,
                'El certificado de instalación de gas natural no está vigente.');
        }
    }

    // ─── 9. OSINERGMIN (Registro de Tanque) ──────────────────────────────
    if (r.osinergmin?.success === true) {
        const osData = r.osinergmin?.data;
        if (osData && typeof osData === 'object') {
            const osEstado = String(osData.estado || '').toUpperCase();
            add(osEstado.includes('VENCIDO') || osEstado.includes('NO VIGENTE'), 'MEDIO',
                'Registro OSINERGMIN de tanque vencido', 3,
                'El registro oficial del tanque de combustible no está vigente.');
        }
    }

    // ─── 10. Papeletas y Multas ──────────────────────────────────────────
    const papeletasLima = arrayLength(r.lima?.data);
    const papeletasCallao = arrayLength(r.callao?.data);
    const papeletasSutran = arrayLength(r.sutran?.data);
    const papeletasCinemometro = arrayLength(r.cinemometro?.data);
    const papeletasMunicipal = r.municipal?.con_papeletas ? safeNum(r.municipal?.total_papeletas || 1) : 0;
    const totalPapeletas = papeletasLima + papeletasCallao + papeletasSutran + papeletasCinemometro + papeletasMunicipal;

    add(papeletasLima > 0, 'MEDIO', `Papeletas de tránsito en SAT Lima (${papeletasLima})`, 8);
    add(papeletasCallao > 0, 'MEDIO', `Papeletas de tránsito en Callao (${papeletasCallao})`, 6);
    add(papeletasSutran + papeletasCinemometro > 0, 'MEDIO',
        `Infracciones SUTRAN / Cinemómetro (${papeletasSutran + papeletasCinemometro})`, 8);
    add(papeletasMunicipal > 0, 'MEDIO',
        `Papeletas en municipalidades provinciales (${papeletasMunicipal})`, 6);

    // Alerta consolidada si hay muchas papeletas
    if (totalPapeletas >= 5) {
        add(true, 'ALTO', `Alta acumulación de papeletas (${totalPapeletas} total)`, 4,
            'El vehículo tiene un historial significativo de infracciones de tránsito.');
    }

    // ─── 11. Habilitación ATU (Taxi) ─────────────────────────────────────
    const atuData = r.atu?.data;
    if (r.atu?.success === true && atuData) {
        const esNoRegistrado = atuData.fuenteDato === 'NOREGISTRADO' || !atuData.estadoCertificado;
        const estadoCert = Number(atuData.estadoCertificado);
        const modalidad = String(atuData.modalidad || 'Taxi').trim();

        if (estadoCert === 1) {
            add(true, 'MEDIO', `Vehículo habilitado como Taxi en ATU (${modalidad})`, 6,
                'Cuenta con autorización y credencial vehicular vigente para servicio de taxi en Lima y Callao. Implica mayor kilometraje, desgaste mecánico acelerado y uso comercial.');
        } else if (estadoCert === 2) {
            add(true, 'ALTO', `Habilitación ATU de Taxi SUSPENDIDA (${modalidad})`, 8,
                'La autorización de taxi ante ATU se encuentra en estado suspendido administrativamente.');
        } else if (estadoCert === 3 || (!esNoRegistrado && estadoCert > 0)) {
            add(true, 'INFORMATIVO', `Historial de Taxi en ATU (Baja / Cese de Servicio)`, 3,
                'El vehículo registra antecedentes de haber operado como servicio de taxi en Lima y Callao.');
        }
    }

    // ─── 12. Valor Venal (Valor Comercial Referencial) ───────────────────
    if (r.valor_venal?.success === true) {
        const vvData = r.valor_venal?.data;
        if (vvData && typeof vvData === 'object') {
            const valorComercial = safeNum(vvData.valor || vvData.valorComercial || vvData.valor_venal);
            if (valorComercial > 0 && valorComercial < 5000) {
                add(true, 'INFORMATIVO', `Valor comercial referencial bajo (S/ ${valorComercial.toFixed(0)})`, 0,
                    'El valor venal es bajo, lo cual puede indicar antigüedad o deterioro.');
            }
        }
    }

    // ─── 13. Cálculo de Métricas Finales ─────────────────────────────────
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

    // Desglose por categoría para el panel
    const criticalAlerts = alerts.filter(a => a.category === 'CRÍTICO');
    const highAlerts = alerts.filter(a => a.category === 'ALTO');
    const mediumAlerts = alerts.filter(a => a.category === 'MEDIO');
    const infoAlerts = alerts.filter(a => a.category === 'INFORMATIVO');

    return {
        score: Math.max(0, Math.min(100, rawVehicleScore)),
        coveragePercent,
        alerts,
        criticalCount: criticalAlerts.length,
        highCount: highAlerts.length,
        mediumCount: mediumAlerts.length,
        infoCount: infoAlerts.length,
        verified,
        failed,
        totalSources,
        totalPapeletas,
        totalDeductions
    };
}
