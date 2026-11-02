/**
 * Construcción de rutas internas (hash) y enlaces de contacto.
 * Centralizar las rutas acá evita tener URLs "escritas a mano" por todo el código.
 */

import { SITIO } from '../../config.js';

/** Ruta al detalle de un producto, opcionalmente con una variante elegida. */
export function rutaProducto(producto, variante = null) {
  const base = `#/producto/${producto.slug}`;
  return variante ? `${base}/${variante.id}` : base;
}

/** Ruta al listado de una categoría (o a todos los productos si no hay categoría). */
export function rutaCategoria(categoria = null) {
  return categoria ? `#/productos/${categoria.rutaSlug}` : '#/productos';
}

/**
 * Enlace de WhatsApp con un mensaje prearmado.
 * @param {string} mensaje
 */
export function enlaceWhatsapp(mensaje = '') {
  const texto = mensaje ? `?text=${encodeURIComponent(mensaje)}` : '';
  return `https://wa.me/${SITIO.whatsapp.numero}${texto}`;
}

/**
 * Enlace al mensaje directo de Instagram con un texto prearmado.
 * Instagram no documenta oficialmente `?text=`: en algunas versiones de la
 * app carga el mensaje y en otras lo ignora. Por eso la vista de producto
 * además copia el mensaje al portapapeles al tocar el botón.
 * @param {string} mensaje
 */
export function enlaceInstagram(mensaje = '') {
  const texto = mensaje ? `?text=${encodeURIComponent(mensaje)}` : '';
  return `${SITIO.instagram.mensajeDirecto}${texto}`;
}

/**
 * Mensaje de consulta para un producto. Incluye el link a la publicación
 * para que quien responda sepa exactamente de qué pieza se habla.
 */
export function mensajeConsulta(producto, variante) {
  const pieza = variante && producto.variantes.length > 1
    ? `${producto.nombre} (${variante.nombre})`
    : producto.nombre;
  const pregunta = variante && !variante.enStock
    ? '¿Va a volver a ingresar?'
    : '¿Está disponible?';
  const url = `${window.location.origin}${window.location.pathname}${rutaProducto(producto, variante)}`;
  return `¡Hola! Me interesa ${pieza}. ${pregunta}\n${url}`;
}
