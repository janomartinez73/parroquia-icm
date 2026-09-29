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
import { estaVacio } from './validacion';
import type { Eventos, Fecha, Flyer, Vigencia } from '../types/eventos';

/** Datos de eventos, validados contra el tipo en tiempo de compilación. */
const eventos: Eventos = datos;

export const ID_SECCION_EVENTOS = 'eventos';
export const MAXIMO_FLYERS = 6;

const CARPETA_FLYERS = '/src/assets/eventos/';

/**
 * Pages CMS guarda la ruta de la imagen ("src/assets/eventos/x.jpg" o
 * "/src/assets/eventos/x.jpg"); a mano se carga solo "x.jpg". Todo queda en "x.jpg".
 */
const nombreDeArchivo = (archivo: string) => archivo.replace(/^\/?src\/assets\/eventos\//, '');

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

// Nombra el elemento con su texto, si tiene, para ubicarlo más fácil.
const nombrar = (campo: string, texto: string) => (estaVacio(texto) ? campo : `${campo} "${texto}"`);

eventos.avisos.forEach((aviso, i) => {
  const nombre = nombrar(`avisos[${i}]`, aviso.texto);
  if (estaVacio(aviso.texto)) errores.push(`${nombre}: el texto del aviso está vacío. Escribilo o borrá el aviso.`);
  validarVigencia(nombre, aviso);
});

eventos.flyers.forEach((flyer, i) => {
  const nombre = nombrar(`flyers[${i}]`, flyer.titulo);
  if (estaVacio(flyer.titulo)) {
    errores.push(`${nombre}: falta el título del flyer. Se muestra debajo de la imagen y la describe.`);
  }
  validarVigencia(nombre, flyer);
  const archivo = nombreDeArchivo(flyer.archivo ?? '');
  if (estaVacio(archivo)) {
    errores.push(`${nombre}: falta elegir la imagen del flyer.`);
  } else if (!imagenes[CARPETA_FLYERS + archivo]) {
    errores.push(
      `${nombre}: no existe el archivo src/assets/eventos/${archivo}. ` +
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
  .map((flyer) => ({ ...flyer, imagen: imagenes[CARPETA_FLYERS + nombreDeArchivo(flyer.archivo)]! }));

/** Secciones del menú y la página; la de eventos solo si hay flyers vigentes. */
export const seccionesVisibles = parroquia.sitio.secciones.filter(
  (seccion) => seccion.id !== ID_SECCION_EVENTOS || flyersVigentes.length > 0,
);
