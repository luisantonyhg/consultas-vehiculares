import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/pages/consulta.astro', import.meta.url), 'utf8');

test('un reintento nunca reutiliza un ticket completado o cancelado', () => {
  assert.match(
    source,
    /const needsFreshRetryTicket = !activeConsultationTicket \|\| consultationLifecycle !== 'active';/,
  );
  assert.match(source, /if \(needsFreshRetryTicket\) \{/);
  assert.match(source, /consultationLifecycle = 'active';/);
});
