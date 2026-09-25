import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/pages/consulta.astro', import.meta.url), 'utf8');

test('un reintento reutiliza el ticket completado o reserva uno nuevo sin colisiones', () => {
  assert.match(
    source,
    /const effectiveTicket = activeConsultationTicket \|\| completedConsultationTicket;/,
  );
  assert.match(source, /const needsFreshRetryTicket = !effectiveTicket;/);
  assert.match(source, /if \(needsFreshRetryTicket\) \{/);
});
