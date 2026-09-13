// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import parroquia from './src/data/parroquia.json' with { type: 'json' };

// https://astro.build/config
export default defineConfig({
  // Vacía mientras no haya dominio: src/lib/seo.ts omite lo que necesita URL absoluta.
  site: parroquia.sitio.seo.url || undefined,
  vite: {
    plugins: [tailwindcss()],
  },
});
