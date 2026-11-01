/**
 * Sección Categorías. Ruta: #/categorias
 *
 * Muestra cada categoría principal como un desplegable con sus subcategorías
 * (opcionales). Cada cambio se guarda en el momento, sin botón "Guardar":
 *   - Renombrar: al salir del campo o tocar Enter.
 *   - "En el menú": muestra u oculta la categoría en el menú de la web.
 *   - ↑ ↓: cambia el orden en el menú.
 *   - Agregar y eliminar.
 */

import { mostrarAviso } from '../componentes/avisos.js';
import { hijasDe, nuevaCategoria, renombrarCategoria } from '../utilidades/categorias.js';
import { esc } from '../../js/utilidades/html.js';

/**
 * @param {{ contenedor: HTMLElement, repositorio: Object }} contexto
 */
export async function vistaCategorias({ contenedor, repositorio }) {
  contenedor.innerHTML = '<p class="cargando" role="status">Cargando…</p>';

  const [categoriasIniciales, productos] = await Promise.all([
    repositorio.listarCategorias(),
    repositorio.listarProductos(),
  ]);
  let categorias = categoriasIniciales;
  const fotosPorCategoria = contarFotos(productos);
  const abiertas = new Set(); // desplegables abiertos (se conservan al redibujar)
  let ocupado = false;

  contenedor.innerHTML = `
    <div class="admin-titulo">
      <h1>Categorías</h1>
    </div>
    <p class="panel__ayuda categorias-admin__ayuda">
      Son las secciones del menú de la web. Tocá una categoría para ver y editar sus
      subcategorías, que son opcionales. Los cambios se guardan solos.
    </p>
    <ul class="categorias-admin" data-lista></ul>
    <form class="panel agregar-categoria agregar-categoria--principal" data-agregar data-padre="">
      <label class="visualmente-oculto" for="nueva-principal">Nueva categoría</label>
      <input class="campo__control" id="nueva-principal" name="nombre" maxlength="40"
             placeholder="Nueva categoría. Ej: Aros" autocomplete="off" />
      <button type="submit" class="boton boton--chico">Agregar</button>
    </form>`;

  const lista = contenedor.querySelector('[data-lista]');
  const buscar = (id) => categorias.find((c) => c.id === id);

  function pintar() {
    const principales = hijasDe(categorias, null);
    lista.innerHTML = principales.length
      ? principales
          .map((p, i) => principalHtml(p, i, principales.length, categorias, fotosPorCategoria, abiertas.has(p.id)))
          .join('')
      : '<li class="vacio">Todavía no hay categorías.</li>';
  }

  /** Enfoca un control después de redibujar (para quien usa teclado). */
  function enfocar(selector) {
    contenedor.querySelector(selector)?.focus();
  }

  /** Guarda cambios y recarga la lista. Devuelve false si falló. */
  async function guardar(cambios, mensaje) {
    try {
      await repositorio.guardarCategorias(cambios);
      categorias = await repositorio.listarCategorias();
      if (mensaje) mostrarAviso(mensaje);
      return true;
    } catch (error) {
      mostrarAviso(error.message, 'error');
      return false;
    }
  }

  /* ----- Acciones ----- */

  async function renombrar(categoria, entrada) {
    let actualizada;
    try {
      actualizada = renombrarCategoria(categoria, entrada.value, categorias);
    } catch (error) {
      mostrarAviso(error.message, 'error');
      entrada.value = categoria.nombre;
      return;
    }
    if (actualizada.nombre === categoria.nombre) return;

    if (await guardar([actualizada], `Guardado: "${actualizada.nombre}".`)) {
      // Sin redibujar, para no sacar el foco del campo siguiente.
      const titulo = lista.querySelector(`details[data-id="${CSS.escape(categoria.id)}"] [data-nombre]`);
      if (titulo) titulo.textContent = actualizada.nombre;
    } else {
      entrada.value = categoria.nombre;
    }
  }

  async function cambiarMenu(categoria, casilla) {
    const ok = await guardar(
      [{ ...categoria, enMenu: casilla.checked }],
      casilla.checked ? `"${categoria.nombre}" se muestra en el menú.` : `"${categoria.nombre}" ya no se muestra en el menú.`,
    );
    if (!ok) casilla.checked = !casilla.checked;
    pintar();
    enfocar(`.fila-categoria[data-id="${CSS.escape(categoria.id)}"] [data-menu]`);
  }

  async function mover(categoria, salto) {
    const hermanas = hijasDe(categorias, categoria.padreId);
    const desde = hermanas.findIndex((c) => c.id === categoria.id);
    const hasta = desde + salto;
    if (hasta < 0 || hasta >= hermanas.length) return;

    hermanas.splice(hasta, 0, ...hermanas.splice(desde, 1));
    await guardar(hermanas.map((c, i) => ({ ...c, orden: i + 1 })));
    pintar();
    const fila = `.fila-categoria[data-id="${CSS.escape(categoria.id)}"]`;
    enfocar(`${fila} [data-accion="${salto < 0 ? 'subir' : 'bajar'}"]:not(:disabled), ${fila} [data-accion]`);
  }

  async function eliminar(categoria) {
    const hijas = hijasDe(categorias, categoria.id);
    const fotos = new Set([categoria, ...hijas].flatMap((c) => [...(fotosPorCategoria.get(c.id) ?? [])])).size;
    const mensaje = [
      `¿Eliminar "${categoria.nombre}"${hijas.length ? ` y sus ${hijas.length} subcategorías` : ''}?`,
      fotos
        ? `${fotos === 1 ? 'Hay 1 foto que la usa' : `Hay ${fotos} fotos que la usan`}: no se borran, pero dejan de aparecer en esta sección.`
        : '',
    ].filter(Boolean).join('\n\n');
    if (!confirm(mensaje)) return;

    try {
      await repositorio.eliminarCategoria(categoria.id);
      categorias = await repositorio.listarCategorias();
      mostrarAviso(`"${categoria.nombre}" eliminada.`);
    } catch (error) {
      mostrarAviso(error.message, 'error');
    }
    pintar();
  }

  async function agregar(formulario) {
    const padreId = formulario.dataset.padre || null;
    const entrada = formulario.elements.nombre;
    let nueva;
    try {
      nueva = nuevaCategoria(entrada.value, padreId, categorias);
    } catch (error) {
      mostrarAviso(error.message, 'error');
      entrada.focus();
      return;
    }
    if (!(await guardar([nueva], `"${nueva.nombre}" agregada.`))) return;

    abiertas.add(padreId ?? nueva.id); // deja a la vista lo que se acaba de crear
    entrada.value = '';
    pintar();
    enfocar(`[data-agregar][data-padre="${CSS.escape(padreId ?? '')}"] input`);
  }

  /* ----- Eventos ----- */

  const control = new AbortController();
  const { signal } = control;

  /** Evita dos operaciones a la vez (ej: doble toque). */
  const enSerie = (accion) => async (...argumentos) => {
    if (ocupado) return;
    ocupado = true;
    try {
      await accion(...argumentos);
    } finally {
      ocupado = false;
    }
  };

  contenedor.addEventListener('click', enSerie(async (e) => {
    const boton = e.target.closest('[data-accion]');
    if (!boton) return;
    const categoria = buscar(boton.closest('[data-id]').dataset.id);
    if (boton.dataset.accion === 'eliminar') return eliminar(categoria);
    return mover(categoria, boton.dataset.accion === 'subir' ? -1 : 1);
  }), { signal });

  contenedor.addEventListener('change', enSerie(async (e) => {
    const categoria = buscar(e.target.closest('[data-id]')?.dataset.id);
    if (!categoria) return;
    if (e.target.matches('[data-renombrar]')) return renombrar(categoria, e.target);
    if (e.target.matches('[data-menu]')) return cambiarMenu(categoria, e.target);
  }), { signal });

  // Enter en un nombre confirma el cambio (dispara `change` al perder el foco).
  contenedor.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('[data-renombrar]')) e.target.blur();
  }, { signal });

  contenedor.addEventListener('submit', (e) => {
    e.preventDefault();
    enSerie(agregar)(e.target);
  }, { signal });

  // El evento `toggle` no burbujea: se escucha en la fase de captura.
  contenedor.addEventListener('toggle', (e) => {
    if (!e.target.matches('details[data-id]')) return;
    if (e.target.open) abiertas.add(e.target.dataset.id);
    else abiertas.delete(e.target.dataset.id);
  }, { signal, capture: true });

  pintar();

  return { limpiar: () => control.abort() };
}

