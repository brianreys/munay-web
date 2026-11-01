/**
 * Listado de productos: todos, o filtrados por categoría / subcategoría.
 * Rutas: #/productos · #/productos/collares · #/productos/collares/escallas
 */

import { filtrosHtml } from '../componentes/filtros.js';
import { activarRotacionDeFotos } from '../componentes/rotacion-fotos.js';
import { grillaHtml } from '../componentes/tarjeta.js';
import {
  buscarCategoria,
  tarjetasDeCategoria,
  tarjetasDeProductos,
} from '../servicios/catalogo.js';
import { esc } from '../utilidades/html.js';
import { vistaNoEncontrado } from './no-encontrado.js';

/** @type {import('../router.js').Vista} */
export function vistaCatalogo(contexto) {
  const { contenedor, catalogo, parametros } = contexto;
  const [slugPadre, slugHijo] = parametros;

  const categoria = slugPadre ? buscarCategoria(catalogo, slugPadre, slugHijo) : null;
  if (slugPadre && !categoria) return vistaNoEncontrado(contexto);

  const tarjetas = categoria
    ? tarjetasDeCategoria(catalogo, categoria)
    : tarjetasDeProductos(catalogo.productos);

  const padre = categoria?.padreId ? catalogo.categoriasPorId.get(categoria.padreId) : null;
  const titulo = categoria ? categoria.nombre : 'Todos los productos';

  contenedor.innerHTML = `
    <section class="seccion contenedor">
      <header class="seccion__encabezado">
        ${padre ? `<p class="sobretitulo">${esc(padre.nombre)}</p>` : '<p class="sobretitulo">Catálogo</p>'}
        <h1 class="seccion__titulo">${esc(titulo)}</h1>
        <p class="seccion__conteo">${tarjetas.length} ${tarjetas.length === 1 ? 'pieza' : 'piezas'}</p>
      </header>
      ${filtrosHtml(catalogo, categoria)}
      ${grillaHtml(tarjetas)}
    </section>
  `;

  return {
    titulo: `${titulo} · Munay`,
    seccion: 'productos',
    limpiar: activarRotacionDeFotos(contenedor),
  };
}
