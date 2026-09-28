import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const site = readFileSync(new URL('../src/data/site.ts', import.meta.url), 'utf8');
const home = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
const consultation = readFileSync(new URL('../src/pages/consulta.astro', import.meta.url), 'utf8');

test('WhatsApp preview on home and consultation uses the current compact Canita logo', () => {
  const imagePath = site.match(/SITE_OG_IMAGE\s*=\s*'([^']+)'/)?.[1];
  assert.equal(imagePath, '/assets/canita-social-2026.jpg');
  assert.ok(existsSync(new URL(`../public${imagePath}`, import.meta.url)));
  for (const page of [home, consultation]) {
    assert.match(page, /property="og:image" content=\{ogImage\}/);
    assert.match(page, /name="twitter:image" content=\{ogImage\}/);
    assert.match(page, /property="og:image:type" content="image\/jpeg"/);
    assert.doesNotMatch(page, /logocanitawsp\.png/);
  }
});
