/**
 * Página para rutas inexistentes o productos que ya no están publicados.
 */

/** @type {import('../router.js').Vista} */
export function vistaNoEncontrado({ contenedor }) {
  contenedor.innerHTML = `
    <section class="seccion contenedor vacio">
      <h1 class="seccion__titulo">No encontramos esta página</h1>
      <p>Puede que la pieza ya no esté disponible.</p>
      <p><a class="boton" href="#/productos">Ver el catálogo</a></p>
    </section>
  `;
  return { titulo: 'Página no encontrada · Munay', seccion: null };
}
