import type { Apertura, DiaSemana } from './horarios';

export interface Direccion {
  calle: string;
  esquina: string;
  ciudad: string;
  provincia: string;
  /** Vacío mientras no se complete; en ese caso no se publica en los datos estructurados. */
  codigoPostal: string;
  pais: string;
  /** ISO 3166-1 alfa-2, por ejemplo "AR". */
  codigoPais: string;
}

/** Coordenadas del templo en grados decimales. Null mientras no se completen. */
export interface Geo {
  latitud: number | null;
  longitud: number | null;
}

/** Teléfono fijo en partes, sin espacios ni guiones. */
export interface Telefono {
  /** Sin "+", por ejemplo "54". */
  codigoPais: string;
  /** Sin el 0 inicial, por ejemplo "341". */
  codigoArea: string;
  numero: string;
}

export interface Contacto {
  telefono: Telefono;
  /** Número internacional sin "+" ni espacios, listo para wa.me. */
  whatsapp: string;
  emails: string[];
}

export interface Red {
  nombre: string;
  url: string;
}

/** Foto con su texto alternativo y, opcionalmente, pie de foto. */
export interface TextosFoto {
  alt: string;
  pie?: string;
}

/** Enlace de WhatsApp con mensaje precargado. */
export interface TextosWhatsApp {
  mensaje: string;
  etiqueta: string;
}

/** Sección de la página: su id es el ancla de navegación. */
export interface Seccion {
  id: string;
  titulo: string;
  /** Etiqueta corta para la barra de navegación. Si falta, se usa el título. */
  menu?: string;
}

/** Textos de la sección de horarios. */
export interface TextosHorarios {
  /** Marca del bloque que corresponde al día de hoy. */
  indicadorHoy: string;
  /** Línea de próxima misa; se arma en el cliente. */
  proxima: {
    hoy: string;
    noQuedan: string;
    noHay: string;
    siguiente: string;
    manana: string;
  };
  misas: {
    titulo: string;
    /** `{dias}` se reemplaza por los días sin misa, en minúscula. */
    sinMisa: string;
  };
  apertura: Record<keyof Apertura, string> & {
    titulo: string;
  };
  dias: Record<DiaSemana, { singular: string; plural: string }>;
}

/** Sección "Nuestra comunidad": los Misioneros Claretianos. */
export interface TextosComunidad {
  presentacion: {
    /** Comienzo del párrafo, en negrita. */
    destacado: string;
    resto: string;
  };
  /** Nombre oficial de la congregación; se despliega junto con el cierre. */
  nombre: {
    /** Botón para desplegar el nombre y el cierre. */
    boton: string;
    texto: string;
  };
  /** Cita de San Antonio María Claret: la primera oración siempre se ve; la continuación, al desplegarla. */
  cita: {
    inicio: string;
    continuacion: string;
    autor: string;
    /** Botón para desplegar la continuación. */
    leerCompleta: string;
    /** El mismo botón, con la cita desplegada. */
    leerMenos: string;
  };
  /** Sigue al nombre, en el mismo desplegable. `latin` va en cursiva y marcado como latín, entre `antes` y `despues`. */
  cierre: {
    antes: string;
    latin: string;
    despues: string;
  };
}

export interface TextosUbicacion {
  comoLlegar: string;
  /** Atributo title del iframe del mapa. */
  mapaTitulo: string;
  foto: TextosFoto;
}

export interface TextosSacramentos {
  bautismos: {
    titulo: string;
    foto: TextosFoto;
  };
  charlas: {
    titulo: string;
    whatsapp: TextosWhatsApp;
  };
}

export interface TextosContacto {
  secretaria: string;
  telefono: string;
  emails: string;
  whatsapp: string;
  redes: string;
  foto: TextosFoto;
}

/** Textos de interfaz del sitio (head, cabecera, hero, secciones, pie, WhatsApp). */
export interface Sitio {
  seo: {
    /** URL pública con https y sin barra final. Vacía: sin canonical, og:url ni sitemap. */
    url: string;
    /** `{nombre}` y `{ciudad}` se reemplazan con los datos de la parroquia. */
    titulo: string;
    /** Admite `{nombre}`, `{calle}`, `{barrio}` y `{ciudad}`. */
    descripcion: string;
  };
  /** Enlace para usuarios de teclado; solo se ve al recibir el foco. */
  saltarAlContenido: string;
  marca: {
    antetitulo: string;
    titulo: string;
  };
  menu: {
    boton: string;
    etiqueta: string;
  };
  /** Dibujo de src/assets/logo.jpeg. Donde el nombre ya está escrito al lado, va con alt vacío. */
  logo: {
    alt: string;
  };
  hero: {
    alt: string;
    /** Botón que lleva a la sección de horarios. */
    verHorarios: string;
  };
  avisos: {
    /** Nombre accesible de la banda de avisos. */
    etiqueta: string;
  };
  eventos: {
    /** Botón debajo de un flyer que tiene PDF; lo abre en otra pestaña. */
    verDocumento: string;
    /** Indicación debajo de cada flyer: la imagen abre en grande en otra pestaña. */
    verEnGrande: string;
  };
  /** "eventos" se omite solo cuando no hay flyers vigentes. */
  secciones: Seccion[];
  horarios: TextosHorarios;
  comunidad: TextosComunidad;
  ubicacion: TextosUbicacion;
  sacramentos: TextosSacramentos;
  contacto: TextosContacto;
  pie: {
    /** Se completa con `comunidad`: "Comunidad a cargo de los Misioneros Claretianos". */
    comunidad: string;
  };
  whatsapp: TextosWhatsApp;
}

export interface Parroquia {
  sitio: Sitio;
  nombre: string;
  comunidad: string;
  barrio: string;
  direccion: Direccion;
  geo: Geo;
  contacto: Contacto;
  /** Si está vacío, no se muestra nada de redes. */
  redes: Red[];
}
