// Verifica que .pages.yml siga sincronizado con los datos del sitio.
//
// Pages CMS reescribe src/data/horarios.json y src/data/eventos.json enteros
// al guardar y borra todo campo que no esté declarado en .pages.yml. Este
// script compara las claves del YAML contra los JSON y contra los tipos de
// src/types/, y comprueba que los valores actuales cumplen los pattern del YAML.
//
// Uso: npm run verificar:cms [-- otra-config.yml]
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import ts from 'typescript';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const rutaConfig = process.argv[2] ? resolve(process.argv[2]) : join(raiz, '.pages.yml');

/** Archivos que edita el panel, con el tipo que los describe. */
const entradas = [
  { nombre: 'horarios', ruta: 'src/data/horarios.json', archivoTipo: 'horarios.ts', tipo: 'Horarios' },
  { nombre: 'eventos', ruta: 'src/data/eventos.json', archivoTipo: 'eventos.ts', tipo: 'Eventos' },
];

let fallas = 0;
const ok = (cond, msg, detalle = []) => {
  console.log(`${cond ? 'OK   ' : 'FALLA'} ${msg}`);
  if (!cond) {
    for (const d of detalle) console.log(`        - ${d}`);
    fallas++;
  }
  return cond;
};
const terminar = () => {
  console.log(fallas ? `\n${fallas} verificaciones fallaron en ${rutaConfig}` : '\nTodo en orden');
  process.exit(fallas ? 1 : 0);
};

// 1. YAML válido, sin claves duplicadas.
const doc = YAML.parseDocument(readFileSync(rutaConfig, 'utf8'), { uniqueKeys: true });
if (!ok(doc.errors.length === 0, 'YAML válido', doc.errors.map((e) => e.message))) terminar();
const config = doc.toJS();

// Las rutas de campos se escriben "a.b", "lista[]" o "lista[].c".

/** Rutas declaradas en el YAML. */
const rutasYaml = (fields, prefijo = '') =>
  fields.flatMap((f) => {
    const ruta = prefijo + f.name + (f.list ? '[]' : '');
    return f.type === 'object' ? rutasYaml(f.fields ?? [], ruta + '.') : [ruta];
  });

/** Rutas del JSON. Una lista vacía no dice qué tiene adentro: queda como "x[]*". */
const rutasJson = (valor, prefijo = '') => {
  if (Array.isArray(valor)) {
    if (valor.length === 0) return [prefijo + '[]*'];
    return [...new Set(valor.flatMap((v) => rutasJson(v, prefijo + '[]')))];
  }
  if (valor && typeof valor === 'object') {
    return Object.entries(valor).flatMap(([k, v]) => rutasJson(v, prefijo ? `${prefijo}.${k}` : k));
  }
  return [prefijo];
};

/** Rutas de un tipo exportado de src/types/, resolviendo alias, extends y Record. */
const programa = ts.createProgram(
  entradas.map((e) => join(raiz, 'src/types', e.archivoTipo)),
  { strict: true, noEmit: true },
);
const checker = programa.getTypeChecker();
const tipoExportado = (archivo, nombre) => {
  const fuente = programa.getSourceFile(join(raiz, 'src/types', archivo));
  const simbolo = fuente && checker.getExportsOfModule(checker.getSymbolAtLocation(fuente)).find((s) => s.name === nombre);
  return simbolo && checker.getDeclaredTypeOfSymbol(simbolo);
};
const rutasTipo = (tipo, prefijo = '') => {
  if (checker.isArrayType(tipo)) return rutasTipo(checker.getTypeArguments(tipo)[0], prefijo + '[]');
  if (tipo.flags & (ts.TypeFlags.StringLike | ts.TypeFlags.NumberLike | ts.TypeFlags.BooleanLike)) return [prefijo];
  return checker.getPropertiesOfType(tipo).flatMap((p) =>
    rutasTipo(checker.getTypeOfSymbol(p), prefijo ? `${prefijo}.${p.name}` : p.name));
};

/** Valores del JSON en una ruta, aplanando las listas. */
const valoresEn = (valor, ruta) =>
  ruta.split('.').reduce((actuales, segmento) => {
    const esLista = segmento.endsWith('[]');
    const clave = esLista ? segmento.slice(0, -2) : segmento;
    const hijos = actuales.map((v) => v?.[clave]).filter((v) => v !== undefined);
    return esLista ? hijos.flatMap((v) => (Array.isArray(v) ? v : [v])) : hijos;
  }, [valor]);

/** Campos con pattern, con su ruta. */
const conPattern = (fields, prefijo = '') =>
  fields.flatMap((f) => {
    const ruta = prefijo + f.name + (f.list ? '[]' : '');
    if (f.type === 'object') return conPattern(f.fields ?? [], ruta + '.');
    return f.pattern ? [{ ruta, pattern: f.pattern }] : [];
  });

const campos = (fields, filtro, prefijo = '') =>
  fields.flatMap((f) => {
    const ruta = prefijo + f.name;
    return [...(filtro(f) ? [{ ruta, f }] : []), ...(f.fields ? campos(f.fields, filtro, ruta + '.') : [])];
  });

