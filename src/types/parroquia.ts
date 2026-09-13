export type DiaSemana =
  | 'domingo'
  | 'lunes'
  | 'martes'
  | 'miercoles'
  | 'jueves'
  | 'viernes'
  | 'sabado';

/** Hora en formato 24 hs "HH:MM", por ejemplo "07:30". */
export type Hora = string;

export interface Direccion {
  calle: string;
  esquina: string;
  ciudad: string;
  provincia: string;
  pais: string;
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

export interface Apertura {
  lunesASabados: string[];
  domingos: string[];
}

export type Misas = Record<DiaSemana, Hora[]>;

export interface Bautismos {
  dia: string;
  turnos: string[];
  nota: string;
}

export interface CharlasPreBautismales {
  turnos: string[];
  nota: string;
}

/** Un grupo de días de atención de secretaría con sus franjas horarias. */
export interface HorarioSecretaria {
  dias: string;
  tramos: string[];
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
  titulo: string;
  descripcion: string;
  marca: {
    antetitulo: string;
    titulo: string;
  };
  menu: {
    boton: string;
    etiqueta: string;
  };
  hero: {
    alt: string;
  };
  avisos: {
    /** Nombre accesible de la banda de avisos. */
    etiqueta: string;
  };
  /** "eventos" se omite solo cuando no hay flyers vigentes. */
  secciones: Seccion[];
  horarios: TextosHorarios;
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
  contacto: Contacto;
  /** Si está vacío, no se muestra nada de redes. */
  redes: Red[];
  apertura: Apertura;
  misas: Misas;
  bautismos: Bautismos;
  charlasPreBautismales: CharlasPreBautismales;
  secretaria: HorarioSecretaria[];
}
