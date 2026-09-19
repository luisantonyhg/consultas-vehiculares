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
    const timeoutId = setTimeout(() => controller.abort(), 45000);
    const startMs = performance.now();
    try {
        console.info(`[ATU-INFRACCIONES] Iniciando consulta oficial para placa ${plate}...`);
        const res = await secureFetch(`${BACKEND_URL}/atu-infracciones/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const elapsed = Math.round(performance.now() - startMs);
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
        const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado al consultar ATU (45s).' : (err.message || 'Error de conexión con ATU');
        console.error(`[ATU-INFRACCIONES] ✗ Error tras ${elapsed}ms: ${msg}`);
        callbacks.setCardError('atu_infracciones', title, subtitle, 'fas fa-receipt', '', 'ATU', msg, plate);
        return { success: false, error: msg };
    }
}
