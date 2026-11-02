/**
 * Router del panel (hash): #/ lista · #/nuevo · #/editar/<id> · #/categorias · #/portada · #/colores · #/ventas
 *
 * Igual que el de la web pública, pero además permite que una vista
 * impida salir (`puedeSalir`), para no perder cambios sin guardar.
 */

import { vistaCategorias } from './vistas/categorias.js';
import { vistaColores } from './vistas/colores.js';
import { vistaEditor } from './vistas/editor.js';
import { vistaLista } from './vistas/lista.js';
import { vistaPortada } from './vistas/portada.js';
import { vistaVentas } from './vistas/ventas.js';

const RUTAS = [
  { patron: /^$/, vista: vistaLista },
  { patron: /^nuevo$/, vista: vistaEditor },
  { patron: /^editar\/([\w-]+)$/, vista: vistaEditor },
  { patron: /^categorias$/, vista: vistaCategorias },
  { patron: /^portada$/, vista: vistaPortada },
  { patron: /^colores$/, vista: vistaColores },
  { patron: /^ventas$/, vista: vistaVentas },
];

/**
 * @param {{ contenedor: HTMLElement, repositorio: Object }} contexto
 */
export function iniciarRouterAdmin(contexto) {
  let vistaActual = null;
  let hashActual = window.location.hash;
  let ignorarProximo = false;

  async function navegar() {
    if (ignorarProximo) {
      ignorarProximo = false;
      return;
    }

    // Si la vista tiene cambios sin guardar y la usuaria cancela, se vuelve atrás.
    if (vistaActual?.puedeSalir && !vistaActual.puedeSalir()) {
      ignorarProximo = true;
      window.location.hash = hashActual;
      return;
    }

    vistaActual?.limpiar?.();
    vistaActual = null;
    hashActual = window.location.hash;

    const ruta = hashActual.replace(/^#\/?/, '').replace(/\/$/, '');
    const coincidencia = RUTAS.map((r) => ({ ...r, resultado: r.patron.exec(ruta) })).find(
      (r) => r.resultado,
    );
    if (!coincidencia) {
      window.location.hash = '#/';
      return;
    }

    window.scrollTo({ top: 0 });
    vistaActual = await coincidencia.vista({
      ...contexto,
      parametros: coincidencia.resultado.slice(1),
    });
    contexto.contenedor.focus({ preventScroll: true });
  }

  window.addEventListener('hashchange', navegar);
  navegar();
}
