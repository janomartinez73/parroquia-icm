/**
 * Imagen para compartir el enlace (WhatsApp, redes), 1200x630, generada de la
 * fachada del hero en cada build.
 *
 * La fachada es vertical: va a lo alto y centrada sobre el azul noche del hero. Así el
 * recorte cuadrado que usa WhatsApp en la miniatura cae sobre el templo.
 */
import type { APIRoute } from 'astro';
import sharp from 'sharp';
import fotoHero from '../assets/frente-parroquia.jpg';
import { COLOR_NOCHE, IMAGEN_OG } from '../lib/seo';

export const GET: APIRoute = async () => {
  // Astro expone la ruta del archivo original en las imágenes importadas.
  const { fsPath } = fotoHero as typeof fotoHero & { fsPath?: string };
  if (!fsPath) throw new Error('No se encontró el archivo del hero para generar la imagen OG.');

  const { ancho, alto } = IMAGEN_OG;
  const foto = await sharp(fsPath).rotate().resize({ width: ancho, height: alto, fit: 'inside' }).toBuffer();
  const imagen = await sharp({ create: { width: ancho, height: alto, channels: 3, background: COLOR_NOCHE } })
    .composite([{ input: foto, gravity: 'center' }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  return new Response(new Uint8Array(imagen), { headers: { 'Content-Type': 'image/jpeg' } });
};
