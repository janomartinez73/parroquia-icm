/**
 * Normalización y validación de los datos que edita el dueño desde Pages CMS.
 *
 * Pages CMS no guarda las listas vacías: al guardar, las omite del JSON. Por
 * eso una lista que falta (o que vale null) cuenta como lista vacía, y un
 * objeto que falta, como objeto vacío. El resto del código recibe siempre la
 * estructura completa.
 *
 * Cualquier otro dato mal cargado corta el build con un mensaje en castellano
 * que dice qué campo está mal y cómo debería ser, nunca con un TypeError. Si
 * el build falla, Cloudflare sigue publicando la versión anterior.
 *
 * validarHorarios corre solo en el build: la llama el plugin de
 * astro.config.mjs al cargar src/data/horarios.json, antes de que lo lea
 * cualquier módulo. Así las misas llegan completas y ordenadas también al
 * script del cliente, sin sumarle código. validarEventos la llama
 * src/lib/eventos.ts, el único que lee src/data/eventos.json.
 */
// De semana.ts y no de horarios.ts: este módulo se carga con astro.config.mjs
// y no puede importar horarios.json (ver src/lib/semana.ts).
import { SEMANA } from './semana';
import type { DiaSemana, Horarios } from '../types/horarios';
import type { Aviso, Eventos, Flyer } from '../types/eventos';

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

/**
 * Pages CMS guarda la ruta de la imagen ("src/assets/eventos/x.jpg" o
 * "/src/assets/eventos/x.jpg"); a mano se carga solo "x.jpg". Todo queda en "x.jpg".
 */
