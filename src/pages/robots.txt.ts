/** robots.txt: todo indexable. La línea del sitemap va solo si hay sitio.seo.url. */
import type { APIRoute } from 'astro';
import { urlAbsoluta } from '../lib/seo';

export const GET: APIRoute = () => {
  const sitemap = urlAbsoluta('/sitemap.xml');
  const lineas = ['User-agent: *', 'Allow: /', ...(sitemap ? ['', `Sitemap: ${sitemap}`] : [])];

  return new Response(`${lineas.join('\n')}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
