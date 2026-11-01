/**
 * Proveedor de datos de EJEMPLO (sin base de datos).
 * Se usa automáticamente cuando no hay variables de Supabase configuradas.
 * Lee del almacén demo, que incluye los cambios hechos desde el panel admin.
 */

import { leerCatalogoDemo } from '../../../datos/almacen-demo.js';

/** @returns {Promise<import('../catalogo.js').CatalogoCrudo>} */
export async function cargarCatalogo() {
  return leerCatalogoDemo();
}
