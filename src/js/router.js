/**
 * Router basado en el "hash" de la URL (#/productos, #/producto/x, ...).
 *
 * Por qué hash: funciona en cualquier hosting estático sin configuración
 * extra (Netlify, Vercel, GitHub Pages) y no requiere servidor.
 *
 * Cada vista recibe { contenedor, catalogo, parametros } y devuelve:
 *   { titulo, seccion, limpiar? }
 * `limpiar` se ejecuta al salir de la vista (detener carrusel, listeners, etc.).
 */

import { actualizarEncabezado } from './componentes/encabezado.js';
import { vistaBusqueda } from './vistas/busqueda.js';
import { vistaCatalogo } from './vistas/catalogo.js';
import { vistaInicio } from './vistas/inicio.js';
import { vistaNoEncontrado } from './vistas/no-encontrado.js';
import { vistaProducto } from './vistas/producto.js';

/**
 * @typedef {(contexto: { contenedor: HTMLElement, catalogo: Object, parametros: string[] })
 *   => { titulo: string, seccion: string|null, limpiar?: () => void }} Vista
 */

const SEGMENTO = '([\\w-]+)';

/** Tabla de rutas. `ancla` = id de sección a la que se desplaza la página. */
const RUTAS = [
  { patron: /^$/, vista: vistaInicio },
  { patron: new RegExp(`^productos(?:/${SEGMENTO})?(?:/${SEGMENTO})?$`), vista: vistaCatalogo },
  { patron: new RegExp(`^producto/${SEGMENTO}(?:/${SEGMENTO})?$`), vista: vistaProducto },
  { patron: /^sobre-munay$/, vista: vistaInicio, ancla: 'sobre-munay' },
  { patron: /^contacto$/, vista: vistaInicio, ancla: 'contacto' },
  { patron: /^buscar\/(.+)$/, vista: vistaBusqueda },
];

/**
 * @param {{ contenedor: HTMLElement, catalogo: Object }} opciones
 */
export function iniciarRouter({ contenedor, catalogo }) {
  let limpiarVistaAnterior = null;
  let esPrimeraCarga = true;

  function navegar() {
    const hash = window.location.hash;

    // Los anclas comunes (ej: "#contenido" del enlace de accesibilidad) no son rutas.
    if (hash && !hash.startsWith('#/')) return;

    const ruta = hash.slice(2).replace(/\/$/, '');
    const coincidencia = RUTAS.map((r) => ({ ...r, resultado: r.patron.exec(ruta) })).find(
      (r) => r.resultado,
    );

    limpiarVistaAnterior?.();
    const vista = coincidencia?.vista ?? vistaNoEncontrado;
    const parametros = coincidencia ? coincidencia.resultado.slice(1) : [];
    const { titulo, seccion, limpiar } = vista({ contenedor, catalogo, parametros });

    limpiarVistaAnterior = limpiar ?? null;
    document.title = titulo;
    actualizarEncabezado(coincidencia?.ancla ?? seccion);
    posicionar(coincidencia?.ancla);

    // Mover el foco al contenido ayuda a lectores de pantalla tras navegar.
    if (!esPrimeraCarga) contenedor.focus({ preventScroll: true });
    esPrimeraCarga = false;
  }

  window.addEventListener('hashchange', navegar);
  navegar();
}

function posicionar(ancla) {
  const destino = ancla && document.getElementById(ancla);
  if (destino) destino.scrollIntoView({ behavior: 'smooth' });
  else window.scrollTo({ top: 0 });
}
