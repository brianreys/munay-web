/**
 * Utilidades de texto del panel.
 */

/**
 * Convierte un nombre en un "slug" apto para URL.
 * "Collar Ónix y Cuarzo" → "collar-onix-y-cuarzo"
 * @param {string} texto
 */
export function crearSlug(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita tildes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
