/**
 * Punto de entrada de la web pública.
 * Carga estilos, obtiene el catálogo y arranca el router.
 */

import './estilos/base.css';
import './estilos/estructura.css';
import './estilos/componentes.css';

import { renderAnuncio, renderEncabezado } from './js/componentes/encabezado.js';
import { renderPie } from './js/componentes/pie.js';
import { iniciarRouter } from './js/router.js';
import { aplicarColores, aplicarColoresRecordados, recordarColores } from './js/servicios/apariencia.js';
import { obtenerCatalogo } from './js/servicios/catalogo.js';

async function iniciar() {
  const contenedor = document.getElementById('contenido');

  // Colores de la última visita mientras llegan los datos (evita un parpadeo).
  aplicarColoresRecordados();

  // El pie y el anuncio no dependen de los datos: se muestran enseguida.
  renderAnuncio(document.getElementById('anuncio'));
  renderPie(document.getElementById('pie'));

  try {
    const catalogo = await obtenerCatalogo();
    aplicarColores(catalogo.ajustes);
    recordarColores(catalogo.ajustes);
    renderEncabezado(document.getElementById('encabezado'), catalogo);
    iniciarRouter({ contenedor, catalogo });
  } catch (error) {
    console.error('No se pudo cargar el catálogo:', error);
    contenedor.innerHTML = `
      <section class="seccion contenedor vacio">
        <h1 class="seccion__titulo">No pudimos cargar el catálogo</h1>
        <p>Probá recargar la página en unos minutos.</p>
      </section>`;
  }
}

iniciar();
