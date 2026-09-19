import { renderAtuInfracciones } from '../../utils/renderers/atu_infracciones.js';
import { secureFetch } from '../transport.js';

/**
 * Proveedor dedicado y aislado para la consulta oficial de papeletas y actas ATU.
 * NO altera ni comparte estado con la habilitación de taxi ('atu').
 */
export async function runFetchAtuInfracciones(plate, BACKEND_URL, callbacks) {
    const title = 'Papeletas e Infracciones ATU';
    const subtitle = 'Actas de fiscalización oficial · Lima y Callao';
    callbacks.setCardLoading('atu_infracciones', title, subtitle, 'fas fa-receipt', '', 'ATU');
    const controller = new AbortController();
    // ATU incluye CapSolver + sesión oficial + POST. El proveedor permanece
    // fuera de la ruta crítica, por lo que este margen no bloquea las demás
    // secciones y evita abortar antes que el backend.
    const timeoutId = setTimeout(() => controller.abort(), 85000);
    const startMs = performance.now();
    try {
        console.info(`[ATU-INFRACCIONES] Iniciando consulta oficial para placa ${plate}...`);
        const res = await secureFetch(`${BACKEND_URL}/atu-infracciones/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await res.json();
        const elapsed = Math.round(performance.now() - startMs);
        if (!res.ok) {
            const message = data?.error || data?.detail || `HTTP ${res.status}`;
            console.warn(`[ATU-INFRACCIONES] ⚠ Respuesta no disponible en ${elapsed}ms: ${message}`);
            callbacks.setCardError('atu_infracciones', title, subtitle, 'fas fa-receipt', '', 'ATU', message, plate);
            return data;
        }
        if (data.success) {
            const hasData = Array.isArray(data.data) && data.data.length > 0;
            console.info(`[ATU-INFRACCIONES] ✓ Consulta exitosa en ${elapsed}ms: ${data.data?.length || 0} actas encontradas. Total: S/ ${data.total_pagar || '0.00'}`);
            const content = renderAtuInfracciones(data.data, plate, data.total_pagar);
            callbacks.setCardData('atu_infracciones', title, subtitle, 'fas fa-receipt', '', 'ATU', content, true, hasData);
            return data;
        } else {
            console.warn(`[ATU-INFRACCIONES] ⚠ Falló consulta en ${elapsed}ms: ${data.error || 'Error desconocido'}`);
            callbacks.setCardError('atu_infracciones', title, subtitle, 'fas fa-receipt', '', 'ATU', data.error || 'No se pudo consultar papeletas ATU', plate);
            return data;
        }
    } catch (err) {
        clearTimeout(timeoutId);
        const elapsed = Math.round(performance.now() - startMs);
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado al consultar ATU (85s).' : (err.message || 'Error de conexión con ATU');
        console.error(`[ATU-INFRACCIONES] ✗ Error tras ${elapsed}ms: ${msg}`);
        callbacks.setCardError('atu_infracciones', title, subtitle, 'fas fa-receipt', '', 'ATU', msg, plate);
        return { success: false, error: msg };
    }
}
