/**
 * Sección Portada: diapositivas del carrusel de la página de inicio.
 * Ruta: #/portada
 *
 * Cada diapositiva tiene dos fotos recortadas a medida:
 *   - Escritorio: horizontal (16:7).
 *   - Celular: vertical (4:5). Puede salir de la misma foto o de otra.
 * Título, subtítulo y botón son opcionales, y una vista previa muestra cómo
 * queda mientras se escribe.
 *
 * Igual que el editor de productos, trabaja sobre un "borrador" y nada se
 * guarda hasta tocar "Guardar". Sin diapositivas activas, la web muestra las
 * predeterminadas (src/datos/portada-predeterminada.js).
 */

import { mostrarAviso } from '../componentes/avisos.js';
import { recortarImagen } from '../componentes/recortador.js';
import { hijasDe } from '../utilidades/categorias.js';
import { FORMATO_PORTADA, imagenPortadaHtml, textoPortadaHtml } from '../../js/componentes/carrusel.js';
import { esc } from '../../js/utilidades/html.js';

/** Textos de cada paso del recorte. */
const RECORTE = {
  escritorio: {
    ...FORMATO_PORTADA.escritorio,
    titulo: 'Versión escritorio (horizontal)',
    ayuda: 'Así se ve en computadoras y tablets.',
  },
  movil: {
    ...FORMATO_PORTADA.movil,
    titulo: 'Versión celular (vertical)',
    ayuda: 'Así se ve en celulares. Podés recortar la misma foto o elegir otra.',
  },
};

/** Tamaño "real" con el que se dibuja cada vista previa antes de achicarla. */
const LIENZO_PREVIA = {
  escritorio: { ancho: 1280, alto: 560 },
  movil: { ancho: 375, alto: 469 },
};

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
        Al agregar una foto vas a recortarla dos veces: horizontal para computadoras y
        vertical para celulares.
      </p>

      <div class="editor__errores" role="alert" tabindex="-1" hidden data-errores></div>

      <ul class="diapositivas-editor" data-diapositivas></ul>

      <label class="boton boton--contorno boton--chico subir-fotos">
        <input type="file" accept="image/*" class="visualmente-oculto" data-subir />
        + Agregar diapositiva
      </label>

      <div class="editor__barra">
        <button type="button" class="boton boton--contorno" data-accion="descartar">Descartar</button>
        <button type="submit" class="boton">Guardar</button>
      </div>
    </form>`;

  const formulario = contenedor.querySelector('form');
  const lista = formulario.querySelector('[data-diapositivas]');
  const entradaFotos = formulario.querySelector('[data-subir]');
  const cajaErrores = formulario.querySelector('[data-errores]');
  const botonGuardar = formulario.querySelector('[type="submit"]');

  // Las vistas previas se dibujan en tamaño real y se achican al ancho disponible.
  const observadorPrevias = new ResizeObserver((entradas) => {
    for (const { target } of entradas) {
      const { ancho } = LIENZO_PREVIA[target.dataset.previa];
      target.style.setProperty('--escala', target.clientWidth / ancho);
    }
  });

  function pintar() {
    observadorPrevias.disconnect();
    lista.innerHTML = borrador.length
      ? borrador.map((d, i) => diapositivaHtml(d, i, borrador.length, destinos)).join('')
      : `<li class="fotos-editor__vacio">
           Todavía no hay diapositivas: la web muestra las de ejemplo.
           Agregá la primera con el botón de abajo.
         </li>`;
    lista.querySelectorAll('[data-previa]').forEach((marco) => observadorPrevias.observe(marco));
  }

  /** Actualiza solo las vistas previas de una diapositiva (sin tocar los campos). */
  function pintarPrevias(indice) {
    const tarjeta = lista.querySelector(`[data-indice="${indice}"]`);
    tarjeta.querySelectorAll('[data-previa]').forEach((marco) => {
      marco.querySelector('.previa__lienzo').innerHTML = previaContenidoHtml(borrador[indice], marco.dataset.previa);
    });
  }

  function marcarModificado() {
    modificado = true;
  }

  /* ----- Fotos ----- */

  /** Abre el recortador y devuelve { archivo, url } listo para el borrador, o null. */
  async function recortar(archivo, formato, permitirOtraFoto = false) {
    try {
      const recorte = await recortarImagen(archivo, { ...RECORTE[formato], permitirOtraFoto });
      if (!recorte) return null;
      const url = URL.createObjectURL(recorte);
      urlsTemporales.push(url);
      return { archivo: recorte, url };
    } catch {
      mostrarAviso(`No se pudo abrir "${archivo.name}". ¿Es una imagen?`, 'error');
      return null;
    }
  }

  async function agregarDiapositiva(archivo) {
    const escritorio = await recortar(archivo, 'escritorio');
    if (!escritorio) return;
    const movil = await recortar(archivo, 'movil', true);
    if (!movil) mostrarAviso('Sin versión para celular: en celulares se va a ver la horizontal, recortada al centro.');

    borrador.push({
      id: crypto.randomUUID(),
      titulo: '',
      subtitulo: '',
      enlace: '',
      textoBoton: '',
      activa: true,
      url: escritorio.url,
      archivo: escritorio.archivo,
      urlMovil: movil?.url ?? null,
      archivoMovil: movil?.archivo ?? null,
    });
    marcarModificado();
    pintar();
    lista.querySelector(`[data-indice="${borrador.length - 1}"] [data-d="titulo"]`)?.focus();
  }

  async function cambiarFoto(indice, formato, archivo) {
    const recorte = await recortar(archivo, formato);
    if (!recorte) return;
    const diapositiva = borrador[indice];
    if (formato === 'escritorio') Object.assign(diapositiva, recorte);
    else Object.assign(diapositiva, { urlMovil: recorte.url, archivoMovil: recorte.archivo });
    marcarModificado();
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
    'quitar-movil'(indice) {
      Object.assign(borrador[indice], { urlMovil: null, archivoMovil: null, rutaMovil: null });
      pintar();
    },
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

  const indiceDe = (elemento) => Number(elemento.closest('[data-indice]')?.dataset.indice);

  // Campos de texto, destino del botón y "Activa": actualizan el borrador y la vista previa.
  const actualizar = (e) => {
    const campo = e.target.dataset.d;
    const indice = indiceDe(e.target);
    const diapositiva = borrador[indice];
    if (!campo || !diapositiva) return;
    diapositiva[campo] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    marcarModificado();
    pintarPrevias(indice);
  };
  formulario.addEventListener('input', actualizar, { signal });

  formulario.addEventListener('change', (e) => {
    if (e.target === entradaFotos) {
      const [archivo] = entradaFotos.files;
      entradaFotos.value = '';
      if (archivo) agregarDiapositiva(archivo);
      return;
    }
    const formato = e.target.dataset.cambiarFoto;
    if (formato) {
      const [archivo] = e.target.files;
      if (archivo) cambiarFoto(indiceDe(e.target), formato, archivo);
      return;
    }
    actualizar(e);
    // "Activa" cambia la etiqueta de la tarjeta.
    if (e.target.dataset.d === 'activa') {
      const indice = indiceDe(e.target);
      pintar();
      lista.querySelector(`[data-indice="${indice}"] [data-d="activa"]`)?.focus();
    }
  }, { signal });

  formulario.addEventListener('click', (e) => {
    const boton = e.target.closest('[data-accion]');
    if (!boton) return;
    if (acciones[boton.dataset.accion](indiceDe(boton)) !== false) marcarModificado();
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
      observadorPrevias.disconnect();
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
    <li class="diapositiva-editor${d.activa ? '' : ' diapositiva-editor--inactiva'}" data-indice="${indice}">
      <div class="diapositiva-editor__encabezado">
        <strong>${d.activa ? `Diapositiva ${indice + 1}` : `Diapositiva ${indice + 1} · inactiva`}</strong>
      </div>

      <div class="previas">
        ${previaHtml(d, 'escritorio')}
        ${previaHtml(d, 'movil')}
      </div>

      <div class="diapositiva-editor__campos">
        <label class="campo">
          <span class="campo__etiqueta">Título <small>(opcional)</small></span>
          <input class="campo__control" data-d="titulo" value="${esc(d.titulo)}" maxlength="60"
                 placeholder="Ej: Piezas hechas a mano" />
        </label>
        <label class="campo">
          <span class="campo__etiqueta">Subtítulo <small>(opcional)</small></span>
          <input class="campo__control" data-d="subtitulo" value="${esc(d.subtitulo)}" maxlength="120"
                 placeholder="Ej: Piedras naturales elegidas una por una." />
        </label>
        <div class="diapositiva-editor__boton">
          <label class="campo">
            <span class="campo__etiqueta">Botón <small>(opcional)</small>: lleva a</span>
            <select class="campo__control" data-d="enlace">${opciones}</select>
          </label>
          <label class="campo">
            <span class="campo__etiqueta">Texto del botón</span>
            <input class="campo__control" data-d="textoBoton" value="${esc(d.textoBoton)}" maxlength="30"
                   placeholder="Ver colección" />
          </label>
        </div>
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
        <button type="button" class="boton-texto boton-texto--peligro" data-accion="quitar">Quitar diapositiva</button>
      </div>
    </li>`;
}

