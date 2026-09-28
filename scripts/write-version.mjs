// Genera public/version.json con un ID único por despliegue.
// El frontend lo compara para forzar recarga cuando hay nueva versión.
import { writeFileSync, mkdirSync } from 'node:fs';

const buildId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const payload = {
  buildId,
  builtAt: new Date().toISOString(),
};

mkdirSync(new URL('../public/', import.meta.url), { recursive: true });
writeFileSync(new URL('../public/version.json', import.meta.url), JSON.stringify(payload));
console.log(`[version] buildId=${buildId}`);

// Refresca lastmod del sitemap en cada despliegue (frescura para Google).
try {
  const smUrl = new URL('../public/sitemap.xml', import.meta.url);
  const { readFileSync } = await import('node:fs');
  const today = new Date().toISOString().slice(0, 10);
  const xml = readFileSync(smUrl, 'utf8').replace(
    /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g,
    `<lastmod>${today}</lastmod>`,
  );
  writeFileSync(smUrl, xml);
  console.log(`[sitemap] lastmod=${today}`);
} catch (err) {
  console.warn('[sitemap] no se pudo actualizar:', err?.message || err);
}
