// ====================================================
// CONFIGURACIÓN CENTRAL DEL SITIO (SEO + URLs canónicas)
// 👉 Cuando compres tu dominio propio, cambia SOLO esta línea
//    y reconstruye: todo (canonical, OG, sitemap, JSON-LD)
//    apuntará al nuevo dominio sin tocar nada más.
// ====================================================
export const SITE_URL = 'https://consultas-vehiculares.vercel.app';

export const SITE_NAME = 'Cañita';
export const SITE_LOCALE = 'es_PE';
export const SITE_LANG = 'es-PE';
export const SITE_THEME_COLOR = '#0b1c36';
export const SITE_LOGO = '/assets/logocañitaoficial2026.png';
export const SITE_OG_IMAGE = '/assets/canita-social-2026.jpg';
export const TWITTER_SITE = '@CanitaVehicular';

export const canonicalFor = (path: string = '/'): string =>
  SITE_URL.replace(/\/$/, '') + (path.startsWith('/') ? path : `/${path}`);
