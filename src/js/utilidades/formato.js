/**
 * Formateo de valores para mostrar en pantalla.
 */

const formatoPesos = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

/**
 * Formatea un número como precio en pesos argentinos: 18000 → "$ 18.000".
 * @param {number} valor
 * @returns {string}
 */
export function formatearPrecio(valor) {
  return formatoPesos.format(valor);
}

/**
 * Texto de precio para un producto con varias variantes.
 * Si todas cuestan lo mismo muestra ese precio; si no, "Desde $ X".
 * @param {{ precioMin: number, precioMax: number }} producto
 * @returns {string}
 */
export function textoPrecioProducto({ precioMin, precioMax }) {
  if (precioMin === precioMax) return formatearPrecio(precioMin);
  return `Desde ${formatearPrecio(precioMin)}`;
}
