/**
 * Detalle de producto: galería de fotos, selector de variantes, precio,
 * estado de stock y botones de consulta (WhatsApp / Instagram).
 * Ruta: #/producto/<slug> o #/producto/<slug>/<id-variante>
 */

import { SITIO } from '../../config.js';
import { ICONOS } from '../componentes/iconos.js';
import { fotosDeVariante } from '../servicios/catalogo.js';
import { enlaceWhatsapp, mensajeConsulta, rutaProducto } from '../utilidades/enlaces.js';
import { formatearPrecio } from '../utilidades/formato.js';
import { esc } from '../utilidades/html.js';
import { vistaNoEncontrado } from './no-encontrado.js';

/** @type {import('../router.js').Vista} */
export function vistaProducto(contexto) {
  const { contenedor, catalogo, parametros } = contexto;
  const [slug, idVariante] = parametros;

  const producto = catalogo.productos.find((p) => p.slug === slug);
  if (!producto) return vistaNoEncontrado(contexto);

  // Variante inicial: la de la URL, si no la primera con stock, si no la primera.
  let variante =
    producto.variantes.find((v) => v.id === idVariante) ??
    producto.variantes.find((v) => v.enStock) ??
    producto.variantes[0];

  contenedor.innerHTML = `
    <article class="detalle contenedor">
      <nav class="migas" aria-label="Ubicación">
        <a href="#/">Inicio</a> <span aria-hidden="true">/</span>
        <a href="#/productos">Productos</a> <span aria-hidden="true">/</span>
        <span aria-current="page">${esc(producto.nombre)}</span>
      </nav>
      <div class="detalle__galeria" data-galeria></div>
      <div class="detalle__info" data-info></div>
    </article>
  `;

  const galeria = contenedor.querySelector('[data-galeria]');
  const info = contenedor.querySelector('[data-info]');

  function pintar() {
    galeria.innerHTML = galeriaHtml(fotosDeVariante(producto, variante));
    info.innerHTML = infoHtml(producto, variante);
  }
  pintar();

  // Interacciones (se desconectan al salir de la página con `control.abort()`).
  const control = new AbortController();
  contenedor.addEventListener('click', (evento) => {
    const botonVariante = evento.target.closest('[data-variante]');
    if (botonVariante) {
      variante = producto.variantes.find((v) => v.id === botonVariante.dataset.variante);
      // replaceState cambia la URL sin recargar la vista (y sin sumar al historial).
      history.replaceState(null, '', rutaProducto(producto, variante));
      pintar();
      info.querySelector(`[data-variante="${variante.id}"]`)?.focus();
      return;
    }

    const miniatura = evento.target.closest('[data-miniatura]');
    if (miniatura) mostrarFoto(galeria, Number(miniatura.dataset.miniatura));
  }, { signal: control.signal });

  return {
    titulo: `${producto.nombre} · Munay`,
    seccion: 'productos',
    limpiar: () => control.abort(),
  };
}

/* -------------------------------------------------------------------------- */

function galeriaHtml(fotos) {
  if (!fotos.length) {
    return '<div class="galeria__principal galeria__principal--vacia"><span>munay.</span></div>';
  }

  const miniaturas = fotos.length > 1
    ? `<div class="galeria__miniaturas">
        ${fotos.map((foto, i) => `
          <button type="button" class="galeria__miniatura" data-miniatura="${i}"
                  aria-label="Ver foto ${i + 1}" ${i === 0 ? 'aria-current="true"' : ''}>
            <img src="${esc(foto.url)}" alt="" loading="lazy" decoding="async" />
          </button>`).join('')}
      </div>`
    : '';

  return `
    <div class="galeria__principal">
      <img src="${esc(fotos[0].url)}" alt="${esc(fotos[0].alt)}" data-foto-principal
           data-fotos='${esc(JSON.stringify(fotos.map(({ url, alt }) => ({ url, alt }))))}' />
    </div>
    ${miniaturas}`;
}

function mostrarFoto(galeria, indice) {
  const principal = galeria.querySelector('[data-foto-principal]');
  const foto = JSON.parse(principal.dataset.fotos)[indice];
  principal.src = foto.url;
  principal.alt = foto.alt;
  galeria.querySelectorAll('[data-miniatura]').forEach((boton, i) => {
    boton.setAttribute('aria-current', String(i === indice));
  });
}

function infoHtml(producto, variante) {
  const parrafos = producto.descripcion
    .split('\n')
    .filter(Boolean)
    .map((p) => `<p>${esc(p)}</p>`)
    .join('');

  const selector = producto.variantes.length > 1
    ? `<fieldset class="variantes">
        <legend class="variantes__titulo">${esc(producto.etiquetaVariante)}</legend>
        <div class="variantes__opciones">
          ${producto.variantes.map((v) => `
            <button type="button" class="chip${v.enStock ? '' : ' chip--agotado'}"
                    data-variante="${esc(v.id)}" aria-pressed="${v.id === variante.id}">
              ${esc(v.nombre)}${v.enStock ? '' : '<span class="visualmente-oculto"> (sin stock)</span>'}
            </button>`).join('')}
        </div>
      </fieldset>`
    : '';

  const mensaje = mensajeConsulta(producto, variante);

  return `
    <h1 class="detalle__nombre">${esc(producto.nombre)}</h1>
    <p class="detalle__precio">${formatearPrecio(variante.precio)}</p>
    ${variante.enStock
      ? '<p class="detalle__stock">Disponible</p>'
      : '<p class="detalle__stock detalle__stock--agotado"><span class="etiqueta etiqueta--en-linea">Sin stock</span></p>'}

    ${selector}

    <div class="detalle__acciones">
      <a class="boton boton--ancho" href="${enlaceWhatsapp(mensaje)}" target="_blank" rel="noopener">
        ${ICONOS.whatsapp}<span>${variante.enStock ? 'Consultar por WhatsApp' : 'Avisame cuando vuelva'}</span>
      </a>
      <a class="boton boton--contorno boton--ancho" href="${SITIO.instagram.mensajeDirecto}" target="_blank" rel="noopener">
        ${ICONOS.instagram}<span>Escribinos por Instagram</span>
      </a>
    </div>

    <div class="detalle__descripcion">${parrafos}</div>

    <p class="detalle__envio">${ICONOS.camion}<span>${SITIO.envios.titulo}. ${SITIO.envios.gratisLocal}. ${SITIO.envios.detalle}</span></p>
  `;
}
