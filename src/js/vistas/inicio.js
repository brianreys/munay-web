/**
 * Página de inicio: carrusel, beneficios, productos, "Sobre Munay" y contacto.
 */

import { SITIO, SOBRE_MUNAY } from '../../config.js';
import { crearCarrusel } from '../componentes/carrusel.js';
import { filtrosHtml } from '../componentes/filtros.js';
import { ICONOS } from '../componentes/iconos.js';
import { activarRotacionDeFotos } from '../componentes/rotacion-fotos.js';
import { grillaHtml } from '../componentes/tarjeta.js';
import { tarjetasDeProductos } from '../servicios/catalogo.js';
import { enlaceWhatsapp } from '../utilidades/enlaces.js';

/** Cantidad de productos que se muestran en la home antes de "Ver todo". */
const PRODUCTOS_EN_INICIO = 8;

/** @type {import('../router.js').Vista} */
export function vistaInicio({ contenedor, catalogo }) {
  const productos = catalogo.productos.slice(0, PRODUCTOS_EN_INICIO);
  const hayMas = catalogo.productos.length > PRODUCTOS_EN_INICIO;

  contenedor.innerHTML = `
    <section class="portada" aria-label="Novedades">
      <div class="carrusel" data-carrusel></div>
    </section>

    <ul class="beneficios contenedor" aria-label="Beneficios">
      <li>${ICONOS.camion}<span>${SITIO.envios.titulo}</span></li>
      <li>${ICONOS.ubicacion}<span>${SITIO.envios.gratisLocal}</span></li>
      <li>${ICONOS.mano}<span>Piezas hechas a mano</span></li>
      <li>${ICONOS.mensaje}<span>Consultas por WhatsApp e Instagram</span></li>
    </ul>

    <section class="seccion contenedor" aria-labelledby="titulo-piezas">
      <header class="seccion__encabezado">
        <p class="sobretitulo">Colección</p>
        <h2 id="titulo-piezas" class="seccion__titulo">Nuestras piezas</h2>
      </header>
      ${filtrosHtml(catalogo)}
      ${grillaHtml(tarjetasDeProductos(productos))}
      ${hayMas ? '<p class="seccion__accion"><a class="boton boton--contorno" href="#/productos">Ver todo el catálogo</a></p>' : ''}
    </section>

    <section id="sobre-munay" class="sobre" aria-labelledby="titulo-sobre">
      <div class="sobre__contenido contenedor">
        <p class="sobretitulo">Nuestra historia</p>
        <h2 id="titulo-sobre" class="seccion__titulo">${SOBRE_MUNAY.titulo}</h2>
        ${SOBRE_MUNAY.parrafos.map((p) => `<p>${p}</p>`).join('')}
      </div>
    </section>

    <section id="contacto" class="contacto contenedor" aria-labelledby="titulo-contacto">
      <h2 id="titulo-contacto" class="seccion__titulo">¿Te gustó alguna pieza?</h2>
      <p>Escribinos y te ayudamos con tu pedido. ${SITIO.envios.titulo.toLowerCase()}.</p>
      <div class="contacto__botones">
        <a class="boton" href="${enlaceWhatsapp('¡Hola! Quería hacer una consulta.')}" target="_blank" rel="noopener">
          ${ICONOS.whatsapp}<span>WhatsApp</span>
        </a>
        <a class="boton boton--contorno" href="${SITIO.instagram.mensajeDirecto}" target="_blank" rel="noopener">
          ${ICONOS.instagram}<span>Instagram</span>
        </a>
      </div>
    </section>
  `;

  const detenerCarrusel = crearCarrusel(
    contenedor.querySelector('[data-carrusel]'),
    catalogo.portada,
  );
  const detenerRotacion = activarRotacionDeFotos(contenedor);

  return {
    titulo: `Munay · ${SITIO.lema}`,
    seccion: 'inicio',
    limpiar: () => {
      detenerCarrusel();
      detenerRotacion();
    },
  };
}
