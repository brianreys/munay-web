import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

/**
 * Configuración de Vite.
 * El sitio tiene dos páginas independientes:
 *  - index.html → web pública (catálogo)
 *  - admin.html → panel de administración
 *
 * `base` es la carpeta donde se publica la web. En GitHub Pages es
 * '/<nombre-del-repositorio>/' (lo define el workflow con BASE_PATH);
 * con dominio propio o en desarrollo es '/'.
 */
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  server: {
    port: 5173,
    open: false,
  },
  build: {
    rollupOptions: {
      input: {
        principal: fileURLToPath(new URL('./index.html', import.meta.url)),
        admin: fileURLToPath(new URL('./admin.html', import.meta.url)),
      },
    },
  },
});
