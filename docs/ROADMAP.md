# Roadmap

## ✅ Etapa 1 · Catálogo público (actual)

- Portada con carrusel, beneficios, grilla de productos, Sobre Munay y contacto.
- Filtros por categoría y subcategoría.
- Detalle de producto con galería y selector de variantes.
- Estados "Sin stock" y "oculto".
- Consultas por WhatsApp (con mensaje prearmado y link a la pieza) e Instagram.
- Esquema de base de datos y seguridad en Supabase.

## ✅ Etapa 2 · Panel de administración (`/admin.html`)

- Login de las 2 administradoras (Supabase Auth) y modo demo sin login.
- Lista con búsqueda, filtros e interruptores rápidos para **Publicado/Oculto** y **En stock/Sin stock** por variante.
- Alta, edición y eliminación de productos: datos, variantes y precios.
- Subida de fotos desde la galería o la cámara, optimizadas automáticamente.
- Para **cada foto**: variante que muestra, categorías, orden y descripción.
- Sección **Categorías**: crear, renombrar, ordenar, ocultar del menú y eliminar categorías y subcategorías. También se pueden crear desde la carga de fotos.
- Validaciones y aviso de cambios sin guardar.

Pendiente de esta etapa:

- [x] Probar contra Supabase real.
- [x] Gestión de las diapositivas de la portada desde el panel (pestaña **Portada**), con recorte para escritorio y celular.
- [x] Colores de fondo y encabezado editables (pestaña **Colores**).
- [ ] Ordenar los productos entre sí. Hoy se hace con "Destacado" y el orden de alta.

## 🔜 Etapa 3 · Carrito y pedido por WhatsApp

Paso intermedio sin pagos online:

- Carrito guardado en el navegador.
- "Finalizar pedido" arma un mensaje de WhatsApp con el detalle y el total.

## 🔜 Etapa 4 · Pagos

Dos medios, en orden de complejidad:

1. **Transferencia:** se guarda el pedido en una tabla `pedidos` y se muestran CBU y alias. La administradora confirma el pago a mano desde el panel.
2. **Mercado Pago (Checkout Pro):** se crea la "preferencia de pago" desde una *Edge Function* de Supabase, porque la clave privada no puede estar en la web. Mercado Pago avisa a la web cuando el pago se acredita (webhook), y el pedido pasa a "pagado" y descuenta el stock.

Lo que cambia en el modelo:

- Tablas nuevas `pedidos` e `items_pedido`.
- Posiblemente pasar de `en_stock` (sí/no) a `cantidad` (número), para descontar stock automáticamente.

## Ideas sueltas

- Etiqueta "Nuevo" para productos recientes.
- Búsqueda por nombre.
- Feed de Instagram en la home.
- Página de preguntas frecuentes (envíos, cuidados de las piezas).