export const nombreDeArchivo = (archivo: string) => archivo.replace(/^\/?src\/assets\/eventos\//, '');

/** True si es una fecha "AAAA-MM-DD" que existe en el calendario. */
export function esFechaValida(fecha: unknown): fecha is string {
  if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const d = new Date(Date.UTC(anio!, mes! - 1, dia));
  return d.getUTCFullYear() === anio && d.getUTCMonth() === mes! - 1 && d.getUTCDate() === dia;
}

/**
 * Parsea el texto de un JSON que edita Pages CMS. Un archivo vacío o con solo
 * espacios cuenta como {}: el CMS lo deja así al borrar el último elemento.
 * Un JSON mal escrito corta el build con un mensaje en castellano.
 *
 * @param ruta para el mensaje, por ejemplo "src/data/eventos.json".
 */
export function leerJson(texto: string, ruta: string): unknown {
  if (texto.trim() === '') return {};
  try {
    return JSON.parse(texto);
  } catch (error) {
    throw new Error(
      `${ruta} está roto: no es un JSON válido (${(error as Error).message}). ` +
        'Suele ser una coma de más o de menos, o comillas sin cerrar.',
    );
  }
}

const esObjeto = (valor: unknown): valor is Record<string, unknown> =>
  typeof valor === 'object' && valor !== null && !Array.isArray(valor);

const falta = (valor: unknown) => valor === undefined || valor === null;

/**
 * Lectores de campos que anotan en `errores` lo que está mal y devuelven el
 * valor normalizado. Nunca tiran: el que llama junta todos los errores y
 * corta al final, para mostrarlos juntos.
 */
function lectores(errores: string[]) {
  return {
    /** La lista del campo; vacía si falta. Null (con el error anotado) si no es una lista. */
    lista(campo: string, valor: unknown): unknown[] | null {
      if (falta(valor)) return [];
      if (Array.isArray(valor)) return valor;
      errores.push(`${campo}: tiene que ser una lista y no lo es.`);
      return null;
    },

    /** El objeto del campo; vacío si falta. Null (con el error anotado) si no es un objeto. */
    objeto(campo: string, valor: unknown): Record<string, unknown> | null {
      if (falta(valor)) return {};
      if (esObjeto(valor)) return valor;
      errores.push(`${campo}: no tiene el formato esperado.`);
      return null;
    },

    /**
     * Un texto obligatorio: que falte o esté vacío es un error. Devuelve ""
     * si no es un texto, para no encadenar otros errores.
     *
     * @param clave nombre del campo, si `campo` no lo incluye ya.
     */
    texto(campo: string, valor: unknown, siFalta = 'está vacío y tiene que tener un texto.', clave?: string): string {
      if (!falta(valor) && typeof valor !== 'string') {
        errores.push(`${campo}: ${clave ? `"${clave}" ` : ''}tiene que ser un texto y es ${JSON.stringify(valor)}.`);
        return '';
      }
      if (estaVacio(valor)) errores.push(`${campo}: ${siFalta}`);
      return typeof valor === 'string' ? valor : '';
    },
  };
}

/**
 * Normaliza y valida el contenido de src/data/horarios.json. Lo devuelve con
 * los 7 días de misa (los que faltan, sin misas) ordenados, y todas las listas
 * presentes. Junta todos los errores y los tira juntos.
 */
export function validarHorarios(datos: unknown): Horarios {
  if (!esObjeto(datos)) {
    throw new Error('Hay errores en src/data/horarios.json:\n  - el archivo está vacío o no tiene el formato esperado.\n');
  }

  const errores: string[] = [];
  const { lista, objeto, texto } = lectores(errores);

  const tramos = (campo: string, valor: unknown): string[] =>
    (lista(campo, valor) ?? []).map((tramo, i) => {
      const donde = `${campo}[${i}]`;
      const partes = typeof tramo === 'string' ? TRAMO.exec(tramo) : null;
      if (!partes) {
        errores.push(
          `${donde}: el horario ${JSON.stringify(tramo)} no tiene el formato correcto. ` +
            'Tiene que ser "HH:MM a HH:MM", por ejemplo "08:00 a 13:00".',
        );
        return String(tramo);
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
      return String(tramo);
    });

  // Turnos de sacramentos: la lista puede quedar vacía, pero no un renglón.
  const turnos = (campo: string, valor: unknown): string[] =>
    (lista(campo, valor) ?? []).map((turno, i) => texto(`${campo}[${i}]`, turno));

  // Misas: cada hora "HH:MM" y sin repetir. Un día que falta es un día sin
  // misa; un día con otro nombre es un error. El orden lo ponemos nosotros.
  const misasCargadas = objeto('misas', datos.misas);
  for (const clave of Object.keys(misasCargadas ?? {})) {
    if (!SEMANA.includes(clave as DiaSemana)) {
      errores.push(`misas: "${clave}" no es un día válido. Los días son: ${SEMANA.join(', ')}.`);
    }
  }
  const misas = Object.fromEntries(
    SEMANA.map((dia) => {
      const horas = lista(`misas.${dia}`, misasCargadas?.[dia]) ?? [];
      const vistas = new Set<string>();
      horas.forEach((hora) => {
        if (typeof hora !== 'string' || !HORA.test(hora)) {
          errores.push(
            `misas.${dia}: ${JSON.stringify(hora)} no es una hora válida. ` +
              'Tiene que ir con dos dígitos para la hora y dos para los minutos, entre 00:00 y 23:59, por ejemplo "07:30".',
          );
        } else if (vistas.has(hora)) {
          errores.push(`misas.${dia}: la misa de las ${hora} está cargada dos veces. Borrá una.`);
        }
        vistas.add(String(hora));
      });
      // "HH:MM" con dos dígitos se ordena igual como texto que como hora.
      return [dia, horas.map(String).sort()];
    }),
  ) as Horarios['misas'];
  // Un día sin misa es normal; la semana entera sin misas, casi seguro un
  // error de carga (el CMS hasta puede omitir "misas" completo).
  if (misasCargadas && SEMANA.every((dia) => misas[dia].length === 0)) {
    errores.push(
      'misas: no hay ninguna misa cargada en toda la semana. Si es a propósito, avisá al desarrollador; ' +
        'para suspensiones temporales usá un aviso.',
    );
  }

  // Apertura del templo y secretaría: tramos "HH:MM a HH:MM".
  const apertura = objeto('apertura', datos.apertura);
  const secretaria = (lista('secretaria', datos.secretaria) ?? []).flatMap((grupo, i) => {
    const campo = `secretaria[${i}]`;
    const valores = objeto(campo, grupo);
    if (!valores) return [];
    return [{ dias: texto(`${campo}.dias`, valores.dias), tramos: tramos(`${campo}.tramos`, valores.tramos) }];
  });

  // Sacramentos: textos obligatorios; las listas de turnos pueden quedar vacías.
  const bautismos = objeto('bautismos', datos.bautismos) ?? {};
  const charlas = objeto('charlasPreBautismales', datos.charlasPreBautismales) ?? {};

  const normalizado: Horarios = {
    misas,
    apertura: {
      lunesASabados: tramos('apertura.lunesASabados', apertura?.lunesASabados),
      domingos: tramos('apertura.domingos', apertura?.domingos),
    },
    secretaria,
    bautismos: {
      dia: texto('bautismos.dia', bautismos.dia),
      turnos: turnos('bautismos.turnos', bautismos.turnos),
      nota: texto('bautismos.nota', bautismos.nota),
    },
    charlasPreBautismales: {
      turnos: turnos('charlasPreBautismales.turnos', charlas.turnos),
      nota: texto('charlasPreBautismales.nota', charlas.nota),
    },
  };

  if (errores.length > 0) {
    throw new Error(`Hay errores en src/data/horarios.json:\n  - ${errores.join('\n  - ')}\n`);
  }
  return normalizado;
}

/**
 * Normaliza y valida el contenido de src/data/eventos.json. Lo devuelve con
 * las dos listas presentes y la imagen de cada flyer como nombre de archivo
 * ("x.jpg"). Junta todos los errores y los tira juntos.
 *
 * @param existeImagen dice si "x.jpg" está en src/assets/eventos/.
 */
export function validarEventos(datos: unknown, existeImagen: (archivo: string) => boolean): Eventos {
  if (!esObjeto(datos)) {
    throw new Error('Hay errores en src/data/eventos.json:\n  - el archivo está vacío o no tiene el formato esperado.\n');
  }

  const errores: string[] = [];
  const { lista, objeto, texto } = lectores(errores);

  // Nombra el elemento con su texto, si tiene, para ubicarlo más fácil.
  const nombrar = (campo: string, texto: unknown) =>
    estaVacio(texto) ? campo : `${campo} "${String(texto)}"`;

  const fecha = (nombre: string, campo: 'desde' | 'hasta', valor: unknown): string => {
    if (falta(valor) || valor === '') errores.push(`${nombre}: falta la fecha "${campo}".`);
    else if (!esFechaValida(valor)) errores.push(`${nombre}: "${campo}" debe ser una fecha AAAA-MM-DD y es ${JSON.stringify(valor)}.`);
    return String(valor ?? '');
  };

  const vigencia = (nombre: string, valores: Record<string, unknown>) => {
    const desde = fecha(nombre, 'desde', valores.desde);
    const hasta = fecha(nombre, 'hasta', valores.hasta);
    if (esFechaValida(desde) && esFechaValida(hasta) && hasta < desde) {
      errores.push(`${nombre}: "hasta" (${hasta}) es anterior a "desde" (${desde}).`);
    }
    return { desde, hasta };
  };

  // Un elemento que no es un objeto se informa una sola vez.
  const avisos: Aviso[] = (lista('avisos', datos.avisos) ?? []).flatMap((aviso, i) => {
    const valores = objeto(`avisos[${i}]`, aviso);
    if (!valores) return [];
    const nombre = nombrar(`avisos[${i}]`, valores.texto);
    return [{
      texto: texto(nombre, valores.texto, 'el texto del aviso está vacío. Escribilo o borrá el aviso.', 'texto'),
      ...vigencia(nombre, valores),
    }];
  });

  const flyers: Flyer[] = (lista('flyers', datos.flyers) ?? []).flatMap((flyer, i) => {
    const valores = objeto(`flyers[${i}]`, flyer);
    if (!valores) return [];
    const nombre = nombrar(`flyers[${i}]`, valores.titulo);
    const titulo = texto(nombre, valores.titulo, 'falta el título del flyer. Se muestra debajo de la imagen y la describe.', 'titulo');
    const archivo = nombreDeArchivo(texto(nombre, valores.archivo, 'falta elegir la imagen del flyer.', 'archivo'));
    if (!estaVacio(archivo) && !existeImagen(archivo)) {
      errores.push(
        `${nombre}: no existe el archivo src/assets/eventos/${archivo}. ` +
          'Revisá que el nombre coincida exactamente, con mayúsculas y extensión.',
      );
    }
    return [{ archivo, titulo, ...vigencia(nombre, valores) }];
  });

  if (errores.length > 0) {
    throw new Error(`Hay errores en src/data/eventos.json:\n  - ${errores.join('\n  - ')}\n`);
  }
  return { avisos, flyers };
}
