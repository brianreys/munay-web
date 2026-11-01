/**
 * Procesamiento de fotos en el navegador ANTES de subirlas.
 *
 * Las fotos del celular pesan 3–5 MB. Reducirlas a ~1400px y comprimirlas
 * (WebP, o JPEG si el navegador no sabe generar WebP, como Safari) deja
 * cada foto en ~100–200 KB: la web carga rápido y se cuida el espacio
 * gratuito de Supabase.
 */

const LADO_MAXIMO = 1400; // px del lado más largo
const CALIDAD = 0.82;

/**
 * @param {File} archivo  Imagen elegida por el usuario.
 * @returns {Promise<Blob>} Imagen optimizada (image/webp o image/jpeg).
 */
export async function optimizarImagen(archivo) {
  // createImageBitmap respeta la orientación de la foto (EXIF) del celular.
  const imagen = await createImageBitmap(archivo);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
  const ancho = Math.round(imagen.width * escala);
  const alto = Math.round(imagen.height * escala);

  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;
  lienzo.getContext('2d').drawImage(imagen, 0, 0, ancho, alto);
  imagen.close();

  const webp = await lienzoABlob(lienzo, 'image/webp');
  // Si el navegador no soporta WebP devuelve PNG (pesado): mejor JPEG.
  return webp.type === 'image/webp' ? webp : lienzoABlob(lienzo, 'image/jpeg');
}

/** Extensión de archivo según el tipo de imagen. */
export function extensionDe(blob) {
  return blob.type === 'image/webp' ? 'webp' : 'jpg';
}

/** Convierte un Blob en texto "data:..." (lo usa el modo demo para guardar fotos). */
export function blobADataUrl(blob) {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(lector.result);
    lector.onerror = () => rechazar(lector.error);
    lector.readAsDataURL(blob);
  });
}

function lienzoABlob(lienzo, tipo) {
  return new Promise((resolver, rechazar) => {
    lienzo.toBlob(
      (blob) => (blob ? resolver(blob) : rechazar(new Error('No se pudo procesar la imagen.'))),
      tipo,
      CALIDAD,
    );
  });
}
