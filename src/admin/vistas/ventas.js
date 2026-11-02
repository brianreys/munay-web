/**
 * Sección Ventas. Ruta: #/ventas
 *
 * - Registrar una venta: se elige el producto (y su variante), la cantidad y
 *   el precio. Al guardar se descuenta el stock de esa variante.
 * - Historial de las últimas ventas, con la opción de anular una venta
 *   (por ejemplo, si se cargó mal): devuelve las unidades al stock.
 *
 * Las variantes "sin contar" (sin cantidad cargada) se pueden vender igual:
 * la venta queda registrada pero no hay unidades que descontar.
 */

import { mostrarAviso } from '../componentes/avisos.js';
import { formatearPrecio } from '../../js/utilidades/formato.js';
import { esc } from '../../js/utilidades/html.js';

/** @param {{ contenedor: HTMLElement, repositorio: Object }} contexto */
export async function vistaVentas({ contenedor, repositorio }) {
  contenedor.innerHTML = '<p class="cargando" role="status">Cargando…</p>';

  let productos;
  let ventas;
  try {
    [productos, ventas] = await Promise.all([repositorio.listarProductos(), repositorio.listarVentas()]);
  } catch (error) {
    contenedor.innerHTML = `<p class="vacio">No se pudieron cargar las ventas: ${esc(error.message)}</p>`;
    return {};
  }

  let guardando = false;

  contenedor.innerHTML = `
    <div class="admin-titulo">
      <h1>Ventas</h1>
    </div>

    <form class="panel venta-nueva" novalidate data-formulario>
      <h2 class="panel__titulo">Registrar venta</h2>
      <p class="panel__ayuda">Al registrarla se descuenta del stock del producto.</p>

      <label class="campo">
        <span class="campo__etiqueta">Producto</span>
        <select class="campo__control" name="variante" required data-variante></select>
      </label>

      <div class="venta-nueva__numeros">
        <label class="campo">
          <span class="campo__etiqueta">Cantidad</span>
          <input class="campo__control" type="number" name="cantidad" inputmode="numeric" min="1" step="1" value="1" required />
        </label>
        <label class="campo">
          <span class="campo__etiqueta">Precio por unidad ($)</span>
          <input class="campo__control" type="number" name="precio" inputmode="numeric" min="0" step="1" required />
        </label>
      </div>

      <label class="campo">
        <span class="campo__etiqueta">Nota <small>(opcional)</small></span>
        <input class="campo__control" name="nota" maxlength="200" autocomplete="off"
               placeholder="Ej: cliente, medio de pago, envío" />
      </label>

      <p class="venta-nueva__total" data-total></p>
      <p class="venta-nueva__aviso" data-aviso role="status"></p>
      <button type="submit" class="boton">Registrar venta</button>
    </form>

    <section class="panel" aria-labelledby="titulo-historial">
      <h2 class="panel__titulo" id="titulo-historial">Últimas ventas</h2>
      <p class="panel__ayuda" data-resumen></p>
      <ul class="ventas-lista" data-historial></ul>
    </section>`;

  const formulario = contenedor.querySelector('[data-formulario]');
  const selector = formulario.querySelector('[data-variante]');
  const campoCantidad = formulario.elements.cantidad;
  const campoPrecio = formulario.elements.precio;
  const historial = contenedor.querySelector('[data-historial]');
  const botonRegistrar = formulario.querySelector('[type="submit"]');

  /** Variante elegida en el selector, con su producto. */
  function elegida() {
    for (const producto of productos) {
      const variante = producto.variantes.find((v) => v.id === selector.value);
      if (variante) return { producto, variante };
    }
    return null;
  }

  function pintarSelector() {
    const anterior = selector.value;
    selector.innerHTML = opcionesHtml(productos);
    if ([...selector.options].some((o) => o.value === anterior && !o.disabled)) selector.value = anterior;
    alElegir();
  }

  /** Al cambiar de producto: precio sugerido y límite de unidades. */
  function alElegir() {
    const actual = elegida();
    if (!actual) return pintarTotal();
    campoPrecio.value = actual.variante.precio;
    if (actual.variante.cantidad != null) campoCantidad.max = actual.variante.cantidad;
    else campoCantidad.removeAttribute('max');
    pintarTotal();
  }

  function pintarTotal() {
    const actual = elegida();
    const cantidad = Number(campoCantidad.value);
    const precio = Number(campoPrecio.value);
    formulario.querySelector('[data-total]').textContent =
      actual && cantidad > 0 && campoPrecio.value !== '' ? `Total: ${formatearPrecio(cantidad * precio)}` : '';

    let aviso = '';
    if (!actual) aviso = productos.length ? '' : 'Todavía no hay productos cargados.';
    else if (actual.variante.cantidad == null) aviso = 'Este producto no tiene unidades cargadas: la venta se registra sin descontar stock.';
    else if (cantidad > actual.variante.cantidad) aviso = `Solo quedan ${actual.variante.cantidad} unidades.`;
    else aviso = `Quedan ${actual.variante.cantidad} · después de la venta: ${actual.variante.cantidad - (cantidad || 0)}.`;
    formulario.querySelector('[data-aviso]').textContent = aviso;
  }

  function pintarHistorial() {
    historial.innerHTML = ventas.length
      ? ventas.map(ventaHtml).join('')
      : '<li class="vacio">Todavía no hay ventas registradas.</li>';

    // Resumen del mes en curso (sin las anuladas).
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    const delMes = ventas.filter((v) => !v.anulada && new Date(v.fecha) >= inicioMes);
    const total = delMes.reduce((suma, v) => suma + v.cantidad * v.precioUnitario, 0);
    contenedor.querySelector('[data-resumen]').textContent = delMes.length
      ? `Este mes: ${delMes.length} ${delMes.length === 1 ? 'venta' : 'ventas'} · ${formatearPrecio(total)}`
      : 'Este mes todavía no hay ventas.';
  }

  /** Vuelve a leer productos (stock) y ventas después de un cambio. */
  async function recargar() {
    [productos, ventas] = await Promise.all([repositorio.listarProductos(), repositorio.listarVentas()]);
    pintarSelector();
    pintarHistorial();
  }

  async function registrar() {
    if (guardando) return;
    const actual = elegida();
    const cantidad = Number(campoCantidad.value);
    const precio = Number(campoPrecio.value);

    const error = !actual
      ? 'Elegí un producto.'
      : !(Number.isInteger(cantidad) && cantidad > 0)
        ? 'La cantidad tiene que ser un número entero mayor a cero.'
        : campoPrecio.value === '' || !(precio >= 0)
          ? 'Revisá el precio.'
          : actual.variante.cantidad != null && cantidad > actual.variante.cantidad
            ? `No alcanza el stock: quedan ${actual.variante.cantidad} unidades.`
            : '';
    if (error) return mostrarAviso(error, 'error');

    guardando = true;
    botonRegistrar.disabled = true;
    botonRegistrar.textContent = 'Registrando…';
    try {
      await repositorio.registrarVenta({
        varianteId: actual.variante.id,
        cantidad,
        precioUnitario: precio,
        nota: formulario.elements.nota.value.trim(),
      });
      mostrarAviso(`Venta registrada: ${cantidad} × ${nombreCompleto(actual.producto, actual.variante)}.`);
      formulario.elements.nota.value = '';
      campoCantidad.value = 1;
      await recargar();
    } catch (e) {
      mostrarAviso(e.message, 'error');
    } finally {
      guardando = false;
      botonRegistrar.disabled = false;
      botonRegistrar.textContent = 'Registrar venta';
    }
  }

  async function anular(id) {
    const venta = ventas.find((v) => v.id === id);
    const descripcion = `${venta.cantidad} × ${venta.productoNombre}${venta.varianteNombre ? ` (${venta.varianteNombre})` : ''}`;
    if (!confirm(`¿Anular la venta de ${descripcion}? Las unidades vuelven al stock.`)) return;
    try {
      await repositorio.anularVenta(id);
      mostrarAviso('Venta anulada. Las unidades volvieron al stock.');
      await recargar();
    } catch (e) {
      mostrarAviso(e.message, 'error');
    }
  }

  /* ----- Eventos ----- */

  const control = new AbortController();
  const { signal } = control;

  selector.addEventListener('change', alElegir, { signal });
  formulario.addEventListener('input', (e) => {
    if (e.target !== selector) pintarTotal();
  }, { signal });
  formulario.addEventListener('submit', (e) => {
    e.preventDefault();
    registrar();
  }, { signal });
  historial.addEventListener('click', (e) => {
    const boton = e.target.closest('[data-anular]');
    if (boton) anular(boton.dataset.anular);
  }, { signal });

  pintarSelector();
  pintarHistorial();

  return { limpiar: () => control.abort() };
}

