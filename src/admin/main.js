/**
 * Punto de entrada del panel de administración (admin.html).
 *
 * 1. Verifica si hay una sesión iniciada (en modo demo siempre la hay).
 * 2. Sin sesión → pantalla de login.
 * 3. Con sesión → estructura del panel + router (productos / categorías).
 */

import '../estilos/base.css';
import './estilos/admin.css';

import { esc } from '../js/utilidades/html.js';
import { mostrarAviso } from './componentes/avisos.js';
import { iniciarRouterAdmin } from './router.js';
import { repositorio } from './servicios/repositorio.js';
import { vistaLogin } from './vistas/login.js';

const raiz = document.getElementById('admin');

async function iniciar() {
  let usuario = null;
  try {
    usuario = await repositorio.obtenerUsuario();
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }

  if (usuario) arrancarPanel(usuario);
  else vistaLogin(raiz, { repositorio, alIngresar: arrancarPanel });
}

async function arrancarPanel(usuario) {
  raiz.innerHTML = `
    ${repositorio.modo === 'demo' ? avisoDemoHtml() : ''}
    <header class="admin-encabezado">
      <a href="#/" class="logo logo--admin">munay.<span>admin</span></a>
      <nav class="admin-encabezado__acciones" aria-label="Cuenta">
        <a href="${import.meta.env.BASE_URL}" target="_blank" rel="noopener">Ver la web</a>
        ${repositorio.modo === 'supabase'
          ? `<button type="button" data-salir title="${esc(usuario.email)}">Salir</button>`
          : ''}
      </nav>
    </header>
    <nav class="admin-pestanas" aria-label="Secciones del panel">
      <a href="#/" data-seccion="productos">Productos</a>
      <a href="#/ventas" data-seccion="ventas">Ventas</a>
      <a href="#/categorias" data-seccion="categorias">Categorías</a>
      <a href="#/portada" data-seccion="portada">Portada</a>
      <a href="#/colores" data-seccion="colores">Colores</a>
    </nav>
    <main id="vista" class="admin-vista" tabindex="-1"></main>
  `;

  // Marca la pestaña de la sección actual (el editor cuenta como "Productos").
  const marcarSeccion = () => {
    const ruta = window.location.hash.replace(/^#\/?/, '').split('/')[0];
    const actual = ['ventas', 'categorias', 'portada', 'colores'].includes(ruta) ? ruta : 'productos';
    raiz.querySelectorAll('[data-seccion]').forEach((enlace) => {
      if (enlace.dataset.seccion === actual) enlace.setAttribute('aria-current', 'page');
      else enlace.removeAttribute('aria-current');
    });
  };
  window.addEventListener('hashchange', marcarSeccion);
  marcarSeccion();

  raiz.querySelector('[data-salir]')?.addEventListener('click', async () => {
    await repositorio.cerrarSesion();
    window.location.reload();
  });

  raiz.querySelector('[data-restablecer]')?.addEventListener('click', () => {
    if (!confirm('¿Descartar todos los cambios del modo demo y volver a los datos de ejemplo?')) return;
    repositorio.restablecer();
    window.location.hash = '#/';
    window.location.reload();
  });

  // Cada vista carga sus propios datos (así ven siempre las categorías al día).
  iniciarRouterAdmin({ contenedor: raiz.querySelector('#vista'), repositorio });
}

function avisoDemoHtml() {
  return `
    <p class="aviso-demo">
      <strong>Modo demo:</strong> los cambios se guardan solo en este navegador.
      <button type="button" data-restablecer>Restablecer datos de ejemplo</button>
    </p>`;
}

iniciar();
