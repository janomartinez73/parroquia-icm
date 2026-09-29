# Parroquia Inmaculado Corazón de María — sitio web

## 1. Qué es y dónde está publicado

Es la página web de la Parroquia Inmaculado Corazón de María (Viamonte 1585, Barrio Abasto, Rosario), a cargo de los Misioneros Claretianos. Es una sola página con los horarios de misa, la ubicación, los sacramentos, el contacto y, cuando hay, flyers de eventos y avisos.

- **Código:** https://github.com/janomartinez73/parroquia-icm
- **Publicación:** Cloudflare Pages. Cada vez que se guarda un cambio en la rama `main` de GitHub, Cloudflare vuelve a armar el sitio y lo publica solo, en uno o dos minutos. Además se republica todos los días a las 06:00 (ver sección 10).
- **Dirección pública:** https://parroquia-icm.pages.dev (la misma que está en `sitio.seo.url` de `src/data/parroquia.json`; si algún día hay dominio propio, se cambia en los dos lugares).
- **Tipo de proyecto en Cloudflare:** es un proyecto de **Pages**, no de Workers. Cloudflare ya marca Pages como "legacy" y recomienda Workers para proyectos nuevos. Por ahora funciona igual, pero si en el futuro hay que migrarlo, tené en cuenta que los encabezados de `public/_headers` y el Deploy Hook del rebuild diario (sección 10) son cosas de Pages y hay que revisarlos en la migración.

No hay base de datos. Todo el contenido está en tres archivos de texto dentro de `src/data/`. Los horarios, los avisos y los flyers se editan desde un panel web, Pages CMS (sección 3), que guarda los cambios en esos mismos archivos. El resto se cambia editando los archivos.

## 2. Cómo verlo en tu computadora

Hace falta tener instalado Node.js 22 o más nuevo. En la carpeta del proyecto:

```
npm install
npm run dev
```

