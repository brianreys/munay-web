/**
 * Colores editables del sitio (pestaña "Colores" del panel).
 *
 * Se guardan en la tabla `ajustes` de Supabase (o en el modo demo) y la web
 * los aplica reemplazando variables CSS de `estilos/base.css`. El color de la
 * letra del encabezado se elige solo: beige sobre fondos oscuros y chocolate
 * sobre fondos claros, para que siempre se lea.
 *
 * Para que no "parpadeen" los colores de marca en cada visita, el último
 * valor se recuerda en el navegador y se aplica antes de cargar los datos.
 */

/** Colores de marca: los valores por defecto. */
export const COLORES_MARCA = {
  colorFondo: '#e4ccbf',
  colorEncabezado: '#63382c',
};

/** Atajos para elegir rápido en el panel. */
export const PALETA_MARCA = [
  { nombre: 'Beige', valor: '#e4ccbf' },
  { nombre: 'Beige claro', valor: '#ecdcd2' },
  { nombre: 'Chocolate', valor: '#63382c' },
  { nombre: 'Terracota', valor: '#93341d' },
  { nombre: 'Blanco', valor: '#ffffff' },
];

/** Clave de cada color en la tabla `ajustes`. */
export const CLAVES_AJUSTES = {
  colorFondo: 'color_fondo',
  colorEncabezado: 'color_encabezado',
};

const TEXTO_CLARO = '#e4ccbf';
const TEXTO_OSCURO = '#63382c';
const CLAVE_RECORDADA = 'munay-colores';

/** true si es un color en formato #rrggbb. */
export function esColorValido(valor) {
  return /^#[0-9a-f]{6}$/i.test(valor ?? '');
}

/** Completa los colores que falten (o sean inválidos) con los de marca. */
export function normalizarColores(colores = {}) {
  return {
    colorFondo: esColorValido(colores.colorFondo) ? colores.colorFondo.toLowerCase() : COLORES_MARCA.colorFondo,
    colorEncabezado: esColorValido(colores.colorEncabezado)
      ? colores.colorEncabezado.toLowerCase()
      : COLORES_MARCA.colorEncabezado,
  };
}

/** Convierte las filas de la tabla `ajustes` ({ clave, valor }) en colores. */
export function coloresDesdeFilas(filas = []) {
  const porClave = Object.fromEntries(filas.map((f) => [f.clave, f.valor]));
  return normalizarColores({
    colorFondo: porClave[CLAVES_AJUSTES.colorFondo],
    colorEncabezado: porClave[CLAVES_AJUSTES.colorEncabezado],
  });
}

/**
 * Contraste entre dos colores según WCAG (1 = nada, 21 = máximo).
 * Para texto común se recomienda 4.5 o más.
 */
export function contraste(colorA, colorB) {
  const [claro, oscuro] = [luminancia(colorA), luminancia(colorB)].sort((a, b) => b - a);
  return (claro + 0.05) / (oscuro + 0.05);
}

/** Color de letra que mejor se lee sobre un fondo dado. */
export function textoSobre(fondo) {
  return contraste(fondo, TEXTO_CLARO) >= contraste(fondo, TEXTO_OSCURO) ? TEXTO_CLARO : TEXTO_OSCURO;
}

/**
 * Aplica los colores como variables CSS. Por defecto a toda la página; el
 * panel lo usa sobre un elemento para la vista previa.
 * @param {{ colorFondo?: string, colorEncabezado?: string }} colores
 * @param {HTMLElement} [raiz]
 */
export function aplicarColores(colores, raiz = document.documentElement) {
  const { colorFondo, colorEncabezado } = normalizarColores(colores);
  raiz.style.setProperty('--color-fondo', colorFondo);
  raiz.style.setProperty('--color-encabezado', colorEncabezado);
  raiz.style.setProperty('--color-encabezado-texto', textoSobre(colorEncabezado));
  // Color de la barra del navegador en celulares.
  if (raiz === document.documentElement) {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colorEncabezado);
  }
}

/** true si el texto chocolate de la web se lee bien sobre ese fondo (WCAG AA). */
export function fondoLegible(colorFondo) {
  return contraste(colorFondo, TEXTO_OSCURO) >= 4.5;
}

/** Aplica los últimos colores vistos en este navegador (si hay). */
export function aplicarColoresRecordados() {
  try {
    const recordados = JSON.parse(localStorage.getItem(CLAVE_RECORDADA));
    if (recordados) aplicarColores(recordados);
  } catch {
    // Sin colores recordados: quedan los de marca del CSS.
  }
}

/** Recuerda los colores para la próxima visita. */
export function recordarColores(colores) {
  try {
    localStorage.setItem(CLAVE_RECORDADA, JSON.stringify(normalizarColores(colores)));
  } catch {
    // Navegador sin localStorage: no pasa nada, solo puede verse un parpadeo.
  }
}

function luminancia(hex) {
  const canales = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = canales.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
