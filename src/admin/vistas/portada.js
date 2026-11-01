/**
 * Sección Portada: diapositivas del carrusel de la página de inicio.
 * Ruta: #/portada
 *
 * Igual que el editor de productos, trabaja sobre un "borrador" y nada se
 * guarda hasta tocar "Guardar". Cada diapositiva tiene foto, título,
 * subtítulo, a dónde lleva el botón, texto del botón y si está activa.
 *
 * Sin diapositivas activas, la web muestra las predeterminadas
 * (src/datos/portada-predeterminada.js).
 */

import { mostrarAviso } from '../componentes/avisos.js';
import { hijasDe } from '../utilidades/categorias.js';
import { optimizarImagen } from '../utilidades/imagenes.js';
import { esc } from '../../js/utilidades/html.js';

/** @param {{ contenedor: HTMLElement, repositorio: Object }} contexto */
export async function vistaPortada({ contenedor, repositorio }) {
  contenedor.innerHTML = '<p class="cargando" role="status">Cargando…</p>';

  let original;
  let categorias;
  try {
    [original, categorias] = await Promise.all([repositorio.listarPortada(), repositorio.listarCategorias()]);
  } catch (error) {
    contenedor.innerHTML = `<p class="vacio">No se pudo cargar la portada: ${esc(error.message)}</p>`;
    return {};
  }

  let borrador = structuredClone(original);
  const destinos = destinosDelBoton(categorias);
  const urlsTemporales = []; // vistas previas de fotos nuevas (se liberan al salir)
  let modificado = false;
  let guardando = false;

  contenedor.innerHTML = `
    <form class="editor" novalidate>
      <div class="admin-titulo">
        <h1>Portada</h1>
      </div>
      <p class="panel__ayuda portada-ayuda">
        Las diapositivas del carrusel de la página de inicio, en el orden en que se muestran.
        Conviene usar fotos horizontales con el producto en el centro.
      </p>

      <div class="editor__errores" role="alert" tabindex="-1" hidden data-errores></div>

      <ul class="fotos-editor" data-diapositivas></ul>

      <label class="boton boton--contorno boton--chico subir-fotos">
        <input type="file" accept="image/*" multiple class="visualmente-oculto" data-subir />
        + Agregar diapositiva
      </label>
      <p class="panel__ayuda" data-procesando hidden role="status">Procesando fotos…</p>

      <div class="editor__barra">
        <button type="button" class="boton boton--contorno" data-accion="descartar">Descartar</button>
        <button type="submit" class="boton">Guardar</button>
      </div>
    </form>`;

  const formulario = contenedor.querySelector('form');
  const lista = formulario.querySelector('[data-diapositivas]');
  const entradaFotos = formulario.querySelector('[data-subir]');
  const procesando = formulario.querySelector('[data-procesando]');
  const cajaErrores = formulario.querySelector('[data-errores]');
  const botonGuardar = formulario.querySelector('[type="submit"]');

  function pintar() {
    lista.innerHTML = borrador.length
      ? borrador.map((d, i) => diapositivaHtml(d, i, borrador.length, destinos)).join('')
      : `<li class="fotos-editor__vacio">
           Todavía no hay diapositivas: la web muestra las de ejemplo.
           Agregá la primera con el botón de abajo.
         </li>`;
  }

  function marcarModificado() {
    modificado = true;
  }

  /* ----- Fotos ----- */

  /** Optimiza una imagen y devuelve { archivo, url } para la vista previa. */
  async function prepararFoto(archivo) {
    const imagen = await optimizarImagen(archivo);
    const url = URL.createObjectURL(imagen);
    urlsTemporales.push(url);
    return { archivo: imagen, url };
  }

  async function conProcesando(tarea) {
    procesando.hidden = false;
    entradaFotos.disabled = true;
    try {
      await tarea();
    } finally {
      entradaFotos.disabled = false;
      procesando.hidden = true;
    }
  }

  async function agregarDiapositivas(archivos) {
    await conProcesando(async () => {
      for (const archivo of archivos) {
        try {
          borrador.push({
            id: crypto.randomUUID(),
            titulo: '',
            subtitulo: '',
            enlace: '#/productos',
            textoBoton: 'Ver colección',
            activa: true,
            ...(await prepararFoto(archivo)),
          });
        } catch {
          mostrarAviso(`No se pudo procesar "${archivo.name}". ¿Es una imagen?`, 'error');
        }
      }
    });
    entradaFotos.value = '';
    marcarModificado();
    pintar();
  }

  async function cambiarFoto(indice, entrada) {
    const [archivo] = entrada.files;
    if (!archivo) return;
    await conProcesando(async () => {
      try {
        Object.assign(borrador[indice], await prepararFoto(archivo));
        marcarModificado();
      } catch {
        mostrarAviso(`No se pudo procesar "${archivo.name}". ¿Es una imagen?`, 'error');
      }
    });
    pintar();
  }

  /* ----- Acciones (botones) ----- */

  function mover(desde, hasta) {
    const [diapositiva] = borrador.splice(desde, 1);
    borrador.splice(hasta, 0, diapositiva);
    pintar();
    const accion = desde > hasta ? 'subir' : 'bajar';
    lista.querySelector(`[data-indice="${hasta}"] [data-accion="${accion}"]:not(:disabled)`)?.focus();
  }

  const acciones = {
    subir: (indice) => mover(indice, indice - 1),
    bajar: (indice) => mover(indice, indice + 1),
    quitar(indice) {
      if (!confirm('¿Quitar esta diapositiva del carrusel?')) return false;
      borrador.splice(indice, 1);
      pintar();
    },
    descartar() {
      if (!modificado || !confirm('¿Descartar los cambios sin guardar?')) return false;
      borrador = structuredClone(original);
      modificado = false;
      mostrarErrores([]);
      pintar();
      return false;
    },
  };

  /* ----- Guardado ----- */

  function mostrarErrores(errores) {
    cajaErrores.hidden = !errores.length;
    cajaErrores.innerHTML = errores.length
      ? `<p><strong>No se pudo guardar:</strong></p><ul>${errores.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>`
      : '';
    if (errores.length) cajaErrores.focus();
  }

  async function guardar() {
    if (guardando) return;
    if (borrador.length && !borrador.some((d) => d.activa)) {
      const seguir = confirm('Ninguna diapositiva está activa: la web va a mostrar las de ejemplo. ¿Guardar igual?');
      if (!seguir) return;
    }

    guardando = true;
    botonGuardar.disabled = true;
    botonGuardar.textContent = 'Guardando…';
    try {
      await repositorio.guardarPortada(
        borrador.map((d) => ({ ...d, titulo: d.titulo.trim(), subtitulo: d.subtitulo.trim(), textoBoton: d.textoBoton.trim() })),
      );
      // Se recarga para tener las rutas definitivas de las fotos subidas.
      original = await repositorio.listarPortada();
      borrador = structuredClone(original);
      modificado = false;
      mostrarErrores([]);
      pintar();
      mostrarAviso('Portada guardada.');
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

  // `input` para textos (al tipear) y `change` para casillas, selectores y fotos.
  const actualizar = (e) => {
    const campo = e.target.dataset.d;
    const diapositiva = borrador[Number(e.target.closest('[data-indice]')?.dataset.indice)];
    if (!campo || !diapositiva) return;
    diapositiva[campo] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    marcarModificado();
  };
  formulario.addEventListener('input', actualizar, { signal });

  formulario.addEventListener('change', (e) => {
    if (e.target === entradaFotos) return agregarDiapositivas([...entradaFotos.files]);
    if ('cambiarFoto' in e.target.dataset) {
      return cambiarFoto(Number(e.target.closest('[data-indice]').dataset.indice), e.target);
    }
    actualizar(e);
    // El interruptor "Activa" cambia la etiqueta de la foto.
    if (e.target.dataset.d === 'activa') {
      const indice = Number(e.target.closest('[data-indice]').dataset.indice);
      pintar();
      lista.querySelector(`[data-indice="${indice}"] [data-d="activa"]`)?.focus();
    }
  }, { signal });

  formulario.addEventListener('click', (e) => {
    const boton = e.target.closest('[data-accion]');
    if (!boton) return;
    const indice = Number(boton.closest('[data-indice]')?.dataset.indice);
    if (acciones[boton.dataset.accion](indice) !== false) marcarModificado();
  }, { signal });

  formulario.addEventListener('submit', (e) => {
    e.preventDefault();
    guardar();
  }, { signal });

  window.addEventListener('beforeunload', (e) => {
    if (modificado) e.preventDefault();
  }, { signal });

  pintar();

  return {
    puedeSalir: () => !modificado || confirm('Tenés cambios sin guardar en la portada. ¿Salir igual?'),
    limpiar: () => {
      control.abort();
      urlsTemporales.forEach((url) => URL.revokeObjectURL(url));
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Datos                                                                      */
/* -------------------------------------------------------------------------- */

/** Lugares de la web a los que puede llevar el botón de una diapositiva. */
function destinosDelBoton(categorias) {
  const destinos = [
    { enlace: '', texto: 'Sin botón' },
    { enlace: '#/productos', texto: 'Todos los productos' },
  ];
  for (const principal of hijasDe(categorias, null)) {
    destinos.push({ enlace: `#/productos/${principal.slug}`, texto: principal.nombre });
    for (const hija of hijasDe(categorias, principal.id)) {
      destinos.push({ enlace: `#/productos/${principal.slug}/${hija.slug}`, texto: `${principal.nombre} › ${hija.nombre}` });
    }
  }
  destinos.push({ enlace: '#/sobre-munay', texto: 'Sobre Munay' });
  return destinos;
}

/* -------------------------------------------------------------------------- */
/* HTML                                                                       */
/* -------------------------------------------------------------------------- */

function diapositivaHtml(d, indice, total, destinos) {
  // Si el enlace guardado ya no existe (ej: categoría renombrada), se conserva igual.
  const conocido = destinos.some((x) => x.enlace === d.enlace);
  const opciones = [...destinos, ...(conocido ? [] : [{ enlace: d.enlace, texto: `Otro: ${d.enlace}` }])]
    .map((x) => `<option value="${esc(x.enlace)}" ${x.enlace === d.enlace ? 'selected' : ''}>${esc(x.texto)}</option>`)
    .join('');

  return `
    <li class="foto-editor foto-editor--portada${d.activa ? '' : ' foto-editor--inactiva'}" data-indice="${indice}">
      <div class="foto-editor__imagen">
        <img src="${esc(d.url)}" alt="" />
        <span class="foto-editor__numero">${d.activa ? `Diapositiva ${indice + 1}` : 'Inactiva'}</span>
      </div>

      <div class="foto-editor__campos">
        <label class="campo">
          <span class="campo__etiqueta">Título</span>
          <input class="campo__control" data-d="titulo" value="${esc(d.titulo)}" maxlength="60"
                 placeholder="Ej: Piezas hechas a mano" />
        </label>
        <label class="campo">
          <span class="campo__etiqueta">Subtítulo</span>
          <input class="campo__control" data-d="subtitulo" value="${esc(d.subtitulo)}" maxlength="120"
                 placeholder="Ej: Piedras naturales elegidas una por una." />
        </label>
        <label class="campo">
          <span class="campo__etiqueta">El botón lleva a</span>
          <select class="campo__control" data-d="enlace">${opciones}</select>
        </label>
        <label class="campo">
          <span class="campo__etiqueta">Texto del botón</span>
          <input class="campo__control" data-d="textoBoton" value="${esc(d.textoBoton)}" maxlength="30"
                 placeholder="Ver colección" />
        </label>
        <label class="interruptor">
          <input type="checkbox" data-d="activa" ${d.activa ? 'checked' : ''} />
          <span class="interruptor__texto">Activa (se muestra en la web)</span>
        </label>
      </div>

      <div class="foto-editor__acciones">
        <button type="button" class="boton-icono" data-accion="subir" ${indice === 0 ? 'disabled' : ''}
                aria-label="Mover antes" title="Mover antes">←</button>
        <button type="button" class="boton-icono" data-accion="bajar" ${indice === total - 1 ? 'disabled' : ''}
                aria-label="Mover después" title="Mover después">→</button>
        <label class="boton-texto subir-fotos">
          <input type="file" accept="image/*" class="visualmente-oculto" data-cambiar-foto />
          Cambiar foto
        </label>
        <button type="button" class="boton-texto boton-texto--peligro" data-accion="quitar">Quitar</button>
      </div>
    </li>`;
}
