# Arquitectura

## Resumen

```
 Navegador (visitante)                    Supabase (servicio en la nube)
┌──────────────────────────┐            ┌───────────────────────────────┐
│ Web estática (Vite)      │  lectura   │ PostgreSQL                    │
│  router → vistas         │──────────▶ │  categorias, productos,       │
│  servicios/catalogo.js   │  (anon key)│  variantes, fotos, portada    │
│                          │            │ Storage                       │
│                          │──────────▶ │  buckets: productos, portada  │
└──────────────────────────┘            │ Auth                          │
                                        │  2 usuarios administradores   │
 Panel admin                  escritura │                               │
┌──────────────────────────┐──────────▶ │                               │
│ admin.html (login)       │  (sesión)  └───────────────────────────────┘
│  router → vistas         │
│  servicios/repositorio   │
└──────────────────────────┘
```

- **Frontend:** HTML + CSS + JavaScript sin framework, empaquetado con [Vite](https://vite.dev/). Se publica como sitio estático, gratis en Netlify o Vercel.
- **Backend:** [Supabase](https://supabase.com/) (plan gratuito). Ofrece base de datos, almacenamiento de fotos y login, sin servidor propio.

## Decisiones y motivos

| Decisión | Motivo |
| --- | --- |
| Sin framework (React, etc.) | Menos cosas que aprender y mantener. El sitio es chico y se entiende leyendo el código. |
| Router con hash (`#/productos`) | Funciona en cualquier hosting estático sin configurar redirecciones. |
| Supabase | Base, fotos y login en un solo lugar, con plan gratuito. Si se agrega e-commerce, los pedidos van a tablas nuevas. |
| Datos en la base, no en archivos | Las dos administradoras pueden cargar productos desde el celular sin tocar código ni volver a publicar la web. |
| Proveedores intercambiables (`demo` / `supabase`) | Permite desarrollar y probar sin conexión, con datos de ejemplo. |

## Flujo de una visita

1. `main.js` dibuja el anuncio y el pie, y pide el catálogo a `servicios/catalogo.js`.
2. `catalogo.js` elige el proveedor. Si hay variables `VITE_SUPABASE_*` usa `supabase.js`; si no, `demo.js`.
3. El catálogo se **prepara** una sola vez: se descartan los productos ocultos y las variantes no visibles, y se calculan el precio mínimo/máximo y el estado "sin stock".
4. `router.js` lee el hash de la URL y ejecuta la vista correspondiente:

| Ruta | Vista |
| --- | --- |
| `#/` | `vistas/inicio.js`: carrusel, piezas, Sobre Munay, contacto |
| `#/productos` | `vistas/catalogo.js`: todos los productos |
| `#/productos/collares` | Una categoría |
| `#/productos/collares/escallas` | Una subcategoría |
| `#/producto/<slug>` | `vistas/producto.js`: detalle |
| `#/producto/<slug>/<id-variante>` | Detalle con una variante preseleccionada |
| `#/sobre-munay`, `#/contacto` | Inicio, desplazado a esa sección |

5. Cada vista devuelve `{ titulo, seccion, limpiar }`. Antes de cambiar de página, el router ejecuta `limpiar`, que detiene el carrusel y desconecta los eventos.

## Panel de administración

`admin.html` es una segunda página independiente, que Vite empaqueta por separado. Funciona así:

1. `src/admin/main.js` le pide al **repositorio** la usuaria actual.
   - En modo Supabase verifica que haya sesión y que la cuenta figure en `administradores`; si no, muestra el login.
   - En modo demo entra directo.
2. El router del panel muestra la **lista** (`#/`), el **editor** (`#/nuevo`, `#/editar/<id>`) las **categorías** (`#/categorias`) la **portada** (`#/portada`, el carrusel de inicio, con un recortador de fotos en `componentes/recortador.js`) o los **colores** (`#/colores`, guardados en la tabla `ajustes` y aplicados por `js/servicios/apariencia.js`). Si el editor tiene cambios sin guardar, avisa antes de salir. Cada vista carga sus datos al abrirse, así siempre ve las categorías al día.
3. El **repositorio** (`src/admin/servicios/repositorio.js`) ofrece las mismas funciones con dos implementaciones:
   - `repositorio-supabase.js`: escribe en la base y sube las fotos a Storage, en la carpeta `productos/<id-producto>/`.
   - `repositorio-demo.js`: guarda todo en `localStorage`. La web pública lee de ahí, así se puede probar el circuito completo sin Supabase.
4. Las fotos se **optimizan en el navegador** antes de subir: WebP o JPEG de 1400px como máximo (`utilidades/imagenes.js`).
5. Los ids de variantes y fotos nuevas se generan en el navegador (UUID). Así una foto puede asignarse a una variante que todavía no se guardó.

## Cómo agregar…

- **Una página nueva:** crear `src/js/vistas/mi-vista.js` y sumar la ruta en la tabla `RUTAS` de `router.js`.
- **Un texto fijo** (contacto, envíos, Sobre Munay): editar `src/config.js`.
- **Un color o una fuente:** editar las variables de `:root` en `src/estilos/base.css`.
- **Una categoría:** desde el panel, pestaña **Categorías** (`#/categorias`) o con "+ Nueva categoría" en las fotos del editor. Aparece sola en el menú y en los filtros. Las reglas de ids y nombres están en `src/admin/utilidades/categorias.js`.
