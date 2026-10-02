// Mapeo oficial de portales para "Verificar fuente" en cada sección DNI
export const DNI_SOURCE_URLS: Record<string, string> = {
  identidad: 'https://buscardniperu.com/',
  sunat: 'https://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/FrameCriterioBusquedaWeb.jsp',
  jne_multas: 'https://multas.jne.gob.pe/',
  transporte_licencias: 'https://licencias.mtc.gob.pe/',
  transporte_record: 'https://recordconductor.mtc.gob.pe/',
  transporte_papeletas: 'https://scppp.mtc.gob.pe/',
  minedu: 'https://titulosinstitutos.minedu.gob.pe/',
  osce: 'https://bi.seace.gob.pe/pentaho/api/repos/:public:ANTECEDENTES_PROVEEDORES:ANTECEDENTES_PROVEEDORES.wcdf/generatedContent?userid=public&password=key',
  infogob: 'https://infogob.jne.gob.pe/',
  webmii: 'https://webmii.com/'
};

// ====================================================
// GESTOR DE ESTADO Y RENDERIZADO DE SECCIONES DNI
// Mismo diseño y lógica de tarjetas tipo acordeón que Placas
// ====================================================

export type DniSections = Record<string, unknown>;
const state: DniSections = {};

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

export function escapeHtml(s: string): string {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Algoritmo de inferencia de género por nombres en Perú
export function inferirSexoPorNombre(nombres: string): string {
  if (!nombres || nombres === '—' || nombres === '-') return '—';
  const primerNombre = nombres.trim().toUpperCase().split(/\s+/)[0]
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const nombresFemeninos = new Set([
    'MARIA', 'ANA', 'ROSA', 'CARMEN', 'LUZ', 'JUANA', 'PATRICIA', 'DIANA',
    'CLAUDIA', 'ANDREA', 'SOFIA', 'ELENA', 'LAURA', 'GLORIA', 'LILIANA',
    'MONICA', 'SILVIA', 'ELIZABETH', 'YESSICA', 'JESSICA', 'VERONICA',
    'MARITZA', 'PILAR', 'MILAGROS', 'TERESA', 'BEATRIZ', 'LUCIA', 'CECILIA',
    'GABRIELA', 'VANESSA', 'ROCIO', 'KAREN', 'STEPHANIE', 'CINTHIA', 'CYNTHIA',
    'PAOLA', 'FIORELLA', 'ESTHER', 'MIRIAM', 'MIRIAN', 'SANDRA', 'KARLA',
    'ALEJANDRA', 'DANIELA', 'VALERIA', 'CAMILA', 'ISABEL', 'MERCEDES', 'INDIRA',
    'YOLANDA', 'BLANCA', 'GLADYS', 'SONIA', 'IRMA', 'HILDA', 'BERTHA', 'NORMA',
    'VICTORIA', 'RITA', 'OLGA', 'LUCILA', 'AIDA', 'ANGELA', 'LOURDES', 'JULIA'
  ]);

  const nombresMasculinos = new Set([
    'JUAN', 'JOSE', 'CARLOS', 'LUIS', 'JORGE', 'MIGUEL', 'MANUEL', 'DAVID',
    'VICTOR', 'JESUS', 'MARIO', 'FERNANDO', 'ROBERTO', 'CRISTIAN', 'CHRISTIAN',
    'FRANCISCO', 'JULIO', 'CESAR', 'EDUARDO', 'ANGEL', 'DANIEL', 'DIEGO',
    'ALBERTO', 'MARCO', 'ALEX', 'JAVIER', 'RICARDO', 'MARTIN', 'RAUL',
    'ENRIQUE', 'HUGO', 'ALEXANDER', 'EDGAR', 'ALFREDO', 'WALTER', 'OSCAR',
    'RUBEN', 'HECTOR', 'JAIME', 'ARTURO', 'EDWIN', 'GUILLERMO', 'PEDRO',
    'RONALD', 'JONATHAN', 'ALONSO', 'SEBASTIAN', 'ADRIAN', 'GABRIEL', 'RENZO',
    'SERGIO', 'RODRIGO', 'LEONARDO', 'GONZALO', 'GUSTAVO', 'PABLO', 'FELIPE'
  ]);

  if (nombresFemeninos.has(primerNombre)) return 'FEMENINO';
  if (nombresMasculinos.has(primerNombre)) return 'MASCULINO';

  if (primerNombre.endsWith('A') && !['JOSHUA'].includes(primerNombre)) return 'FEMENINO';
  if (primerNombre.endsWith('O') || primerNombre.endsWith('OR') || primerNombre.endsWith('EL') || primerNombre.endsWith('AN') || primerNombre.endsWith('ER')) return 'MASCULINO';

  return '—';
}

export function fila(label: string, value: unknown): string {
  if (value === null || value === undefined || value === "null" || value === "undefined") return "";
  const strVal = String(value).trim();
  if (strVal === "" || strVal === "-" || strVal === "—" || strVal === "--" || strVal === "null" || strVal === "undefined") return "";
  const safeLabel = escapeHtml(label);
  const safeValue = escapeHtml(strVal);
  return `
    <tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors duration-150 font-poppins">
      <td class="py-2 px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/50 border-r border-slate-100 w-[38%] align-middle font-poppins">${safeLabel}</td>
      <td class="py-2 px-3 text-xs font-bold text-slate-900 leading-tight w-auto align-middle font-poppins">${safeValue}</td>
    </tr>
  `;
}

// Badges oficiales idénticos a los de Placa (Verde, Rojo, Ámbar, Gris)
// Badges oficiales 100% idénticos a los de Placas (renderers.js)
export function badgeLoading(): string {
  return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-900 text-white border border-slate-900 shadow-sm uppercase tracking-wider font-poppins">
    <span class="inline-block w-2.5 h-2.5 rounded-full border-2 border-white border-t-transparent spin-icon"></span> Consultando
  </span>`;
}

export function badgeWaiting(position?: number): string {
  const label = position && position > 0 ? `En espera ${position}` : 'En espera';
  return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-900 text-white border border-slate-900 shadow-sm uppercase tracking-wider font-poppins">
    <i class="fas fa-clock text-slate-300 animate-pulse text-[10px]"></i> ${label}
  </span>`;
}

export function badgePill(type: 'success' | 'danger' | 'warning' | 'neutral' | 'dark', text: string): string {
  if (type === 'success') {
    return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-600 text-white shadow-sm uppercase tracking-wider font-poppins"><i class="fas fa-circle-check text-[10px]"></i> ${escapeHtml(text)}</span>`;
  }
  if (type === 'dark') {
    return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-black text-white shadow-sm uppercase tracking-wider font-poppins"><i class="fas fa-arrows-rotate text-[10px]"></i> ${escapeHtml(text)}</span>`;
  }
  if (type === 'danger') {
    return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-sm uppercase tracking-wider font-poppins"><i class="fas fa-triangle-exclamation text-[10px]"></i> ${escapeHtml(text)}</span>`;
  }
  if (type === 'warning') {
    return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-600 text-white shadow-sm uppercase tracking-wider font-poppins"><i class="fas fa-triangle-exclamation text-[10px]"></i> ${escapeHtml(text)}</span>`;
  }
  return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700 border border-slate-300 shadow-sm uppercase tracking-wider font-poppins"><i class="fas fa-circle-info text-[10px]"></i> ${escapeHtml(text)}</span>`;
}
export function setSection(name: string, data: unknown): void {
  state[name] = data;
  paintDniSection(name, data);
}

export function paintDniSection(name: string, rawData: unknown): void {
  const d: Dict = isDict(rawData) ? rawData : {};
  const inner: Dict = isDict(d.data) ? (d.data as Dict) : d;
  const providerStatus = str(d.status).toUpperCase();

  const cardContainer = document.getElementById(`dni-card-${name}`);
  if (!cardContainer) return;

  const badgeContainer = cardContainer.querySelector('.status-badge-container');
  const bodyContent = cardContainer.querySelector('.card-body-content');
  const skeletonEl = cardContainer.querySelector('.card-skeleton');

  let badgeHtml = badgePill('success', 'REGISTRADO');
  let tableRows = '';

  // Ningún fallo técnico puede convertirse en una afirmación negativa sobre
  // una persona. Las secciones solo renderizan "sin" cuando su proveedor
  // respondió OK con un resultado explícitamente confirmado.
  // Excepción ordenada por producto: papeletas nunca usa plomo; un fallo
  // técnico es ROJO "no verificado" (alerta de reintento, jamás "con
  // sanciones"), y el hallazgo confirmado es ROJO con conteo o VERDE.
  if (providerStatus === 'ERROR' || providerStatus === 'UNAVAILABLE' || providerStatus === 'EMPTY') {
    const unavailable = providerStatus === 'UNAVAILABLE';
    if (name === 'transporte_papeletas') {
      badgeHtml = badgePill('dark', 'NO VERIFICADO · REINTENTAR');
      tableRows = `
        <div class="p-4 text-center text-slate-700 bg-rose-50/60 rounded-xl border border-rose-200">
          <i class="fas fa-triangle-exclamation text-rose-500 text-lg mb-1 block"></i>
          <p class="text-xs font-bold text-slate-900">El portal MTC no devolvió un resultado verificable en esta consulta.</p>
          <p class="text-[10px] text-slate-500 mt-0.5">No se afirma que existan ni que no existan sanciones.</p>
          <button data-dni-retry="transporte_papeletas" class="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold bg-black text-white uppercase tracking-wider font-poppins hover:bg-slate-800 transition-colors">
            <i class="fas fa-arrows-rotate text-[10px]"></i> Reintentar solo esta sección
          </button>
        </div>
      `;
    } else if (name === 'webmii') {
      badgeHtml = badgePill('neutral', unavailable ? 'FUENTE NO DISPONIBLE' : 'RESULTADO SIN CONFIRMAR');
      tableRows = `
        <div class="p-4 text-center text-slate-600 bg-slate-50 rounded-xl border border-slate-200">
          <i class="fas fa-circle-info text-slate-400 text-lg mb-1 block"></i>
          <p class="text-xs font-bold text-slate-900">No se pudo verificar WebMii ni el índice de respaldo en esta consulta.</p>
          <p class="text-[10px] text-slate-500 mt-0.5">No se infiere que no exista presencia digital. Puedes volver a consultar la fuente.</p>
          <button data-dni-retry="webmii" class="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold bg-slate-900 text-white uppercase tracking-wider font-poppins hover:bg-slate-700 transition-colors">
            <i class="fas fa-arrows-rotate text-[10px]"></i> Reintentar WebMii
          </button>
        </div>
      `;
    } else {
      badgeHtml = badgePill('neutral', unavailable ? 'FUENTE NO DISPONIBLE' : 'RESULTADO SIN CONFIRMAR');
      tableRows = `
        <div class="p-4 text-center text-slate-600 bg-slate-50 rounded-xl border border-slate-200">
          <i class="fas fa-circle-info text-slate-400 text-lg mb-1 block"></i>
          <p class="text-xs font-bold text-slate-900">${unavailable ? 'La fuente no está disponible para esta consulta.' : 'La fuente no devolvió un resultado verificable.'}</p>
          <p class="text-[10px] text-slate-500 mt-0.5">No se infiere información negativa ni positiva a partir de este estado.</p>
        </div>
      `;
    }
  } else switch (name) {
    case 'identidad': {
      const nombres = str(inner.nombres || inner.nombre_completo || '—');
      const apePat = str(inner.apellido_paterno || '—');
      const apeMat = str(inner.apellido_materno || '—');
      const completo = str(inner.nombre_completo || `${nombres} ${apePat} ${apeMat}`);
      const edadObj = isDict(inner.edad) ? (inner.edad as Dict) : {};
      const edadTxt = str(edadObj.legible || inner.edad || '—');
      const fecNac = str(inner.fecha_nacimiento || '—');
      
      let sexo = str(inner.sexo || '');
      if (!sexo || sexo === '—' || sexo === '-' || sexo === 'null') {
        sexo = inferirSexoPorNombre(nombres || completo);
      }
      
      const inputDni = (document.getElementById('dni-search-input') as HTMLInputElement)?.value?.trim() 
        || (document.getElementById('dni-input') as HTMLInputElement)?.value?.trim() || '';
      const dniVal = str(inner.dni || inputDni || '—');
      const dv = str(inner.digito_verificador || '');

      badgeHtml = badgePill('success', 'IDENTIDAD VERIFICADA');
      tableRows = `
        <div class="mb-3.5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-50/60 via-white to-white border border-amber-200/80 shadow-2xs flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#edd59b] via-[#cfab5c] to-[#a07c30] p-0.5 shadow-xs flex items-center justify-center shrink-0">
            <div class="w-full h-full rounded-2xl bg-[#fdfbf7] flex items-center justify-center text-amber-800 text-lg font-bold">
              <i class="fas fa-user-check"></i>
            </div>
          </div>
          <div class="min-w-0">
            <span class="text-[9px] font-black uppercase tracking-wider text-slate-400 block font-archivo">CIUDADANO PERUANO VERIFICADO</span>
            <h4 class="text-sm sm:text-base font-black text-slate-900 leading-tight font-poppins truncate">${escapeHtml(completo)}</h4>
            <p class="text-[11px] text-amber-800 font-semibold mt-0.5">DNI: <strong class="font-mono text-slate-900">${escapeHtml(dniVal)}</strong> ${dv ? `(Dígito: ${escapeHtml(dv)})` : ''}</p>
          </div>
        </div>
        <div class="overflow-x-auto w-full">
          <table class="w-full text-left border-collapse">
            <tbody>
              ${fila('Nombres', nombres)}
              ${fila('Apellido Paterno', apePat)}
              ${fila('Apellido Materno', apeMat)}
              ${fila('Fecha de Nacimiento', fecNac)}
              ${fila('Edad Actual', edadTxt)}
              ${fila('Sexo', sexo)}
              ${/* Estado Civil omitido por solicitud de usuario */ ''}
            </tbody>
          </table>
        </div>
      `;
      break;
    }

    case 'sunat': {
      const tieneRuc = inner.tiene_ruc === true || (str(inner.numero_ruc || inner.ruc).length > 0 && str(inner.numero_ruc || inner.ruc) !== '—' && str(inner.numero_ruc || inner.ruc) !== '-');
      const rucNum = str(inner.numero_ruc || inner.ruc || '');
      const tipoContribuyente = str(inner.tipo_contribuyente || '');
      const tipoDocumento = str(inner.tipo_documento || '');
      const nombreComercial = str(inner.nombre_comercial || '');
      const fechaInscripcion = str(inner.fecha_inscripcion || '');
      const fechaInicio = str(inner.fecha_inicio_actividades || '');
      const estado = str(inner.estado_contribuyente || inner.estado || '').toUpperCase();
      const condicion = str(inner.condicion_contribuyente || inner.condicion || '').toUpperCase();
      const domicilio = str(inner.domicilio_fiscal || '');
      const emisionComp = str(inner.sistema_emision_comprobante || '');
      const comExterior = str(inner.actividad_comercio_exterior || '');
      const contabilidad = str(inner.sistema_contabilidad || '');
      const actividadEcon = str(inner.actividades_economicas || inner.actividad_economica || '');
      const compPago = str(inner.comprobantes_pago || '');
      const emisionElec = str(inner.sistema_emision_electronica || '');
      const emisorElecDesde = str(inner.emisor_electronico_desde || '');
      const compElectronicos = str(inner.comprobantes_electronicos || '');
      const pleDesde = str(inner.afiliado_ple_desde || '');
      const padrones = str(inner.padrones || '');

      if (tieneRuc) {
        // El color comunica si existe inscripción RUC; la condición tributaria
        // se conserva como dato y no cambia el estado de registro.
        badgeHtml = badgePill('success', `CON REGISTRO RUC${estado ? ` · ${estado}` : ''}`);
        tableRows = `
          <div class="overflow-x-auto w-full">
            <table class="w-full text-left border-collapse">
              <tbody>
                ${fila('Número de RUC', rucNum)}
                ${fila('Tipo Contribuyente', tipoContribuyente)}
                ${fila('Tipo de Documento', tipoDocumento)}
                ${fila('Nombre Comercial', nombreComercial)}
                ${fila('Fecha de Inscripción', fechaInscripcion)}
                ${fila('Fecha de Inicio de Actividades', fechaInicio)}
                ${fila('Estado del Contribuyente', estado)}
                ${fila('Condición del Contribuyente', condicion)}
                ${fila('Domicilio Fiscal', domicilio)}
                ${fila('Sistema Emisión de Comprobante', emisionComp)}
                ${fila('Actividad Comercio Exterior', comExterior)}
                ${fila('Sistema Contabilidad', contabilidad)}
                ${fila('Actividad(es) Económica(s)', actividadEcon)}
                ${fila('Comprobantes de Pago c/aut. (F. 806/816)', compPago)}
                ${fila('Sistema de Emisión Electrónica', emisionElec)}
                ${fila('Emisor electrónico desde', emisorElecDesde)}
                ${fila('Comprobantes Electrónicos', compElectronicos)}
                ${fila('Afiliado al PLE desde', pleDesde)}
                ${fila('Padrones', padrones)}
              </tbody>
            </table>
          </div>
        `;
      } else {
        const dniConsultado = str(inner.dni || (document.getElementById('dni-input') as HTMLInputElement)?.value || 'consultado');
        const notFoundMsg = str(inner.mensaje || `El Sistema RUC NO REGISTRA un número de RUC para el DNI número ${dniConsultado} consultado.`);
        badgeHtml = badgePill('danger', 'SIN REGISTRO RUC');
        tableRows = `
          <div class="p-4 text-center text-slate-700 bg-rose-50/40 rounded-xl border border-rose-200/80 font-poppins">
            <i class="fas fa-circle-xmark text-rose-500 text-lg mb-1 block"></i>
            <p class="text-xs font-bold text-slate-900">${escapeHtml(notFoundMsg)}</p>
            <p class="text-[10px] text-slate-500 mt-1">El ciudadano no cuenta con obligaciones tributarias comerciales inscritas en SUNAT.</p>
          </div>
        `;
      }
      break;
    }

    case 'jne_multas': {
      const multas = arr(inner.multas);
      const tieneMultas = inner.tiene_multas === true || multas.length > 0;
      const montoRaw = inner.total_deuda ?? inner.total_multas_pe;
      const montoNumero = typeof montoRaw === 'number' ? montoRaw : Number(String(montoRaw ?? '').replace(',', '.'));
      const totalDeuda = Number.isFinite(montoNumero) && montoNumero > 0 ? montoNumero.toFixed(2) : (multas.length > 0 ? multas.reduce((acc: number, m: any) => acc + (Number(m.deuda) || 0), 0).toFixed(2) : '0.00');
      const montoConfirmado = inner.monto_confirmado === true || (multas.length > 0 && providerStatus === 'OK');
      const resultadoConfirmado = inner.resultado_confirmado === true && providerStatus === 'OK';

      if (tieneMultas && multas.length > 0) {
        badgeHtml = badgePill('danger', `CON MULTAS (S/ ${totalDeuda})`);

        tableRows = `
          <div class="space-y-3 font-poppins">
            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div class="bg-slate-900 text-white px-3.5 py-2 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <i class="fas fa-vote-yea text-amber-400 text-xs"></i>
                  <span class="text-[11px] font-black uppercase tracking-wider">Detalle de Multas Electorales Pendientes</span>
                </div>
                <span class="text-[9px] font-bold px-2 py-0.5 rounded bg-rose-500 text-white uppercase tracking-wider">${multas.length} Multa(s)</span>
              </div>
              <div class="overflow-x-auto w-full -mx-0">
                <table class="w-full min-w-[480px] text-left text-xs bg-white">
                  <thead class="bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th class="p-2.5">CÓDIGO</th>
                      <th class="p-2.5">PROCESO ELECTORAL</th>
                      <th class="p-2.5">TIPO OMISIÓN</th>
                      <th class="p-2.5 text-right">DEUDA (S/.)</th>
                      <th class="p-2.5 text-center">ETAPA DE COBRANZA</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    ${multas.map((m: any) => {
                      const cod = str(m.codigo || m.nro_multa || '—');
                      const proc = str(m.proceso_electoral || 'ELECCIONES GENERALES');
                      const tipo = str(m.tipo_omision || 'SUFRAGIO').toUpperCase();
                      const deudaVal = Number(m.deuda ?? 0).toFixed(2);
                      const etapa = str(m.etapa_cobranza || '-------');

                      return `
                        <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 font-poppins">
                          <td class="p-2.5 align-middle">
                            <span class="font-mono font-black text-slate-800 text-[11px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">${escapeHtml(cod)}</span>
                          </td>
                          <td class="p-2.5 align-middle">
                            <p class="font-extrabold text-slate-900 text-xs uppercase leading-snug break-words">${escapeHtml(proc)}</p>
                          </td>
                          <td class="p-2.5 align-middle">
                            <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold ${tipo.includes('MESA') ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-rose-100 text-rose-800 border border-rose-200'}">${escapeHtml(tipo)}</span>
                          </td>
                          <td class="p-2.5 align-middle text-right font-mono font-bold text-rose-700 text-xs whitespace-nowrap">
                            S/ ${escapeHtml(deudaVal)}
                          </td>
                          <td class="p-2.5 align-middle text-center text-slate-500 font-mono text-xs">
                            ${escapeHtml(etapa)}
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Tarjeta de suma total después de la tabla -->
            <div class="p-3.5 bg-gradient-to-r from-rose-50 via-rose-50/50 to-amber-50 rounded-xl border border-rose-200 flex items-center justify-between shadow-2xs">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center text-base shadow-xs shrink-0">
                  <i class="fas fa-coins"></i>
                </div>
                <div>
                  <span class="text-[9px] font-black uppercase tracking-wider text-rose-800 block">TOTAL DEUDA ELECTORAL ACUMULADA</span>
                  <span class="text-xs font-bold text-slate-700">JNE Multas Pendientes de Pago</span>
                </div>
              </div>
              <div class="text-right">
                <span class="text-lg sm:text-xl font-black text-rose-700 font-mono tracking-tight">S/ ${totalDeuda}</span>
              </div>
            </div>
          </div>
        `;
      } else if (!tieneMultas && resultadoConfirmado && montoConfirmado) {
        badgeHtml = badgePill('success', 'SIN MULTAS');
        tableRows = `
          <div class="p-4 sm:p-5 text-center text-slate-700 bg-emerald-50/50 rounded-xl border border-emerald-200 font-poppins">
            <i class="fas fa-circle-check text-emerald-600 text-xl mb-1.5 block"></i>
            <p class="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">Sin Multas Electorales Pendientes</p>
            <p class="text-[11px] text-slate-600 mt-1 max-w-md mx-auto">No registra multas electorales pendientes ante el Jurado Nacional de Elecciones (JNE). El ciudadano se encuentra al día con sus deberes cívicos electorales.</p>
          </div>
        `;
      } else {
        badgeHtml = badgePill('neutral', 'RESULTADO SIN CONFIRMAR');
        tableRows = `
          <div class="p-4 text-center text-slate-600 bg-slate-50 rounded-xl border border-slate-200">
            <i class="fas fa-circle-info text-slate-400 text-lg mb-1 block"></i>
            <p class="text-xs font-bold text-slate-900">El JNE no devolvió una confirmación verificable sobre las multas.</p>
            <p class="text-[10px] text-slate-500 mt-0.5">No se muestra “sin multas” cuando el resultado o el monto no están confirmados.</p>
          </div>
        `;
      }
      break;
    }

    case 'transporte_licencias': {
      const rawList = arr(inner.licencias || inner.registros);
      const list = rawList.length > 0
        ? rawList
        : (str(inner.numero_licencia || inner.licencia).length > 0
            ? [{
                numero: inner.numero_licencia || inner.licencia,
                categoria: inner.categoria || inner.clase_categoria || 'A-I',
                estado: inner.estado || 'VIGENTE',
                fecha_vencimiento: inner.fecha_vencimiento || inner.vigencia_hasta || '—',
                fecha_expedicion: inner.fecha_expedicion || '—',
                restricciones: inner.restricciones || 'SIN RESTRICCIONES',
                centro_emision: inner.centro_emision || '—',
                tipo_licencia: inner.tipo_licencia || 'Física',
              }]
            : []);

      const tieneLic = inner.tiene_licencia !== false && inner.posee_licencia !== false && list.length > 0;
      const conductor = str(inner.conductor || inner.nombres || '');

      if (tieneLic) {
        if (list.length > 1) {
          badgeHtml = badgePill('success', `${list.length} LICENCIAS (${list.map((l: any) => str(l.categoria || l.clase_categoria || '')).filter(Boolean).join(', ')})`);
        } else {
          const l0: any = list[0];
          const cat = str(l0.categoria || l0.clase_categoria || 'A-I');
          const est = str(l0.estado || 'VIGENTE').toUpperCase();
          const isVig = est.includes('VIGENTE');
          badgeHtml = isVig ? badgePill('success', `VIGENTE (${cat})`) : badgePill('danger', est);
        }

        let cardsHtml = '';
        if (conductor) {
          cardsHtml += `
            <div class="mb-3 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-poppins">
              <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Conductor</span>
              <span class="font-bold text-slate-900">${escapeHtml(conductor)}</span>
            </div>
          `;
        }

        list.forEach((lic: any, idx: number) => {
          const num = str(lic.numero || lic.numero_licencia || '—');
          const cat = str(lic.categoria || lic.clase_categoria || '—');
          const est = str(lic.estado || 'VIGENTE').toUpperCase();
          const isVig = est.includes('VIGENTE');
          const fecExp = str(lic.fecha_expedicion || '—');
          const fecVen = str(lic.fecha_vencimiento || lic.vigencia_hasta || '—');
          const tipoLic = str(lic.tipo_licencia || 'Física');
          const restr = str(lic.restricciones || 'SIN RESTRICCIONES');
          const centro = str(lic.centro_emision || '—');

          const pill = isVig
            ? `<span class="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded border border-emerald-200">VIGENTE</span>`
            : `<span class="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 rounded border border-rose-200">${escapeHtml(est)}</span>`;

          cardsHtml += `
            <div class="rounded-xl border border-slate-200 overflow-hidden ${idx > 0 ? 'mt-3' : ''} bg-white shadow-sm font-poppins">
              <div class="bg-slate-100/80 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                <span class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <i class="fas fa-id-card text-sky-600"></i> Licencia: ${escapeHtml(cat)}
                </span>
                ${pill}
              </div>
              <div class="overflow-x-auto w-full">
                <table class="w-full text-left border-collapse">
                  <tbody>
                    ${fila('Clase y Categoría', cat)}
                    ${fila('Número de Licencia', num)}
                    ${fila('Tipo de Licencia', tipoLic)}
                    ${fila('Fecha de Expedición', fecExp)}
                    ${fila('Vigente Hasta', fecVen)}
                    ${fila('Centro de Emisión', centro)}
                    ${fila('Restricciones', restr)}
                    ${fila('Estado', est)}
                  </tbody>
                </table>
              </div>
            </div>
          `;
        });

        if (inner.grupo_sanguineo || inner.donacion_organos) {
          cardsHtml += `
            <div class="mt-3 grid grid-cols-2 gap-2 text-xs font-poppins">
              ${inner.grupo_sanguineo ? `<div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200"><span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Grupo Sanguíneo</span><span class="font-bold text-slate-900">${escapeHtml(String(inner.grupo_sanguineo))}</span></div>` : ''}
              ${inner.donacion_organos ? `<div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200"><span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Donación Órganos</span><span class="font-bold text-slate-900">${escapeHtml(String(inner.donacion_organos))}</span></div>` : ''}
            </div>
          `;
        }

        tableRows = cardsHtml;
      } else {
        badgeHtml = badgePill('danger', 'SIN LICENCIA');
        tableRows = `
          <div class="p-4 text-center text-slate-600 bg-rose-50/40 rounded-xl border border-rose-100 font-poppins">
            <i class="fas fa-circle-xmark text-rose-500 text-lg mb-1 block"></i>
            <p class="text-xs font-bold text-slate-900">No registra Licencia de Conducir en el Sistema Nacional de Conductores (MTC).</p>
            <p class="text-[10px] text-slate-500 mt-0.5">El ciudadano no cuenta con autorización activa para conducir vehículos motorizados.</p>
          </div>
        `;
      }
      break;
    }

    case 'transporte_record': {
      const tieneLic = inner.tiene_licencia === true || inner.posee_licencia === true;
      const sinLicenciaConfirmada = (inner.tiene_licencia === false && inner.posee_licencia === false) || str(inner.estado).toUpperCase() === 'SIN_LICENCIA';
      const puntos = Number(inner.puntos_firmes ?? 0);
      const puntosConfirmados = inner.puntos_firmes !== undefined && inner.puntos_firmes !== null && Number.isFinite(puntos);
      const estado = str(inner.estado || (tieneLic ? 'HABILITADO' : 'SIN LICENCIA')).toUpperCase();
      const sanciones = arr(inner.sanciones);
      const sancionesCount = Array.isArray(inner.sanciones)
        ? sanciones.length
        : (inner.sanciones == null || inner.sanciones === '' ? 0 : Number(inner.sanciones));
      const sancionesCountKnown = Number.isFinite(sancionesCount);
      const resultadoConfirmado = inner.consulta_confirmada === true && providerStatus === 'OK';

      if (!resultadoConfirmado || (!tieneLic && !sinLicenciaConfirmada) || (tieneLic && !puntosConfirmados)) {
        badgeHtml = badgePill('neutral', 'RESULTADO SIN CONFIRMAR');
        tableRows = `
          <div class="p-4 sm:p-5 text-center text-slate-700 bg-slate-50 rounded-xl border border-slate-200 font-poppins">
            <i class="fas fa-circle-info text-slate-500 text-xl mb-1.5 block"></i>
            <p class="text-xs sm:text-sm font-black text-slate-900">El MTC no confirmó un resultado completo.</p>
            <p class="text-[11px] text-slate-600 mt-1">No se infiere que tenga o no tenga licencia, sanciones o puntos.</p>
          </div>
        `;
      } else if (!tieneLic) {
        badgeHtml = badgePill('danger', 'SIN LICENCIA');
        tableRows = `
          <div class="p-4 sm:p-5 text-center text-slate-700 bg-rose-50/50 rounded-xl border border-rose-200 font-poppins">
            <i class="fas fa-circle-xmark text-rose-600 text-xl mb-1.5 block"></i>
            <p class="text-xs sm:text-sm font-black text-slate-900">El MTC confirmó que no registra licencia.</p>
            <p class="text-[11px] text-slate-600 mt-1">Este resultado no se interpreta como una verificación de papeletas.</p>
          </div>
        `;
      } else if (puntos === 0 && sancionesCountKnown && sancionesCount === 0) {
        badgeHtml = badgePill('success', 'SIN RÉCORD NEGATIVO');
        tableRows = `
          <div class="p-4 sm:p-5 text-center text-slate-700 bg-emerald-50/50 rounded-xl border border-emerald-200 font-poppins">
            <i class="fas fa-circle-check text-emerald-600 text-xl mb-1.5 block"></i>
            <p class="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">Sin sanciones ni puntos firmes reportados</p>
            <p class="text-[11px] text-slate-600 mt-1 max-w-md mx-auto">Resultado confirmado por el Sistema de Récord de Conductor del MTC.</p>
          </div>
        `;
      } else {
        badgeHtml = badgePill('warning', `${puntos} PUNTOS · ${sancionesCountKnown ? sancionesCount : 'SIN DETALLE'} SANCIONES`);
        tableRows = `
          <div class="overflow-x-auto w-full font-poppins">
            <table class="w-full min-w-[320px] text-left border-collapse">
              <tbody>
                ${fila('Puntos Firmes Acumulados', `${puntos} puntos`)}
                ${fila('Estado del Conductor', estado)}
                ${fila('Número de Licencia', str(inner.numero_licencia || '—'))}
                ${fila('Récord Correlativo', str(inner.num_record || '—'))}
                ${fila('Sanciones Firmes', sancionesCountKnown ? String(sancionesCount) : 'No informado')}
                ${fila('Puntos en Proceso', str(inner.puntos_proceso || '0'))}
              </tbody>
            </table>
          </div>
        `;
      }
      break;
    }

    case 'transporte_papeletas': {
      const infracciones = arr(inner.infracciones || inner.papeletas || inner.papeletas_pendientes);
      const tieneInfracciones = inner.tiene_infracciones === true || inner.tiene_papeletas === true || infracciones.length > 0;
      const resultadoConfirmado = inner.resultado_confirmado === true && providerStatus === 'OK';
      const estado = str(inner.estado || (tieneInfracciones ? 'CON SANCIONES' : 'SIN SANCIONES')).toUpperCase();
      const entidad = str(inner.entidad || 'MTC / SUTRAN');

      if (!tieneInfracciones && infracciones.length === 0 && resultadoConfirmado) {
        badgeHtml = badgePill('success', 'SIN SANCIONES');
        tableRows = `
          <div class="p-4 text-center text-slate-600 bg-emerald-50/40 rounded-xl border border-emerald-100">
            <i class="fas fa-circle-check text-emerald-600 text-lg mb-1 block"></i>
            <p class="text-xs font-bold text-slate-900">No registra infracciones ni papeletas pendientes por DNI.</p>
            <p class="text-[10px] text-slate-500 mt-0.5">Portal oficial SCPPP (MTC · SUTRAN · ATU) libre de sanciones firmes.</p>
          </div>
        `;
      } else if (tieneInfracciones && resultadoConfirmado) {
        const total = infracciones.length || Number(inner.total_papeletas ?? inner.total ?? 1);
        badgeHtml = badgePill('danger', `CON SANCIONES (${total})`);
        tableRows = `
          <div class="overflow-x-auto w-full">
            <table class="w-full text-left border-collapse">
              <tbody>
                ${fila('Estado Oficial', estado)}
                ${fila('Total de Infracciones', total)}
                ${fila('Monto Pendiente', str(inner.monto_pendiente || inner.monto_total || ''))}
                ${fila('Entidad Fiscalizadora', entidad)}
              </tbody>
            </table>
          </div>
          ${infracciones.length > 0 ? `
            <div class="mt-3 space-y-2">
              ${infracciones.map((inf: any) => {
                const num = isDict(inf) ? str(inf.numero || inf.codigo || inf.infraccion || 'Infracción') : str(inf);
                const fecha = isDict(inf) ? str(inf.fecha || '') : '';
                const ent = isDict(inf) ? str(inf.entidad || entidad) : entidad;
                return `
                  <div class="p-2.5 bg-rose-50/60 border border-rose-200/80 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <strong class="text-rose-900 font-bold">${escapeHtml(num)}</strong>
                      ${fecha ? `<span class="text-slate-500 text-[10px] ml-2 font-medium">Fecha: ${escapeHtml(fecha)}</span>` : ''}
                    </div>
                    <span class="text-[10px] font-bold text-slate-600 uppercase">${escapeHtml(ent)}</span>
                  </div>
                `;
              }).join('')}
            </div>
          ` : ''}
          `;
      }
      else {
        badgeHtml = badgePill('dark', 'NO VERIFICADO · REINTENTAR');
        tableRows = `
          <div class="p-4 text-center text-slate-700 bg-rose-50/60 rounded-xl border border-rose-200">
            <i class="fas fa-triangle-exclamation text-rose-500 text-lg mb-1 block"></i>
            <p class="text-xs font-bold text-slate-900">La fuente no devolvió infracciones verificables.</p>
            <p class="text-[10px] text-slate-500 mt-0.5">No se afirma que existan ni que no existan sanciones.</p>
            <button data-dni-retry="transporte_papeletas" class="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold bg-black text-white uppercase tracking-wider font-poppins hover:bg-slate-800 transition-colors">
              <i class="fas fa-arrows-rotate text-[10px]"></i> Reintentar solo esta sección
            </button>
          </div>
        `;
      }
      break;
    }

    case 'minedu': {
      const nested = isDict(inner.data) ? (inner.data as Dict) : {};
      const rawRecords = inner.titulos || inner.registros || inner.resultados || nested.titulos || nested.registros || nested.resultados;
      const tecs = arr(inner.tecnologicos || nested.tecnologicos);
      const peds = arr(inner.pedagogicos || nested.pedagogicos);
      const unis = arr(inner.universitarios || nested.universitarios);

      let allDegrees: any[] = [];
      if (arr(rawRecords).length > 0) {
        allDegrees = arr(rawRecords);
      } else {
        allDegrees = [...peds, ...unis, ...tecs];
      }

      const tieneTitulos = inner.posee_titulos === true || allDegrees.length > 0 || str(inner.grado || inner.titulo).length > 0;

      if (tieneTitulos && allDegrees.length > 0) {
        const total = allDegrees.length;
        badgeHtml = badgePill('success', `CON TÍTULO (${total})`);

        const renderItem = (item: any) => {
          const it = isDict(item) ? item : {};
          const nom = str(it.apellidos_nombres || inner.nombres || 'Registrado');
          const dniVal = str(it.dni || inner.dni || '');
          const grado = str(it.grado_titulo || it.grado || it.titulo || 'Profesional Técnico');
          const tipo = str(it.tipo || 'Tecnológico');
          const nivel = str(it.nivel || (tipo === 'Pedagógico' ? 'SUPERIOR PEDAGÓGICO' : (tipo === 'Universitario' ? 'SUPERIOR UNIVERSITARIO (SUNEDU)' : 'SUPERIOR TECNOLÓGICO')));
          const fecha = str(it.fecha_emision || it.fecha || '');
          const cod = str(it.codigo_minedu || it.codigo || '');
          const inst = str(it.institucion_educativa || it.institucion || 'MINEDU');
          const reg = str(it.region || it.pais_region || '');

          let badgeTipo = 'bg-blue-600';
          if (tipo === 'Pedagógico' || nivel.includes('PEDAGÓGICO')) {
            badgeTipo = 'bg-emerald-600';
          } else if (tipo === 'Universitario' || nivel.includes('UNIVERSITARIO') || nivel.includes('SUNEDU')) {
            badgeTipo = 'bg-indigo-600';
          }

          return `
            <tr class="hover:bg-slate-50 transition-colors font-poppins border-b border-slate-100 last:border-0">
              <td class="p-3 align-top w-1/3">
                <p class="font-black text-slate-900 leading-tight text-xs uppercase">${escapeHtml(nom)}</p>
                ${dniVal ? `<p class="text-[11px] font-bold text-amber-700 mt-1">DNI: ${escapeHtml(dniVal)}</p>` : ''}
              </td>
              <td class="p-3 align-top w-1/3">
                <div class="mb-1">
                  <span class="inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase text-white tracking-wider ${badgeTipo}">${escapeHtml(tipo)}</span>
                </div>
                <p class="font-extrabold text-blue-900 leading-tight text-xs uppercase">${escapeHtml(grado)}</p>
                <div class="mt-1.5 space-y-0.5 text-[10px] text-slate-500 font-medium">
                  <p><span class="font-bold text-slate-700">Nivel:</span> ${escapeHtml(nivel)}</p>
                  ${fecha ? `<p><span class="font-bold text-slate-700">Fecha diploma / emisión:</span> ${escapeHtml(fecha)}</p>` : ''}
                  ${cod ? `<p><span class="font-bold text-slate-700">Código MINEDU:</span> <span class="font-mono font-bold text-slate-800">${escapeHtml(cod)}</span></p>` : ''}
                </div>
              </td>
              <td class="p-3 align-top w-1/3">
                <p class="font-bold text-slate-900 leading-tight text-xs uppercase">${escapeHtml(inst)}</p>
                ${reg ? `<p class="text-[10px] font-bold text-slate-500 mt-1.5"><i class="fas fa-location-dot text-amber-600 mr-1"></i>País / Región: <span class="text-slate-700 font-bold">${escapeHtml(reg)}</span></p>` : ''}
              </td>
            </tr>
          `;
        };

        tableRows = `
          <div class="space-y-4 font-poppins">
            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div class="bg-slate-900 text-white px-3.5 py-2 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <i class="fas fa-graduation-cap text-amber-400 text-xs"></i>
                  <span class="text-[11px] font-black uppercase tracking-wider">Registro Nacional de Grados y Títulos</span>
                </div>
                <span class="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500 text-white uppercase tracking-wider">${allDegrees.length} Registrado(s)</span>
              </div>
              <div class="overflow-x-auto w-full">
                <table class="w-full min-w-[480px] text-left text-xs bg-white">
                  <thead class="bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th class="p-2.5">APELLIDOS Y NOMBRES</th>
                      <th class="p-2.5">GRADO O TÍTULO</th>
                      <th class="p-2.5">INSTITUCIÓN EDUCATIVA</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    ${allDegrees.map(renderItem).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;
      } else {
        badgeHtml = badgePill('danger', 'SIN REGISTRO');
        tableRows = `
          <div class="p-4 rounded-xl border border-rose-200 bg-rose-50 text-slate-700 text-xs font-poppins">
            <div class="flex items-center gap-2 text-rose-800 font-bold mb-1.5">
              <i class="fas fa-circle-xmark text-rose-500 text-sm"></i>
              <span>Resultado de la búsqueda de grados y títulos</span>
            </div>
            <div class="bg-white border border-slate-200 rounded-lg p-3 my-2 text-slate-600">
              <p class="font-bold text-slate-800 text-[11px]">Tecnológicos / Pedagógicos / Universitarios:</p>
              <p class="text-xs text-rose-600 font-semibold mt-0.5">No se encontraron resultados registrados para este documento.</p>
            </div>
            <div class="text-[10px] text-slate-500 mt-2 space-y-1">
              <p><strong class="text-slate-600">Fuente:</strong></p>
              <p>• Direcciones Regionales (DRE) o Gerencias Regionales de Educación (GRE): grados y títulos registrados antes del año 2016.</p>
              <p>• MINEDU: grados y títulos registrados a partir del año 2016.</p>
              <p>• SUNEDU: Registro Nacional de Grados y Títulos Universitarios.</p>
              <p>Si tiene alguna consulta escriba al correo: <a href="mailto:registrotitulos@minedu.gob.pe" class="text-blue-600 font-bold hover:underline">registrotitulos@minedu.gob.pe</a></p>
            </div>
          </div>
        `;
      }
      break;
    }

    case 'osce': {
      const esProveedor = inner.es_proveedor_estado === true;
      const inhabilitado = inner.inhabilitado === true;
      if (esProveedor) {
        badgeHtml = inhabilitado ? badgePill('danger', 'INHABILITADO') : badgePill('success', `${str(inner.condicion || 'ACTIVO')} · PROVEEDOR`);
        tableRows = `
          <div class="overflow-x-auto w-full">
            <table class="w-full text-left border-collapse font-poppins">
              <tbody>
                ${fila('Estado de Habilitación', inhabilitado ? 'INHABILITADO' : 'HABILITADO PARA CONTRATAR CON EL ESTADO')}
                ${fila('RUC del Proveedor', str(inner.ruc_consultado || '—'))}
                ${fila('Razón Social / Proveedor', str(inner.razon_social || '—'))}
                ${fila('Condición en OSCE / SEACE', str(inner.condicion || 'ACTIVO'))}
              </tbody>
            </table>
          </div>
        `;
      } else {
        badgeHtml = badgePill('success', 'SIN ANTECEDENTES PROVEEDOR');
        tableRows = `
          <div class="p-4 text-center text-slate-700 bg-emerald-50/40 rounded-xl border border-emerald-200/80 font-poppins">
            <i class="fas fa-circle-check text-emerald-600 text-lg mb-1 block"></i>
            <p class="text-xs font-bold text-slate-900">No registra antecedentes como proveedor adjudicado ni contrataciones en el Estado.</p>
            <p class="text-[10px] text-slate-500 mt-1">El DNI consultado no figura en el Registro Nacional de Proveedores (RNP) ni registra sanciones en SEACE / OSCE.</p>
          </div>
        `;
      }
      break;
    }

    case 'infogob': {
      const afiliado = inner.afiliado_actualmente === true;
      const orgActual = isDict(inner.organizacion_actual) ? inner.organizacion_actual : null;
      const orgName = str(orgActual?.organizacion || inner.organizacion_politica || '');
      const historial = arr(inner.historial);

      if (afiliado && orgName && !orgName.toLowerCase().includes('ningun')) {
        badgeHtml = badgePill('danger', 'PERTENECE A LA POLÍTICA');
      } else {
        badgeHtml = badgePill('success', 'NO PERTENECE A LA POLÍTICA');
      }

      let contentHtml = '';

      // 1. Tarjeta de afiliación actual
      if (afiliado && orgActual) {
        const cargosList = arr(orgActual.cargos);
        contentHtml += `
          <div class="mb-4 border-2 border-rose-300 bg-rose-50/40 rounded-xl overflow-hidden shadow-2xs font-poppins">
            <div class="bg-rose-950 text-white px-3.5 py-2.5 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i class="fas fa-flag text-rose-400 text-xs"></i>
                <span class="text-[11px] font-black uppercase tracking-wider">Afiliación Política Vigente</span>
              </div>
              <span class="text-[9px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white uppercase tracking-wider">Afiliado Válido</span>
            </div>
            <div class="p-3.5">
              <h4 class="text-xs sm:text-sm font-black text-rose-950 uppercase break-words">${escapeHtml(str(orgActual.organizacion))}</h4>
              <div class="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                <p><span class="font-bold text-slate-800">Estado Org.:</span> <span class="font-bold text-emerald-700">${escapeHtml(str(orgActual.estado_organizacion || 'INSCRITA'))}</span></p>
                <p><span class="font-bold text-slate-800">Tipo / Alcance:</span> ${escapeHtml(str(orgActual.tipo || 'Partido Político'))} · ${escapeHtml(str(orgActual.alcance || 'Nacional'))}</p>
                <p><span class="font-bold text-slate-800">Condición:</span> ${escapeHtml(str(orgActual.condicion || 'Afiliado Válido'))}</p>
                <p><span class="font-bold text-slate-800">Fecha / Periodo:</span> ${escapeHtml(str(orgActual.periodo || orgActual.fecha_inscripcion || '—'))}</p>
              </div>
              ${cargosList.length > 0 ? `
                <div class="mt-2.5 pt-2.5 border-t border-rose-200 text-xs">
                  <span class="font-bold text-rose-950 block text-[10px] uppercase tracking-wider">Cargos / Funciones Directivas:</span>
                  ${cargosList.map((c: any) => `<p class="text-[11px] text-slate-800 font-medium mt-0.5 break-words"><i class="fas fa-briefcase text-amber-600 mr-1.5"></i>${escapeHtml(String(c))}</p>`).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        `;
      } else {
        contentHtml += `
          <div class="mb-4 p-4 sm:p-5 text-center text-slate-700 bg-emerald-50/50 rounded-xl border border-emerald-200 font-poppins">
            <i class="fas fa-circle-check text-emerald-600 text-xl mb-1.5 block"></i>
            <p class="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">No Pertenece a la Política</p>
            <p class="text-[11px] text-slate-600 mt-1 max-w-md mx-auto">El ciudadano figura como independiente y no registra militancia ni afiliación activa a ningún partido político en el Registro de Organizaciones Políticas (ROP · JNE).</p>
          </div>
        `;
      }

      // 2. Tabla historial responsiva
      if (historial.length > 0) {
        contentHtml += `
          <div class="border border-slate-200 rounded-xl overflow-hidden shadow-xs font-poppins">
            <div class="bg-slate-800 text-white px-3.5 py-2 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i class="fas fa-clock-rotate-left text-amber-400 text-xs"></i>
                <span class="text-[11px] font-black uppercase tracking-wider">Historial de Afiliaciones y Renuncias</span>
              </div>
              <span class="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-200 uppercase tracking-wider">${historial.length} Registro(s)</span>
            </div>
            <div class="overflow-x-auto w-full">
              <table class="w-full min-w-[500px] text-left text-xs bg-white">
                <thead class="bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th class="p-2.5">ORGANIZACIÓN POLÍTICA</th>
                    <th class="p-2.5">TIPO / ALCANCE</th>
                    <th class="p-2.5">CONDICIÓN</th>
                    <th class="p-2.5">PERIODO</th>
                    <th class="p-2.5">CARGOS / OBSERVACIONES</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${historial.map((item: any) => {
                    const org = str(item.organizacion || '—');
                    const tipo = str(item.tipo || 'Partido Político');
                    const alcance = str(item.alcance || 'Nacional');
                    const estOrg = str(item.estado_organizacion || '');
                    const cond = str(item.condicion || (item.afiliado_actualmente ? 'Afiliado Válido' : 'Cancelada'));
                    const per = str(item.periodo || '—');
                    const obs = str(item.observaciones || '');
                    const cgs = arr(item.cargos).join(', ');

                    let condBadge = 'bg-slate-100 text-slate-700 border-slate-200';
                    if (cond.toLowerCase().includes('válido') || cond.toLowerCase().includes('valido')) {
                      condBadge = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                    } else if (cond.toLowerCase().includes('renuncia')) {
                      condBadge = 'bg-amber-100 text-amber-800 border-amber-200';
                    } else if (cond.toLowerCase().includes('cancelada')) {
                      condBadge = 'bg-rose-100 text-rose-800 border-rose-200';
                    }

                    return `
                      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 font-poppins">
                        <td class="p-2.5 align-top">
                          <p class="font-black text-slate-900 text-xs uppercase leading-tight break-words">${escapeHtml(org)}</p>
                          ${estOrg ? `<span class="inline-block mt-1 text-[9px] font-bold text-slate-500 uppercase">${escapeHtml(estOrg)}</span>` : ''}
                        </td>
                        <td class="p-2.5 align-top">
                          <p class="font-bold text-slate-800 text-[11px]">${escapeHtml(tipo)}</p>
                          <p class="text-[10px] text-slate-500">${escapeHtml(alcance)}</p>
                        </td>
                        <td class="p-2.5 align-top">
                          <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${condBadge}">${escapeHtml(cond)}</span>
                        </td>
                        <td class="p-2.5 align-top font-mono text-[11px] text-slate-700 whitespace-nowrap">
                          ${escapeHtml(per)}
                        </td>
                        <td class="p-2.5 align-top text-[10px] text-slate-600 max-w-xs break-words">
                          ${cgs ? `<p class="font-bold text-slate-800 mb-0.5"><i class="fas fa-user-tag text-amber-600 mr-1"></i>${escapeHtml(cgs)}</p>` : ''}
                          ${obs ? `<p class="text-slate-500 italic">${escapeHtml(obs)}</p>` : (cgs ? '' : '<span class="text-slate-400">—</span>')}
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }

      tableRows = contentHtml;
      break;
    }

    case 'webmii': {
      const nested = isDict(inner.data) ? (inner.data as Dict) : {};
      const rawLinks = inner.enlaces_detectados || inner.enlaces || inner.resultados || inner.links || nested.enlaces_detectados || nested.enlaces || nested.resultados || nested.links;
      const links = arr(rawLinks).map((item: any) => {
        if (typeof item === 'string') return { url: item, titulo: item };
        if (!isDict(item)) return {};
        return {
          ...item,
          url: item.url || item.link || item.href || item.uri,
          titulo: item.titulo || item.título || item.title || item.nombre || item.text || item.url || item.link,
          fuente: item.fuente || item.source || item.portal || 'WebMii OSINT',
        };
      }).filter((item: any) => typeof item.url === 'string' && /^https?:\/\//i.test(item.url));
      const queries = arr(inner.consultas_realizadas || nested.consultas_realizadas).filter(Boolean).map(String);
      const total = links.length;
      const consultaConfirmada = inner.consulta_confirmada === true || nested.consulta_confirmada === true;
      const rawScore = Number(inner.score ?? nested.score ?? 0);
      const scoreStr = rawScore > 0 ? `${rawScore.toFixed(1)} / 10` : consultaConfirmada ? 'Sin puntuación disponible' : 'Resultado no verificable';
      badgeHtml = total > 0
        ? badgePill('success', `MENCIONES (${total})`)
        : consultaConfirmada ? badgePill('neutral', 'SIN MENCIONES CONFIRMADAS') : badgePill('neutral', 'FUENTE SIN RESPUESTA');

      tableRows = `
        <div class="space-y-3.5 font-poppins">
          <div class="p-3 bg-gradient-to-r from-emerald-50/70 via-slate-50 to-white rounded-xl border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span class="text-[9px] font-extrabold uppercase tracking-wider text-emerald-800 block">Puntuación de Presencia Digital (OSINT)</span>
              <p class="text-sm font-black text-slate-900">${escapeHtml(scoreStr)}${consultaConfirmada ? ` · <span class="text-xs font-bold text-emerald-700">${total} menciones indexadas</span>` : ''}</p>
            </div>
            <a href="https://webmii.com/" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black transition shadow-xs shrink-0 self-start sm:self-auto">
              <i class="fas fa-globe text-xs"></i> Portal WebMii
            </a>
          </div>

          <p class="text-xs font-bold text-slate-700">Presencia y menciones en fuentes públicas abiertas indexadas:</p>
          ${total > 0 ? `
            <div class="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
              <table class="w-full text-left text-xs bg-white">
                <thead class="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                  <tr>
                    <th class="p-2.5 w-1/4">Fuente / Portal</th>
                    <th class="p-2.5 w-1/2">Título de la Mención</th>
                    <th class="p-2.5 w-1/4 text-center">Acceso</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${links.map((l: any) => {
                    const u = isDict(l) ? str(l.url) : str(l);
                    let safeUrl = '';
                    try {
                      const parsed = new URL(u);
                      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') safeUrl = parsed.href;
                    } catch { /* Invalid provider links are shown as text, never navigated. */ }
                    const t = isDict(l) ? str(l.titulo) || u : u;
                    const snippet = isDict(l) ? str(l.descripcion || l.snippet || l.resumen) : '';
                    const source = isDict(l) ? str(l.fuente) || 'WebMii OSINT' : 'WebMii OSINT';
                    let domain = '';
                    try { domain = new URL(u).hostname.replace('www.', ''); } catch { domain = 'Web'; }
                    return `
                      <tr class="hover:bg-slate-50 transition-colors">
                        <td class="p-2.5 font-bold text-slate-800">
                          <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase">${escapeHtml(domain)}</span>
                          <span class="block mt-1 text-[9px] font-semibold normal-case text-slate-400">${escapeHtml(source)}</span>
                        </td>
                        <td class="p-2.5 font-medium text-slate-700 leading-snug">
                          <span>${escapeHtml(t)}</span>
                          ${snippet ? `<span class="block mt-1 text-[11px] font-normal text-slate-500 leading-relaxed">${escapeHtml(snippet)}</span>` : ''}
                        </td>
                        <td class="p-2.5 text-center">
                          ${safeUrl ? `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-bold transition shadow-xs"><i class="fas fa-arrow-up-right-from-square text-[8px] text-emerald-600"></i> Ver enlace</a>` : '<span class="text-slate-400">Enlace no válido</span>'}
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          ` : consultaConfirmada ? `
            <div class="p-4 rounded-xl border border-amber-200 bg-amber-50/60 text-slate-600 text-xs">
              <p class="font-bold text-slate-800"><i class="fas fa-circle-info text-amber-600 mr-1.5"></i>No se confirmaron enlaces públicos en esta consulta.</p>
              <p class="text-[11px] text-slate-500 mt-1">Este resultado no descarta presencia digital fuera de los índices consultados.</p>
            </div>
          ` : `
            <div class="p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-xs">
              <p class="font-bold text-slate-800"><i class="fas fa-circle-info text-slate-400 mr-1.5"></i>No fue posible obtener una respuesta verificable de WebMii ni del índice de respaldo.</p>
              <p class="text-[11px] text-slate-500 mt-1">No se informa “0 menciones” cuando las fuentes no respondieron.</p>
            </div>
          `}
          ${queries.length > 0 ? `<p class="text-[10px] text-slate-400 mt-2">Consultas realizadas: ${queries.map(escapeHtml).join(' · ')}</p>` : ''}
        </div>
      `;
      break;
    }
  }

  // Inyectar en Badge y Cuerpo con Footer Oficial Cañita
  if (badgeContainer) badgeContainer.innerHTML = badgeHtml;
  if (skeletonEl) skeletonEl.classList.add('hidden');
  cardContainer.setAttribute('data-status', 'funciona');
  const sourceUrl = DNI_SOURCE_URLS[name] || '';
  const verifyLink = sourceUrl 
    ? ` <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-bold ml-1.5 normal-case hover:underline"><i class="fas fa-arrow-up-right-from-square text-[8px]"></i> Verificar fuente</a>`
    : '';


  const sourceLabels: Record<string, string> = {
    identidad: 'buscardniperu.com',
    sunat: 'SUNAT',
    jne_multas: 'JNE',
    transporte_licencias: 'MTC',
    transporte_record: 'MTC',
    transporte_papeletas: 'MTC – CONSULTA DE PAPELETAS / SANCIONES',
    minedu: 'MINEDU / SUNEDU',
    osce: 'OECE / SEACE - Contrataciones Públicas',
    infogob: 'INFOGOB / JNE',
    webmii: 'Fuentes Públicas Digitales'
  };
  const sourceName = sourceLabels[name] || 'Portal Oficial del Estado';
  // Velocidad de la sección: mismo número que el backend (elapsed_ms del
  // SSE; 0.0 = servido desde caché). Sin fugas: solo el tiempo.
  const elapsedRaw = Number((d as Dict).elapsed_ms ?? (inner as Dict).elapsed_ms);
  const speedChip = Number.isFinite(elapsedRaw) && elapsedRaw >= 0
    ? (elapsedRaw === 0 ? ' · ⚡caché' : ` · ⚡${(elapsedRaw / 1000).toFixed(1)}s`)
    : '';

  if (bodyContent) {
    bodyContent.classList.remove('hidden');
    bodyContent.innerHTML = `
      ${tableRows}
      <div class="canita-export-brand mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-800">
        <div class="flex items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-2.5">
            <img src="/assets/logocañitaoficial2026.png" alt="Cañita" class="h-8 w-auto max-w-[105px] rounded-md object-contain" />
            <div class="min-w-0">
              <p class="text-[9px] font-extrabold uppercase tracking-[.14em] text-slate-800">Consulta de personas Cañita</p>
              <p class="text-[8px] font-semibold text-slate-400">Información verificada en portales oficiales</p>
            </div>
          </div>
        </div>
      </div>
      <div class="card-source-footer mt-2.5 flex flex-col gap-2 border-t border-slate-200 pt-2.5 sm:flex-row sm:items-center sm:justify-between font-poppins">
        <div class="flex items-center justify-between gap-2 text-[9px] md:text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
          <span>Fuente: ${sourceName}${verifyLink}</span>
          <span>Consultado: ${new Date().toLocaleTimeString('es-PE')}${speedChip}</span>
        </div>
      </div>
    `;
  }

  // Mantener el acordeón bajo control del usuario. El stream actualiza varias
  // tarjetas conforme llegan sus fuentes; no debe abrirlas ni cerrarlas por sí
  // solo y desplazar la página mientras se consulta.
  const body = cardContainer.querySelector('.accordion-body') as HTMLElement | null;
  const header = cardContainer.querySelector('.accordion-header') as HTMLElement | null;
  const chevron = cardContainer.querySelector('.accordion-chevron') as HTMLElement | null;
  const isExpanded = Boolean(body && !body.classList.contains('hidden'));
  if (header) {
    header.classList.remove('bg-white', 'text-slate-900', 'border-b', 'border-slate-100', 'bg-gradient-to-r', 'from-[#1a3a6b]', 'to-[#0b1c36]', 'text-white', 'border-b-2', 'border-slate-900');
    header.classList.add(...(isExpanded
      ? ['bg-gradient-to-r', 'from-[#1a3a6b]', 'to-[#0b1c36]', 'text-white', 'border-b-2', 'border-slate-900']
      : ['bg-white', 'text-slate-900']));
    const title = header.querySelector('h3');
    if (title) {
      title.classList.toggle('text-white', isExpanded);
      title.classList.toggle('text-slate-900', !isExpanded);
      title.classList.add('font-bold');
    }
    const sub = header.querySelector('p');
    if (sub) {
      sub.classList.toggle('text-white/60', isExpanded);
      sub.classList.toggle('text-slate-400', !isExpanded);
      sub.classList.add('font-semibold');
    }
  }
  if (chevron) {
    chevron.classList.toggle('rotate-180', isExpanded);
    chevron.classList.toggle('text-white', isExpanded);
    chevron.classList.toggle('text-slate-400', !isExpanded);
  }
}
