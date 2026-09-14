# Parroquia Inmaculado Corazón de María — sitio web

## 1. Qué es y dónde está publicado

Es la página web de la Parroquia Inmaculado Corazón de María (Viamonte 1585, Barrio Abasto, Rosario), a cargo de los Misioneros Claretianos. Es una sola página con los horarios de misa, la ubicación, los sacramentos, el contacto y, cuando hay, flyers de eventos y avisos.

- **Código:** https://github.com/janomartinez73/parroquia-icm
- **Publicación:** Cloudflare Pages. Cada vez que se guarda un cambio en la rama `main` de GitHub, Cloudflare vuelve a armar el sitio y lo publica solo, en uno o dos minutos. Además se republica todos los días a las 06:00 (ver sección 9).
- **Dirección pública:** _(completar con la dirección de Cloudflare Pages o el dominio propio cuando esté definido)_.

No hay base de datos ni panel de administración. Todo el contenido está en dos archivos de texto dentro de `src/data/`. Para cambiar algo del sitio se edita uno de esos archivos y listo.

## 2. Cómo verlo en tu computadora

Hace falta tener instalado Node.js 22 o más nuevo. En la carpeta del proyecto:

```
npm install
npm run dev
```

El segundo comando muestra una dirección (normalmente http://localhost:4321). Abrila en el navegador. Cada vez que guardes un archivo, la página se actualiza sola. Para cortar, `Ctrl + C`.

No hace falta hacer esto para cambiar horarios o agregar flyers: se puede todo desde la web de GitHub.

## 3. Cómo cambiar un horario de misa

Los horarios están en `src/data/parroquia.json`, en el bloque `"misas"`:

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

1. Entrá a https://github.com/janomartinez73/parroquia-icm/blob/main/src/data/parroquia.json
2. Tocá el ícono del lápiz (**Edit this file**), arriba a la derecha del archivo.
3. Hacé el cambio.
4. Tocá **Commit changes…**, escribí una línea que diga qué cambiaste ("Agrego misa de los jueves 11 hs") y confirmá con **Commit changes**.

En uno o dos minutos está publicado. Si te equivocaste en algo (una coma de más, una comilla sin cerrar), el sitio publicado **no se rompe**: sigue la versión anterior y GitHub te manda un mail avisando que falló la validación (ver sección 9). Volvés a editar el archivo y corregís.

## 4. Cómo agregar un flyer

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

Importante: primero la imagen, después el JSON. Si la entrada apunta a una imagen que todavía no está, el sitio no se publica hasta que la subas.

Qué pasa después, sin que hagas nada:

- Un flyer con `desde` en el futuro aparece solo ese día, a partir de las 06:00.
- Cuando pasa la fecha `hasta`, desaparece solo.
- Se muestran como máximo 6, los de `desde` más reciente primero.
- Si no hay ningún flyer vigente, la sección "Eventos" y su botón del menú no aparecen.

De vez en cuando conviene borrar las entradas vencidas del JSON y sus imágenes, para que no se acumulen.

## 5. Cómo agregar un aviso en el banner

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

## 6. Cómo agregar una red social

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

## 7. Dónde está cada cosa

**`src/data/parroquia.json`** — todo lo fijo de la parroquia:

| Bloque | Qué tiene |
|---|---|
| `nombre`, `comunidad`, `barrio` | Nombre de la parroquia, "Misioneros Claretianos", "Barrio Abasto" |
| `direccion` | Calle, esquina, ciudad, provincia, código postal |
| `geo` | Coordenadas del templo (para buscadores) |
| `contacto` | Teléfono fijo, WhatsApp y correos |
| `redes` | Redes sociales (sección 6) |
| `misas` | Horarios de misa por día (sección 3) |
| `apertura` | Horario en que está abierto el templo |
| `secretaria` | Días y horarios de secretaría |
| `bautismos`, `charlasPreBautismales` | Días, turnos y notas |
| `sitio` | Todos los textos de la página que no son datos: títulos de sección, menú, textos de botones, descripciones de fotos, título y descripción para Google (`sitio.seo`) |

**`src/data/eventos.json`** — lo que cambia seguido y vence:

| Bloque | Qué tiene |
|---|---|
| `avisos` | Mensajes de la franja roja (sección 5) |
| `flyers` | Flyers de eventos (sección 4) |

**Fotos:** las fijas están en `src/assets/`: `frente-parroquia.jpg` (la fachada, arriba de todo y en la miniatura al compartir el enlace), `esquina-parroquia.jpg` (Ubicación), `campanario.jpg` (banda de cielo estrellado), `altar-mayor.jpg` (Bautismos) y `entrada-secretaria.jpg` (Contacto). `padre-claret.jpg` hoy no se usa. Los flyers, en `src/assets/eventos/`. Para cambiar una foto fija, subí la nueva con el mismo nombre de archivo.

El resto de las carpetas (`src/components`, `src/lib`, etc.) es el código que arma la página. Para el uso diario no hace falta tocarlo.

## 8. Problemas conocidos y cómo se resolvieron

**Tailwind con Astro.** Los estilos usan Tailwind v4 conectado con el plugin `@tailwindcss/vite`, con los colores y fuentes definidos en `src/styles/global.css`. El paquete viejo `@astrojs/tailwind` está discontinuado y no sirve para Tailwind v4: no hay que instalarlo, y tampoco hace falta un archivo `tailwind.config.js`. Con las versiones actuales (Astro 7.3, Tailwind 4.3) funciona sin ningún parche: no hay `overrides` en `package.json` ni hace falta instalar con `--legacy-peer-deps`. Si al actualizar Astro `npm install` se queja de versiones incompatibles con `@tailwindcss/vite`, lo normal es que falte que Tailwind publique una versión compatible: actualizá `@tailwindcss/vite` y `tailwindcss` a la última antes de forzar nada.

**Títulos sin dorado ni versalitas.** Hasta la fase 7, los títulos de sección y los subtítulos salían marrones y en letra normal por un espacio que faltaba entre dos clases de estilo. Se corrigió en `TituloSeccion.astro` y `Subtitulo.astro`.

**Una coma de más no la detecta `astro check`.** Revisa que cada dato tenga la forma correcta, pero acepta un JSON con una coma sobrante. Esa la detecta el build. Por eso la validación automática corre los dos.

**Aviso "Datos pendientes de completar" al compilar.** Es esperable mientras falten el dominio, las coordenadas y el código postal en `parroquia.json`. No es un error: el sitio se publica igual, solo que sin esos datos para buscadores y sin miniatura al compartir el enlace por WhatsApp.

**Flyers vencidos entre publicaciones.** El sitio se arma en el momento de publicar, así que un flyer podía seguir en la página después de vencido. Hay dos defensas: la página los oculta al abrirse si ya pasó la fecha, y el sitio se republica solo todos los días a las 06:00.

## 9. Tareas automáticas (GitHub Actions)

Hay dos, en `.github/workflows/`. Se ven en la pestaña **Actions** del repositorio.

### Validar (`validar.yml`)

Corre en cada cambio que se guarda en `main`: arma el sitio (`npm run build`) y revisa los datos (`npm run check`). Si algo está mal, el cambio queda marcado con una cruz roja en GitHub y te llega un mail. Tocando la cruz se ve el error; casi siempre dice el archivo y la línea.

Ojo: esto avisa, no frena. Cloudflare arma el sitio por su cuenta. Si el error es de JSON mal escrito, Cloudflare también falla y sigue publicada la versión anterior. Si es un dato con la forma equivocada (por ejemplo, una hora de misa sin comillas, `7.30` en vez de `"07:30"`), Cloudflare puede publicarlo igual y la página se ve rara: corregilo apenas llegue el mail.

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