/* -------------------------------------------------------------------------- */
/* Datos                                                                      */
/* -------------------------------------------------------------------------- */

/** Map categoría → Set de ids de fotos que la usan. */
function contarFotos(productos) {
  const mapa = new Map();
  for (const foto of productos.flatMap((p) => p.fotos)) {
    for (const id of foto.categorias) {
      if (!mapa.has(id)) mapa.set(id, new Set());
      mapa.get(id).add(foto.id);
    }
  }
  return mapa;
}

/* -------------------------------------------------------------------------- */
/* HTML                                                                       */
/* -------------------------------------------------------------------------- */

function principalHtml(principal, indice, total, categorias, fotosPorCategoria, abierta) {
  const hijas = hijasDe(categorias, principal.id);
  const fotos = new Set([principal, ...hijas].flatMap((c) => [...(fotosPorCategoria.get(c.id) ?? [])])).size;
  const detalle = [
    hijas.length === 1 ? '1 subcategoría' : `${hijas.length} subcategorías`,
    fotos === 1 ? '1 foto' : `${fotos} fotos`,
    principal.enMenu ? '' : 'oculta del menú',
  ].filter(Boolean).join(' · ');

  return `
    <li class="categoria-admin">
      <details data-id="${esc(principal.id)}" ${abierta ? 'open' : ''}>
        <summary class="categoria-admin__resumen">
          <span class="categoria-admin__nombre" data-nombre>${esc(principal.nombre)}</span>
          <span class="categoria-admin__detalle">${detalle}</span>
        </summary>
        <div class="categoria-admin__cuerpo">
          ${filaHtml(principal, indice, total, 'div')}

          <p class="categoria-admin__subtitulo">Subcategorías (opcionales)</p>
          ${hijas.length
            ? `<ul class="subcategorias-admin">${hijas.map((h, i) => filaHtml(h, i, hijas.length, 'li')).join('')}</ul>`
            : '<p class="panel__ayuda">Sin subcategorías: la categoría muestra todas sus piezas juntas.</p>'}

          <form class="agregar-categoria" data-agregar data-padre="${esc(principal.id)}">
            <input class="campo__control" name="nombre" maxlength="40" autocomplete="off"
                   placeholder="Nueva subcategoría de ${esc(principal.nombre)}"
                   aria-label="Nueva subcategoría de ${esc(principal.nombre)}" />
            <button type="submit" class="boton boton--contorno boton--chico">Agregar</button>
          </form>
        </div>
      </details>
    </li>`;
}

/** Fila editable de una categoría: nombre, "En el menú", orden y eliminar. */
function filaHtml(categoria, indice, total, etiqueta) {
  return `
    <${etiqueta} class="fila-categoria" data-id="${esc(categoria.id)}">
      <input class="campo__control fila-categoria__nombre" data-renombrar maxlength="40"
             value="${esc(categoria.nombre)}" aria-label="Nombre de ${esc(categoria.nombre)}" />
      <label class="interruptor">
        <input type="checkbox" data-menu ${categoria.enMenu ? 'checked' : ''} />
        <span class="interruptor__texto">En el menú</span>
      </label>
      <div class="fila-categoria__acciones">
        <button type="button" class="boton-icono" data-accion="subir" ${indice === 0 ? 'disabled' : ''}
                aria-label="Mover antes" title="Mover antes">↑</button>
        <button type="button" class="boton-icono" data-accion="bajar" ${indice === total - 1 ? 'disabled' : ''}
                aria-label="Mover después" title="Mover después">↓</button>
        <button type="button" class="boton-texto boton-texto--peligro" data-accion="eliminar">Eliminar</button>
      </div>
    </${etiqueta}>`;
}
