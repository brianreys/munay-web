/**
 * Repositorio REAL: lee y escribe en Supabase como usuaria administradora.
 * Interfaz documentada en `repositorio.js`.
 *
 * Seguridad: todas las escrituras pasan por las políticas RLS de
 * `supabase/esquema.sql`, que solo las permiten a usuarios de la tabla
 * `administradores`. Este código no puede saltearse esa protección.
 *
 * Nota: guardar un producto son varias operaciones seguidas (producto,
 * variantes, fotos, categorías). Si se corta internet a mitad de camino,
 * volver a guardar completa lo que faltó, porque todo usa "upsert".
 */

import { CLAVES_AJUSTES, coloresDesdeFilas, normalizarColores } from '../../js/servicios/apariencia.js';
import { BUCKETS, supabase, urlPublica } from '../../js/servicios/supabase-cliente.js';
import { extensionDe } from '../utilidades/imagenes.js';

export const modo = 'supabase';

const CONSULTA_PRODUCTOS = `
  id, slug, nombre, descripcion, etiqueta_variante, estado, destacado, orden,
  variantes ( id, nombre, precio, en_stock, visible, orden ),
  fotos ( id, ruta, alt, orden, variante_id, foto_categorias ( categoria_id ) )
`;

/* -------------------------------------------------------------------------- */
/* Sesión                                                                     */
/* -------------------------------------------------------------------------- */

export async function obtenerUsuario() {
  const { data } = await supabase.auth.getSession();
  const sesion = data.session;
  if (!sesion) return null;

  // Además de estar logueada, la cuenta tiene que figurar como administradora.
  const { data: admin, error } = await supabase
    .from('administradores')
    .select('nombre')
    .eq('user_id', sesion.user.id)
    .maybeSingle();
  if (error) throw traducirError(error);
  if (!admin) {
    await supabase.auth.signOut();
    throw new Error('Esta cuenta no tiene permisos de administración.');
  }
  return { email: sesion.user.email, nombre: admin.nombre };
}

export async function iniciarSesion(email, clave) {
  const { error } = await supabase.auth.signInWithPassword({ email, password: clave });
  if (error) throw new Error('Email o contraseña incorrectos.');
  return obtenerUsuario();
}

export async function cerrarSesion() {
  await supabase.auth.signOut();
}

/* -------------------------------------------------------------------------- */
/* Lectura                                                                    */
/* -------------------------------------------------------------------------- */

export async function listarCategorias() {
  const { data, error } = await supabase
    .from('categorias')
    .select('id, slug, nombre, padre_id, en_menu, orden')
    .order('orden');
  if (error) throw traducirError(error);
  return data.map((fila) => ({
    id: fila.id,
    slug: fila.slug,
    nombre: fila.nombre,
    padreId: fila.padre_id,
    enMenu: fila.en_menu,
    orden: fila.orden,
  }));
}

export async function listarProductos() {
  const { data, error } = await supabase.from('productos').select(CONSULTA_PRODUCTOS).order('orden');
  if (error) throw traducirError(error);
  return data.map(mapearProducto);
}

function mapearProducto(fila) {
  const porOrden = (a, b) => a.orden - b.orden;
  return {
    id: fila.id,
    slug: fila.slug,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    etiquetaVariante: fila.etiqueta_variante,
    estado: fila.estado,
    destacado: fila.destacado,
    orden: fila.orden,
    variantes: fila.variantes
      .map((v) => ({
        id: v.id,
        nombre: v.nombre,
        precio: Number(v.precio),
        enStock: v.en_stock,
        visible: v.visible,
        orden: v.orden,
      }))
      .sort(porOrden),
    fotos: fila.fotos
      .map((f) => ({
        id: f.id,
        ruta: f.ruta,
        url: urlPublica(BUCKETS.productos, f.ruta),
        alt: f.alt,
        orden: f.orden,
        varianteId: f.variante_id,
        categorias: f.foto_categorias.map((r) => r.categoria_id),
      }))
      .sort(porOrden),
  };
}

/* -------------------------------------------------------------------------- */
/* Escritura                                                                  */
/* -------------------------------------------------------------------------- */

