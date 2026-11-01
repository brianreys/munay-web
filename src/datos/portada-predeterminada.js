/**
 * Diapositivas del carrusel de la portada que se usan mientras la tabla
 * `portada` de Supabase está vacía (y siempre en modo demo).
 * Las fotos están en `public/demo/`.
 *
 * Para cambiarlas: cargar filas en la tabla `portada` (ver docs/SUPABASE.md).
 * En cuanto haya al menos una activa, la web usa esas en lugar de estas.
 */

/** Carpeta de las fotos de ejemplo, respetando dónde está publicada la web. */
const DEMO = `${import.meta.env.BASE_URL}demo/`;

export const PORTADA_PREDETERMINADA = [
  {
    url: `${DEMO}collar-cuarzo-rosa-dije-agata.jpg`,
    titulo: 'Piezas hechas a mano',
    subtitulo: 'Piedras naturales elegidas una por una.',
    enlace: '#/productos',
    textoBoton: 'Ver colección',
  },
  {
    url: `${DEMO}collar-amazonita.jpg`,
    titulo: 'Escallas',
    subtitulo: 'Collares de piedras naturales para todos los días.',
    enlace: '#/productos/collares/escallas',
    textoBoton: 'Ver escallas',
  },
  {
    url: `${DEMO}collar-escallas-blancas.jpg`,
    titulo: 'Combiná a tu manera',
    subtitulo: 'Collares, dijes y sogas que se arman juntos.',
    enlace: '#/productos/dijes',
    textoBoton: 'Ver dijes',
  },
];