// 2. En el panel están exactamente los archivos esperados (parroquia.json queda afuera a propósito).
const contenido = Array.isArray(config?.content) ? config.content : [];
const rutasContenido = contenido.map((c) => c.path).sort();
const esperadas = entradas.map((e) => e.ruta).sort();
ok(JSON.stringify(rutasContenido) === JSON.stringify(esperadas),
  `el panel edita solo ${esperadas.join(' y ')}`,
  [`declarados en content: ${rutasContenido.join(', ') || '(ninguno)'}`]);

for (const { nombre, ruta, archivoTipo, tipo } of entradas) {
  const entrada = contenido.find((c) => c.path === ruta);
  if (!entrada) continue;

  ok(entrada.type === 'file' && entrada.format === 'json', `${nombre}: type file y format json`);
  const declaradas = rutasYaml(entrada.fields ?? []);

  // 3. Claves del JSON actual contra el YAML. Lo que falte en el YAML, el CMS lo borra al guardar.
  // Al revés no se controla: el CMS omite las listas vacías al guardar, así que
  // un campo declarado puede faltar en el JSON. Que el YAML no declare campos
  // de más lo controla el paso 4, contra el tipo.
  // Un archivo vacío o con solo espacios cuenta como {}: el CMS lo deja así al
  // borrar el último elemento (el sitio hace lo mismo, ver leerJson en src/lib/validacion.ts).
  const texto = readFileSync(join(raiz, ruta), 'utf8');
  let json;
  try {
    json = texto.trim() === '' ? {} : JSON.parse(texto);
  } catch (e) {
    ok(false, `${nombre}: ${ruta} es un JSON válido`, [e.message]);
    continue;
  }
  const reales = rutasJson(json);
  const cubre = (r, d) => (r.endsWith('[]*') ? d.startsWith(r.slice(0, -1)) : r === d);
  const faltanJson = reales.filter((r) => !declaradas.some((d) => cubre(r, d)));
  ok(faltanJson.length === 0, `${nombre}: todos los campos de ${ruta} están en .pages.yml`,
    faltanJson.map((r) => `${r.replace(/\*$/, '')} está en el JSON y falta en .pages.yml (el CMS lo borraría al guardar)`));

  // 4. Claves del YAML contra el tipo TypeScript.
  const tipoTs = tipoExportado(archivoTipo, tipo);
  if (ok(Boolean(tipoTs), `${nombre}: existe el tipo ${tipo} en src/types/${archivoTipo}`)) {
    const delTipo = rutasTipo(tipoTs);
    const faltanTipo = delTipo.filter((r) => !declaradas.includes(r));
    const sobranTipo = declaradas.filter((d) => !delTipo.includes(d));
    ok(faltanTipo.length === 0 && sobranTipo.length === 0, `${nombre}: campos de .pages.yml iguales al tipo ${tipo}`, [
      ...faltanTipo.map((r) => `${r} está en el tipo ${tipo} y falta en .pages.yml`),
      ...sobranTipo.map((d) => `${d} está en .pages.yml y no existe en el tipo ${tipo}`),
    ]);
  }

  // 5. Los valores actuales cumplen los pattern. Si no, el dueño no podría guardar sin corregirlos.
  for (const { ruta: rutaCampo, pattern } of conPattern(entrada.fields ?? [])) {
    let re;
    try {
      re = new RegExp(pattern.regex);
    } catch (e) {
      ok(false, `${nombre}.${rutaCampo}: pattern válido`, [e.message]);
      continue;
    }
    const valores = valoresEn(json, rutaCampo);
    const malos = valores.filter((v) => typeof v !== 'string' || !re.test(v));
    ok(malos.length === 0, `${nombre}.${rutaCampo}: valores actuales (${valores.length}) contra ${pattern.regex}`,
      malos.map((m) => `${JSON.stringify(m)} no cumple el pattern: el panel no dejaría guardar sin corregirlo`));
  }

  // 6. Fechas con el formato que espera el sitio (AAAA-MM-DD).
  const malFecha = campos(entrada.fields ?? [], (f) => f.type === 'date' && f.options?.format !== 'yyyy-MM-dd');
  ok(malFecha.length === 0, `${nombre}: fechas con formato yyyy-MM-dd`,
    malFecha.map(({ ruta: r }) => `${r} tiene que llevar options.format: yyyy-MM-dd`));
}

// 7. Cada campo image usa una fuente de media declarada, cuya carpeta existe.
const media = Array.isArray(config?.media) ? config.media : [];
for (const m of media) {
  const dir = join(raiz, m.input ?? '');
  ok(existsSync(dir) && statSync(dir).isDirectory(), `media ${m.name}: existe la carpeta ${m.input}`);
}
const imagenes = contenido.flatMap((c) => campos(c.fields ?? [], (f) => f.type === 'image').map((x) => ({ ...x, c })));
for (const { ruta, f, c } of imagenes) {
  ok(media.some((m) => m.name === f.options?.media), `${c.name}.${ruta}: usa la fuente de media "${f.options?.media}"`,
    [`fuentes declaradas: ${media.map((m) => m.name).join(', ') || '(ninguna)'}`]);
}

// 8. Cada campo tiene etiqueta en castellano; sin ella el panel muestra el nombre técnico.
const sinLabel = contenido.flatMap((c) => campos(c.fields ?? [], (f) => !f.label).map(({ ruta }) => `${c.name}.${ruta}`));
ok(sinLabel.length === 0, 'todos los campos tienen label', sinLabel.map((r) => `${r} sin label`));

terminar();
