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

/**
 * Contenido de src/data/horarios.json. El CMS reescribe ese archivo entero,
 * así que no puede tener nada que no esté declarado acá.
 */
export interface Horarios {
  misas: Misas;
  apertura: Apertura;
  secretaria: HorarioSecretaria[];
  bautismos: Bautismos;
  charlasPreBautismales: CharlasPreBautismales;
}
