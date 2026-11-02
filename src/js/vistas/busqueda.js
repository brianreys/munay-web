/**
 * Resultados del buscador del encabezado. Ruta: #/buscar/<texto>
 *
 * Busca en el nombre, la descripción y los nombres de las variantes de los
 * productos publicados, sin importar mayúsculas ni tildes ("onix" encuentra
 * "Ónix"). Si se escriben varias palabras, cada una tiene que aparecer.
 */

import { activarRotacionDeFotos } from '../componentes/rotacion-fotos.js';
import { grillaHtml } from '../componentes/tarjeta.js';
import { tarjetasDeProductos } from '../servicios/catalogo.js';
import { esc } from '../utilidades/html.js';

/** @type {import('../router.js').Vista} */
export function vistaBusqueda({ contenedor, catalogo, parametros }) {
  const texto = decodeURIComponent(parametros[0] ?? '').trim();
  const palabras = normalizar(texto).split(/\s+/).filter(Boolean);

  const resultados = catalogo.productos.filter((producto) => {
    const contenido = normalizar(
      [producto.nombre, producto.descripcion, ...producto.variantes.map((v) => v.nombre)].join(' '),
    );
    return palabras.every((palabra) => contenido.includes(palabra));
  });

  // El campo del encabezado muestra lo que se buscó (ej: al volver atrás).
  const campo = document.getElementById('buscador-productos');
  if (campo) campo.value = texto;

  contenedor.innerHTML = `
    <section class="seccion contenedor">
      <header class="seccion__encabezado">
        <p class="sobretitulo">Búsqueda</p>
        <h1 class="seccion__titulo">“${esc(texto)}”</h1>
        <p class="seccion__conteo">${resultados.length} ${resultados.length === 1 ? 'pieza' : 'piezas'}</p>
      </header>
      ${resultados.length
        ? grillaHtml(tarjetasDeProductos(resultados))
        : `<div class="vacio">
             <p class="vacio__titulo">No encontramos piezas con esa búsqueda</p>
             <p>Probá con otra palabra o <a href="#/productos">mirá todos los productos</a>.</p>
           </div>`}
    </section>`;

  return {
    titulo: `Buscar “${texto}” · Munay`,
    seccion: 'productos',
    limpiar: activarRotacionDeFotos(contenedor),
  };
}

/** Minúsculas y sin tildes, para comparar textos. */
function normalizar(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
