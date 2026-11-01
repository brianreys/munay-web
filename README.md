# Munay · Web

Catálogo web de **Munay**, bijouterie artesanal ([@munay.piezas](https://www.instagram.com/munay.piezas/)).

- Catálogo de productos con variantes, filtros por categoría y estado de stock.
- Consultas por WhatsApp e Instagram (sin carrito por ahora).
- **Panel de administración** (`/admin.html`) para cargar productos y fotos desde el celular o la compu.
- Datos en **Supabase** (base de datos + fotos). Sin Supabase configurado, todo funciona en **modo demo**: los cambios del panel se guardan en el navegador y se ven en la web.

---

## Inicio rápido

Requisitos: [Node.js](https://nodejs.org/) 20 o superior.

```bash
npm install
```

```bash
npm run dev
```

- Web: <http://localhost:5173>
- Panel: <http://localhost:5173/admin.html>

Sin archivo `.env.local` se usan los datos de ejemplo de `src/datos/catalogo-demo.js` (modo demo).

### Scripts

| Comando           | Qué hace                                              |
| ----------------- | ----------------------------------------------------- |
| `npm run dev`     | Servidor de desarrollo con recarga automática          |
| `npm run build`   | Genera la versión optimizada para publicar en `dist/`  |
| `npm run preview` | Sirve `dist/` localmente para revisar el build         |
| `npm run format`  | Ordena el formato del código con Prettier              |

---

## Estructura del proyecto

```
munay-web/
├── index.html                  Web pública (el contenido lo arma JavaScript)
├── admin.html                  Panel de administración
├── public/                     Archivos que se copian tal cual (favicon, fotos demo)
├── src/
│   ├── main.js                 Punto de entrada de la web: estilos + catálogo + router
│   ├── config.js               Textos y datos de contacto editables
│   ├── admin/                  Panel de administración
│   │   ├── main.js             Punto de entrada: sesión + estructura + router
│   │   ├── router.js           #/ lista · #/nuevo · #/editar/<id> · #/categorias · #/portada · #/colores
│   │   ├── vistas/             login.js, lista.js, editor.js, categorias.js, portada.js, colores.js
│   │   ├── componentes/        avisos.js (mensajes), recortador.js (recorte de fotos)
│   │   ├── servicios/          repositorio (demo o Supabase) para escribir datos
│   │   ├── utilidades/         optimización de imágenes, slugs, reglas de categorías
│   │   └── estilos/admin.css
│   ├── datos/
│   │   ├── catalogo-demo.js    Datos de ejemplo
│   │   └── almacen-demo.js     Guarda el modo demo en el navegador
│   ├── estilos/
│   │   ├── base.css            Variables de marca (colores, fuentes), reset
│   │   ├── estructura.css      Encabezado, navegación, secciones, pie
│   │   └── componentes.css     Botones, chips, tarjetas, carrusel, detalle
│   └── js/
│       ├── router.js           Rutas (#/productos, #/producto/x, ...)
│       ├── componentes/        Piezas de interfaz reutilizables
│       ├── vistas/             Una función por página
│       ├── servicios/          Carga y consultas del catálogo
│       │   └── proveedores/    Origen de datos: demo.js o supabase.js
│       └── utilidades/         Formato de precios, enlaces, escape de HTML
├── supabase/
│   ├── esquema.sql             Tablas, seguridad (RLS) y buckets de fotos
│   ├── semilla.sql             Categorías iniciales
│   └── migraciones/            Cambios para bases ya creadas (ver docs/SUPABASE.md)
└── docs/                       Documentación (ver abajo)
```

## Documentación

| Documento                                          | Para qué                                             |
| -------------------------------------------------- | ---------------------------------------------------- |
| [GUIA-ADMIN.md](docs/GUIA-ADMIN.md)                | Cómo usar el panel (para las administradoras)        |
| [ARQUITECTURA.md](docs/ARQUITECTURA.md)            | Cómo está armada la web y por qué                    |
| [MODELO-DE-DATOS.md](docs/MODELO-DE-DATOS.md)      | Productos, variantes, fotos, categorías y stock      |
| [SUPABASE.md](docs/SUPABASE.md)                    | Crear la base de datos y los usuarios administradores |
| [PUBLICAR.md](docs/PUBLICAR.md)                    | Publicar la web y conectar el dominio                |
| [ROADMAP.md](docs/ROADMAP.md)                      | Próximos pasos: panel admin y pagos                  |

## Convenciones de código

- **Idioma:** código, comentarios y documentación en español.
- **JavaScript:** módulos ES, funciones pequeñas con comentario JSDoc arriba. Sin frameworks.
- **CSS:** nombres tipo BEM en español (`.tarjeta__nombre`, `.boton--contorno`). Los colores y fuentes salen de las variables de `src/estilos/base.css`.
- **Seguridad:** todo texto que viene de la base se pasa por `esc()` antes de insertarlo en HTML.
- **Accesibilidad:** textos alternativos en fotos, foco visible, navegación por teclado y respeto de "reducir movimiento".
- **Formato:** Prettier (`npm run format`) + `.editorconfig`.
