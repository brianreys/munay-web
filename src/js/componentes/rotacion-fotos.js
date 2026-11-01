/**
 * Rotación de fotos en las tarjetas de producto que tienen más de una foto
 * (las marcadas con `data-rotar`, ver tarjeta.js).
 *
 *  - Computadora (con mouse): al pasar el puntero se queda en la portada
 *    (con el zoom del CSS) y cada 3 segundos pasa a la foto siguiente.
 *    Al sacar el puntero vuelve a la portada.
 *  - Celular / tablet (táctil): la foto avanza a medida que la tarjeta
 *    recorre la pantalla con el scroll. Entra mostrando la portada.
 */

const INTERVALO = 3000; // ms entre foto y foto al pasar el puntero

/**
 * @param {HTMLElement} raiz  Contenedor de la vista con las grillas.
 * @returns {() => void} Función para detener todo al salir de la página.
 */
export function activarRotacionDeFotos(raiz) {
  const tarjetas = [...raiz.querySelectorAll('[data-rotar]')];
  if (!tarjetas.length) return () => {};

  const conMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  return conMouse ? rotarAlPasarElPuntero(tarjetas) : rotarConElScroll(tarjetas);
}

/* -------------------------------------------------------------------------- */
/* Computadora                                                                */
/* -------------------------------------------------------------------------- */

function rotarAlPasarElPuntero(tarjetas) {
  const control = new AbortController();
  const { signal } = control;
  const temporizadores = new Map();

  const empezar = (contenedor) => {
    if (temporizadores.has(contenedor)) return;
    cargarFotos(contenedor);
    let indice = 0;
    temporizadores.set(contenedor, setInterval(() => {
      indice = (indice + 1) % cantidadDeFotos(contenedor);
      mostrarFoto(contenedor, indice);
    }, INTERVALO));
  };

  const terminar = (contenedor) => {
    clearInterval(temporizadores.get(contenedor));
    temporizadores.delete(contenedor);
    mostrarFoto(contenedor, 0);
  };

  for (const contenedor of tarjetas) {
    const enlace = contenedor.closest('a') ?? contenedor;
    // También con teclado: al enfocar la tarjeta se comporta igual que el puntero.
    for (const evento of ['pointerenter', 'focus']) {
      enlace.addEventListener(evento, () => empezar(contenedor), { signal });
    }
    for (const evento of ['pointerleave', 'blur']) {
      enlace.addEventListener(evento, () => terminar(contenedor), { signal });
    }
  }

  return () => {
    control.abort();
    temporizadores.forEach((id) => clearInterval(id));
  };
}

/* -------------------------------------------------------------------------- */
/* Celular                                                                    */
/* -------------------------------------------------------------------------- */

function rotarConElScroll(tarjetas) {
  const control = new AbortController();
  const visibles = new Set();
  let pendiente = false;

  // Se siguen solo las tarjetas cerca de la pantalla. El margen hace que sus
  // fotos se descarguen un poco antes de que aparezcan.
  const observador = new IntersectionObserver((entradas) => {
    for (const entrada of entradas) {
      if (entrada.isIntersecting) {
        visibles.add(entrada.target);
        cargarFotos(entrada.target);
      } else {
        visibles.delete(entrada.target);
        mostrarFoto(entrada.target, 0);
      }
    }
    programar();
  }, { rootMargin: '200px 0px' });

  /** Una sola actualización por cuadro, aunque el scroll dispare muchos eventos. */
  function programar() {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(actualizar);
  }

  function actualizar() {
    pendiente = false;
    const alto = window.innerHeight;
    for (const contenedor of visibles) {
      const { top, height } = contenedor.getBoundingClientRect();
      // Recorrido: el centro de la foto sube del 85% al 15% del alto de la
      // pantalla. Ese tramo se reparte en partes iguales entre las fotos.
      const avance = (alto * 0.85 - (top + height / 2)) / (alto * 0.7);
      const total = cantidadDeFotos(contenedor);
      const indice = Math.min(total - 1, Math.max(0, Math.floor(avance * total)));
      if (Number(contenedor.dataset.fotoActual ?? 0) !== indice) mostrarFoto(contenedor, indice);
    }
  }

  tarjetas.forEach((contenedor) => observador.observe(contenedor));
  window.addEventListener('scroll', programar, { passive: true, signal: control.signal });
  window.addEventListener('resize', programar, { signal: control.signal });

  return () => {
    observador.disconnect();
    control.abort();
  };
}

/* -------------------------------------------------------------------------- */
/* Auxiliares                                                                 */
/* -------------------------------------------------------------------------- */

function cantidadDeFotos(contenedor) {
  return contenedor.querySelectorAll('.tarjeta__foto').length;
}

/** Descarga las fotos extra la primera vez que hacen falta. */
function cargarFotos(contenedor) {
  contenedor.querySelectorAll('img[data-src]').forEach((img) => {
    img.src = img.dataset.src;
    img.removeAttribute('data-src');
  });
}

/** Muestra la foto número `indice` (0 = portada) con un fundido. */
function mostrarFoto(contenedor, indice) {
  contenedor.querySelectorAll('.tarjeta__foto').forEach((foto, i) => {
    foto.classList.toggle('tarjeta__foto--activa', i === indice && i > 0);
  });
  contenedor.dataset.fotoActual = indice;
}
