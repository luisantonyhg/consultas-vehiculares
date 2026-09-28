import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(resolve(here, '../src/scripts/consulta/consulta-controller.ts'), 'utf8');
const overlays = readFileSync(resolve(here, '../src/components/consulta/ConsultationOverlays.astro'), 'utf8');

test('la admisión con alta demanda muestra un modal centrado antes de consultar fuentes', () => {
    assert.match(overlays, /id="consultation-queue-modal"/);
    assert.match(source, /function showConsultationQueueModal/);
    assert.match(source, /showConsultationQueueModal\(state\)/);
    assert.match(source, /function hideConsultationQueueModal/);
});

test('el modal comunica posición y espera estimada sin iniciar consultas pesadas', () => {
    assert.match(source, /consultation-queue-position/);
    assert.match(source, /consultation-queue-wait/);
    assert.match(overlays, /Tu turno está reservado/);
});
