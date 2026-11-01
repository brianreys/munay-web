/**
 * Recortador de fotos: ventana para encuadrar una foto en un formato fijo
 * (ej: horizontal para escritorio o vertical para celular en la portada).
 *
 * Cómo se usa: el marco tiene el formato final y la foto se mueve por detrás.
 *   - Arrastrar (mouse o dedo) mueve la foto. Con teclado: flechas.
 *   - Zoom con la barra, la rueda del mouse o pellizcando con dos dedos.
 *   - La foto siempre cubre todo el marco: no quedan bordes vacíos.
 *
 * Se trabaja con coordenadas de la FOTO ORIGINAL (centro + zoom), así el
 * recorte final sale con la máxima calidad aunque la vista previa sea chica.
 */

import { comprimirLienzo } from '../utilidades/imagenes.js';
import { esc } from '../../js/utilidades/html.js';

const ZOOM_MAXIMO = 4;
const PASO_TECLADO = 20; // px de pantalla por cada flecha

/**
 * Abre el recortador.
 * @param {Blob} archivo  Foto elegida.
 * @param {{
 *   ancho: number, alto: number,   tamaño final en px (define el formato)
 *   titulo: string, ayuda?: string,
 *   permitirOtraFoto?: boolean     muestra "Usar otra foto"
 * }} opciones
 * @returns {Promise<Blob|null>} La foto recortada y comprimida, o null si se canceló.
 */
