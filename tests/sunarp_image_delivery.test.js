import test from 'node:test';
import assert from 'node:assert/strict';
import { runFetchSUNARP } from '../src/services/api.js';
import { renderSunarp } from '../src/utils/renderers/registrales.js';
import { initOfficialImageStates } from '../src/ui/official_image.js';

test('SUNARP requests its official image in the existing response', async () => {
    const previous = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = async (url, options) => {
        calls++;
        assert.equal(options.headers['X-Image-Transport'], 'inline');
        return { ok: true, status: 200, headers: new Headers(), json: async () => ({
            success: true, validation_status: 'found', datos: { Marca: 'PRUEBA' }, official_image_base64: 'fixture',
        }) };
    };
    try {
        await runFetchSUNARP('ABC123', 'https://example.test/api/v1', {
            setCardData(){}, setCardError(){assert.fail('unexpected provider error')}, processVehicleInfo(){},
        });
        assert.equal(calls, 1);
    } finally { globalThis.fetch = previous; }
});

function node() {
    const classes = new Set(['hidden']);
    return { textContent: '', classList: { toggle(c, on){ on ? classes.add(c) : classes.delete(c); }, remove(c){classes.delete(c);}, contains(c){return classes.has(c);} } };
}
function fixture(ok) {
    const status = node(), download = node(), caption = node(), fields = node();
    const wrapper = { state: '', querySelector(selector){ return selector.includes('status') ? status : selector.includes('download') ? download : caption; }, setAttribute(_, value){this.state=value;} };
    const image = { ...node(), dataset: {}, complete: true, naturalWidth: ok ? 500 : 0, closest(){return wrapper;}, addEventListener(){} };
    const container = { querySelectorAll(){return [image];}, querySelector(){return fields;} };
    return { status, download, caption, fields, wrapper, image, container };
}
test('a failed image stays hidden, disables its download and exposes existing data', () => {
    const f = fixture(false);
    initOfficialImageStates(f.container);
    assert.equal(f.image.classList.contains('hidden'), true);
    assert.equal(f.download.classList.contains('hidden'), true);
    assert.equal(f.fields.classList.contains('hidden'), false);
    assert.match(f.status.textContent, /no se pudo mostrar/);
});
test('a decoded image reveals its download and official caption', () => {
    const f = fixture(true);
    initOfficialImageStates(f.container);
    assert.equal(f.wrapper.state, 'loaded');
    assert.equal(f.image.classList.contains('hidden'), false);
    assert.equal(f.download.classList.contains('hidden'), false);
    assert.equal(f.status.classList.contains('hidden'), true);
});
test('SUNARP without an image still exposes data without inventing annotations', () => {
    const html = renderSunarp({ Marca: 'PRUEBA' }, 'ABC123');
    assert.match(html, /data-sunarp-fields class="rounded/);
    assert.match(html, /No informado/);
    assert.doesNotMatch(html, /NINGUNA/);
});
