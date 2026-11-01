/**
 * Editor de producto (alta y edición). Rutas: #/nuevo · #/editar/<id>
 *
 * Trabaja sobre un "borrador" (copia del producto). Nada se guarda hasta
 * tocar "Guardar". Secciones:
 *   1. Datos      → nombre, descripción, cómo se llaman las opciones, estado.
 *   2. Variantes  → cada opción comprable: nombre, precio, stock, visible.
 *   3. Fotos      → subir (se optimizan solas), elegir variante y categorías
 *                   de CADA foto, ordenar y quitar. Al marcar una categoría se
 *                   despliegan sus subcategorías (opcionales). También se
 *                   pueden crear categorías nuevas desde acá: esas se guardan
 *                   en el momento, sin esperar a "Guardar".
 *
 * Los ids de variantes y fotos nuevas se generan acá (UUID), así una foto
 * puede apuntar a una variante que todavía no se guardó.
 */

import { mostrarAviso } from '../componentes/avisos.js';
import { conPrincipales, hijasDe, nuevaCategoria } from '../utilidades/categorias.js';
import { optimizarImagen } from '../utilidades/imagenes.js';
import { crearSlug } from '../utilidades/texto.js';
import { esc } from '../../js/utilidades/html.js';

/**
 * Títulos base del selector de variantes en la web. El primero es el valor por
 * defecto. Los que se crean con "+ Nueva categoría…" se suman solos a la lista,
 * porque se leen de los productos ya guardados.
 */
const ETIQUETAS_VARIANTE = ['Opciones', 'Color'];
const ETIQUETA_NUEVA = '__nueva__'; // valor de la opción "+ Nueva categoría…"

/**
 * @param {{ contenedor: HTMLElement, repositorio: Object, parametros: string[] }} contexto
 */
