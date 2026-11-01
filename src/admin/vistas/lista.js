/**
 * Lista de productos del panel.
 *
 * Desde acá se resuelve lo más frecuente sin entrar a editar:
 *  - Publicar / ocultar un producto (interruptor).
 *  - Marcar cada variante con o sin stock (desplegable "Stock").
 * Tocar el producto abre el editor completo.
 */

import { mostrarAviso } from '../componentes/avisos.js';
import { esc } from '../../js/utilidades/html.js';
import { formatearPrecio } from '../../js/utilidades/formato.js';

const FILTROS = [
  { id: 'todos', texto: 'Todos', cumple: () => true },
  { id: 'publicados', texto: 'Publicados', cumple: (p) => p.estado === 'publicado' },
  { id: 'ocultos', texto: 'Ocultos', cumple: (p) => p.estado === 'oculto' },
  { id: 'sin-stock', texto: 'Con faltantes', cumple: (p) => p.variantes.some((v) => !v.enStock) },
];

/** @param {{ contenedor: HTMLElement, repositorio: Object }} contexto */
export async function vistaLista({ contenedor, repositorio }) {
  contenedor.innerHTML = '<p class="cargando" role="status">Cargando productos…</p>';

  let productos;
  try {
    productos = await repositorio.listarProductos();
  } catch (error) {
    contenedor.innerHTML = `<p class="vacio">No se pudieron cargar los productos: ${esc(error.message)}</p>`;
    return {};
  }

  let filtroActivo = 'todos';
  let busqueda = '';

  contenedor.innerHTML = `
    <div class="admin-titulo">
      <h1>Productos</h1>
      <a class="boton" href="#/nuevo">+ Nuevo producto</a>
    </div>

    <label class="campo">
      <span class="visualmente-oculto">Buscar</span>
      <input class="campo__control" type="search" placeholder="Buscar por nombre…" data-buscar />
    </label>

    <div class="admin-filtros" role="group" aria-label="Filtrar" data-filtros></div>
    <ul class="lista-productos" data-lista></ul>
  `;

  const lista = contenedor.querySelector('[data-lista]');
  const filtros = contenedor.querySelector('[data-filtros]');

  function pintar() {
    filtros.innerHTML = FILTROS.map((f) => `
      <button type="button" class="chip chip--secundario" data-filtro="${f.id}"
              aria-pressed="${f.id === filtroActivo}">
        ${f.texto} (${productos.filter(f.cumple).length})
      </button>`).join('');

    const filtro = FILTROS.find((f) => f.id === filtroActivo);
    const texto = busqueda.toLowerCase();
    const visibles = productos
      .filter(filtro.cumple)
      .filter((p) => p.nombre.toLowerCase().includes(texto))
      .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre));

    lista.innerHTML = visibles.length
      ? visibles.map(filaHtml).join('')
      : '<li class="vacio">No hay productos para mostrar.</li>';
  }
  pintar();

  // ----- Eventos -----
  const control = new AbortController();
  const { signal } = control;

  contenedor.querySelector('[data-buscar]').addEventListener('input', (e) => {
    busqueda = e.target.value.trim();
    pintar();
  }, { signal });

  filtros.addEventListener('click', (e) => {
    const boton = e.target.closest('[data-filtro]');
    if (!boton) return;
    filtroActivo = boton.dataset.filtro;
    pintar();
  }, { signal });

  lista.addEventListener('change', async (e) => {
    const casilla = e.target;
    const producto = productos.find((p) => p.id === casilla.closest('[data-producto]')?.dataset.producto);
    if (!producto) return;

    casilla.disabled = true;
    try {
      if (casilla.matches('[data-publicar]')) {
        const estado = casilla.checked ? 'publicado' : 'oculto';
        await repositorio.actualizarProducto(producto.id, { estado });
        producto.estado = estado;
        mostrarAviso(`"${producto.nombre}" ${estado === 'publicado' ? 'publicado' : 'oculto'}.`);
      } else if (casilla.matches('[data-stock]')) {
        const variante = producto.variantes.find((v) => v.id === casilla.dataset.stock);
        await repositorio.actualizarVariante(variante.id, { enStock: casilla.checked });
        variante.enStock = casilla.checked;
        mostrarAviso(`${producto.nombre} · ${variante.nombre}: ${casilla.checked ? 'en stock' : 'sin stock'}.`);
      }
      // Se actualizan los contadores de los filtros sin redibujar la lista
      // (así el desplegable de stock que está abierto no se cierra).
      filtros.querySelectorAll('[data-filtro]').forEach((boton) => {
        const f = FILTROS.find((x) => x.id === boton.dataset.filtro);
        boton.textContent = `${f.texto} (${productos.filter(f.cumple).length})`;
      });
      actualizarFila(casilla.closest('[data-producto]'), producto);
    } catch (error) {
      casilla.checked = !casilla.checked; // se revierte el cambio visual
      mostrarAviso(error.message, 'error');
    } finally {
      casilla.disabled = false;
    }
  }, { signal });

  return { limpiar: () => control.abort() };
}

/* -------------------------------------------------------------------------- */

function filaHtml(producto) {
  const foto = producto.fotos[0];
  const precios = producto.variantes.map((v) => v.precio);
  const publicado = producto.estado === 'publicado';

  return `
    <li class="fila-producto${publicado ? '' : ' fila-producto--oculto'}" data-producto="${esc(producto.id)}">
      <a class="fila-producto__principal" href="#/editar/${esc(producto.id)}">
        ${foto
          ? `<img class="fila-producto__foto" src="${esc(foto.url)}" alt="" loading="lazy" />`
          : '<span class="fila-producto__foto fila-producto__foto--vacia">sin foto</span>'}
        <span class="fila-producto__texto">
          <strong>${esc(producto.nombre)}</strong>
          <small>
            ${producto.variantes.length} ${producto.variantes.length === 1 ? 'variante' : 'variantes'}
            ${precios.length ? ` · desde ${formatearPrecio(Math.min(...precios))}` : ''}
          </small>
          <small class="fila-producto__estado" data-resumen>${resumenEstado(producto)}</small>
        </span>
      </a>

      <label class="interruptor">
        <input type="checkbox" data-publicar ${publicado ? 'checked' : ''} />
        <span class="interruptor__texto">Publicado</span>
      </label>

      ${producto.variantes.length ? `
        <details class="fila-producto__stock">
          <summary>Stock</summary>
          <ul>
            ${producto.variantes.map((v) => `
              <li>
                <label class="interruptor">
                  <input type="checkbox" data-stock="${esc(v.id)}" ${v.enStock ? 'checked' : ''} />
                  <span class="interruptor__texto">${esc(v.nombre)}${v.visible ? '' : ' (oculta)'}</span>
                </label>
              </li>`).join('')}
          </ul>
        </details>` : ''}
    </li>`;
}

function resumenEstado(producto) {
  if (producto.estado === 'oculto') return 'Oculto en la web';
  const sinStock = producto.variantes.filter((v) => !v.enStock).length;
  if (!producto.variantes.length) return 'Sin variantes: no se muestra';
  if (sinStock === producto.variantes.length) return 'Sin stock';
  if (sinStock) return `${sinStock} sin stock`;
  return 'Visible en la web';
}

function actualizarFila(fila, producto) {
  fila.classList.toggle('fila-producto--oculto', producto.estado !== 'publicado');
  fila.querySelector('[data-resumen]').textContent = resumenEstado(producto);
}
