/**
 * Sección Colores. Ruta: #/colores
 *
 * Permite cambiar el color de fondo de la página y el del encabezado (franja
 * de anuncios + barra del logo y menú). Cada color se elige con el selector,
 * escribiendo el código (#rrggbb) o con los atajos de la paleta de marca.
 * La letra del encabezado se ajusta sola para que se lea (ver apariencia.js).
 * Los cambios se ven en la vista previa y se aplican al tocar "Guardar".
 */

import { mostrarAviso } from '../componentes/avisos.js';
import {
  COLORES_MARCA,
  PALETA_MARCA,
  aplicarColores,
  esColorValido,
  fondoLegible,
  normalizarColores,
  textoSobre,
} from '../../js/servicios/apariencia.js';
import { esc } from '../../js/utilidades/html.js';

const CAMPOS = [
  { id: 'colorFondo', nombre: 'Fondo de la página', ayuda: 'El color detrás de los productos y las secciones.' },
  { id: 'colorEncabezado', nombre: 'Encabezado', ayuda: 'La franja de anuncios de arriba y la barra con el logo y el menú.' },
];

/** @param {{ contenedor: HTMLElement, repositorio: Object }} contexto */
export async function vistaColores({ contenedor, repositorio }) {
  contenedor.innerHTML = '<p class="cargando" role="status">Cargando…</p>';

  let guardados;
  try {
    guardados = await repositorio.obtenerColores();
  } catch (error) {
    contenedor.innerHTML = `<p class="vacio">No se pudieron cargar los colores: ${esc(error.message)}</p>`;
    return {};
  }

  let colores = { ...guardados };
  let guardando = false;
  const modificado = () => CAMPOS.some(({ id }) => colores[id] !== guardados[id]);

  contenedor.innerHTML = `
    <form class="editor" novalidate>
      <div class="admin-titulo">
        <h1>Colores</h1>
      </div>
      <p class="panel__ayuda portada-ayuda">
        Elegí el color con el selector, escribí el código (ej: <code>#e4ccbf</code>) o tocá uno de la
        paleta de Munay. "Color de marca" vuelve al original.
      </p>

      <div class="colores">
        <div class="panel colores__campos">
          ${CAMPOS.map((campo) => campoHtml(campo, colores[campo.id])).join('')}
        </div>

        <figure class="colores__previa">
          <figcaption class="campo__etiqueta">Vista previa</figcaption>
          <div class="previa-colores" data-previa aria-hidden="true">
            <div class="previa-colores__anuncio">Envíos a todo el país</div>
            <div class="previa-colores__encabezado">
              <span class="previa-colores__menu">☰</span>
              <span class="previa-colores__logo">munay.</span>
              <span class="previa-colores__menu">◎</span>
            </div>
            <div class="previa-colores__cuerpo">
              <p class="previa-colores__titulo">Nuestras piezas</p>
              <div class="previa-colores__grilla">
                ${Array.from({ length: 3 }, () => `
                  <div class="previa-colores__tarjeta">
                    <span class="previa-colores__foto"></span>
                    <span>Collar</span>
                    <small>$ 25.000</small>
                  </div>`).join('')}
              </div>
              <p class="previa-colores__seccion">Sobre Munay</p>
            </div>
          </div>
        </figure>
      </div>

      <div class="editor__barra">
        <button type="button" class="boton boton--contorno" data-descartar>Descartar</button>
        <button type="submit" class="boton">Guardar</button>
      </div>
    </form>`;

  const formulario = contenedor.querySelector('form');
  const previa = formulario.querySelector('[data-previa]');
  const botonGuardar = formulario.querySelector('[type="submit"]');

  /** Refleja `colores` en los controles, avisos y vista previa. */
  function pintar({ salvo } = {}) {
    for (const { id } of CAMPOS) {
      const valor = colores[id];
      formulario.querySelector(`[data-selector="${id}"]`).value = valor;
      const codigo = formulario.querySelector(`[data-codigo="${id}"]`);
      if (codigo !== salvo) codigo.value = valor;
      codigo.removeAttribute('aria-invalid');
      formulario.querySelectorAll(`[data-elegir="${id}"]`).forEach((boton) => {
        boton.setAttribute('aria-pressed', String(boton.dataset.valor === valor));
      });
    }
    formulario.querySelector('[data-aviso="colorFondo"]').textContent = fondoLegible(colores.colorFondo)
      ? ''
      : 'Ojo: sobre este fondo el texto de la web puede costar leerse.';
    formulario.querySelector('[data-aviso="colorEncabezado"]').textContent =
      `La letra del encabezado se pone ${textoSobre(colores.colorEncabezado) === '#e4ccbf' ? 'beige' : 'chocolate'} sola, para que se lea.`;
    aplicarColores(colores, previa);
  }

  function elegir(id, valor) {
    colores = { ...colores, [id]: valor.toLowerCase() };
  }

  async function guardar() {
    if (guardando) return;
    guardando = true;
    botonGuardar.disabled = true;
    botonGuardar.textContent = 'Guardando…';
    try {
      await repositorio.guardarColores(colores);
      guardados = normalizarColores(colores);
      mostrarAviso('Colores guardados. Se ven en la web al recargarla.');
    } catch (error) {
      mostrarAviso(error.message, 'error');
    } finally {
      guardando = false;
      botonGuardar.disabled = false;
      botonGuardar.textContent = 'Guardar';
    }
  }

  /* ----- Eventos ----- */

  const control = new AbortController();
  const { signal } = control;

  formulario.addEventListener('input', (e) => {
    const { selector, codigo } = e.target.dataset;
    if (selector) {
      elegir(selector, e.target.value);
      pintar();
    } else if (codigo) {
      // Se acepta con o sin "#" mientras se escribe; solo se aplica si es válido.
      const valor = e.target.value.trim().replace(/^#?/, '#');
      const valido = esColorValido(valor);
      e.target.toggleAttribute('aria-invalid', !valido);
      if (valido) {
        elegir(codigo, valor);
        pintar({ salvo: e.target });
      }
    }
  }, { signal });

  // Al salir del campo de código, si quedó incompleto vuelve al último válido.
  formulario.addEventListener('focusout', (e) => {
    if (e.target.dataset.codigo) pintar();
  }, { signal });

  formulario.addEventListener('click', (e) => {
    const boton = e.target.closest('[data-elegir], [data-restablecer], [data-descartar]');
    if (!boton) return;
    if (boton.dataset.elegir) elegir(boton.dataset.elegir, boton.dataset.valor);
    else if (boton.dataset.restablecer) elegir(boton.dataset.restablecer, COLORES_MARCA[boton.dataset.restablecer]);
    else colores = { ...guardados };
    pintar();
  }, { signal });

  formulario.addEventListener('submit', (e) => {
    e.preventDefault();
    guardar();
  }, { signal });

  window.addEventListener('beforeunload', (e) => {
    if (modificado()) e.preventDefault();
  }, { signal });

  pintar();

  return {
    puedeSalir: () => !modificado() || confirm('Tenés cambios de colores sin guardar. ¿Salir igual?'),
    limpiar: () => control.abort(),
  };
}

/* -------------------------------------------------------------------------- */
/* HTML                                                                       */
/* -------------------------------------------------------------------------- */

function campoHtml({ id, nombre, ayuda }, valor) {
  return `
    <fieldset class="color-campo">
      <legend class="campo__etiqueta">${nombre}</legend>
      <p class="campo__ayuda">${ayuda}</p>
      <div class="color-campo__fila">
        <input type="color" class="color-campo__selector" data-selector="${id}" value="${esc(valor)}"
               aria-label="${nombre}: elegir color" />
        <input class="campo__control color-campo__codigo" data-codigo="${id}" value="${esc(valor)}"
               maxlength="7" spellcheck="false" autocomplete="off" aria-label="${nombre}: código del color" />
        <button type="button" class="boton-texto" data-restablecer="${id}">Color de marca</button>
      </div>
      <div class="paleta" role="group" aria-label="Paleta de Munay">
        ${PALETA_MARCA.map((c) => `
          <button type="button" class="paleta__color" data-elegir="${id}" data-valor="${c.valor}"
                  style="background: ${c.valor}" title="${c.nombre} (${c.valor})"
                  aria-label="${c.nombre}" aria-pressed="false"></button>`).join('')}
      </div>
      <p class="color-campo__aviso" data-aviso="${id}" role="status"></p>
    </fieldset>`;
}
