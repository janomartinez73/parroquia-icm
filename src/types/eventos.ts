/** Fecha "AAAA-MM-DD", en hora de Argentina. */
export type Fecha = string;

/** Período en que algo se muestra. Ambas fechas cuentan como vigentes. */
export interface Vigencia {
  desde: Fecha;
  hasta: Fecha;
}

/** Aviso breve para la banda de arriba de todo, por ejemplo un cambio de horario. */
export interface Aviso extends Vigencia {
  texto: string;
}

/** Flyer de un evento. */
export interface Flyer extends Vigencia {
  /** Nombre del archivo dentro de src/assets/eventos/, por ejemplo "semana-santa.jpg". */
  archivo: string;
  /** Se muestra debajo de la imagen y es su texto alternativo. */
  titulo: string;
}

export interface Eventos {
  avisos: Aviso[];
  flyers: Flyer[];
}
