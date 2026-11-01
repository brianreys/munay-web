/**
 * Filtros por categoría (chips). Son enlaces comunes: cambian la URL y el
 * router se encarga de mostrar el resultado, así cada filtro se puede
 * compartir o guardar en favoritos.
 */

import { categoriasPrincipales, subcategorias } from '../servicios/catalogo.js';
import { rutaCategoria } from '../utilidades/enlaces.js';
import { esc } from '../utilidades/html.js';

/**
 * @param {Object} catalogo
 * @param {Object|null} categoriaActiva
 * @returns {string} HTML con una o dos filas de chips
 */
export function filtrosHtml(catalogo, categoriaActiva = null) {
  // Si la categoría activa es una subcategoría, la "principal" es su padre.
  const principal = categoriaActiva?.padreId
    ? catalogo.categoriasPorId.get(categoriaActiva.padreId)
    : categoriaActiva;
  const hijos = principal ? subcategorias(catalogo, principal.id) : [];

  const filaPrincipal = [
    chip('Todos', rutaCategoria(), !principal),
    ...categoriasPrincipales(catalogo).map((cat) =>
      chip(cat.nombre, rutaCategoria(cat), cat.id === principal?.id),
    ),
  ];

  const filaSecundaria = hijos.length
    ? [
        chip('Todas', rutaCategoria(principal), categoriaActiva?.id === principal.id, true),
        ...hijos.map((hijo) => chip(hijo.nombre, rutaCategoria(hijo), hijo.id === categoriaActiva?.id, true)),
      ]
    : [];

  return `
    <nav class="filtros" aria-label="Filtrar por categoría">
      <ul class="filtros__fila">${filaPrincipal.join('')}</ul>
      ${filaSecundaria.length ? `<ul class="filtros__fila filtros__fila--secundaria">${filaSecundaria.join('')}</ul>` : ''}
    </nav>`;
}

function chip(texto, href, activo, secundario = false) {
  return `
    <li>
      <a class="chip${secundario ? ' chip--secundario' : ''}" href="${href}"
         ${activo ? 'aria-current="page"' : ''}>${esc(texto)}</a>
    </li>`;
}
