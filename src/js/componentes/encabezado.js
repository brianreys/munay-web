/**
 * Barra de anuncio + encabezado con logo y menú de navegación.
 *
 * El menú de "Productos" se arma a partir de las categorías del catálogo
 * (una categoría nueva cargada en la base aparece sola en el menú) y se
 * despliega por niveles, solo al tocar cada uno:
 *
 *   Productos ▾            → muestra las categorías
 *     Collares ▾           → muestra sus subcategorías
 *       Ver todos / Escallas / Donas / Mil vueltas
 *     Dijes                → (sin subcategorías: es un enlace directo)
 *
 * Funciona igual en computadora (panel flotante) y en celular (dentro del
 * menú hamburguesa). Los desplegables usan botones con `aria-expanded`
 * y el atributo `hidden`, así también son accesibles por teclado.
 */

import { ANUNCIOS, SITIO } from '../../config.js';
import { categoriasPrincipales, subcategorias } from '../servicios/catalogo.js';
import { rutaCategoria } from '../utilidades/enlaces.js';
import { esc } from '../utilidades/html.js';
import { ICONOS } from './iconos.js';

/** Milisegundos que se ve cada mensaje de la franja superior. */
const INTERVALO_ANUNCIO = 3000;

/**
 * Franja superior: muestra los mensajes de `ANUNCIOS` de a uno, en una sola
 * línea, con un fundido. Se pausa mientras el puntero está encima.
 * Los lectores de pantalla leen todos los mensajes juntos (no cambian solos).
 */
export function renderAnuncio(elemento) {
  elemento.innerHTML = `
    <p class="visualmente-oculto">${ANUNCIOS.join('. ')}</p>
    <div class="anuncio__mensajes" aria-hidden="true">
      ${ANUNCIOS.map((texto, i) => `<span class="anuncio__mensaje${i === 0 ? ' es-activo' : ''}">${esc(texto)}</span>`).join('')}
    </div>`;

  const mensajes = [...elemento.querySelectorAll('.anuncio__mensaje')];
  if (mensajes.length < 2) return;

  let actual = 0;
  let pausado = false;
  elemento.addEventListener('pointerenter', () => (pausado = true));
  elemento.addEventListener('pointerleave', () => (pausado = false));

  setInterval(() => {
    if (pausado || document.hidden) return;
    mensajes[actual].classList.remove('es-activo');
    actual = (actual + 1) % mensajes.length;
    mensajes[actual].classList.add('es-activo');
  }, INTERVALO_ANUNCIO);
}

/**
 * Dibuja el encabezado y conecta el botón de menú (celular) y los desplegables.
 * @param {HTMLElement} elemento
 * @param {Object} catalogo
 */
export function renderEncabezado(elemento, catalogo) {
  elemento.innerHTML = `
    <div class="encabezado__barra contenedor">
      <button class="encabezado__boton-menu" type="button" aria-expanded="false"
              aria-controls="navegacion" aria-label="Abrir menú">
        <span class="hamburguesa" aria-hidden="true"></span>
      </button>

      <a href="#/" class="logo" aria-label="Munay, ir al inicio">munay.</a>

      <form class="buscador" role="search" data-buscador>
        <label class="visualmente-oculto" for="buscador-productos">Buscar productos</label>
        <input class="buscador__campo" id="buscador-productos" type="search" name="q"
               placeholder="Buscar productos" autocomplete="off" />
        <button class="buscador__boton" type="submit" aria-label="Buscar">${ICONOS.lupa}</button>
      </form>

      <a href="${SITIO.instagram.url}" class="encabezado__social" target="_blank" rel="noopener"
         aria-label="Instagram de Munay (se abre en otra pestaña)">${ICONOS.instagram}</a>
    </div>

    <nav id="navegacion" class="navegacion" aria-label="Principal">
      <ul class="navegacion__lista">
        <li><a href="#/" data-seccion="inicio">Inicio</a></li>
        <li class="navegacion__item-submenu">
          ${botonDesplegable('submenu-productos', 'Productos', 'navegacion__desplegar', 'data-seccion="productos"')}
          <ul class="submenu" id="submenu-productos" hidden>
            <li><a class="submenu__ver-todo" href="#/productos">Ver todos los productos</a></li>
            ${categoriasPrincipales(catalogo).map((cat) => itemCategoria(catalogo, cat)).join('')}
          </ul>
        </li>
        <li><a href="#/sobre-munay" data-seccion="sobre-munay">Sobre Munay</a></li>
        <li><a href="#/contacto" data-seccion="contacto">Contacto</a></li>
      </ul>
    </nav>
  `;

  conectarMenuCelular(elemento);
  conectarDesplegables(elemento);
  conectarBuscador(elemento);
}

