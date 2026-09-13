/**
 * Cálculos de horarios en hora de Argentina.
 *
 * El sitio es estático y el build corre en UTC, así que estas funciones
 * tienen que llamarse desde un <script> del cliente, nunca desde el
 * frontmatter de un componente .astro.
 *
 * Todas reciben `ahora` (y `misas`) como parámetros opcionales para poder
 * testearlas con fechas fijas.
 */
import { parroquia } from './parroquia';
import type { DiaSemana, Hora, Misas } from '../types/parroquia';

const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';

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
  misas: Misas = parroquia.misas,
): Hora[] {
  return misas[diaActual(ahora)];
}

/**
 * Próxima misa de hoy según la hora actual en Argentina, o null si ya no
 * quedan. Una misa que empieza en este mismo minuto todavía cuenta.
 */
export function proximaMisa(
  ahora: Date = new Date(),
  misas: Misas = parroquia.misas,
): Hora | null {
  const minutos = minutosActuales(ahora);
  return misasDeHoy(ahora, misas).find((hora) => minutosDelDia(hora) >= minutos) ?? null;
}
