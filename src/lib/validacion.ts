/**
 * Validación de los datos que edita el dueño desde Pages CMS.
 *
 * Cualquier dato mal cargado corta el build con un mensaje en castellano que
 * dice qué campo está mal y cómo debería ser. Si el build falla, Cloudflare
 * sigue publicando la versión anterior.
 *
 * validarHorarios corre solo en el build: la llama el plugin de
 * astro.config.mjs al cargar src/data/horarios.json, antes de que lo lea
 * cualquier módulo. Así las misas llegan ordenadas también al script del
 * cliente, sin sumarle código.
 */
import { SEMANA } from './horarios';
import type { Horarios } from '../types/horarios';

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const TRAMO = /^(\S+) a (\S+)$/;

/** True si no es un texto o si queda vacío después de sacar los espacios. */
export function estaVacio(texto: unknown): boolean {
  return typeof texto !== 'string' || texto.trim() === '';
}

/** "08:00 a 13:00" → inicio y fin. Solo para tramos ya validados. */
export function partirTramo(tramo: string): { inicio: string; fin: string } {
  const [, inicio = '', fin = ''] = TRAMO.exec(tramo) ?? [];
  return { inicio, fin };
}

const esObjeto = (valor: unknown): valor is Record<string, unknown> =>
  typeof valor === 'object' && valor !== null && !Array.isArray(valor);

/**
 * Valida el contenido de src/data/horarios.json y lo devuelve con las misas
 * de cada día ordenadas. Junta todos los errores y los tira juntos.
 */
export function validarHorarios(datos: unknown): Horarios {
  const errores: string[] = [];

  /** Lista del campo, o null (con el error anotado) si no es una lista. */
  const lista = (campo: string, valor: unknown): unknown[] | null => {
    if (Array.isArray(valor)) return valor;
    errores.push(`${campo}: falta la lista o no es una lista.`);
    return null;
  };

  const texto = (campo: string, valor: unknown) => {
    if (estaVacio(valor)) errores.push(`${campo}: está vacío y tiene que tener un texto.`);
  };

  const tramos = (campo: string, valor: unknown) => {
    lista(campo, valor)?.forEach((tramo, i) => {
      const donde = `${campo}[${i}]`;
      const partes = typeof tramo === 'string' ? TRAMO.exec(tramo) : null;
      if (!partes) {
        errores.push(
          `${donde}: el horario "${String(tramo)}" no tiene el formato correcto. ` +
            'Tiene que ser "HH:MM a HH:MM", por ejemplo "08:00 a 13:00".',
        );
        return;
      }
      const [, inicio = '', fin = ''] = partes;
      const invalidas = [inicio, fin].filter((hora) => !HORA.test(hora));
      if (invalidas.length > 0) {
        errores.push(
          `${donde}: en el horario "${tramo}", ${invalidas.map((h) => `"${h}"`).join(' y ')} ` +
            `${invalidas.length > 1 ? 'no son horas válidas' : 'no es una hora válida'}. ` +
            'Cada hora va con dos dígitos para la hora y dos para los minutos, entre 00:00 y 23:59, por ejemplo "08:00 a 13:00".',
        );
      } else if (inicio >= fin) {
        errores.push(
          `${donde}: en el horario "${tramo}", la hora de inicio (${inicio}) tiene que ser anterior a la de cierre (${fin}).`,
        );
      }
    });
  };

  if (!esObjeto(datos)) {
    throw new Error('Hay errores en src/data/horarios.json:\n  - el archivo está vacío o no tiene el formato esperado.\n');
  }

  // Misas: los 7 días, cada hora "HH:MM" y sin repetir. El orden lo ponemos nosotros.
  const misasOrdenadas: Record<string, string[]> = {};
  const { misas } = datos;
  if (!esObjeto(misas)) {
    errores.push('misas: falta la lista de misas por día.');
  } else {
    for (const clave of Object.keys(misas)) {
      if (!SEMANA.includes(clave as (typeof SEMANA)[number])) {
        errores.push(`misas: "${clave}" no es un día válido. Los días son: ${SEMANA.join(', ')}.`);
      }
    }
    for (const dia of SEMANA) {
      if (!(dia in misas)) {
        errores.push(
          `misas: falta el día "${dia}". Tienen que estar los 7 días; si un día no hay misa, dejá su lista vacía.`,
        );
        continue;
      }
      const horas = lista(`misas.${dia}`, misas[dia]);
      if (!horas) continue;
      const vistas = new Set<string>();
      horas.forEach((hora) => {
        if (typeof hora !== 'string' || !HORA.test(hora)) {
          errores.push(
            `misas.${dia}: "${String(hora)}" no es una hora válida. ` +
              'Tiene que ir con dos dígitos para la hora y dos para los minutos, entre 00:00 y 23:59, por ejemplo "07:30".',
          );
        } else if (vistas.has(hora)) {
          errores.push(`misas.${dia}: la misa de las ${hora} está cargada dos veces. Borrá una.`);
        }
        vistas.add(String(hora));
      });
      // "HH:MM" con dos dígitos se ordena igual como texto que como hora.
      misasOrdenadas[dia] = horas.map(String).sort();
    }
  }

  // Apertura del templo y secretaría: tramos "HH:MM a HH:MM".
  const { apertura, secretaria, bautismos, charlasPreBautismales } = datos;
  if (!esObjeto(apertura)) {
    errores.push('apertura: faltan los horarios de apertura del templo.');
  } else {
    tramos('apertura.lunesASabados', apertura.lunesASabados);
    tramos('apertura.domingos', apertura.domingos);
  }

  lista('secretaria', secretaria)?.forEach((grupo, i) => {
    const campo = `secretaria[${i}]`;
    if (!esObjeto(grupo)) {
      errores.push(`${campo}: no tiene el formato esperado (días y horarios).`);
      return;
    }
    texto(`${campo}.dias`, grupo.dias);
    tramos(`${campo}.tramos`, grupo.tramos);
  });

  // Sacramentos: textos no vacíos; las listas de turnos pueden quedar vacías.
  const turnos = (campo: string, valor: unknown) =>
    lista(campo, valor)?.forEach((turno, i) => texto(`${campo}[${i}]`, turno));

  if (!esObjeto(bautismos)) {
    errores.push('bautismos: faltan los datos de bautismos.');
  } else {
    texto('bautismos.dia', bautismos.dia);
    turnos('bautismos.turnos', bautismos.turnos);
    texto('bautismos.nota', bautismos.nota);
  }

  if (!esObjeto(charlasPreBautismales)) {
    errores.push('charlasPreBautismales: faltan los datos de las charlas prebautismales.');
  } else {
    turnos('charlasPreBautismales.turnos', charlasPreBautismales.turnos);
    texto('charlasPreBautismales.nota', charlasPreBautismales.nota);
  }

  if (errores.length > 0) {
    throw new Error(`Hay errores en src/data/horarios.json:\n  - ${errores.join('\n  - ')}\n`);
  }

  return { ...datos, misas: misasOrdenadas } as unknown as Horarios;
}
