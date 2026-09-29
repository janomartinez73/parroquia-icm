// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import parroquia from './src/data/parroquia.json' with { type: 'json' };
import { validarHorarios } from './src/lib/validacion';

/**
 * Valida src/data/horarios.json al cargarlo y ordena las misas, antes de que
 * lo lea cualquier módulo: el del build y el script del cliente, que trae las
 * misas incrustadas. Un dato mal cargado corta el build.
 * @returns {import('vite').Plugin}
 */
function validacionHorarios() {
  return {
    name: 'parroquia:horarios',
    enforce: 'pre',
    transform(codigo, id) {
      if (!id.split('?')[0]?.endsWith('/src/data/horarios.json')) return;
      let datos;
      try {
        datos = JSON.parse(codigo);
      } catch {
        throw new Error('src/data/horarios.json está roto: no es un JSON válido.');
      }
      return JSON.stringify(validarHorarios(datos));
    },
  };
}

// https://astro.build/config
export default defineConfig({
  // Vacía mientras no haya dominio: src/lib/seo.ts omite lo que necesita URL absoluta.
  site: parroquia.sitio.seo.url || undefined,
  vite: {
    plugins: [validacionHorarios(), tailwindcss()],
  },
});
