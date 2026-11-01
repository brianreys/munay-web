/**
 * Mensajes emergentes ("toasts") para confirmar acciones o mostrar errores.
 */

const DURACION = 4000; // ms

/**
 * @param {string} texto
 * @param {'exito'|'error'} [tipo]
 */
export function mostrarAviso(texto, tipo = 'exito') {
  const contenedor = document.getElementById('avisos');
  const aviso = document.createElement('p');
  aviso.className = `aviso aviso--${tipo}`;
  aviso.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
  aviso.textContent = texto;
  contenedor.append(aviso);
  setTimeout(() => aviso.remove(), tipo === 'error' ? DURACION * 2 : DURACION);
}