/** Buscador de productos (solo escritorio): lleva a #/buscar/<texto>. */
function conectarBuscador(encabezado) {
  const formulario = encabezado.querySelector('[data-buscador]');
  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const texto = formulario.elements.q.value.trim();
    if (texto) window.location.hash = `#/buscar/${encodeURIComponent(texto)}`;
  });
}

/* -------------------------------------------------------------------------- */
/* HTML                                                                       */
/* -------------------------------------------------------------------------- */

/** Botón que abre/cierra el bloque con id `idControlado`. */
function botonDesplegable(idControlado, texto, clase, atributosExtra = '') {
  return `
    <button type="button" class="${clase}" data-desplegar aria-expanded="false"
            aria-controls="${idControlado}" ${atributosExtra}>
      <span>${esc(texto)}</span>${ICONOS.flechaAbajo}
    </button>`;
}

/** Categoría del submenú: desplegable si tiene subcategorías, enlace si no. */
function itemCategoria(catalogo, categoria) {
  const hijos = subcategorias(catalogo, categoria.id);

  if (!hijos.length) {
    return `<li><a class="submenu__categoria" href="${rutaCategoria(categoria)}">${esc(categoria.nombre)}</a></li>`;
  }

  const idHijos = `submenu-${categoria.id}`;
  return `
    <li>
      ${botonDesplegable(idHijos, categoria.nombre, 'submenu__categoria')}
      <ul class="submenu__hijos" id="${idHijos}" hidden>
        <li><a href="${rutaCategoria(categoria)}">Ver todos</a></li>
        ${hijos.map((hijo) => `<li><a href="${rutaCategoria(hijo)}">${esc(hijo.nombre)}</a></li>`).join('')}
      </ul>
    </li>`;
}

/* -------------------------------------------------------------------------- */
/* Comportamiento                                                             */
/* -------------------------------------------------------------------------- */

function conectarMenuCelular(encabezado) {
  const boton = encabezado.querySelector('.encabezado__boton-menu');
  boton.addEventListener('click', () => {
    const abierto = encabezado.classList.toggle('esta-abierto');
    boton.setAttribute('aria-expanded', String(abierto));
    boton.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
    if (!abierto) cerrarDesplegables(encabezado);
  });
}

function conectarDesplegables(encabezado) {
  encabezado.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-desplegar]');
    if (!boton) return;

    const abrir = boton.getAttribute('aria-expanded') !== 'true';

    // Acordeón: al abrir un nivel se cierran sus "hermanos" (otra categoría abierta).
    const lista = boton.closest('li').parentElement;
    for (const hermano of lista.querySelectorAll(':scope > li > [data-desplegar]')) {
      if (hermano !== boton) alternar(hermano, false);
    }
    alternar(boton, abrir);
  });

  // Cerrar al tocar fuera del menú o al presionar Escape.
  document.addEventListener('click', (evento) => {
    if (!evento.target.closest('.navegacion__item-submenu')) cerrarDesplegables(encabezado);
  });
  document.addEventListener('keydown', (evento) => {
    if (evento.key !== 'Escape') return;
    const productos = encabezado.querySelector('.navegacion__desplegar');
    if (productos.getAttribute('aria-expanded') === 'true') {
      cerrarDesplegables(encabezado);
      productos.focus();
    }
  });
}

/**
 * Abre o cierra un desplegable. Al cerrarlo, también cierra los niveles
 * internos para que la próxima vez arranque plegado.
 */
function alternar(boton, abrir) {
  const bloque = document.getElementById(boton.getAttribute('aria-controls'));
  boton.setAttribute('aria-expanded', String(abrir));
  bloque.hidden = !abrir;
  if (!abrir) {
    for (const interno of bloque.querySelectorAll('[data-desplegar]')) alternar(interno, false);
  }
}

function cerrarDesplegables(encabezado) {
  for (const boton of encabezado.querySelectorAll('.navegacion__desplegar')) alternar(boton, false);
}

/**
 * Marca la sección activa en el menú y cierra menú y desplegables.
 * La llama el router en cada cambio de página.
 * @param {string} seccion  'inicio' | 'productos' | 'sobre-munay' | 'contacto'
 */
export function actualizarEncabezado(seccion) {
  const encabezado = document.getElementById('encabezado');
  encabezado.classList.remove('esta-abierto');
  encabezado.querySelector('.encabezado__boton-menu')?.setAttribute('aria-expanded', 'false');
  cerrarDesplegables(encabezado);

  for (const enlace of encabezado.querySelectorAll('[data-seccion]')) {
    if (enlace.dataset.seccion === seccion) enlace.setAttribute('aria-current', 'page');
    else enlace.removeAttribute('aria-current');
  }
}
