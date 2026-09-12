import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/pages/consulta.astro', import.meta.url), 'utf8');

test('Heavy Phase normal conserva waitForHeavyPhase con ticket capturado', () => {
    assert.match(source, /const capturedGeneration = consultationGeneration/);
    assert.match(source, /const capturedTicket = activeConsultationTicket/);
    assert.match(source, /capturedTicket && consultationLifecycle === 'active' && capturedGeneration === consultationGeneration && capturedTicket === activeConsultationTicket/);
    assert.match(source, /waitForHeavyPhase\(BACKEND_URL, capturedTicket/);
});

test('Heavy Phase inválida registra skip y evita reserva', () => {
    assert.match(source, /\[HEAVY-PHASE-SKIP\] reason=\$\{reason\}/);
    assert.match(source, /consultationLifecycle !== 'active' \? consultationLifecycle/);
    assert.match(source, /capturedGeneration !== consultationGeneration \? 'generation_changed'/);
    assert.match(source, /capturedTicket !== activeConsultationTicket \? 'ticket_changed'/);
});

test('Heavy Phase skip retorna antes de Fase 2', () => {
    const skip = source.indexOf("console.warn(`[HEAVY-PHASE-SKIP]");
    const phase2 = source.indexOf("queryStatus.textContent = 'Fase 2: Consultando servicios avanzados...'", skip);
    assert.ok(skip >= 0 && phase2 > skip);
    const branch = source.slice(skip, phase2);
    assert.match(branch, /renderVehicleScore\(plate\);\s*return;/s);
});
