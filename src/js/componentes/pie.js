/**
 * Pie de página: marca, navegación y contacto.
 */

import { SITIO } from '../../config.js';
import { enlaceWhatsapp } from '../utilidades/enlaces.js';
import { ICONOS } from './iconos.js';

/** @param {HTMLElement} elemento */
export function renderPie(elemento) {
  const anio = new Date().getFullYear();

  elemento.innerHTML = `
    <div class="pie__columnas contenedor">
      <div class="pie__marca">
        <a href="#/" class="logo logo--pie">munay.</a>
        <p>${SITIO.lema}</p>
      </div>

      <nav aria-label="Pie de página">
        <h2 class="pie__titulo">Navegación</h2>
        <ul class="pie__lista">
          <li><a href="#/">Inicio</a></li>
          <li><a href="#/productos">Productos</a></li>
          <li><a href="#/sobre-munay">Sobre Munay</a></li>
        </ul>
      </nav>

      <div>
        <h2 class="pie__titulo">Contacto</h2>
        <ul class="pie__lista">
          <li>
            <a href="${SITIO.instagram.url}" target="_blank" rel="noopener" class="pie__contacto">
              ${ICONOS.instagram}<span>@${SITIO.instagram.usuario}</span>
            </a>
          </li>
          <li>
            <a href="${enlaceWhatsapp()}" target="_blank" rel="noopener" class="pie__contacto">
              ${ICONOS.whatsapp}<span>${SITIO.whatsapp.visible}</span>
            </a>
          </li>
          <li class="pie__contacto">${ICONOS.camion}<span>${SITIO.envios.titulo}</span></li>
          <li class="pie__contacto">${ICONOS.ubicacion}<span>${SITIO.envios.gratisLocal}</span></li>
        </ul>
      </div>
    </div>

    <p class="pie__legal">© ${anio} Munay · Todos los derechos reservados</p>
  `;
}
