/**
 * Pantalla de ingreso (solo en modo Supabase).
 * Las cuentas se crean desde el dashboard de Supabase: ver docs/SUPABASE.md.
 */

/**
 * @param {HTMLElement} raiz
 * @param {{ repositorio: Object, alIngresar: (usuario: Object) => void }} opciones
 */
export function vistaLogin(raiz, { repositorio, alIngresar }) {
  raiz.innerHTML = `
    <main class="login">
      <form class="login__tarjeta" novalidate>
        <p class="logo logo--admin">munay.<span>admin</span></p>
        <h1 class="login__titulo">Ingresar al panel</h1>

        <label class="campo">
          <span class="campo__etiqueta">Email</span>
          <input class="campo__control" type="email" name="email" autocomplete="username" required />
        </label>
        <label class="campo">
          <span class="campo__etiqueta">Contraseña</span>
          <input class="campo__control" type="password" name="clave" autocomplete="current-password" required />
        </label>

        <p class="login__error" role="alert" hidden></p>
        <button class="boton boton--ancho" type="submit">Ingresar</button>
      </form>
    </main>
  `;

  const formulario = raiz.querySelector('form');
  const error = raiz.querySelector('.login__error');
  const boton = formulario.querySelector('button');

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const { email, clave } = Object.fromEntries(new FormData(formulario));
    if (!email || !clave) {
      mostrarError('Completá email y contraseña.');
      return;
    }

    boton.disabled = true;
    boton.textContent = 'Ingresando…';
    try {
      alIngresar(await repositorio.iniciarSesion(email.trim(), clave));
    } catch (e) {
      mostrarError(e.message);
      boton.disabled = false;
      boton.textContent = 'Ingresar';
    }
  });

  function mostrarError(texto) {
    error.textContent = texto;
    error.hidden = false;
  }
}
