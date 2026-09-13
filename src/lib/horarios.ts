/**
 * Cálculos de horarios en hora de Argentina.
 *
 * El sitio es estático y el build corre en UTC, así que las funciones que
 * dependen de `ahora` tienen que llamarse desde un <script> del cliente,
 * nunca desde el frontmatter de un componente .astro.
 *
 * Todas reciben `ahora` (y `misas`) como parámetros opcionales para poder
 * testearlas con fechas fijas.
 */
// Import nombrado: el bundle del cliente incluye solo `misas`, no todo el JSON.
import { misas as misasParroquia } from '../data/parroquia.json';
import type { Apertura, DiaSemana, Hora, Misas } from '../types/parroquia';

export const ZONA_HORARIA ='America/Argentina/Buenos_Aires';

/** Días en orden, empezando por el domingo. */
export const SEMANA: readonly DiaSemana[] = [
  'domingo',
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
];

/** Días que abarca cada grupo del horario de apertura del templo. */
export const DIAS_APERTURA: Record<keyof Apertura, DiaSemana[]> = {
  lunesASabados: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'],
  domingos: ['domingo'],
};

const formatoDia = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONA_HORARIA,
  weekday: 'short',
});

const formatoHora = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONA_HORARIA,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const DIAS: Record<string, DiaSemana> = {
  Sun: 'domingo',
  Mon: 'lunes',
  Tue: 'martes',
  Wed: 'miercoles',
  Thu: 'jueves',
  Fri: 'viernes',
  Sat: 'sabado',
};

function minutosDelDia(hora: Hora): number {
  const [h, m] = hora.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function minutosActuales(ahora: Date): number {
  const partes = formatoHora.formatToParts(ahora);
  const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
    Number(partes.find((p) => p.type === tipo)?.value ?? 0);
  return valor('hour') * 60 + valor('minute');
}

/** Clave del día de hoy en Argentina. */
export function diaActual(ahora: Date = new Date()): DiaSemana {
  const dia = DIAS[formatoDia.format(ahora)];
  if (!dia) throw new Error(`Día de la semana inesperado: ${formatoDia.format(ahora)}`);
  return dia;
}

/** Horarios de misa de hoy; vacío si no hay. */
export function misasDeHoy(
  ahora: Date = new Date(),
  misas: Misas = misasParroquia,
): Hora[] {
  return misas[diaActual(ahora)];
}

/**
 * Próxima misa de hoy según la hora actual en Argentina, o null si ya no
 * quedan. Una misa que empieza en este mismo minuto todavía cuenta.
 */
export function proximaMisa(
  ahora: Date = new Date(),
  misas: Misas = misasParroquia,
): Hora | null {
  const minutos = minutosActuales(ahora);
  return misasDeHoy(ahora, misas).find((hora) => minutosDelDia(hora) >= minutos) ?? null;
}

export interface MisaSiguiente {
  dia: DiaSemana;
  hora: Hora;
  /** 0 = hoy, 1 = mañana… hasta 7 (el mismo día de la semana que viene). */
  enDias: number;
}

/**
 * Próxima misa a partir de ahora: la que queda hoy o, si no hay, la
 * primera de los días siguientes. Null solo si no hay misas en la semana.
 */
export function siguienteMisa(
  ahora: Date = new Date(),
  misas: Misas = misasParroquia,
): MisaSiguiente | null {
  const hoy = diaActual(ahora);
  const hora = proximaMisa(ahora, misas);
  if (hora) return { dia: hoy, hora, enDias: 0 };

  const indiceHoy = SEMANA.indexOf(hoy);
  for (let enDias = 1; enDias <= 7; enDias++) {
    const dia = SEMANA[(indiceHoy + enDias) % 7];
    const primera = dia && misas[dia][0];
    if (dia && primera) return { dia, hora: primera, enDias };
  }
  return null;
}
