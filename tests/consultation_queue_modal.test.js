import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(resolve(here, '../src/pages/consulta.astro'), 'utf8');

test('la admisión con alta demanda muestra un modal centrado antes de consultar fuentes', () => {
    assert.match(source, /id="consultation-queue-modal"/);
    assert.match(source, /function showConsultationQueueModal/);
    assert.match(source, /showConsultationQueueModal\(state\)/);
    assert.match(source, /function hideConsultationQueueModal/);
});

test('el modal comunica posición y espera estimada sin iniciar consultas pesadas', () => {
    assert.match(source, /consultation-queue-position/);
    assert.match(source, /consultation-queue-wait/);
    assert.match(source, /Tu turno está reservado/);
});
