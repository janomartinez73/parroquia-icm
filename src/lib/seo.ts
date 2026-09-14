/**
 * Metadatos del <head>, datos estructurados (schema.org) y URLs absolutas,
 * todo derivado de src/data/parroquia.json.
 *
 * Lo que necesita una URL absoluta (canonical, og:url, og:image, sitemap) se
 * omite mientras sitio.seo.url esté vacía, para no publicar un dominio
 * equivocado. Los datos pendientes se avisan en la consola del build.
 */
import { parroquia, telefonoInternacional } from './parroquia';
import { DIAS_APERTURA } from './horarios';
import type { Apertura, DiaSemana } from '../types/parroquia';

const { sitio, nombre, comunidad, barrio, direccion, geo, apertura, redes } = parroquia;

/** theme-color: el marfil de la cabecera. Mismo valor que --color-marfil en global.css. */
export const COLOR_MARFIL = '#fbf8f1';

/** Fondo de la imagen para compartir: el azul noche del hero. Mismo valor que --color-noche. */
export const COLOR_NOCHE = '#13213f';

/** Imagen para compartir el enlace, generada en el build por src/pages/og.jpg.ts. */
export const IMAGEN_OG = { ruta: '/og.jpg', ancho: 1200, alto: 630 };

/** Reemplaza cada `{clave}` de la plantilla; una clave desconocida corta el build. */
function completar(plantilla: string, valores: Record<string, string>): string {
  return plantilla.replace(/\{(\w+)\}/g, (marcador, clave: string) => {
    const valor = valores[clave];
    if (valor === undefined) {
      throw new Error(`parroquia.json: el marcador ${marcador} de "${plantilla}" no existe.`);
    }
    return valor;
  });
}

const valores = { nombre, calle: direccion.calle, barrio, ciudad: direccion.ciudad };

export const titulo = completar(sitio.seo.titulo, valores);
export const descripcion = completar(sitio.seo.descripcion, valores);

if (sitio.seo.url && !/^https:\/\/[^/]+$/.test(sitio.seo.url)) {
  throw new Error(
    `parroquia.json: sitio.seo.url debe ser del tipo "https://dominio.com", sin barra final, y es "${sitio.seo.url}".`,
  );
}

/** URL absoluta de una ruta del sitio, o undefined si todavía no hay dominio. */
export function urlAbsoluta(ruta: string): string | undefined {
  return sitio.seo.url ? new URL(ruta, sitio.seo.url).href : undefined;
}

const tieneGeo = geo.latitud !== null && geo.longitud !== null;

const pendientes = [
  !sitio.seo.url && 'sitio.seo.url: sin ella no hay canonical, og:url, og:image (miniatura de WhatsApp) ni sitemap.',
  !tieneGeo && 'geo.latitud y geo.longitud: los datos estructurados salen sin coordenadas.',
  !direccion.codigoPostal && 'direccion.codigoPostal: la dirección de los datos estructurados sale sin código postal.',
].filter(Boolean);

if (pendientes.length > 0) {
  console.warn(`\n[parroquia.json] Datos pendientes de completar:\n  - ${pendientes.join('\n  - ')}\n`);
}

const DIAS_SCHEMA: Record<DiaSemana, string> = {
  domingo: 'Sunday',
  lunes: 'Monday',
  martes: 'Tuesday',
  miercoles: 'Wednesday',
  jueves: 'Thursday',
  viernes: 'Friday',
  sabado: 'Saturday',
};

/** "08:00 a 13:00" → apertura y cierre. Un tramo con otro formato corta el build. */
function horasDelTramo(tramo: string) {
  const partes = /^(\d{2}:\d{2}) a (\d{2}:\d{2})$/.exec(tramo);
  if (!partes) {
    throw new Error(`parroquia.json: el tramo de apertura "${tramo}" debe tener el formato "HH:MM a HH:MM".`);
  }
  return { opens: partes[1], closes: partes[2] };
}

const horariosApertura = (Object.keys(DIAS_APERTURA) as (keyof Apertura)[]).flatMap((clave) =>
  apertura[clave].map((tramo) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: DIAS_APERTURA[clave].map((dia) => DIAS_SCHEMA[dia]),
    ...horasDelTramo(tramo),
  })),
);

/**
 * Datos estructurados de la parroquia. Es Church (el templo) y Organization
 * (la comunidad): schema.org solo admite parentOrganization en Organization.
 *
 * @param rutaImagen ruta publicada del hero, por ejemplo "/_astro/frente-parroquia.nm02wkbs.jpg".
 */
export function datosEstructurados(rutaImagen: string) {
  const url = urlAbsoluta('/');
  const imagen = urlAbsoluta(rutaImagen);

  return {
    '@context': 'https://schema.org',
    '@type': ['Church', 'Organization'],
    ...(url && { '@id': `${url}#parroquia`, url }),
    name: nombre,
    ...(imagen && { image: imagen }),
    telephone: telefonoInternacional(),
    address: {
      '@type': 'PostalAddress',
      streetAddress: direccion.calle,
      addressLocality: direccion.ciudad,
      addressRegion: direccion.provincia,
      ...(direccion.codigoPostal && { postalCode: direccion.codigoPostal }),
      addressCountry: direccion.codigoPais,
    },
    ...(tieneGeo && {
      geo: { '@type': 'GeoCoordinates', latitude: geo.latitud, longitude: geo.longitud },
    }),
    openingHoursSpecification: horariosApertura,
    // Perfiles oficiales: Google los usa para vincular la ficha con las redes.
    ...(redes.length > 0 && { sameAs: redes.map((red) => red.url) }),
    parentOrganization: { '@type': 'Organization', name: comunidad },
  };
}
