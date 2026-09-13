/**
 * Avisos y flyers de src/data/eventos.json, validados y filtrados por fecha.
 *
 * El filtro de acá corre en el build. Como un aviso o un flyer puede vencer
 * entre dos deploys, FiltroVigencia.astro vuelve a filtrar en el cliente.
 */
import type { ImageMetadata } from 'astro';
import datos from '../data/eventos.json';
import { parroquia } from './parroquia';
import { ZONA_HORARIA } from './horarios';
import type { Eventos, Fecha, Flyer, Vigencia } from '../types/eventos';

/** Datos de eventos, validados contra el tipo en tiempo de compilación. */
const eventos: Eventos = datos;

export const ID_SECCION_EVENTOS = 'eventos';
export const MAXIMO_FLYERS = 6;

const CARPETA_FLYERS = '/src/assets/eventos/';

const imagenes = import.meta.glob<ImageMetadata>('/src/assets/eventos/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', {
  eager: true,
  import: 'default',
});

const formatoFecha = new Intl.DateTimeFormat('en', {
  timeZone: ZONA_HORARIA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Fecha de hoy en Argentina, "AAAA-MM-DD". */
export function fechaDeHoy(ahora: Date = new Date()): Fecha {
  const partes = formatoFecha.formatToParts(ahora);
  const valor = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((p) => p.type === tipo)?.value;
  return `${valor('year')}-${valor('month')}-${valor('day')}`;
}

function esFechaValida(fecha: Fecha): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const d = new Date(Date.UTC(anio!, mes! - 1, dia));
  return d.getUTCFullYear() === anio && d.getUTCMonth() === mes! - 1 && d.getUTCDate() === dia;
}

// Las fechas "AAAA-MM-DD" se ordenan igual como texto que como fecha.
const estaVigente = ({ desde, hasta }: Vigencia, hoy: Fecha) => desde <= hoy && hoy <= hasta;

// Junta todos los errores de carga para mostrarlos juntos y cortar el build.
const errores: string[] = [];

function validarVigencia(nombre: string, { desde, hasta }: Vigencia) {
  if (!esFechaValida(desde)) errores.push(`${nombre}: "desde" debe ser una fecha AAAA-MM-DD y es "${desde}".`);
  if (!esFechaValida(hasta)) errores.push(`${nombre}: "hasta" debe ser una fecha AAAA-MM-DD y es "${hasta}".`);
  if (esFechaValida(desde) && esFechaValida(hasta) && hasta < desde) {
    errores.push(`${nombre}: "hasta" (${hasta}) es anterior a "desde" (${desde}).`);
  }
}

eventos.avisos.forEach((aviso, i) => validarVigencia(`avisos[${i}] "${aviso.texto}"`, aviso));

eventos.flyers.forEach((flyer, i) => {
  const nombre = `flyers[${i}] "${flyer.titulo}"`;
  validarVigencia(nombre, flyer);
  if (!imagenes[CARPETA_FLYERS + flyer.archivo]) {
    errores.push(
      `${nombre}: no existe el archivo src/assets/eventos/${flyer.archivo}. ` +
        'Revisá que el nombre coincida exactamente, con mayúsculas y extensión.',
    );
  }
});

if (errores.length > 0) {
  throw new Error(`Hay errores en src/data/eventos.json:\n  - ${errores.join('\n  - ')}\n`);
}

export type FlyerConImagen = Flyer & { imagen: ImageMetadata };

const hoy = fechaDeHoy();

/** Avisos vigentes el día del build, en el orden del JSON. */
export const avisosVigentes = eventos.avisos.filter((aviso) => estaVigente(aviso, hoy));

/**
 * Flyers vigentes el día del build, del "desde" más reciente al más viejo.
 * Incluye los que pasan del máximo: se renderizan ocultos, por si en el
 * cliente vence alguno de los primeros y tienen que ocupar su lugar.
 */
export const flyersVigentes: FlyerConImagen[] = eventos.flyers
  .filter((flyer) => estaVigente(flyer, hoy))
  .sort((a, b) => b.desde.localeCompare(a.desde))
  .map((flyer) => ({ ...flyer, imagen: imagenes[CARPETA_FLYERS + flyer.archivo]! }));

/** Secciones del menú y la página; la de eventos solo si hay flyers vigentes. */
export const seccionesVisibles = parroquia.sitio.secciones.filter(
  (seccion) => seccion.id !== ID_SECCION_EVENTOS || flyersVigentes.length > 0,
);
