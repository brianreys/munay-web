/**
 * Utilidades para generar HTML de forma segura.
 */

const REEMPLAZOS = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escapa un texto para insertarlo dentro de HTML.
 * Usar SIEMPRE con datos que vienen de la base de datos (nombres,
 * descripciones, etc.) para evitar inyección de código (XSS).
 * @param {unknown} valor
 * @returns {string}
 */
export function esc(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (caracter) => REEMPLAZOS[caracter]);
}

/**
 * Indica si el usuario pidió reducir animaciones en su sistema operativo.
 * @returns {boolean}
 */
export function prefiereMenosMovimiento() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
