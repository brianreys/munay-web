/**
 * Proveedor de datos REAL: lee el catálogo desde Supabase.
 *
 * Traduce las filas de la base (snake_case) a la misma forma que usan los
 * datos de ejemplo (camelCase), para que el resto de la web sea agnóstica.
 * Las políticas RLS ya filtran lo que no es público (productos ocultos, etc.).
 */

import { coloresDesdeFilas } from '../apariencia.js';
import { supabase, BUCKETS, urlPublica } from '../supabase-cliente.js';

const CONSULTA_PRODUCTOS = `
  id, slug, nombre, descripcion, etiqueta_variante, estado, destacado, orden,
  variantes ( id, nombre, precio, en_stock, visible, orden ),
  fotos ( id, ruta, alt, orden, variante_id, foto_categorias ( categoria_id ) )
`;

/** @returns {Promise<import('../catalogo.js').CatalogoCrudo>} */
export async function cargarCatalogo() {
  const [categorias, productos, portada, ajustes] = await Promise.all([
    supabase.from('categorias').select('id, slug, nombre, padre_id, en_menu, orden'),
    supabase.from('productos').select(CONSULTA_PRODUCTOS).eq('estado', 'publicado'),
    supabase
      .from('portada')
      .select('ruta, ruta_movil, titulo, subtitulo, enlace, texto_boton, orden')
      .eq('activa', true)
      .order('orden'),
    supabase.from('ajustes').select('clave, valor'),
  ]);

  // Sin categorías o productos no hay catálogo: eso sí es un error.
  for (const respuesta of [categorias, productos]) {
    if (respuesta.error) throw respuesta.error;
  }
  // La portada y los colores son secundarios: si fallan (ej: falta correr una
  // migración), la web sigue con las diapositivas y colores predeterminados.
  for (const [nombre, respuesta] of [['portada', portada], ['ajustes', ajustes]]) {
    if (respuesta.error) console.warn(`No se pudo leer "${nombre}":`, respuesta.error.message);
  }

  return {
    categorias: categorias.data.map(mapearCategoria),
    productos: productos.data.map(mapearProducto),
    portada: (portada.data ?? []).map(mapearDiapositiva),
    ajustes: coloresDesdeFilas(ajustes.data ?? []),
  };
}

function mapearCategoria(fila) {
  return {
    id: fila.id,
    slug: fila.slug,
    nombre: fila.nombre,
    padreId: fila.padre_id,
    enMenu: fila.en_menu,
    orden: fila.orden,
  };
}

function mapearProducto(fila) {
  return {
    id: fila.id,
    slug: fila.slug,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    etiquetaVariante: fila.etiqueta_variante,
    estado: fila.estado,
    destacado: fila.destacado,
    orden: fila.orden,
    variantes: fila.variantes.map((variante) => ({
      id: variante.id,
      nombre: variante.nombre,
      precio: Number(variante.precio), // numeric llega como string
      enStock: variante.en_stock,
      visible: variante.visible,
      orden: variante.orden,
    })),
    fotos: fila.fotos.map((foto) => ({
      id: foto.id,
      url: urlPublica(BUCKETS.productos, foto.ruta),
      alt: foto.alt,
      orden: foto.orden,
      varianteId: foto.variante_id,
      categorias: foto.foto_categorias.map((relacion) => relacion.categoria_id),
    })),
  };
}

function mapearDiapositiva(fila) {
  return {
    orden: fila.orden,
    url: urlPublica(BUCKETS.portada, fila.ruta),
    urlMovil: fila.ruta_movil ? urlPublica(BUCKETS.portada, fila.ruta_movil) : null,
    titulo: fila.titulo,
    subtitulo: fila.subtitulo,
    enlace: fila.enlace,
    textoBoton: fila.texto_boton,
  };
}
