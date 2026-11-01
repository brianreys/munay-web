# Publicar la web

## Cómo funciona

| Pieza | Dónde vive | Qué guarda |
| --- | --- | --- |
| **Código** (esta carpeta) | Tu PC → GitHub → Netlify | HTML, CSS y JavaScript. Netlify lo publica y lo sirve en el dominio. |
| **Datos** | Supabase, en la nube | Productos, categorías, portada, fotos y cuentas de administración. Ya está en internet, no en tu PC. |
| **Dominio** | NIC Argentina (o el registrador elegido) | Solo el nombre: apunta a Netlify. |

La web publicada lee los datos directo de Supabase. Por eso, cargar productos desde el panel **no** requiere volver a publicar: lo que se guarda aparece al instante. Solo se vuelve a publicar cuando cambia el código (diseño, textos de `src/config.js`, funciones nuevas).

La web es un sitio estático (carpeta `dist/` generada por `npm run build`), así que se puede publicar gratis en Netlify. Vercel también sirve, pero su plan gratuito no permite uso comercial.

## Prueba gratuita: GitHub Pages

Deja la web en `https://<usuario>.github.io/munay-web/`, sin costo. El workflow [`.github/workflows/publicar.yml`](../.github/workflows/publicar.yml) la vuelve a publicar en cada `git push`. Los datos de Supabase salen de `.env.production`.

> En el plan gratuito de GitHub, Pages solo funciona con repositorios **públicos**: el código queda visible. No hay claves secretas en el repositorio (`.env.local` está excluido y la clave de Supabase que se sube es la pública).

1. En <https://github.com/new>: nombre `munay-web`, visibilidad **Public**, sin README ni .gitignore.
2. Desde la carpeta `munay-web`, conectar y subir. La primera vez Git abre el navegador para iniciar sesión en GitHub.

   ```bash
   git remote add origin https://github.com/<usuario>/munay-web.git
   git push -u origin main
   ```

3. En el repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Pestaña **Actions → Publicar en GitHub Pages → Run workflow**. Si la ejecución del primer push falló, es porque Pages todavía no estaba activado; esta la reemplaza.
5. En 1–2 minutos queda en `https://<usuario>.github.io/munay-web/`, con el panel en `.../munay-web/admin.html`.

Para publicar cambios: `git add -A`, `git commit -m "..."` y `git push`.

## Opción recomendada para el lanzamiento: Netlify conectado a GitHub

Cada vez que se suben cambios al repositorio, la web se actualiza sola.

1. Instalar [Git](https://git-scm.com/download/win) y crear una cuenta en GitHub.
2. Subir el proyecto a un repositorio **privado**. El `.gitignore` ya excluye `node_modules`, `dist` y `.env.local`.
3. En <https://app.netlify.com>: **Add new site → Import an existing project** y elegir el repositorio.
4. Configuración de build:
   - Base directory: `munay-web`, o vacío si el repositorio es solo esta carpeta
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Las variables de Supabase ya están en `.env.production`, así que no hace falta cargarlas en Netlify.
6. Deploy. Netlify da una dirección del tipo `munay.netlify.app`.

## Conectar el dominio propio

1. Comprar el dominio, por ejemplo `munay.com.ar` en [NIC Argentina](https://nic.ar/).
2. En Netlify: **Domain management → Add a domain** y seguir las instrucciones de DNS, que en NIC.ar se configuran como "delegación".
3. El certificado HTTPS se genera solo.
4. En Supabase: **Authentication → URL Configuration → Site URL** = `https://<tu-dominio>`. Se usa en los emails de Supabase, por ejemplo para recuperar la contraseña.

## Antes de lanzar (lista de control)

- [ ] Reemplazar los textos provisorios de `src/config.js` (Sobre Munay, envíos).
- [ ] Cargar el catálogo real y la portada desde el panel.
- [ ] Revisar precios y stock.
- [ ] Actualizar `og:image` en `index.html` con una foto de portada definitiva.
- [ ] Probar los botones de WhatsApp e Instagram desde un celular.
