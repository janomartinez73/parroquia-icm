import datos from '../data/parroquia.json';
import type { Parroquia } from '../types/parroquia';

/** Datos de la parroquia, validados contra el tipo en tiempo de compilación. */
export const parroquia: Parroquia = datos;

const { contacto, direccion } = parroquia;

/** Enlace a WhatsApp con el número de la parroquia y un mensaje precargado. */
export function enlaceWhatsApp(mensaje: string): string {
  return `https://wa.me/${contacto.whatsapp}?text=${encodeURIComponent(mensaje)}`;
}

/** Teléfono en formato internacional, por ejemplo "+543417930527". */
export function telefonoInternacional(): string {
  const { codigoPais, codigoArea, numero } = contacto.telefono;
  return `+${codigoPais}${codigoArea}${numero}`;
}

/** Enlace tel: en formato internacional, por ejemplo "tel:+543417930527". */
export function enlaceTelefono(): string {
  return `tel:${telefonoInternacional()}`;
}

// Dirección completa, tal como se busca en Google Maps.
const busquedaMapa = encodeURIComponent(
  [direccion.calle, direccion.ciudad, direccion.provincia, direccion.pais].join(', '),
);

/** Abre Google Maps con indicaciones para llegar a la parroquia. */
export const enlaceComoLlegar = `https://www.google.com/maps/dir/?api=1&destination=${busquedaMapa}`;

/** Mapa para embeber en un iframe; no requiere clave de API. */
export const enlaceMapaEmbebido = `https://www.google.com/maps?q=${busquedaMapa}&output=embed`;
