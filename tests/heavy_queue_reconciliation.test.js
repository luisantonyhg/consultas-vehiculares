import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(resolve(here, '../src/services/consultation_queue.js'), 'utf8');

test('el polling de fase pesada solicita reconciliación atómica al backend', () => {
    assert.match(source, /\?reconcile_heavy=true/);
    assert.match(source, /while \(state\.heavy_status === 'queued'\)/);
});

test('el polling de admisión también reconcilia Redis antes de iniciar fan-out', () => {
    assert.match(source, /while \(state\.status === 'queued'\)[\s\S]*?\?reconcile_heavy=true/);
});
