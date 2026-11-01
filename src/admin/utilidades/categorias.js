/**
 * Reglas para crear y renombrar categorías, compartidas por la sección
 * Categorías y por el editor de productos (alta rápida desde una foto).
 *
 * Árbol de dos niveles: categoría principal (padreId = null) y subcategorías
 * opcionales. El `slug` (parte de la URL) no se puede repetir entre hermanas.
 */

import { crearSlug } from './texto.js';

const porOrden = (a, b) => a.orden - b.orden;

/** Hijas directas de una categoría (o las principales si padreId es null), ordenadas. */
export function hijasDe(categorias, padreId) {
  return categorias.filter((c) => (c.padreId ?? null) === (padreId ?? null)).sort(porOrden);
}

/**
 * Arma una categoría nueva lista para guardar.
 * @param {string} nombre
 * @param {string|null} padreId  null para una categoría principal
 * @param {Array} categorias      todas las existentes
 * @throws {Error} si el nombre está vacío o repetido en ese nivel
 */
export function nuevaCategoria(nombre, padreId, categorias) {
  const limpio = validarNombre(nombre, padreId, categorias);
  const slug = crearSlug(limpio);
  const hermanas = hijasDe(categorias, padreId);

  // Id legible y único: 'aros' o 'collares-largos' (si ya existe, 'aros-2').
  const base = padreId ? `${padreId}-${slug}` : slug;
  let id = base;
  for (let n = 2; categorias.some((c) => c.id === id); n++) id = `${base}-${n}`;

  return {
    id,
    slug,
    nombre: limpio,
    padreId: padreId ?? null,
    enMenu: true,
    orden: Math.max(0, ...hermanas.map((c) => c.orden)) + 1,
  };
}

/**
 * Devuelve la categoría con el nombre nuevo. El slug acompaña al nombre,
 * así la URL de la web coincide con lo que se ve en el menú.
 * @throws {Error} si el nombre está vacío o repetido en ese nivel
 */
export function renombrarCategoria(categoria, nombre, categorias) {
  const otras = categorias.filter((c) => c.id !== categoria.id);
  const limpio = validarNombre(nombre, categoria.padreId, otras);
  return { ...categoria, nombre: limpio, slug: crearSlug(limpio) };
}

/** Agrega a la lista de ids la categoría principal de cada subcategoría marcada. */
export function conPrincipales(ids, categorias) {
  const padres = ids.map((id) => categorias.find((c) => c.id === id)?.padreId).filter(Boolean);
  return [...new Set([...padres, ...ids])];
}

function validarNombre(nombre, padreId, categorias) {
  const limpio = nombre.trim().replace(/\s+/g, ' ');
  const slug = crearSlug(limpio);
  if (!slug) throw new Error('Escribí un nombre para la categoría.');
  if (hijasDe(categorias, padreId).some((c) => c.slug === slug)) {
    throw new Error(`Ya existe "${limpio}" en ese nivel.`);
  }
  return limpio;
}