/* -------------------------------------------------------------------------- */
/* HTML                                                                       */
/* -------------------------------------------------------------------------- */

function nombreCompleto(producto, variante) {
  return producto.variantes.length > 1 ? `${producto.nombre} (${variante.nombre})` : producto.nombre;
}

/** Opciones del selector: una por variante, por orden alfabético. Las agotadas no se pueden elegir. */
function opcionesHtml(productos) {
  const ordenados = [...productos].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const opcion = (producto, variante) => {
    const agotada = !variante.enStock || variante.cantidad === 0;
    const stock = agotada ? 'agotado' : variante.cantidad != null ? `quedan ${variante.cantidad}` : 'sin contar';
    return `<option value="${esc(variante.id)}" ${agotada ? 'disabled' : ''}>${esc(nombreCompleto(producto, variante))} · ${stock}</option>`;
  };

  return [
    '<option value="">Elegí un producto…</option>',
    ...ordenados.flatMap((p) => p.variantes.map((v) => opcion(p, v))),
  ].join('');
}

function ventaHtml(venta) {
  const fecha = new Date(venta.fecha).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
  });
  return `
    <li class="venta${venta.anulada ? ' venta--anulada' : ''}">
      <div class="venta__texto">
        <strong>${venta.cantidad} × ${esc(venta.productoNombre)}${venta.varianteNombre ? ` <span>(${esc(venta.varianteNombre)})</span>` : ''}</strong>
        <small>${fecha}${venta.nota ? ` · ${esc(venta.nota)}` : ''}${venta.anulada ? ' · Anulada' : ''}</small>
      </div>
      <span class="venta__total">${formatearPrecio(venta.cantidad * venta.precioUnitario)}</span>
      ${venta.anulada ? '' : `<button type="button" class="boton-texto boton-texto--peligro" data-anular="${esc(venta.id)}">Anular</button>`}
    </li>`;
}