El segundo comando muestra una dirección (normalmente http://localhost:4321). Abrila en el navegador. Cada vez que guardes un archivo, la página se actualiza sola. Para cortar, `Ctrl + C`.

No hace falta hacer esto para cambiar horarios o agregar flyers: se hace desde el panel de Pages CMS (sección 3) o, si no, desde la web de GitHub.

## 3. Pages CMS: el panel de edición

[Pages CMS](https://pagescms.org) es un panel web gratuito que edita archivos de un repositorio de GitHub con formularios. Es la forma normal de cambiar horarios, avisos y flyers: quien lo usa no ve JSON ni necesita cuenta de GitHub. Cada vez que alguien toca **Save**, el panel hace un commit en `main` y Cloudflare publica como con cualquier otro cambio. Se entra desde https://app.pagescms.org.

La guía para quien edita desde el panel se arma aparte, con capturas del panel real. Esta sección es para el desarrollador.

### Qué edita

Todo lo define `.pages.yml`, en la raíz del repositorio:

| En el panel | Archivo |
|---|---|
| **Horarios** | `src/data/horarios.json` (misas, apertura, secretaría, bautismos, charlas pre-bautismales) |
| **Avisos y flyers** | `src/data/eventos.json` |
| **Flyers** (biblioteca de imágenes) | carpeta `src/assets/eventos/` |

`src/data/parroquia.json` (textos del sitio, contacto, redes) queda fuera del panel a propósito: lo maneja el desarrollador.

Las horas llevan un `pattern` en `.pages.yml`, así que el panel no deja guardar `7:30` o `8 a 13`: pide `07:30` y `08:00 a 13:00`. Las fechas se eligen con un calendario y se guardan como `AAAA-MM-DD`.

### Reescribe los JSON enteros

Al guardar, Pages CMS no modifica solo el campo que cambió: arma el archivo de nuevo a partir de lo que declara `.pages.yml` y lo escribe entero. Eso tiene dos consecuencias:

- **Borra lo que no conoce.** Un campo que esté en el JSON y no en `.pages.yml` desaparece en la próxima edición desde el panel, sin aviso.
- **El formato del archivo puede cambiar.** Por ejemplo, listas que estaban en un renglón (`["07:30", "19:30"]`) pueden quedar con un elemento por renglón, o las claves en otro orden. El contenido es el mismo y el sitio no cambia; no hace falta "arreglarlo".

Los flyers subidos desde el panel quedan en `archivo` con la ruta completa (`src/assets/eventos/semana-santa.jpg`, a veces con `/` adelante) en vez de solo el nombre. El sitio acepta las dos formas.

### Regla: `.pages.yml` sincronizado con los JSON

Si se agrega, renombra o borra un campo de `horarios.json` o `eventos.json`, hay que actualizar `.pages.yml` **en el mismo cambio** (y el tipo correspondiente en `src/types/`). Si no, la primera edición desde el panel borra del JSON el campo que `.pages.yml` no declara.

Esto lo controla `npm run verificar:cms` (`scripts/verificar-pages-cms.mjs`), que también corre en la validación automática (sección 10). Revisa que:

- `.pages.yml` sea YAML válido y el panel edite solo `horarios.json` y `eventos.json`.
- Los campos de `.pages.yml` sean exactamente los del JSON actual y los de los tipos `Horarios` y `Eventos` de `src/types/`. Si falta o sobra alguno, dice cuál y dónde.
- Los valores actuales del JSON cumplan los `pattern` del YAML (si no, el panel no dejaría guardar sin corregirlos primero).
- Las fechas usen el formato `yyyy-MM-dd`, los campos de imagen apunten a una fuente de media que exista, y todos los campos tengan etiqueta.

Para probar una variante de la configuración sin tocar la real: `npm run verificar:cms -- ruta/a/otra.yml`.

### Instalar la app en el repositorio (una sola vez)

1. Entrá a https://app.pagescms.org e iniciá sesión con la cuenta de GitHub dueña del repositorio.
2. El panel pide instalar la app de GitHub **Pages CMS**. Instalala en la cuenta y, en **Repository access**, elegí **Only select repositories** y marcá solo `parroquia-icm`. Se puede cambiar después desde GitHub: **Settings → Applications → Installed GitHub Apps → Pages CMS → Configure** (en la configuración de la cuenta, no del repositorio).
3. Volvé al panel, elegí el repositorio y la rama `main`. Tienen que aparecer **Horarios**, **Avisos y flyers** y **Flyers**. Si dice que no encuentra la configuración, revisá que `.pages.yml` esté en `main`.

### Invitar a quien edita

No necesita cuenta de GitHub:

1. En el panel, con el repositorio abierto, entrá a **Collaborators** (en el menú lateral; el nombre puede variar con las versiones del panel).
2. Escribí su correo y tocá **Invite**.
3. Le llega un mail con un enlace para entrar. Cada vez que quiera volver, entra a https://app.pagescms.org con el mismo correo y recibe un enlace nuevo.

Sus cambios los guarda la app de Pages CMS en GitHub, no una persona con usuario de GitHub. Por eso el aviso cuando algo falla es un issue y no solo el mail de GitHub (sección 10). Para sacarle el acceso, se lo borra de la misma lista.

## 4. Cómo cambiar un horario de misa editando el JSON

La forma normal es el panel de Pages CMS (sección 3). Esta sección y las dos siguientes son la alternativa para el desarrollador: editar el JSON directo, en la computadora o desde la web de GitHub. Sirve si el panel no anda o para cambios que el panel no cubre.

Los horarios están en `src/data/horarios.json`, en el bloque `"misas"`:

```json
"misas": {
  "domingo": ["09:30", "11:00", "19:30"],
  "lunes": [],
  "martes": ["07:30", "19:30"],
  "miercoles": ["07:30", "11:00", "19:30"],
  "jueves": ["07:30", "19:30"],
  "viernes": ["07:30", "19:30"],
  "sabado": ["07:30", "19:30"]
},
```

Ejemplo: si los jueves se agrega una misa a las 11, la línea queda así:

```json
  "jueves": ["07:30", "11:00", "19:30"],
```

Reglas:

- La hora va entre comillas, con dos dígitos y en formato 24 hs: `"07:30"`, `"19:30"`. No `"7:30"` ni `"7.30 hs"`.
- Las horas se separan con coma, en orden de la más temprana a la más tarde. **Después de la última no va coma.**
- Un día sin misa queda con los corchetes vacíos: `[]`. El sitio muestra solo "Los lunes no hay misa".
- Los nombres de los días (`"miercoles"`, `"sabado"`) van sin tilde y no se tocan.
- No hace falta agrupar días: si martes y jueves tienen los mismos horarios, el sitio los junta solo.

En el mismo archivo están también `"apertura"` (horario del templo), `"secretaria"`, `"bautismos"` y `"charlasPreBautismales"`, y se editan igual. En `"apertura"` cada tramo tiene que escribirse exactamente como `"08:00 a 13:00"`; si no, el sitio no se publica y avisa del error.

### Desde la web de GitHub, sin bajar nada

1. Entrá a https://github.com/janomartinez73/parroquia-icm/blob/main/src/data/horarios.json
2. Tocá el ícono del lápiz (**Edit this file**), arriba a la derecha del archivo.
3. Hacé el cambio.
4. Tocá **Commit changes…**, escribí una línea que diga qué cambiaste ("Agrego misa de los jueves 11 hs") y confirmá con **Commit changes**.

En uno o dos minutos está publicado. Si te equivocaste en algo (una coma de más, una comilla sin cerrar), el sitio publicado **no se rompe**: sigue la versión anterior y se abre un issue en el repositorio avisando que falló la validación (ver sección 10). Volvés a editar el archivo y corregís.

Si agregás, renombrás o borrás un campo (no un valor), actualizá también `.pages.yml` en el mismo cambio (sección 3).

## 5. Cómo agregar un flyer editando el JSON

La forma normal es el panel de Pages CMS (sección 3), que sube la imagen y agrega la entrada en un solo paso. A mano:

1. **Subí la imagen** a la carpeta `src/assets/eventos/`. Desde GitHub: entrá a esa carpeta, **Add file → Upload files**, arrastrá la imagen y **Commit changes**. Conviene un nombre simple, sin espacios ni tildes: `semana-santa-2027.jpg`. Sirven JPG, PNG o WEBP.
2. **Agregá la entrada** en `"flyers"` dentro de `src/data/eventos.json`:

   ```json
   {
     "avisos": [],
     "flyers": [
       {
         "archivo": "semana-santa-2027.jpg",
         "titulo": "Semana Santa 2027",
         "desde": "2027-03-15",
         "hasta": "2027-03-28"
       }
     ]
   }
   ```

   - `archivo`: el nombre exacto de la imagen, con mayúsculas y extensión iguales.
   - `titulo`: se muestra debajo del flyer.
   - `desde` y `hasta`: fechas en formato `AAAA-MM-DD`. Las dos cuentan: el flyer se ve desde el primer día hasta el último, inclusive.
   - Si ya hay otros flyers, cada bloque `{ … }` se separa del siguiente con una coma.
3. **Guardá el cambio** (Commit changes). Se publica solo.

Importante: primero la imagen, después el JSON. En `archivo` también sirve la ruta completa que guarda el panel (`src/assets/eventos/semana-santa-2027.jpg`). Si la entrada apunta a una imagen que todavía no está, el sitio no se publica hasta que la subas.

Qué pasa después, sin que hagas nada:

- Un flyer con `desde` en el futuro aparece solo ese día, a partir de las 06:00.
- Cuando pasa la fecha `hasta`, desaparece solo.
- Se muestran como máximo 6, los de `desde` más reciente primero.
- Si no hay ningún flyer vigente, la sección "Eventos" y su botón del menú no aparecen.

De vez en cuando conviene borrar las entradas vencidas y sus imágenes (desde el panel o a mano), para que no se acumulen.

## 6. Cómo agregar un aviso en el banner editando el JSON

La forma normal es el panel de Pages CMS (sección 3). A mano:

El banner es la franja roja arriba de todo. Sirve para algo corto y urgente: "El sábado 14 no hay misa de 19:30". Va en `"avisos"` de `src/data/eventos.json`:

```json
{
  "avisos": [
    {
      "texto": "El sábado 14 no hay misa de 19:30.",
      "desde": "2026-09-10",
      "hasta": "2026-09-14"
    }
  ],
  "flyers": []
}
```

Las fechas funcionan igual que en los flyers: aparece y desaparece solo. Puede haber varios avisos a la vez, separados por coma; se muestran uno debajo del otro. Sin avisos vigentes, la franja no aparece.

## 7. Cómo agregar una red social

Las redes están en `"redes"`, dentro de `src/data/parroquia.json`. Hoy está cargado el Facebook. Para sumar, por ejemplo, Instagram, se agrega una línea después de la de Facebook, con una coma entre las dos:

```json
"redes": [
  { "nombre": "Facebook", "url": "https://www.facebook.com/ParroquiaInmaculadoCorazondeMariadeRosario/" },
  { "nombre": "Instagram", "url": "https://www.instagram.com/nombre-de-la-cuenta" }
],
```

- `nombre` es el texto del enlace que se ve en la página.
- `url` es la dirección completa, empezando con `https://`. Lo más seguro es copiarla desde el navegador y borrar lo que viene después de un `?` (por ejemplo `?locale=es_LA`), que no hace falta.
- Aparecen en la sección Contacto y en el pie de la página. Si la lista queda vacía (`"redes": []`), no se muestra nada de redes.

## 8. Dónde está cada cosa

**`src/data/parroquia.json`** — todo lo fijo de la parroquia:

| Bloque | Qué tiene |
|---|---|
| `nombre`, `comunidad`, `barrio` | Nombre de la parroquia, "Misioneros Claretianos", "Barrio Abasto" |
| `direccion` | Calle, esquina, ciudad, provincia, código postal |
| `geo` | Coordenadas del templo (para buscadores) |
| `contacto` | Teléfono fijo, WhatsApp y correos |
| `redes` | Redes sociales (sección 7) |
| `sitio` | Todos los textos de la página que no son datos: títulos de sección, menú, textos de botones, descripciones de fotos, título y descripción para Google (`sitio.seo`) |

**`src/data/horarios.json`** — horarios de la parroquia:

| Bloque | Qué tiene |
|---|---|
| `misas` | Horarios de misa por día (sección 4) |
| `apertura` | Horario en que está abierto el templo |
| `secretaria` | Días y horarios de secretaría |
| `bautismos`, `charlasPreBautismales` | Días, turnos y notas |

**`src/data/eventos.json`** — lo que cambia seguido y vence:

| Bloque | Qué tiene |
|---|---|
| `avisos` | Mensajes de la franja roja (sección 6) |
| `flyers` | Flyers de eventos (sección 5) |

**Fotos:** las fijas están en `src/assets/`: `frente-parroquia.jpg` (la fachada, arriba de todo y en la miniatura al compartir el enlace), `esquina-parroquia.jpg` (Ubicación), `campanario.jpg` (banda de cielo estrellado), `altar-mayor.jpg` (Bautismos) y `entrada-secretaria.jpg` (Contacto). `padre-claret.jpg` hoy no se usa. Los flyers, en `src/assets/eventos/`. Para cambiar una foto fija, subí la nueva con el mismo nombre de archivo.

El resto de las carpetas (`src/components`, `src/lib`, etc.) es el código que arma la página. Para el uso diario no hace falta tocarlo.

## 9. Problemas conocidos y cómo se resolvieron

**Tailwind con Astro.** Los estilos usan Tailwind v4 conectado con el plugin `@tailwindcss/vite`, con los colores y fuentes definidos en `src/styles/global.css`. El paquete viejo `@astrojs/tailwind` está discontinuado y no sirve para Tailwind v4: no hay que instalarlo, y tampoco hace falta un archivo `tailwind.config.js`. Con las versiones actuales (Astro 7.3, Tailwind 4.3) funciona sin ningún parche: no hay `overrides` en `package.json` ni hace falta instalar con `--legacy-peer-deps`. Si al actualizar Astro `npm install` se queja de versiones incompatibles con `@tailwindcss/vite`, lo normal es que falte que Tailwind publique una versión compatible: actualizá `@tailwindcss/vite` y `tailwindcss` a la última antes de forzar nada.

**Títulos sin dorado ni versalitas.** Hasta la fase 7, los títulos de sección y los subtítulos salían marrones y en letra normal por un espacio que faltaba entre dos clases de estilo. Se corrigió en `TituloSeccion.astro` y `Subtitulo.astro`.

**Una coma de más no la detecta `astro check`.** Revisa que cada dato tenga la forma correcta, pero acepta un JSON con una coma sobrante. Esa la detecta el build. Por eso la validación automática corre los dos (y además `verificar:cms`, que controla otra cosa: sección 3).

**Aviso "Datos pendientes de completar" al compilar.** Es esperable mientras falten el dominio, las coordenadas y el código postal en `parroquia.json`. No es un error: el sitio se publica igual, solo que sin esos datos para buscadores y sin miniatura al compartir el enlace por WhatsApp.

**Flyers vencidos entre publicaciones.** El sitio se arma en el momento de publicar, así que un flyer podía seguir en la página después de vencido. Hay dos defensas: la página los oculta al abrirse si ya pasó la fecha, y el sitio se republica solo todos los días a las 06:00.

## 10. Tareas automáticas (GitHub Actions)

Hay dos, en `.github/workflows/`. Se ven en la pestaña **Actions** del repositorio.

### Validar (`validar.yml`)

Corre en cada cambio que se guarda en `main`, venga del panel, de la web de GitHub o de un push: arma el sitio (`npm run build`), revisa los datos (`npm run check`) y verifica la configuración del panel (`npm run verificar:cms`, sección 3). Los tres corren aunque falle alguno, para ver todos los errores juntos. Si algo está mal, el cambio queda marcado con una cruz roja en GitHub. Tocando la cruz se ve el error; casi siempre dice el archivo y la línea.

**Aviso con un issue.** GitHub manda un mail cuando falla un workflow, pero se lo manda a quien hizo el push. Los cambios del panel los pushea la app de Pages CMS, no una persona, así que ese mail probablemente no le llegue a nadie. Por eso, si algo falla, el último paso abre un issue en el repositorio titulado **"Falló la validación del sitio"**, con el enlace a la ejecución, el commit y su autor. Si ya hay uno abierto con ese título, agrega un comentario en vez de abrir otro.

- El mail del issue le llega a quien tenga el repositorio en **Watch**. El dueño lo tiene activado por defecto; si no te llegan, en el repositorio tocá **Watch** y elegí **All Activity** o, en **Custom**, al menos **Issues**.
- Cuando esté corregido, cerrá el issue. Si vuelve a fallar después, se abre uno nuevo.
- Hace falta que el repositorio tenga los issues activados (**Settings → General → Features → Issues**; vienen activados por defecto). El workflow usa el token automático de GitHub con permiso solo para leer el código y escribir issues.

Ojo: este workflow avisa, no frena. Cloudflare arma el sitio por su cuenta, pero corre el mismo `npm run build`, así que lo que corta el build acá también lo corta allá, y en ese caso sigue publicada la versión anterior. Lo que detectan solo `astro check` o `verificar:cms` no llega a Cloudflare, que publica igual.

- **Frena también a Cloudflare (lo detecta `npm run build`):**
  - Cualquiera de los tres JSON mal escrito: una coma de más, comillas sin cerrar.
  - Cualquier dato inválido de `horarios.json`: una hora de misa mal cargada (`7.30` o `"7:30"` en vez de `"07:30"`), una misa repetida, un día que falta, un horario de apertura o de secretaría que no sea `"HH:MM a HH:MM"` o que cierre antes de abrir, un texto de bautismos o de charlas vacío.
  - Cualquier dato inválido de `eventos.json`: una fecha que no sea `AAAA-MM-DD` o que no exista, un "hasta" anterior al "desde", un aviso sin texto, un flyer sin título o con una imagen que no está en `src/assets/eventos/`. Si falta una lista entera o un campo, también se corta, aunque el mensaje puede ser menos claro.
  - En `parroquia.json`: `sitio.seo.url` mal escrita, o un `{marcador}` que no existe en el título o la descripción.
- **Solo lo detecta `astro check`:** un dato de `parroquia.json` con la forma equivocada (por ejemplo, un número sin comillas donde va un texto, o un campo que falta) y los errores de tipos en el código. `parroquia.json` no se valida en el build, así que Cloudflare puede publicarlo igual y la página se ve rara: corregilo apenas aparezca el issue.
- **Solo lo detecta `verificar:cms`:** `.pages.yml` desincronizado con los JSON o con los tipos, o un valor cargado que no cumple el formato que pide el panel. No afecta lo publicado, pero hay que corregirlo antes de la próxima edición desde el panel, porque al guardar podría borrar campos.

### Rebuild diario (`rebuild-diario.yml`)

Todos los días a las 06:00 de Argentina le pide a Cloudflare que vuelva a publicar el sitio, para que los flyers y avisos entren y salgan en fecha. Usa un **Deploy Hook**: una dirección secreta que, cuando alguien la llama, dispara una publicación. No tiene acceso a nada más de la cuenta de Cloudflare.

Para que funcione hay que configurarlo una sola vez:

**Paso A — Crear el Deploy Hook en Cloudflare**

1. Entrá a https://dash.cloudflare.com e iniciá sesión.
2. En el menú de la izquierda, **Workers & Pages** (en algunas versiones del panel está dentro de **Compute**).
3. Elegí el proyecto del sitio de la parroquia.
4. Andá a **Settings** y buscá la sección **Builds** (en paneles más viejos se llama **Builds & deployments**).
5. En **Deploy hooks**, tocá **Add deploy hook** (o **Add**).
6. Nombre: `rebuild-diario`. Rama: `main`.
7. Guardá. Cloudflare muestra una dirección que empieza con `https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/…`. **Copiala entera.**

Tratala como una contraseña: quien la tenga puede disparar publicaciones (no puede cambiar el contenido, pero sí gastar builds). No la pegues en ningún archivo del proyecto.

**Paso B — Guardarla como secret en GitHub**

1. Entrá a https://github.com/janomartinez73/parroquia-icm
2. **Settings** (arriba, en la barra del repositorio).
3. En el menú de la izquierda: **Secrets and variables → Actions**.
4. **New repository secret**.
5. Name: `CLOUDFLARE_DEPLOY_HOOK` (exactamente así, en mayúsculas).
6. Secret: pegá la dirección del paso A.
7. **Add secret**.

**Paso C — Probarlo**

1. En el repositorio, pestaña **Actions**.
2. A la izquierda, **Rebuild diario**.
3. **Run workflow** → **Run workflow**.
4. A los segundos aparece una ejecución: tiene que quedar con un tilde verde. En el panel de Cloudflare, en **Deployments**, tiene que aparecer una publicación nueva.

Si queda con cruz roja y dice "Falta el secret CLOUDFLARE_DEPLOY_HOOK", revisá el nombre del paso B. Si dice un error de `curl`, la dirección está mal copiada o el hook se borró en Cloudflare: creá uno nuevo y reemplazá el secret (en la misma pantalla del paso B, tocando el lápiz al lado del nombre).

**Dos cosas a tener en cuenta**

- **GitHub apaga las tareas programadas de los repositorios públicos que pasan 60 días sin cambios.** Si el repositorio es público y pasan dos meses sin tocar nada, GitHub manda un mail avisando y el rebuild diario se detiene. Para reactivarlo: **Actions → Rebuild diario → Enable workflow**. Cualquier cambio guardado en el repositorio también reinicia la cuenta.
- La hora no es exacta: GitHub a veces lo arranca con unos minutos, o hasta una hora, de demora cuando tiene mucha carga.