export async function vistaEditor({ contenedor, repositorio, parametros }) {
  const [idProducto] = parametros;
  contenedor.innerHTML = '<p class="cargando" role="status">Cargando…</p>';

  const [productos, categorias] = await Promise.all([
    repositorio.listarProductos(),
    repositorio.listarCategorias(),
  ]);
  const original = idProducto ? productos.find((p) => p.id === idProducto) : null;
  if (idProducto && !original) {
    contenedor.innerHTML = '<p class="vacio">Este producto no existe. <a href="#/">Volver a la lista</a></p>';
    return {};
  }

  const esNuevo = !original;
  const borrador = original ? structuredClone(original) : productoNuevo(productos);
  // Fotos cargadas solo con la subcategoría: se marca también su principal,
  // así el selector la muestra desplegada.
  borrador.fotos.forEach((foto) => {
    foto.categorias = conPrincipales(foto.categorias, categorias);
  });
  const urlsTemporales = []; // vistas previas de fotos nuevas (se liberan al salir)
  let modificado = false;
  let guardando = false;

  const etiquetas = [...new Set([...ETIQUETAS_VARIANTE, ...productos.map((p) => p.etiquetaVariante).filter(Boolean)])];
  contenedor.innerHTML = estructuraHtml(borrador, esNuevo, etiquetas);

  const formulario = contenedor.querySelector('form');
  const listaVariantes = formulario.querySelector('[data-variantes]');
  const listaFotos = formulario.querySelector('[data-fotos]');
  const cajaErrores = formulario.querySelector('[data-errores]');
  const textoSlug = formulario.querySelector('[data-slug]');
  const procesando = formulario.querySelector('[data-procesando]');
  const entradaFotos = formulario.querySelector('[data-subir]');
  const botonGuardar = formulario.querySelector('[type="submit"]');
  const entradaEtiqueta = formulario.querySelector('[data-etiqueta-nueva]');

  /* ----- Dibujo de las secciones dinámicas ----- */

  function pintarSlug() {
    const slug = esNuevo ? crearSlug(borrador.nombre) : borrador.slug;
    textoSlug.textContent = slug
      ? `Enlace: /producto/${slug}${esNuevo ? '' : ' (no cambia al renombrar, para no romper links compartidos)'}`
      : '';
  }

  function pintarVariantes() {
    listaVariantes.innerHTML = borrador.variantes.map((v, i) => varianteHtml(v, i, borrador.variantes.length)).join('');
  }

  function pintarFotos() {
    listaFotos.innerHTML = borrador.fotos.length
      ? borrador.fotos.map((foto, i) => fotoHtml(foto, i, borrador, categorias)).join('')
      : '<li class="fotos-editor__vacio">Todavía no hay fotos. La primera foto es la portada del producto.</li>';
  }

  pintarSlug();
  pintarVariantes();
  pintarFotos();

  /* ----- Edición de campos ----- */

  function marcarModificado() {
    modificado = true;
  }

  /** Enfoca la casilla de una categoría después de redibujar las fotos. */
  function enfocarCategoria(indice, categoriaId) {
    listaFotos.querySelector(`[data-indice="${indice}"] [data-categoria="${CSS.escape(categoriaId)}"]`)?.focus();
  }

  /** Copia el valor de un control del formulario al borrador. */
  function actualizarDesdeControl(control) {
    // El campo de "nueva categoría" no es parte del producto.
    if ('nuevaCategoria' in control.dataset) return;

    // Selector de "¿Cómo se llaman las opciones?": la última opción muestra un
    // campo para escribir un nombre nuevo.
    if ('etiquetaSelect' in control.dataset) {
      const esNueva = control.value === ETIQUETA_NUEVA;
      entradaEtiqueta.hidden = !esNueva;
      borrador.etiquetaVariante = esNueva ? entradaEtiqueta.value : control.value;
      if (esNueva && document.activeElement !== entradaEtiqueta) entradaEtiqueta.focus();
      return marcarModificado();
    }

    const campo = control.dataset.campo;
    if (campo) {
      borrador[campo] = control.type === 'checkbox' ? control.checked : control.value;
      if (campo === 'nombre') pintarSlug();
      return marcarModificado();
    }

    if (control.name === 'estado') {
      borrador.estado = control.value;
      return marcarModificado();
    }

    const indice = Number(control.closest('[data-indice]')?.dataset.indice);

    const campoVariante = control.dataset.variante;
    if (campoVariante) {
      const variante = borrador.variantes[indice];
      if (control.type === 'checkbox') variante[campoVariante] = control.checked;
      else if (campoVariante === 'precio') variante.precio = control.value === '' ? null : Number(control.value);
      else variante[campoVariante] = control.value;
      return marcarModificado();
    }

    const foto = borrador.fotos[indice];
    if (!foto) return;
    if (control.dataset.foto === 'alt') foto.alt = control.value;
    if (control.dataset.foto === 'varianteId') foto.varianteId = control.value || null;
    if (control.dataset.categoria) {
      const id = control.dataset.categoria;
      if (control.checked) {
        foto.categorias = [...new Set([...foto.categorias, id])];
      } else {
        // Al desmarcar una principal se desmarcan también sus subcategorías.
        const quitar = new Set([id, ...hijasDe(categorias, id).map((c) => c.id)]);
        foto.categorias = foto.categorias.filter((c) => !quitar.has(c));
      }
      // Una principal despliega o pliega sus subcategorías.
      if ('principal' in control.dataset) {
        pintarFotos();
        enfocarCategoria(indice, id);
      }
    }
    marcarModificado();
  }

  /* ----- Acciones (botones) ----- */

  const acciones = {
    'agregar-variante'() {
      borrador.variantes.push(varianteNueva(''));
      pintarVariantes();
      pintarFotos(); // el selector de variante de cada foto suma la opción nueva
      listaVariantes.querySelector('li:last-child input')?.focus();
    },
    'quitar-variante'(indice) {
      const [quitada] = borrador.variantes.splice(indice, 1);
      // Las fotos de esa variante pasan a ser generales del producto.
      borrador.fotos.forEach((f) => {
        if (f.varianteId === quitada.id) f.varianteId = null;
      });
      pintarVariantes();
      pintarFotos();
    },
    'subir-foto'(indice) {
      moverFoto(indice, indice - 1);
    },
    'bajar-foto'(indice) {
      moverFoto(indice, indice + 1);
    },
    'mostrar-nueva-categoria'(indice, boton) {
      boton.outerHTML = nuevaCategoriaHtml(boton.dataset.padre);
      listaFotos.querySelector(`[data-indice="${indice}"] [data-nueva-categoria]`)?.focus();
      return false;
    },
    'cancelar-categoria'() {
      pintarFotos();
      return false;
    },
    async 'crear-categoria'(indice, boton) {
      const caja = boton.closest('[data-padre]');
      const padreId = caja.dataset.padre || null;
      const entrada = caja.querySelector('[data-nueva-categoria]');
      let nueva;
      boton.disabled = true;
      try {
        nueva = nuevaCategoria(entrada.value, padreId, categorias);
        await repositorio.guardarCategorias([nueva]);
      } catch (error) {
        mostrarAviso(error.message, 'error');
        boton.disabled = false;
        entrada.focus();
        return false;
      }
      categorias.push(nueva);
      // La foto queda marcada en la categoría nueva (y en su principal).
      const foto = borrador.fotos[indice];
      foto.categorias = [...new Set([...foto.categorias, ...(padreId ? [padreId] : []), nueva.id])];
      mostrarAviso(`Categoría "${nueva.nombre}" creada.`);
      pintarFotos();
      enfocarCategoria(indice, nueva.id);
    },
    'copiar-categorias'(indice) {
      borrador.fotos[indice].categorias = [...borrador.fotos[indice - 1].categorias];
      pintarFotos();
    },
    'quitar-foto'(indice) {
      if (!confirm('¿Quitar esta foto del producto?')) return false;
      borrador.fotos.splice(indice, 1);
      pintarFotos();
    },
    async eliminar() {
      const confirmado = confirm(
        `¿Eliminar "${borrador.nombre}" definitivamente? También se borran sus fotos y no se puede deshacer.\n\nSi solo querés que no se vea en la web, usá el estado "Oculto".`,
      );
      if (!confirmado) return false;
      try {
        await repositorio.eliminarProducto(original);
        modificado = false;
        mostrarAviso(`"${original.nombre}" eliminado.`);
        window.location.hash = '#/';
      } catch (error) {
        mostrarAviso(error.message, 'error');
      }
      return false;
    },
  };

  function moverFoto(desde, hasta) {
    const [foto] = borrador.fotos.splice(desde, 1);
    borrador.fotos.splice(hasta, 0, foto);
    pintarFotos();
    // Mantener el foco en el mismo botón de la foto movida (uso con teclado).
    listaFotos.querySelector(`[data-indice="${hasta}"] [data-accion="${desde > hasta ? 'subir-foto' : 'bajar-foto'}"]:not(:disabled)`)?.focus();
  }

  async function agregarFotos(archivos) {
    procesando.hidden = false;
    entradaFotos.disabled = true;
    for (const archivo of archivos) {
      try {
        const imagen = await optimizarImagen(archivo);
        const url = URL.createObjectURL(imagen);
        urlsTemporales.push(url);
        borrador.fotos.push({
          id: crypto.randomUUID(),
          archivo: imagen,
          url,
          alt: borrador.nombre,
          varianteId: null,
          orden: borrador.fotos.length,
          categorias: [],
        });
      } catch {
        mostrarAviso(`No se pudo procesar "${archivo.name}". ¿Es una imagen?`, 'error');
      }
    }
    entradaFotos.value = '';
    entradaFotos.disabled = false;
    procesando.hidden = true;
    marcarModificado();
    pintarFotos();
  }

  /* ----- Guardado ----- */

  function validar() {
    const errores = [];
    if (!borrador.nombre.trim()) errores.push('Falta el nombre del producto.');
    if (!entradaEtiqueta.hidden && !entradaEtiqueta.value.trim()) {
      errores.push('Escribí cómo se llaman las opciones, o elegí una de la lista.');
    }
    if (!borrador.variantes.length) errores.push('Agregá al menos una variante.');
    borrador.variantes.forEach((v, i) => {
      const nombre = v.nombre.trim() || `número ${i + 1}`;
      if (!v.nombre.trim()) errores.push(`La variante ${i + 1} no tiene nombre.`);
      if (v.precio === null || Number.isNaN(v.precio) || v.precio < 0) {
        errores.push(`La variante "${nombre}" necesita un precio válido.`);
      }
    });
    return errores;
  }

  function mostrarErrores(errores) {
    cajaErrores.hidden = !errores.length;
    cajaErrores.innerHTML = errores.length
      ? `<p><strong>Revisá estos datos:</strong></p><ul>${errores.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>`
      : '';
    if (errores.length) {
      cajaErrores.scrollIntoView({ behavior: 'smooth', block: 'center' });
      cajaErrores.focus();
    }
  }

  async function guardar() {
    if (guardando) return;

    const errores = validar();
    mostrarErrores(errores);
    if (errores.length) return;

    const sinCategoria = borrador.fotos.filter((f) => !f.categorias.length).length;
    if (sinCategoria) {
      const seguir = confirm(
        `${sinCategoria === 1 ? 'Hay 1 foto' : `Hay ${sinCategoria} fotos`} sin categoría: no van a aparecer al filtrar por categoría (sí en "Todos"). ¿Guardar igual?`,
      );
      if (!seguir) return;
    }

    guardando = true;
    botonGuardar.disabled = true;
    botonGuardar.textContent = 'Guardando…';
    try {
      await repositorio.guardarProducto({
        ...borrador,
        nombre: borrador.nombre.trim(),
        descripcion: borrador.descripcion.trim(),
        etiquetaVariante: borrador.etiquetaVariante.trim() || ETIQUETAS_VARIANTE[0],
        slug: esNuevo ? crearSlug(borrador.nombre) : borrador.slug,
        variantes: borrador.variantes.map((v) => ({ ...v, nombre: v.nombre.trim() })),
      });
      modificado = false;
      mostrarAviso(`"${borrador.nombre.trim()}" guardado.`);
      window.location.hash = '#/';
    } catch (error) {
      mostrarErrores([error.message]);
    } finally {
      guardando = false;
      botonGuardar.disabled = false;
      botonGuardar.textContent = 'Guardar';
    }
  }

  /* ----- Eventos ----- */

  const control = new AbortController();
  const { signal } = control;

  // `input` para textos (al tipear) y `change` para casillas/selectores.
  // actualizarDesdeControl es idempotente, así que no importa si llegan ambos.
  formulario.addEventListener('input', (e) => actualizarDesdeControl(e.target), { signal });
  formulario.addEventListener('change', (e) => {
    if (e.target === entradaFotos) return agregarFotos([...entradaFotos.files]);
    actualizarDesdeControl(e.target);
    // Al terminar de escribir el nombre de una variante, se actualizan los selectores de las fotos.
    if (e.target.dataset.variante === 'nombre') pintarFotos();
  }, { signal });

  formulario.addEventListener('click', async (e) => {
    const boton = e.target.closest('[data-accion]');
    if (!boton) return;
    const indice = Number(boton.closest('[data-indice]')?.dataset.indice);
    const resultado = await acciones[boton.dataset.accion](indice, boton);
    if (resultado !== false) marcarModificado();
  }, { signal });

  // En "nueva categoría", Enter agrega (en vez de enviar el formulario) y Escape cancela.
  formulario.addEventListener('keydown', (e) => {
    if (!('nuevaCategoria' in e.target.dataset)) return;
    const accion = { Enter: 'crear-categoria', Escape: 'cancelar-categoria' }[e.key];
    if (!accion) return;
    e.preventDefault();
    e.target.closest('[data-padre]').querySelector(`[data-accion="${accion}"]`).click();
  }, { signal });

  formulario.addEventListener('submit', (e) => {
    e.preventDefault();
    guardar();
  }, { signal });

  // Aviso del navegador si se intenta cerrar la pestaña con cambios sin guardar.
  window.addEventListener('beforeunload', (e) => {
    if (modificado) e.preventDefault();
  }, { signal });

  return {
    puedeSalir: () => !modificado || confirm('Tenés cambios sin guardar. ¿Salir igual?'),
    limpiar: () => {
      control.abort();
      urlsTemporales.forEach((url) => URL.revokeObjectURL(url));
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Datos iniciales                                                            */
/* -------------------------------------------------------------------------- */

function productoNuevo(productos) {
  return {
    id: crypto.randomUUID(),
    slug: '',
    nombre: '',
    descripcion: '',
    etiquetaVariante: ETIQUETAS_VARIANTE[0],
    estado: 'publicado',
    destacado: false,
    orden: Math.max(0, ...productos.map((p) => p.orden)) + 1,
    variantes: [varianteNueva('Único')],
    fotos: [],
  };
}

function varianteNueva(nombre) {
  return { id: crypto.randomUUID(), nombre, precio: null, enStock: true, visible: true, orden: 0 };
}

/* -------------------------------------------------------------------------- */
/* HTML                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Opciones del selector "¿Cómo se llaman las opciones?": las conocidas y, al
 * final, "+ Nueva categoría…" para escribir otra.
 */
function opcionesEtiquetaHtml(actual, etiquetas) {
  return [
    ...etiquetas.map((valor) => `<option value="${esc(valor)}" ${valor === actual ? 'selected' : ''}>${esc(valor)}</option>`),
    `<option value="${ETIQUETA_NUEVA}">+ Nueva categoría…</option>`,
  ].join('');
}

function estructuraHtml(producto, esNuevo, etiquetas) {
  return `
    <form class="editor" novalidate>
      <div class="admin-titulo">
        <div>
          <a href="#/" class="volver">← Productos</a>
          <h1>${esNuevo ? 'Nuevo producto' : 'Editar producto'}</h1>
        </div>
      </div>

      <div class="editor__errores" role="alert" tabindex="-1" hidden data-errores></div>

      <section class="panel" aria-labelledby="titulo-datos">
        <h2 class="panel__titulo" id="titulo-datos">Datos</h2>

        <label class="campo">
          <span class="campo__etiqueta">Nombre *</span>
          <input class="campo__control" data-campo="nombre" value="${esc(producto.nombre)}"
                 maxlength="80" required placeholder="Ej: Collar Cuarzo Rosa" />
          <span class="campo__ayuda" data-slug></span>
        </label>

        <label class="campo">
          <span class="campo__etiqueta">Descripción</span>
          <textarea class="campo__control" data-campo="descripcion" rows="4"
                    placeholder="Materiales, medidas, cuidados…">${esc(producto.descripcion)}</textarea>
        </label>

        <div class="campo">
          <label class="campo__etiqueta" for="etiqueta-variante">¿Cómo se llaman las opciones?</label>
          <select class="campo__control" id="etiqueta-variante" data-etiqueta-select>
            ${opcionesEtiquetaHtml(producto.etiquetaVariante, etiquetas)}
          </select>
          <input class="campo__control" data-campo="etiquetaVariante" data-etiqueta-nueva hidden maxlength="30" autocomplete="off"
                 placeholder="Nombre nuevo. Ej: Largo, Piedra" aria-label="Nombre nuevo para las opciones" />
          <span class="campo__ayuda">Es el título del selector en la web. Ej: "Color" para gorras.</span>
        </div>

        <fieldset class="campo">
          <legend class="campo__etiqueta">Estado en la web</legend>
          <div class="segmentado">
            <label><input type="radio" name="estado" value="publicado" ${producto.estado === 'publicado' ? 'checked' : ''} /><span>Publicado</span></label>
            <label><input type="radio" name="estado" value="oculto" ${producto.estado === 'oculto' ? 'checked' : ''} /><span>Oculto</span></label>
          </div>
        </fieldset>

        <label class="interruptor">
          <input type="checkbox" data-campo="destacado" ${producto.destacado ? 'checked' : ''} />
          <span class="interruptor__texto">Destacado (aparece primero en la web)</span>
        </label>
      </section>

      <section class="panel" aria-labelledby="titulo-variantes">
        <h2 class="panel__titulo" id="titulo-variantes">Variantes</h2>
        <p class="panel__ayuda">Cada opción que se puede comprar, con su precio y su stock. Ej: "Solo", "Con dije en soga".</p>
        <ul class="variantes-editor" data-variantes></ul>
        <button type="button" class="boton boton--contorno boton--chico" data-accion="agregar-variante">+ Agregar variante</button>
      </section>

      <section class="panel" aria-labelledby="titulo-fotos">
        <h2 class="panel__titulo" id="titulo-fotos">Fotos</h2>
        <p class="panel__ayuda">
          A cada foto indicale qué variante muestra y en qué categorías tiene que aparecer.
          Las fotos se achican solas antes de subirse.
        </p>
        <ul class="fotos-editor" data-fotos></ul>
        <label class="boton boton--contorno boton--chico subir-fotos">
          <input type="file" accept="image/*" multiple class="visualmente-oculto" data-subir />
          + Agregar fotos
        </label>
        <p class="panel__ayuda" data-procesando hidden role="status">Procesando fotos…</p>
      </section>

      ${esNuevo ? '' : `
        <section class="panel panel--peligro" aria-labelledby="titulo-eliminar">
          <h2 class="panel__titulo" id="titulo-eliminar">Eliminar producto</h2>
          <p class="panel__ayuda">Borra el producto y sus fotos para siempre. Si solo querés que no se vea, elegí "Oculto".</p>
          <button type="button" class="boton boton--peligro boton--chico" data-accion="eliminar">Eliminar producto</button>
        </section>`}

      <div class="editor__barra">
        <a href="#/" class="boton boton--contorno">Cancelar</a>
        <button type="submit" class="boton">Guardar</button>
      </div>
    </form>`;
}

function varianteHtml(variante, indice, total) {
  return `
    <li class="variante-editor" data-indice="${indice}">
      <label class="campo variante-editor__nombre">
        <span class="campo__etiqueta">Nombre</span>
        <input class="campo__control" data-variante="nombre" value="${esc(variante.nombre)}"
               placeholder="Ej: Solo, Con dije, Negra" />
      </label>
      <label class="campo variante-editor__precio">
        <span class="campo__etiqueta">Precio ($)</span>
        <input class="campo__control" type="number" inputmode="numeric" min="0" step="1"
               data-variante="precio" value="${variante.precio ?? ''}" />
      </label>
      <div class="variante-editor__opciones">
        <label class="interruptor">
          <input type="checkbox" data-variante="enStock" ${variante.enStock ? 'checked' : ''} />
          <span class="interruptor__texto">En stock</span>
        </label>
        <label class="interruptor">
          <input type="checkbox" data-variante="visible" ${variante.visible ? 'checked' : ''} />
          <span class="interruptor__texto">Visible</span>
        </label>
        ${total > 1 ? `<button type="button" class="boton-texto boton-texto--peligro" data-accion="quitar-variante">Quitar</button>` : ''}
      </div>
    </li>`;
}

function fotoHtml(foto, indice, producto, categorias) {
  const total = producto.fotos.length;
  const opcionesVariante = producto.variantes
    .map((v, i) => `<option value="${esc(v.id)}" ${v.id === foto.varianteId ? 'selected' : ''}>${esc(v.nombre || `Variante ${i + 1}`)}</option>`)
    .join('');

  return `
    <li class="foto-editor" data-indice="${indice}">
      <div class="foto-editor__imagen">
        <img src="${esc(foto.url)}" alt="" />
        <span class="foto-editor__numero">${indice === 0 ? 'Portada' : `Foto ${indice + 1}`}</span>
      </div>

      <div class="foto-editor__campos">
        <label class="campo">
          <span class="campo__etiqueta">Variante que muestra</span>
          <select class="campo__control" data-foto="varianteId">
            <option value="">General (todas las variantes)</option>
            ${opcionesVariante}
          </select>
        </label>

        <fieldset class="campo">
          <legend class="campo__etiqueta">Categorías</legend>
          ${selectorCategoriasHtml(foto, categorias)}
          <span class="campo__ayuda">Marcá la categoría; las subcategorías se despliegan debajo y son opcionales.</span>
        </fieldset>

        <label class="campo">
          <span class="campo__etiqueta">Descripción de la foto</span>
          <input class="campo__control" data-foto="alt" value="${esc(foto.alt)}"
                 placeholder="Ej: Collar de cuarzo rosa con dije de ágata" />
          <span class="campo__ayuda">La leen los lectores de pantalla y Google.</span>
        </label>
      </div>

      <div class="foto-editor__acciones">
        <button type="button" class="boton-icono" data-accion="subir-foto" ${indice === 0 ? 'disabled' : ''}
                aria-label="Mover antes" title="Mover antes">←</button>
        <button type="button" class="boton-icono" data-accion="bajar-foto" ${indice === total - 1 ? 'disabled' : ''}
                aria-label="Mover después" title="Mover después">→</button>
        ${indice > 0 ? '<button type="button" class="boton-texto" data-accion="copiar-categorias">Copiar categorías de la anterior</button>' : ''}
        <button type="button" class="boton-texto boton-texto--peligro" data-accion="quitar-foto">Quitar</button>
      </div>
    </li>`;
}

/**
 * Casillas de categorías. Solo se ven las principales; al marcar una, debajo
 * se despliegan sus subcategorías (opcionales) y un botón para crear otra.
 */
function selectorCategoriasHtml(foto, categorias) {
  const casilla = (categoria, esPrincipal) => `
    <label class="chip-check${esPrincipal ? ' chip-check--principal' : ''}">
      <input type="checkbox" data-categoria="${esc(categoria.id)}" ${esPrincipal ? 'data-principal' : ''}
             ${foto.categorias.includes(categoria.id) ? 'checked' : ''} />
      <span>${esc(categoria.nombre)}</span>
    </label>`;

  return `
    <div class="categorias-grupos">
      ${hijasDe(categorias, null).map((principal) => {
        if (!foto.categorias.includes(principal.id)) {
          return `<div class="categorias-grupo">${casilla(principal, true)}</div>`;
        }
        return `
          <div class="categorias-grupo categorias-grupo--abierto">
            ${casilla(principal, true)}
            <div class="categorias-grupo__hijas" role="group" aria-label="Subcategorías de ${esc(principal.nombre)} (opcionales)">
              ${hijasDe(categorias, principal.id).map((hija) => casilla(hija, false)).join('')}
              ${botonNuevaCategoriaHtml(principal.id, '+ Subcategoría')}
            </div>
          </div>`;
      }).join('')}
      <div class="categorias-grupo">${botonNuevaCategoriaHtml('', '+ Nueva categoría')}</div>
    </div>`;
}

function botonNuevaCategoriaHtml(padreId, texto) {
  return `<button type="button" class="chip-nuevo" data-accion="mostrar-nueva-categoria" data-padre="${esc(padreId)}">${texto}</button>`;
}

/** Campo para escribir el nombre de una categoría nueva (reemplaza al botón). */
function nuevaCategoriaHtml(padreId) {
  const texto = padreId ? 'Nombre de la subcategoría' : 'Nombre de la categoría';
  return `
    <span class="categoria-rapida" data-padre="${esc(padreId)}">
      <input class="campo__control" data-nueva-categoria maxlength="40" autocomplete="off"
             placeholder="${texto}" aria-label="${texto}" />
      <button type="button" class="boton boton--chico" data-accion="crear-categoria">Agregar</button>
      <button type="button" class="boton-texto" data-accion="cancelar-categoria">Cancelar</button>
    </span>`;
}