/** Vista previa de un formato, con su botón para cambiar la foto. */
function previaHtml(d, formato) {
  const esMovil = formato === 'movil';
  const usaEscritorio = esMovil && !d.urlMovil;
  return `
    <figure class="previa previa--${formato}">
      <div class="previa__marco" data-previa="${formato}">
        <div class="previa__lienzo" style="width: ${LIENZO_PREVIA[formato].ancho}px; height: ${LIENZO_PREVIA[formato].alto}px">
          ${previaContenidoHtml(d, formato)}
        </div>
      </div>
      <figcaption class="previa__pie">
        <span>${esMovil ? 'Celular' : 'Escritorio'}${usaEscritorio ? ' · usa la horizontal' : ''}</span>
        <label class="boton-texto subir-fotos">
          <input type="file" accept="image/*" class="visualmente-oculto" data-cambiar-foto="${formato}" />
          ${usaEscritorio ? 'Agregar foto' : 'Cambiar foto'}
        </label>
        ${esMovil && d.urlMovil
          ? '<button type="button" class="boton-texto" data-accion="quitar-movil">Usar la horizontal</button>'
          : ''}
      </figcaption>
    </figure>`;
}

/** Interior de la vista previa: misma estructura que una diapositiva del carrusel. */
function previaContenidoHtml(d, formato) {
  const foto = formato === 'movil' ? { url: d.urlMovil || d.url } : { url: d.url };
  const texto = textoPortadaHtml(d);
  return `
    <div class="carrusel__diapositiva es-activa${texto ? ' carrusel__diapositiva--con-texto' : ''}">
      ${imagenPortadaHtml(foto)}
      ${texto}
    </div>`;
}
