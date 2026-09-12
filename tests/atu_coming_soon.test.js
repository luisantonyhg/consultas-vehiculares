import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/pages/consulta.astro', import.meta.url), 'utf8');

test('ATU se muestra como PRÓXIMAMENTE en frontend', () => {
    assert.match(source, /setCardComingSoon\('atu'/);
    assert.match(source, /Esta función estará disponible próximamente/);
});

test('ATU no genera fetch automático desde el scheduler avanzado', () => {
    const jobsStart = source.indexOf('const advancedJobs');
    const jobsEnd = source.indexOf('};', jobsStart);
    const jobs = source.slice(jobsStart, jobsEnd);
    assert.doesNotMatch(jobs, /atu\s*:/);
});
