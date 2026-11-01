/**
 * Repositorio del MODO DEMO: guarda todo en el navegador (ver almacen-demo.js).
 * No pide login. Las fotos se guardan como texto "data:" dentro del catálogo.
 * Interfaz documentada en `repositorio.js`.
 */

import {
  guardarCatalogoDemo,
  leerCatalogoDemo,
  restablecerCatalogoDemo,
} from '../../datos/almacen-demo.js';
import { normalizarColores } from '../../js/servicios/apariencia.js';
import { blobADataUrl } from '../utilidades/imagenes.js';

export const modo = 'demo';

let datos = leerCatalogoDemo();

/** Reemplaza los datos y los guarda; si falla, deja todo como estaba. */
function persistir(nuevosDatos) {
  guardarCatalogoDemo(nuevosDatos);
  datos = nuevosDatos;
}

export async function obtenerUsuario() {
  return { email: 'demo', nombre: 'Modo demo' };
}

export async function iniciarSesion() {
  return obtenerUsuario();
}

export async function cerrarSesion() {}

export async function listarCategorias() {
  return structuredClone(datos.categorias);
}

export async function listarProductos() {
  return structuredClone(datos.productos);
}

export async function guardarProducto(producto) {
  const repetido = datos.productos.find((p) => p.slug === producto.slug && p.id !== producto.id);
  if (repetido) {
    throw new Error(`Ya existe otro producto con el enlace "${producto.slug}". Cambiá el nombre.`);
  }

  const fotos = await Promise.all(
    producto.fotos.map(async (foto, indice) => ({
      id: foto.id,
      url: foto.archivo ? await blobADataUrl(foto.archivo) : foto.url,
      alt: foto.alt,
      varianteId: foto.varianteId,
      orden: indice,
      categorias: [...foto.categorias],
    })),
  );

  const guardado = {
    ...producto,
    variantes: producto.variantes.map((v, indice) => ({ ...v, orden: indice })),
    fotos,
  };

  const existe = datos.productos.some((p) => p.id === producto.id);
  const productos = existe
    ? datos.productos.map((p) => (p.id === producto.id ? guardado : p))
    : [...datos.productos, guardado];

  persistir({ ...datos, productos });
  return structuredClone(guardado);
}

export async function actualizarProducto(id, cambios) {
  persistir({
    ...datos,
    productos: datos.productos.map((p) => (p.id === id ? { ...p, ...cambios } : p)),
  });
}

export async function actualizarVariante(id, cambios) {
  persistir({
    ...datos,
    productos: datos.productos.map((p) => ({
      ...p,
      variantes: p.variantes.map((v) => (v.id === id ? { ...v, ...cambios } : v)),
    })),
  });
}

export async function eliminarProducto(producto) {
  persistir({ ...datos, productos: datos.productos.filter((p) => p.id !== producto.id) });
}

export async function guardarCategorias(cambios) {
  const porId = new Map(datos.categorias.map((c) => [c.id, c]));
  cambios.forEach((c) => porId.set(c.id, { ...porId.get(c.id), ...c }));
  persistir({ ...datos, categorias: [...porId.values()] });
}

export async function eliminarCategoria(id) {
  // Igual que en la base: se van las subcategorías y se quitan de las fotos.
  const ids = new Set([id, ...datos.categorias.filter((c) => c.padreId === id).map((c) => c.id)]);
  persistir({
    ...datos,
    categorias: datos.categorias.filter((c) => !ids.has(c.id)),
    productos: datos.productos.map((p) => ({
      ...p,
      fotos: p.fotos.map((f) => ({ ...f, categorias: f.categorias.filter((c) => !ids.has(c)) })),
    })),
  });
}

export async function listarPortada() {
  // Las diapositivas de ejemplo no traen id ni orden: se completan acá.
  return datos.portada.map((d, indice) => ({
    id: d.id ?? `demo-${indice}`,
    urlMovil: null,
    titulo: '',
    subtitulo: '',
    enlace: '',
    textoBoton: '',
    activa: true,
    orden: indice,
    ...structuredClone(d),
  }));
}

export async function guardarPortada(diapositivas) {
  const portada = await Promise.all(
    diapositivas.map(async ({ archivo, archivoMovil, ...diapositiva }, indice) => ({
      ...diapositiva,
      url: archivo ? await blobADataUrl(archivo) : diapositiva.url,
      urlMovil: archivoMovil ? await blobADataUrl(archivoMovil) : diapositiva.urlMovil,
      orden: indice,
    })),
  );
  persistir({ ...datos, portada });
}

export async function obtenerColores() {
  return normalizarColores(datos.ajustes);
}

export async function guardarColores(colores) {
  persistir({ ...datos, ajustes: normalizarColores(colores) });
}

/** Solo demo: descarta los cambios y vuelve a los datos de ejemplo. */
export function restablecer() {
  restablecerCatalogoDemo();
  datos = leerCatalogoDemo();
}
