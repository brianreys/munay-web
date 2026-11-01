/**
 * Servicio de catálogo: carga los datos (demo o Supabase), los prepara y
 * ofrece las consultas que usan las vistas.
 *
 * Reglas de negocio que se aplican acá:
 *  - Solo se muestran productos con estado 'publicado'.
 *  - Las variantes con `visible = false` (y sus fotos) se descartan.
 *  - Un producto sin variantes visibles no se muestra (no tiene precio).
 *  - Un producto está "sin stock" cuando TODAS sus variantes lo están.
 *  - Las categorías se asignan a las FOTOS: una foto etiquetada
 *    'collares-escallas' aparece en "Escallas" y también en "Collares".
 *  - Sin diapositivas activas en la portada, se usan las predeterminadas.
 */

import { PORTADA_PREDETERMINADA } from '../../datos/portada-predeterminada.js';

/**
 * @typedef {Object} CatalogoCrudo  Forma común que devuelven los proveedores.
 * @property {Array} categorias
 * @property {Array} productos
 * @property {Array} portada
 */

/** @type {Promise<Object> | null} */
let catalogoEnMemoria = null;

/** Indica si hay credenciales de Supabase (si no, se usa el modo demo). */
const usarSupabase = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
);

/**
 * Devuelve el catálogo preparado. Se carga una sola vez por visita.
 * Los proveedores se importan de forma dinámica para que el modo demo no
 * descargue la librería de Supabase.
 */
export function obtenerCatalogo() {
  catalogoEnMemoria ??= (async () => {
    const proveedor = usarSupabase
      ? await import('./proveedores/supabase.js')
      : await import('./proveedores/demo.js');
    return prepararCatalogo(await proveedor.cargarCatalogo());
  })();
  return catalogoEnMemoria;
}

/* -------------------------------------------------------------------------- */
/* Preparación de datos                                                       */
/* -------------------------------------------------------------------------- */

const porOrden = (a, b) => a.orden - b.orden;

function prepararCatalogo({ categorias, productos, portada }) {
  const categoriasOrdenadas = [...categorias].sort(porOrden);
  const categoriasPorId = new Map(categoriasOrdenadas.map((c) => [c.id, c]));

  // `rutaSlug` es lo que va en la URL: 'collares' o 'collares/escallas'.
  for (const categoria of categoriasOrdenadas) {
    const padre = categoriasPorId.get(categoria.padreId);
    categoria.rutaSlug = padre ? `${padre.slug}/${categoria.slug}` : categoria.slug;
  }

  return {
    categorias: categoriasOrdenadas,
    categoriasPorId,
    productos: productos
      .filter((producto) => producto.estado === 'publicado')
      .map(prepararProducto)
      .filter((producto) => producto.variantes.length > 0)
      .sort(compararProductos),
    portada: diapositivasActivas(portada),
  };
}

/** Diapositivas activas en orden; sin ninguna, las predeterminadas. */
function diapositivasActivas(portada = []) {
  const activas = portada.filter((d) => d.activa !== false).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  return activas.length ? activas : PORTADA_PREDETERMINADA;
}

function prepararProducto(producto) {
  const variantes = producto.variantes.filter((v) => v.visible).sort(porOrden);
  const idsVisibles = new Set(variantes.map((v) => v.id));
  const fotos = producto.fotos
    .filter((foto) => !foto.varianteId || idsVisibles.has(foto.varianteId))
    .sort(porOrden);
  const precios = variantes.map((v) => v.precio);

  return {
    ...producto,
    variantes,
    fotos,
    sinStock: variantes.every((v) => !v.enStock),
    precioMin: Math.min(...precios),
    precioMax: Math.max(...precios),
  };
}

/** Orden de listado: con stock primero, luego destacados, luego `orden`. */
function compararProductos(a, b) {
  return (
    Number(a.sinStock) - Number(b.sinStock) ||
    Number(b.destacado) - Number(a.destacado) ||
    a.orden - b.orden
  );
}