export async function recortarImagen(archivo, { ancho, alto, titulo, ayuda = '', permitirOtraFoto = false }) {
  let imagen = await createImageBitmap(archivo);

  const dialogo = document.createElement('dialog');
  dialogo.className = 'recortador';
  dialogo.setAttribute('aria-labelledby', 'recortador-titulo');
  dialogo.innerHTML = `
    <div class="recortador__caja">
      <h2 class="recortador__titulo" id="recortador-titulo">${esc(titulo)}</h2>
      <p class="recortador__ayuda">
        ${ayuda ? `${esc(ayuda)} ` : ''}Arrastrá la foto para encuadrarla y usá el zoom.
        Lo que queda dentro del marco es lo que se va a ver.
      </p>
      <div class="recortador__marco" style="aspect-ratio: ${ancho} / ${alto}; width: min(100%, calc(58vh * ${ancho / alto}))">
        <canvas tabindex="0" aria-label="Foto a recortar. Flechas para moverla, + y - para el zoom."></canvas>
      </div>
      <label class="recortador__zoom">
        <span>Zoom</span>
        <input type="range" min="1" max="${ZOOM_MAXIMO}" step="0.01" value="1" data-zoom />
      </label>
      <div class="recortador__acciones">
        ${permitirOtraFoto
          ? `<label class="boton-texto subir-fotos recortador__otra">
               <input type="file" accept="image/*" class="visualmente-oculto" data-otra />
               Usar otra foto
             </label>`
          : ''}
        <button type="button" class="boton boton--contorno boton--chico" data-cancelar>Cancelar</button>
        <button type="button" class="boton boton--chico" data-confirmar>Usar este recorte</button>
      </div>
    </div>`;
  document.body.append(dialogo);

  const lienzo = dialogo.querySelector('canvas');
  const contexto = lienzo.getContext('2d');
  const control = dialogo.querySelector('[data-zoom]');

  // Estado: punto de la foto que queda en el centro del marco, y zoom.
  let centroX = imagen.width / 2;
  let centroY = imagen.height / 2;
  let zoom = 1;

  /** Escala (px de pantalla por px de foto) para que la foto cubra el marco. */
  function escala() {
    const { clientWidth: w, clientHeight: h } = lienzo;
    return Math.max(w / imagen.width, h / imagen.height) * zoom;
  }

  /** Evita que se vean bordes vacíos: limita el centro según el zoom. */
  function limitar() {
    const s = escala();
    const mitadX = lienzo.clientWidth / 2 / s;
    const mitadY = lienzo.clientHeight / 2 / s;
    centroX = Math.min(imagen.width - mitadX, Math.max(mitadX, centroX));
    centroY = Math.min(imagen.height - mitadY, Math.max(mitadY, centroY));
  }

  function dibujar() {
    const densidad = window.devicePixelRatio || 1;
    const { clientWidth: w, clientHeight: h } = lienzo;
    if (!w || !h) return;
    lienzo.width = Math.round(w * densidad);
    lienzo.height = Math.round(h * densidad);
    limitar();
    const s = escala();
    contexto.setTransform(densidad, 0, 0, densidad, 0, 0);
    contexto.imageSmoothingQuality = 'high';
    contexto.drawImage(imagen, w / 2 - centroX * s, h / 2 - centroY * s, imagen.width * s, imagen.height * s);
  }

  function cambiarZoom(valor) {
    zoom = Math.min(ZOOM_MAXIMO, Math.max(1, valor));
    control.value = zoom;
    dibujar();
  }

  function mover(dx, dy) {
    const s = escala();
    centroX -= dx / s;
    centroY -= dy / s;
    dibujar();
  }

  /* ----- Arrastrar y pellizcar ----- */

  const punteros = new Map();
  let distanciaInicial = 0;
  let zoomInicial = 1;

  const distancia = () => {
    const [a, b] = [...punteros.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  lienzo.addEventListener('pointerdown', (e) => {
    lienzo.setPointerCapture(e.pointerId);
    punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (punteros.size === 2) {
      distanciaInicial = distancia();
      zoomInicial = zoom;
    }
  });

  lienzo.addEventListener('pointermove', (e) => {
    const anterior = punteros.get(e.pointerId);
    if (!anterior) return;
    punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (punteros.size === 2) cambiarZoom(zoomInicial * (distancia() / distanciaInicial));
    else mover(e.clientX - anterior.x, e.clientY - anterior.y);
  });

  const soltar = (e) => punteros.delete(e.pointerId);
  lienzo.addEventListener('pointerup', soltar);
  lienzo.addEventListener('pointercancel', soltar);

  lienzo.addEventListener('wheel', (e) => {
    e.preventDefault();
    cambiarZoom(zoom * Math.exp(-e.deltaY * 0.0015));
  }, { passive: false });

  lienzo.addEventListener('keydown', (e) => {
    const flechas = {
      ArrowLeft: [PASO_TECLADO, 0],
      ArrowRight: [-PASO_TECLADO, 0],
      ArrowUp: [0, PASO_TECLADO],
      ArrowDown: [0, -PASO_TECLADO],
    };
    if (flechas[e.key]) mover(...flechas[e.key]);
    else if (e.key === '+' || e.key === '=') cambiarZoom(zoom * 1.1);
    else if (e.key === '-') cambiarZoom(zoom / 1.1);
    else return;
    e.preventDefault();
  });

  control.addEventListener('input', () => cambiarZoom(Number(control.value)));

  // Redibuja si cambia el tamaño de la ventana (ej: girar el celular).
  const observador = new ResizeObserver(dibujar);
  observador.observe(lienzo);

  /* ----- Otra foto ----- */

  dialogo.querySelector('[data-otra]')?.addEventListener('change', async (e) => {
    const [otra] = e.target.files;
    if (!otra) return;
    try {
      const nueva = await createImageBitmap(otra);
      imagen.close();
      imagen = nueva;
      centroX = imagen.width / 2;
      centroY = imagen.height / 2;
      cambiarZoom(1);
    } catch {
      alert(`No se pudo abrir "${otra.name}". ¿Es una imagen?`);
    }
    e.target.value = '';
  });

  /* ----- Resultado ----- */

  /** Dibuja el recorte en tamaño final (sin agrandar fotos chicas) y lo comprime. */
  async function recortar() {
    limitar();
    const s = escala();
    const recorteAncho = lienzo.clientWidth / s;
    const recorteAlto = lienzo.clientHeight / s;
    const anchoFinal = Math.round(Math.min(ancho, recorteAncho));
    const altoFinal = Math.round((anchoFinal * alto) / ancho);

    const salida = document.createElement('canvas');
    salida.width = anchoFinal;
    salida.height = altoFinal;
    const ctx = salida.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      imagen,
      centroX - recorteAncho / 2, centroY - recorteAlto / 2, recorteAncho, recorteAlto,
      0, 0, anchoFinal, altoFinal,
    );
    return comprimirLienzo(salida);
  }

  return new Promise((resolver) => {
    const cerrar = (resultado) => {
      observador.disconnect();
      imagen.close();
      dialogo.close();
      dialogo.remove();
      resolver(resultado);
    };

    dialogo.querySelector('[data-cancelar]').addEventListener('click', () => cerrar(null));
    // Escape cierra la ventana: cuenta como cancelar.
    dialogo.addEventListener('cancel', (e) => {
      e.preventDefault();
      cerrar(null);
    });
    dialogo.querySelector('[data-confirmar]').addEventListener('click', async (e) => {
      e.currentTarget.disabled = true;
      e.currentTarget.textContent = 'Procesando…';
      cerrar(await recortar());
    });

    dialogo.showModal();
    dibujar();
    lienzo.focus();
  });
}
