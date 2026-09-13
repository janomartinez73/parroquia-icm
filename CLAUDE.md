# Parroquia Inmaculado Corazón de María — Sitio informativo

## Identidad
Parroquia Inmaculado Corazón de María, Barrio Abasto.
Viamonte 1585 (esquina Presidente Roca), Rosario, Santa Fe, Argentina.
Comunidad a cargo de los Misioneros Claretianos.

## Qué es
Sitio estático de una sola página con navegación por anclas.
Público: feligreses, mayoría desde celular, franja etaria alta.
El 80% entra a ver horarios de misa. Todo lo demás es secundario.

## Stack
- Astro, template minimal, TypeScript strict
- Sin framework de UI. Cero JavaScript al cliente salvo que sea imprescindible
- Tailwind v4 vía @tailwindcss/vite, config CSS-first con @theme
- NO usar @astrojs/tailwind (deprecada) ni tailwind.config.js
- Deploy en Cloudflare Pages: build `npm run build`, output `dist`

## Reglas no negociables
- Todo el contenido sale de src/data/*.json. Nunca hardcodear textos ni
  horarios dentro de componentes
- Mobile-first. Tamaño de fuente base 18px
- Sin animaciones, sin carruseles, sin dependencias innecesarias
- Imágenes siempre con el componente <Image> de Astro
- Español rioplatense en toda la interfaz
- NO ejecutar comandos de git ni de gh bajo ninguna circunstancia.
  El control de versiones lo maneja el usuario manualmente.

## Identidad visual
Papel antiguo y sobrio. Nada corporativo, nada de gradientes ni glassmorphism.
- Fondo: #FDFAF4 (crema)
- Texto: #3D2B23 (marrón oscuro)
- Acento y títulos de sección: #B08D4F (dorado)
- Destacados: #6B2028 (bordó)
- Tipografía: serif en títulos y cuerpo. Títulos de sección en versalitas
  con letter-spacing amplio.

## Fases
Actual: 7 (automatización y documentación, cierre)
Siguientes: 1 datos · 2 layout · 3 horarios · 4 ubicación+sacramentos+contacto
· 5 flyers · 6 SEO/a11y · 7 automatización
No adelantar trabajo de fases futuras.
