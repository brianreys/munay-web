/**
 * Almacén del MODO DEMO: guarda el catálogo en el navegador (localStorage).
 *
 * Lo usan tanto la web pública como el panel de administración, así los
 * cambios hechos en el panel se ven en la web sin necesidad de Supabase.
 * Solo sirve para probar: los datos viven en ESTE navegador y nada más.
 */

import { CATALOGO_DEMO } from './catalogo-demo.js';

const CLAVE = 'munay-demo-catalogo-v1';

/** Devuelve el catálogo guardado, o los datos de ejemplo si no hay nada. */
export function leerCatalogoDemo() {
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado) return JSON.parse(guardado);
  } catch {
    // localStorage bloqueado o datos corruptos: se usan los de ejemplo.
  }
  return structuredClone(CATALOGO_DEMO);
}

/**
 * Guarda el catálogo completo.
 * @throws {Error} si el navegador no tiene más espacio (fotos muy grandes).
 */
export function guardarCatalogoDemo(catalogo) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(catalogo));
  } catch {
    throw new Error(
      'El modo demo se quedó sin espacio en este navegador. Probá con menos fotos o restablecé los datos de ejemplo.',
    );
  }
}

/** Borra los cambios y vuelve a los datos de ejemplo originales. */
export function restablecerCatalogoDemo() {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // Nada que borrar.
  }
}