/* -------------------------------------------------------------------------- */
/* Consultas de categorías                                                    */
/* -------------------------------------------------------------------------- */

/** Categorías de primer nivel que se muestran en el menú. */
export function categoriasPrincipales(catalogo) {
  return catalogo.categorias.filter((c) => c.enMenu && !c.padreId);
}

/** Subcategorías visibles de una categoría. */
export function subcategorias(catalogo, padreId) {
  return catalogo.categorias.filter((c) => c.enMenu && c.padreId === padreId);
}

/**
 * Busca una categoría a partir de los segmentos de la URL.
 * Ej: ('collares', 'escallas') → categoría 'collares-escallas'.
 */
export function buscarCategoria(catalogo, slugPadre, slugHijo) {
  const padre = catalogo.categorias.find((c) => !c.padreId && c.slug === slugPadre);
  if (!padre || !slugHijo) return padre ?? null;
  return catalogo.categorias.find((c) => c.padreId === padre.id && c.slug === slugHijo) ?? null;
}

/** Ids de una categoría y sus subcategorías (el árbol tiene dos niveles). */
function idsConDescendientes(catalogo, categoriaId) {
  const ids = new Set([categoriaId]);
  for (const categoria of catalogo.categorias) {
    if (categoria.padreId === categoriaId) ids.add(categoria.id);
  }
  return ids;
}

/* -------------------------------------------------------------------------- */
/* Consultas de tarjetas (lo que se muestra en las grillas)                   */
/* -------------------------------------------------------------------------- */

/**
 * @typedef {Object} Tarjeta
 * @property {Object} producto
 * @property {Object|null} variante  Variante puntual, o null = producto completo.
 * @property {Object[]} fotos         La primera es la portada; las demás van rotando
 *                                    (ver componentes/rotacion-fotos.js).
 */

/** Máximo de fotos que rota una tarjeta (el resto se ve en el detalle). */
const FOTOS_POR_TARJETA = 5;

/**
 * Una tarjeta por producto, con todas sus variantes (vista "Todos").
 * @returns {Tarjeta[]}
 */
export function tarjetasDeProductos(productos) {
  return productos.map((producto) => ({
    producto,
    variante: null,
    fotos: producto.fotos.slice(0, FOTOS_POR_TARJETA),
  }));
}

/**
 * Tarjetas de una categoría: se recorren las FOTOS etiquetadas con esa
 * categoría (o una subcategoría) y se arma una tarjeta por cada variante
 * distinta, así un mismo producto puede aparecer varias veces con sus
 * distintas combinaciones (ej: collar solo / collar con dije).
 * @returns {Tarjeta[]}
 */
export function tarjetasDeCategoria(catalogo, categoria) {
  const idsValidos = idsConDescendientes(catalogo, categoria.id);
  const tarjetas = [];

  for (const producto of catalogo.productos) {
    const fotosPorVariante = new Map();

    for (const foto of producto.fotos) {
      if (!foto.categorias.some((id) => idsValidos.has(id))) continue;
      const clave = foto.varianteId ?? 'general';
      if (!fotosPorVariante.has(clave)) fotosPorVariante.set(clave, []);
      fotosPorVariante.get(clave).push(foto);
    }

    for (const [clave, fotos] of fotosPorVariante) {
      const variante = producto.variantes.find((v) => v.id === clave) ?? null;
      tarjetas.push({
        producto,
        variante,
        fotos: fotos.slice(0, FOTOS_POR_TARJETA),
      });
    }
  }

  return tarjetas;
}

/** Fotos para la galería de una variante: primero las propias, luego las generales. */
export function fotosDeVariante(producto, variante) {
  const propias = producto.fotos.filter((f) => variante && f.varianteId === variante.id);
  const generales = producto.fotos.filter((f) => !f.varianteId);
  const resultado = [...propias, ...generales];
  return resultado.length ? resultado : producto.fotos;
}
