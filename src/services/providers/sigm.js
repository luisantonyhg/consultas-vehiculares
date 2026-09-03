import { renderSIGM } from '../../utils/renderers.js';
import { secureFetch } from '../transport.js';

function openDocumentModal(blob, filename) {
    const previous = document.getElementById('sigm-document-modal');
    previous?.remove();
    const objectUrl = URL.createObjectURL(blob);
    const modal = document.createElement('div');
    modal.id = 'sigm-document-modal';
    modal.className = 'fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm';
    modal.innerHTML = `<div class="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"><div class="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3"><div><p class="text-xs font-black text-slate-900">Documento oficial SIGM</p><p class="text-[10px] text-slate-500">${filename}</p></div><div class="flex gap-2"><a href="${objectUrl}" download="${filename}" class="rounded-lg bg-lime-600 px-3 py-2 text-[10px] font-black text-white"><i class="fas fa-download mr-1"></i>Descargar</a><button type="button" data-close-sigm class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700"><i class="fas fa-xmark"></i></button></div></div><iframe title="Documento SIGM" src="${objectUrl}" class="min-h-0 flex-1 bg-slate-100"></iframe></div>`;
    const close = () => { URL.revokeObjectURL(objectUrl); modal.remove(); };
    modal.querySelector('[data-close-sigm]')?.addEventListener('click', close);
    modal.addEventListener('click', (event) => { if (event.target === modal) close(); });
    document.body.appendChild(modal);
}

function bindDocumentButtons(BACKEND_URL) {
    document.querySelectorAll('.sigm-document-button:not([data-bound])').forEach((button) => {
        button.dataset.bound = 'true';
        button.addEventListener('click', async () => {
            const original = button.innerHTML;
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando documento…';
            try {
                const query = new URLSearchParams({
                    id_formulario: button.dataset.formId || '', codigo_acto: button.dataset.act || '',
                    tipo_modificacion: button.dataset.mod || '',
                });
                const url = `${BACKEND_URL}/sigm/documento/${button.dataset.folio}/${button.dataset.year}/${button.dataset.ticket}?${query}`;
                const response = await secureFetch(url);
                if (!response.ok) {
                    const detail = await response.json().catch(() => ({}));
                    throw new Error(detail.detail || `HTTP ${response.status}`);
                }
                openDocumentModal(await response.blob(), `SIGM_${button.dataset.folio}_${button.dataset.form}.pdf`);
            } catch (error) {
                button.innerHTML = '<i class="fas fa-triangle-exclamation"></i> No disponible; reintentar';
                button.title = error?.message || 'No se pudo cargar el documento';
                return;
            } finally {
                button.disabled = false;
            }
            button.innerHTML = original;
        });
    });
}

export async function runFetchSIGM(plate, BACKEND_URL, callbacks) {
    const title = 'Vehículo Prendado · Garantías Mobiliarias SUNARP';
    callbacks.setCardLoading('sigm', title, 'Consulta gratuita por bien', 'fas fa-file-shield', '', 'SIGM SUNARP');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 95000);
    try {
        const response = await secureFetch(`${BACKEND_URL}/sigm/${plate}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'SIGM no pudo completar la consulta');
        const hasData = Boolean(result.tiene_garantias && result.data?.length);
        const badge = hasData
            ? `<span class="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white"><i class="fas fa-triangle-exclamation"></i> ${result.total} GARANTÍA${result.total === 1 ? '' : 'S'}</span>`
            : `<span class="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white"><i class="fas fa-circle-check"></i> SIN GARANTÍAS</span>`;
        callbacks.setCardData('sigm', title, 'Consulta gratuita por bien', 'fas fa-file-shield', '', 'SIGM SUNARP', renderSIGM(result.data, plate), true, hasData, badge);
        setTimeout(() => bindDocumentButtons(BACKEND_URL), 0);
        return result;
    } catch (error) {
        clearTimeout(timeoutId);
        const message = error.name === 'AbortError' ? 'SIGM superó el tiempo máximo de 95s.' : (error.message || 'Error de conexión');
        callbacks.setCardError('sigm', title, 'Consulta gratuita por bien', 'fas fa-file-shield', '', 'SIGM SUNARP', message, plate);
        return { success: false, error: message };
    }
}
