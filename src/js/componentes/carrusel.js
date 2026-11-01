/**
 * Carrusel de portada con transición de fundido.
 *
 * - Avanza solo cada `intervalo` ms, salvo que el usuario prefiera menos
 *   movimiento o esté interactuando (mouse encima / foco dentro).
 * - Se puede manejar con flechas, puntos, teclado y deslizando en el celular.
 * - Las diapositivas ocultas llevan `inert` para que no reciban foco.
 * - Cada diapositiva puede tener una foto horizontal (escritorio) y otra
 *   vertical (celular). Título, subtítulo y botón son opcionales.
 */

import { esc, prefiereMenosMovimiento } from '../utilidades/html.js';
import { ICONOS } from './iconos.js';

const DISTANCIA_MINIMA_DESLIZAR = 40; // px

/**
 * Formato de las fotos de portada. El recortador del panel usa estos mismos
 * valores, y `.carrusel` en componentes.css tiene las mismas proporciones.
 */
export const FORMATO_PORTADA = {
  escritorio: { ancho: 1920, alto: 840 }, // 16:7, horizontal
  movil: { ancho: 1080, alto: 1350 }, // 4:5, vertical
  anchoMaximoMovil: 680, // px: hasta este ancho de pantalla se usa la foto vertical
};

/**
 * @param {HTMLElement} raiz  Contenedor vacío donde se dibuja el carrusel.
 * @param {Array<{url, titulo, subtitulo, enlace, textoBoton}>} diapositivas
 * @param {{ intervalo?: number }} [opciones]
 * @returns {() => void} Función para detener el carrusel al salir de la página.
 */
export function crearCarrusel(raiz, diapositivas, { intervalo = 6000 } = {}) {
  if (!diapositivas.length) {
    raiz.hidden = true;
    return () => {};
  }

  const total = diapositivas.length;
  raiz.setAttribute('aria-roledescription', 'carrusel');
  raiz.innerHTML = `
    <div class="carrusel__pista">
      ${diapositivas.map((d, i) => diapositivaHtml(d, i, total)).join('')}
    </div>
    ${total > 1 ? controlesHtml(total) : ''}
  `;

  const elementos = [...raiz.querySelectorAll('.carrusel__diapositiva')];
  const puntos = [...raiz.querySelectorAll('.carrusel__punto')];
  let actual = 0;
  let temporizador = null;

  function irA(indice) {
    actual = (indice + total) % total;
    elementos.forEach((el, i) => {
      const activa = i === actual;
      el.classList.toggle('es-activa', activa);
      el.inert = !activa;
    });
    puntos.forEach((punto, i) => punto.setAttribute('aria-current', String(i === actual)));
  }

  function iniciar() {
    if (total < 2 || prefiereMenosMovimiento()) return;
    detener();
    temporizador = setInterval(() => irA(actual + 1), intervalo);
  }

  function detener() {
    clearInterval(temporizador);
    temporizador = null;
  }

  // Controles
  const control = new AbortController();
  const { signal } = control;

  raiz.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-ir]');
    if (!boton) return;
    const destino = boton.dataset.ir;
    irA(destino === 'anterior' ? actual - 1 : destino === 'siguiente' ? actual + 1 : Number(destino));
  }, { signal });

  raiz.addEventListener('keydown', (evento) => {
    if (evento.key === 'ArrowLeft') irA(actual - 1);
    if (evento.key === 'ArrowRight') irA(actual + 1);
  }, { signal });

  // Pausa mientras el usuario interactúa
  raiz.addEventListener('mouseenter', detener, { signal });
  raiz.addEventListener('mouseleave', iniciar, { signal });
  raiz.addEventListener('focusin', detener, { signal });
  raiz.addEventListener('focusout', iniciar, { signal });

  // Deslizar con el dedo
  let inicioX = null;
  raiz.addEventListener('touchstart', (e) => { inicioX = e.touches[0].clientX; }, { signal, passive: true });
  raiz.addEventListener('touchend', (e) => {
    if (inicioX === null) return;
    const diferencia = e.changedTouches[0].clientX - inicioX;
    if (Math.abs(diferencia) > DISTANCIA_MINIMA_DESLIZAR) irA(actual + (diferencia < 0 ? 1 : -1));
    inicioX = null;
  }, { signal });

  irA(0);
  iniciar();

  return () => {
    detener();
    control.abort();
  };
}

function diapositivaHtml(diapositiva, indice, total) {
  // La primera imagen se carga con prioridad: es lo primero que se ve.
  const carga = indice === 0 ? 'fetchpriority="high"' : 'loading="lazy"';
  const texto = textoPortadaHtml(diapositiva);
  return `
    <div class="carrusel__diapositiva${texto ? ' carrusel__diapositiva--con-texto' : ''}" role="group"
         aria-roledescription="diapositiva" aria-label="${indice + 1} de ${total}">
      ${imagenPortadaHtml(diapositiva, carga)}
      ${texto}
    </div>`;
}

/**
 * Foto de una diapositiva: en celular usa la versión vertical si existe.
 * Exportada para la vista previa del panel.
 */
export function imagenPortadaHtml(diapositiva, atributos = '') {
  const movil = diapositiva.urlMovil
    ? `<source media="(max-width: ${FORMATO_PORTADA.anchoMaximoMovil}px)" srcset="${esc(diapositiva.urlMovil)}" />`
    : '';
  return `
    <picture>
      ${movil}
      <img class="carrusel__imagen" src="${esc(diapositiva.url)}" alt="" ${atributos} decoding="async" />
    </picture>`;
}

/**
 * Título, subtítulo y botón (todos opcionales). Sin ninguno, no se dibuja nada.
 * Exportada para la vista previa del panel.
 */
export function textoPortadaHtml({ titulo, subtitulo, enlace, textoBoton }) {
  if (!titulo && !subtitulo && !enlace) return '';
  return `
    <div class="carrusel__texto">
      ${titulo ? `<h2 class="carrusel__titulo">${esc(titulo)}</h2>` : ''}
      ${subtitulo ? `<p class="carrusel__subtitulo">${esc(subtitulo)}</p>` : ''}
      ${enlace ? `<a class="boton boton--claro" href="${esc(enlace)}">${esc(textoBoton || 'Ver colección')}</a>` : ''}
    </div>`;
}

function controlesHtml(total) {
  const puntos = Array.from({ length: total }, (_, i) =>
    `<button class="carrusel__punto" type="button" data-ir="${i}" aria-label="Ir a la diapositiva ${i + 1}"></button>`,
  ).join('');

  return `
    <button class="carrusel__flecha carrusel__flecha--anterior" type="button" data-ir="anterior" aria-label="Anterior">${ICONOS.flechaIzquierda}</button>
    <button class="carrusel__flecha carrusel__flecha--siguiente" type="button" data-ir="siguiente" aria-label="Siguiente">${ICONOS.flechaDerecha}</button>
    <div class="carrusel__puntos">${puntos}</div>`;
}