export async function guardarProducto(producto) {
  // 1. Producto
  await ejecutar(
    supabase.from('productos').upsert({
      id: producto.id,
      slug: producto.slug,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      etiqueta_variante: producto.etiquetaVariante,
      estado: producto.estado,
      destacado: producto.destacado,
      orden: producto.orden,
    }),
  );

  // 2. Variantes: se borran las quitadas y se guardan las actuales.
  await borrarQuitadas('variantes', producto.id, producto.variantes.map((v) => v.id));
  if (producto.variantes.length) {
    await ejecutar(
      supabase.from('variantes').upsert(
        producto.variantes.map((v, indice) => ({
          id: v.id,
          producto_id: producto.id,
          nombre: v.nombre,
          precio: v.precio,
          en_stock: v.enStock,
          visible: v.visible,
          orden: indice,
        })),
      ),
    );
  }

  // 3. Fotos quitadas: se borran la fila y el archivo.
  const { data: fotosPrevias, error } = await supabase
    .from('fotos')
    .select('id, ruta')
    .eq('producto_id', producto.id);
  if (error) throw traducirError(error);

  const idsActuales = new Set(producto.fotos.map((f) => f.id));
  const quitadas = fotosPrevias.filter((f) => !idsActuales.has(f.id));
  if (quitadas.length) {
    await ejecutar(supabase.from('fotos').delete().in('id', quitadas.map((f) => f.id)));
    await supabase.storage.from(BUCKETS.productos).remove(quitadas.map((f) => f.ruta));
  }

  // 4. Fotos nuevas: se suben a Storage en la carpeta del producto.
  const filasFotos = [];
  for (const [indice, foto] of producto.fotos.entries()) {
    let ruta = foto.ruta;
    if (foto.archivo) {
      ruta = `${producto.id}/${foto.id}.${extensionDe(foto.archivo)}`;
      const { error: errorSubida } = await supabase.storage
        .from(BUCKETS.productos)
        .upload(ruta, foto.archivo, {
          contentType: foto.archivo.type,
          cacheControl: '31536000', // el archivo nunca cambia: se puede cachear un año
          upsert: true,
        });
      if (errorSubida) throw new Error(`No se pudo subir una foto: ${errorSubida.message}`);
    }
    filasFotos.push({
      id: foto.id,
      producto_id: producto.id,
      variante_id: foto.varianteId,
      ruta,
      alt: foto.alt,
      orden: indice,
    });
  }

  if (filasFotos.length) {
    await ejecutar(supabase.from('fotos').upsert(filasFotos));

    // 5. Categorías de cada foto: se reemplazan por las actuales.
    const idsFotos = filasFotos.map((f) => f.id);
    await ejecutar(supabase.from('foto_categorias').delete().in('foto_id', idsFotos));
    const relaciones = producto.fotos.flatMap((foto) =>
      foto.categorias.map((categoriaId) => ({ foto_id: foto.id, categoria_id: categoriaId })),
    );
    if (relaciones.length) await ejecutar(supabase.from('foto_categorias').insert(relaciones));
  }
}

export async function actualizarProducto(id, { estado }) {
  await ejecutar(supabase.from('productos').update({ estado }).eq('id', id));
}

export async function actualizarVariante(id, { enStock }) {
  await ejecutar(supabase.from('variantes').update({ en_stock: enStock }).eq('id', id));
}

export async function eliminarProducto(producto) {
  const rutas = producto.fotos.map((f) => f.ruta).filter(Boolean);
  // Al borrar el producto, la base borra en cascada variantes, fotos y categorías.
  await ejecutar(supabase.from('productos').delete().eq('id', producto.id));
  if (rutas.length) await supabase.storage.from(BUCKETS.productos).remove(rutas);
}

export async function guardarCategorias(categorias) {
  await ejecutar(
    supabase.from('categorias').upsert(
      categorias.map((c) => ({
        id: c.id,
        slug: c.slug,
        nombre: c.nombre,
        padre_id: c.padreId,
        en_menu: c.enMenu,
        orden: c.orden,
      })),
    ),
  );
}

export async function eliminarCategoria(id) {
  // Primero las subcategorías (la base no deja borrar una principal con hijas).
  // Las fotos pierden esas etiquetas solas: foto_categorias borra en cascada.
  await ejecutar(supabase.from('categorias').delete().eq('padre_id', id));
  await ejecutar(supabase.from('categorias').delete().eq('id', id));
}

/* -------------------------------------------------------------------------- */
/* Portada (carrusel)                                                         */
/* -------------------------------------------------------------------------- */

export async function listarPortada() {
  const { data, error } = await supabase
    .from('portada')
    .select('id, ruta, ruta_movil, titulo, subtitulo, enlace, texto_boton, activa, orden')
    .order('orden');
  if (error) throw traducirError(error);
  return data.map((fila) => ({
    id: fila.id,
    ruta: fila.ruta,
    url: urlPublica(BUCKETS.portada, fila.ruta),
    rutaMovil: fila.ruta_movil,
    urlMovil: fila.ruta_movil ? urlPublica(BUCKETS.portada, fila.ruta_movil) : null,
    titulo: fila.titulo,
    subtitulo: fila.subtitulo,
    enlace: fila.enlace,
    textoBoton: fila.texto_boton,
    activa: fila.activa,
    orden: fila.orden,
  }));
}

