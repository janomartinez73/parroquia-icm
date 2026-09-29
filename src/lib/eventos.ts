/**
 * Avisos y flyers de src/data/eventos.json, validados y filtrados por fecha.
 *
 * El filtro de acá corre en el build. Como un aviso o un flyer puede vencer
 * entre dos deploys, FiltroVigencia.astro vuelve a filtrar en el cliente, sobre
 * el HTML ya generado: el navegador nunca lee eventos.json.
 */
import type { ImageMetadata } from 'astro';
import datos from '../data/eventos.json';
import { parroquia } from './parroquia';
import { ZONA_HORARIA } from './horarios';
import { validarEventos } from './validacion';
import type { Fecha, Flyer, Vigencia } from '../types/eventos';

export const ID_SECCION_EVENTOS = 'eventos';
export const MAXIMO_FLYERS = 6;

const CARPETA_FLYERS = '/src/assets/eventos/';

const imagenes = import.meta.glob<ImageMetadata>('/src/assets/eventos/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', {
  eager: true,
  import: 'default',
});

/**
 * Datos de eventos, completos y validados. El tipo que TypeScript deduce del
 * JSON no sirve: Pages CMS omite las listas vacías. Un dato mal cargado corta
 * el build (ver src/lib/validacion.ts).
 */
const eventos = validarEventos(datos, (archivo) => Boolean(imagenes[CARPETA_FLYERS + archivo]));

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

// Las fechas "AAAA-MM-DD" se ordenan igual como texto que como fecha.
const estaVigente = ({ desde, hasta }: Vigencia, hoy: Fecha) => desde <= hoy && hoy <= hasta;

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
