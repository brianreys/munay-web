# Modelo de datos

La definición completa está en [`supabase/esquema.sql`](../supabase/esquema.sql).

## Las 4 piezas principales

```
PRODUCTO  "Collar Cuarzo Rosa"   (estado: publicado | oculto)
 ├── VARIANTE "Solo"                         $18.000   en stock
 │     └── FOTO collar-solo.jpg              → categorías: [Collares › Escallas]
 └── VARIANTE "Con dije de ágata en soga"    $32.000   en stock
       └── FOTO collar-con-dije.jpg          → categorías: [Collares › Escallas, Dijes, Soga]
```

| Tabla | Qué representa | Campos clave |
| --- | --- | --- |
| `productos` | La pieza o familia de piezas | `nombre`, `slug` (URL), `descripcion`, `estado`, `etiqueta_variante`, `destacado` |
| `variantes` | Cada opción **comprable**, con su precio y stock | `nombre`, `precio`, `en_stock`, `visible` |
| `fotos` | Una imagen subida a Storage | `ruta` (archivo), `alt`, `variante_id` (opcional) |
| `foto_categorias` | Qué categorías tiene **cada foto** | `foto_id`, `categoria_id` |
| `categorias` | Árbol del menú (2 niveles) | `nombre`, `slug`, `padre_id`, `en_menu` |
| `portada` | Diapositivas del carrusel de inicio | `ruta`, `titulo`, `subtitulo`, `enlace` |
| `administradores` | Usuarios que pueden editar | `user_id` |

## Las categorías se asignan a las fotos

Esto es lo que permite que una misma pieza aparezca en varias secciones:

- La foto del collar solo, etiquetada **Collares › Escallas**, aparece en *Escallas* y en *Collares*, porque las categorías padre incluyen a sus hijas. El panel guarda las dos etiquetas (la principal y la subcategoría); la subcategoría es opcional.
- La foto del collar con dije, etiquetada **Collares › Escallas** y **Dijes**, aparece en las dos secciones.
- La etiqueta **Soga** tiene `en_menu = false`: no aparece en el menú, pero queda guardada para filtros futuros.

En **"Todos los productos"** se muestra **una tarjeta por producto**, con todas sus variantes.
En **una categoría** se muestra **una tarjeta por variante** que tenga alguna foto en esa categoría, y el enlace abre el detalle con esa variante elegida.

## Combos

Cada combinación se carga como una **variante con su propio stock**. Por ejemplo, "Collar solo" y "Collar + dije en soga" son dos variantes. Si se vende el combo, solo se marca sin stock el combo.

Si el dije también se vende suelto, se carga como **otro producto** ("Dije Ágata Roja"), con su propia variante y su propio stock.

## Gorras y colores

Para productos cuyas opciones son colores, usar `etiqueta_variante = 'Color'`. En la web el selector aparece como "Color" en lugar de "Variante", y cada color es una variante.

## Stock y visibilidad: las 3 situaciones

| Querés que… | Qué cambiar |
| --- | --- |
| Se vea con la etiqueta **"Sin stock"** | `variantes.en_stock = false`. Si todas sus variantes están así, el producto entero figura "Sin stock" y pasa al final del listado. |
| Una **variante** desaparezca de la web | `variantes.visible = false`. Sus fotos también se ocultan. |
| El **producto** entero desaparezca de la web | `productos.estado = 'oculto'`. No se borra nada y se puede volver a publicar. |

> Recomendación: **no borrar** productos, ocultarlos. Así se conserva el historial y se pueden reactivar.

## Fotos

- Se guardan en **Supabase Storage**, en el bucket `productos`, organizadas por carpeta de producto, por ejemplo `collar-cuarzo-rosa/frente.webp`.
- La tabla `fotos` guarda la **ruta** del archivo, y la web arma la URL pública.
- El panel de administración (próxima etapa) va a reducir el tamaño de cada foto antes de subirla, a unos 1200px y en formato WebP. Así la web carga rápido y no se llena el espacio gratuito, que es de 1 GB.
