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
}

export interface Contacto {
  telefono: string;
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

export interface Secretaria {
  martesAViernes: string;
  sabados: string;
}

/** Sección de la página: su id es el ancla de navegación. */
export interface Seccion {
  id: string;
  titulo: string;
}

/** Textos de interfaz del sitio (head, cabecera, hero, pie, WhatsApp). */
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
  secciones: Seccion[];
  pie: {
    /** Se completa con `comunidad`: "Comunidad a cargo de los Misioneros Claretianos". */
    comunidad: string;
  };
  whatsapp: {
    mensaje: string;
    etiqueta: string;
  };
}

export interface Parroquia {
  sitio: Sitio;
  nombre: string;
  comunidad: string;
  barrio: string;
  direccion: Direccion;
  contacto: Contacto;
  apertura: Apertura;
  misas: Misas;
  bautismos: Bautismos;
  charlasPreBautismales: CharlasPreBautismales;
  secretaria: Secretaria;
}
