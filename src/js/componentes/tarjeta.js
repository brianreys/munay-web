/**
 * Tarjeta de producto para las grillas del catálogo.
 */

import { rutaProducto } from '../utilidades/enlaces.js';
import { formatearPrecio, textoPrecioProducto } from '../utilidades/formato.js';
import { esc } from '../utilidades/html.js';

/**
 * @param {import('../servicios/catalogo.js').Tarjeta} tarjeta
 * @returns {string} HTML de la tarjeta
 */
export function tarjetaHtml({ producto, variante, fotos }) {
  const [portada, ...resto] = fotos;
  const sinStock = variante ? !variante.enStock : producto.sinStock;
  const precio = variante ? formatearPrecio(variante.precio) : textoPrecioProducto(producto);

  // El nombre de la variante solo aporta si el producto tiene más de una.
  const detalle = variante && producto.variantes.length > 1
    ? variante.nombre
    : !variante && producto.variantes.length > 1
      ? `${producto.variantes.length} opciones`
      : '';

  return `
    <article class="tarjeta${sinStock ? ' tarjeta--sin-stock' : ''}">
      <a class="tarjeta__enlace" href="${rutaProducto(producto, variante)}">
        <div class="tarjeta__imagen" ${resto.length ? 'data-rotar' : ''}>
          ${portada ? imagen(portada) : '<span class="tarjeta__sin-foto" aria-hidden="true">munay.</span>'}
          ${resto.map(imagenExtra).join('')}
          ${sinStock ? '<span class="etiqueta">Sin stock</span>' : ''}
        </div>
        <h3 class="tarjeta__nombre">${esc(producto.nombre)}</h3>
        ${detalle ? `<p class="tarjeta__detalle">${esc(detalle)}</p>` : ''}
        <p class="tarjeta__precio">${precio}</p>
      </a>
    </article>`;
}

/**
 * Grilla completa a partir de una lista de tarjetas.
 * @param {import('../servicios/catalogo.js').Tarjeta[]} tarjetas
 */
export function grillaHtml(tarjetas) {
  if (!tarjetas.length) {
    return `
      <div class="vacio">
        <p class="vacio__titulo">Pronto nuevas piezas</p>
        <p>Todavía no hay productos en esta categoría. Seguinos en Instagram para enterarte primero.</p>
      </div>`;
  }
  return `<div class="grilla">${tarjetas.map(tarjetaHtml).join('')}</div>`;
}

function imagen(foto) {
  return `<img class="tarjeta__foto" src="${esc(foto.url)}" alt="${esc(foto.alt)}"
               loading="lazy" decoding="async" width="720" height="900" />`;
}

/**
 * Fotos que rotan sobre la portada. Son decorativas (alt vacío: el lector de
 * pantalla ya anunció el producto) y se descargan recién cuando van a
 * mostrarse (`data-src`), para no cargar fotos que quizás nadie ve.
 */
function imagenExtra(foto) {
  return `<img class="tarjeta__foto tarjeta__foto--extra" data-src="${esc(foto.url)}" alt=""
               decoding="async" width="720" height="900" />`;
}
