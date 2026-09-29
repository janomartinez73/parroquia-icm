/**
 * Días de la semana, sin depender de ningún JSON. Lo importa
 * src/lib/validacion.ts, que se carga junto con astro.config.mjs: si este
 * módulo importara src/data/horarios.json, un horarios.json vacío o roto
 * rompería la config antes de que el plugin pueda dar su mensaje.
 */
import type { DiaSemana } from '../types/horarios';

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
