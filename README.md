Sitio informativo de la Parroquia Inmaculado Corazón de María (Barrio Abasto, Rosario), hecho con Astro y Tailwind v4.

## Cómo agregar un flyer

1. Copiá la imagen (JPG) a `src/assets/eventos/`, por ejemplo `semana-santa-2027.jpg`.
2. Agregá una entrada en `"flyers"` dentro de `src/data/eventos.json`:

   ```json
   {
     "archivo": "semana-santa-2027.jpg",
     "titulo": "Semana Santa 2027",
     "desde": "2027-03-15",
     "hasta": "2027-03-28"
   }
   ```

   Las fechas van en formato `AAAA-MM-DD` y las dos cuentan: el flyer se ve desde el primer día hasta el último, inclusive. Se muestran los 6 más recientes.
3. Hacé commit y push. Cloudflare Pages publica el cambio solo.

Si el build falla, el mensaje dice qué entrada está mal: un archivo que no existe (ojo con mayúsculas y extensión) o una fecha `hasta` anterior a `desde`.

El sitio se genera al hacer push, así que un flyer con `desde` en el futuro aparece recién en el primer deploy a partir de ese día. Los vencidos se ocultan solos, pero conviene borrar de vez en cuando la entrada y el archivo.

Los avisos de la banda de arriba van en `"avisos"` del mismo archivo, con `texto`, `desde` y `hasta`.
