/** Sitemap de la única página. Sin sitio.seo.url sale vacío pero válido. */
import type { APIRoute } from 'astro';
import { urlAbsoluta } from '../lib/seo';

export const GET: APIRoute = () => {
  const inicio = urlAbsoluta('/');
  const urls = inicio ? `\n  <url>\n    <loc>${inicio}</loc>\n  </url>` : '';

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