/**
 * Reemplaza todas las diapositivas por las recibidas: sube las fotos nuevas,
 * guarda las filas y borra las diapositivas (y archivos) que ya no están.
 */
export async function guardarPortada(diapositivas) {
  const { data: previas, error } = await supabase.from('portada').select('id, ruta, ruta_movil');
  if (error) throw traducirError(error);

  /** Sube una foto con nombre nuevo (el archivo se cachea un año, así que nunca se pisa). */
  async function subir(id, sufijo, archivo) {
    const ruta = `${id}-${sufijo}${Date.now()}.${extensionDe(archivo)}`;
    const { error: errorSubida } = await supabase.storage
      .from(BUCKETS.portada)
      .upload(ruta, archivo, { contentType: archivo.type, cacheControl: '31536000' });
    if (errorSubida) throw new Error(`No se pudo subir una foto: ${errorSubida.message}`);
    return ruta;
  }

  const filas = [];
  for (const [indice, d] of diapositivas.entries()) {
    const ruta = d.archivo ? await subir(d.id, '', d.archivo) : d.ruta;
    const rutaMovil = d.archivoMovil ? await subir(d.id, 'movil-', d.archivoMovil) : (d.rutaMovil ?? null);
    filas.push({
      id: d.id,
      ruta,
      ruta_movil: rutaMovil,
      titulo: d.titulo,
      subtitulo: d.subtitulo,
      enlace: d.enlace,
      texto_boton: d.textoBoton,
      activa: d.activa,
      orden: indice,
    });
  }

  if (filas.length) await ejecutar(supabase.from('portada').upsert(filas));

  const idsActuales = new Set(filas.map((f) => f.id));
  const quitadas = previas.filter((p) => !idsActuales.has(p.id));
  if (quitadas.length) await ejecutar(supabase.from('portada').delete().in('id', quitadas.map((p) => p.id)));

  // Archivos que ya nadie usa (diapositivas quitadas o fotos reemplazadas).
  const rutasEnUso = new Set(filas.flatMap((f) => [f.ruta, f.ruta_movil]));
  const sinUso = previas.flatMap((p) => [p.ruta, p.ruta_movil]).filter((ruta) => ruta && !rutasEnUso.has(ruta));
  if (sinUso.length) await supabase.storage.from(BUCKETS.portada).remove(sinUso);
}

/* -------------------------------------------------------------------------- */
/* Colores (tabla ajustes)                                                    */
/* -------------------------------------------------------------------------- */

export async function obtenerColores() {
  const { data, error } = await supabase.from('ajustes').select('clave, valor');
  if (error) throw traducirError(error);
  return coloresDesdeFilas(data);
}

export async function guardarColores(colores) {
  const normalizados = normalizarColores(colores);
  await ejecutar(
    supabase.from('ajustes').upsert(
      Object.entries(CLAVES_AJUSTES).map(([campo, clave]) => ({
        clave,
        valor: normalizados[campo],
        actualizado_en: new Date().toISOString(),
      })),
    ),
  );
}

/* -------------------------------------------------------------------------- */
/* Auxiliares                                                                 */
/* -------------------------------------------------------------------------- */

/** Ejecuta una consulta y lanza un error legible si falla. */
async function ejecutar(consulta) {
  const { error } = await consulta;
  if (error) throw traducirError(error);
}

/** Borra las filas del producto cuyo id ya no está en la lista. */
async function borrarQuitadas(tabla, productoId, idsVigentes) {
  let consulta = supabase.from(tabla).delete().eq('producto_id', productoId);
  if (idsVigentes.length) consulta = consulta.not('id', 'in', `(${idsVigentes.join(',')})`);
  await ejecutar(consulta);
}

/** Convierte errores técnicos de la base en mensajes entendibles. */
function traducirError(error) {
  // Columna o tabla inexistente: la base no tiene la última migración.
  if (['42703', '42P01', 'PGRST204', 'PGRST205'].includes(error.code)) {
    return new Error(
      'Falta actualizar la base de datos: ejecutá en Supabase el archivo supabase/migraciones/01-portada-movil-y-colores.sql (ver docs/SUPABASE.md).',
    );
  }
  if (error.code === '23505' && error.message.includes('categorias')) {
    return new Error('Ya existe una categoría con ese nombre en ese nivel.');
  }
  if (error.code === '23505') {
    return new Error('Ya existe otro producto con ese nombre. Cambiá el nombre e intentá de nuevo.');
  }
  if (error.code === '42501') {
    return new Error('Tu cuenta no tiene permiso para hacer este cambio.');
  }
  return new Error(error.message || 'Ocurrió un error al comunicarse con la base de datos.');
}
