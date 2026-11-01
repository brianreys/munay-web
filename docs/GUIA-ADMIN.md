# Guía del panel de administración

Guía de uso para las administradoras. No hace falta saber programar.

**Dirección:** `https://<tu-dominio>/admin.html`. En desarrollo es <http://localhost:5173/admin.html>.

> Conviene guardarla como acceso directo en la pantalla de inicio del celular (Compartir → "Agregar a inicio").

## Ingresar

Usá el email y la contraseña que se crearon en Supabase (ver [SUPABASE.md](SUPABASE.md)). La sesión queda abierta en ese dispositivo hasta tocar **Salir**.

> En **modo demo** (sin Supabase configurado) no se pide login y los cambios se guardan solo en ese navegador. Sirve para practicar.

## Lista de productos

Es la pantalla principal. Desde acá, sin entrar a editar, podés:

| Querés… | Hacé esto |
| --- | --- |
| Que un producto **no se vea** en la web | Apagá el interruptor **Publicado** |
| Marcar una variante **sin stock** | Abrí **Stock** y apagá la variante. En la web aparece "Sin stock". |
| Buscar un producto | Escribí en el buscador |
| Ver solo ocultos o con faltantes | Tocá los filtros de arriba |

Tocá el nombre o la foto de un producto para editarlo.

## Cargar un producto nuevo

1. **+ Nuevo producto**.
2. **Datos**
   - **Nombre:** por ejemplo "Collar Cuarzo Rosa". Con el nombre se arma el link del producto.
   - **Descripción:** materiales, medidas y cuidados. Cada renglón se muestra como un párrafo.
   - **¿Cómo se llaman las opciones?:** se deja "Opciones", salvo casos como las gorras, donde se elige "Color". Si necesitás otro nombre (por ejemplo "Largo"), elegí **+ Nueva categoría…** al final de la lista y escribilo. Desde ese momento aparece en la lista para los demás productos.
   - **Estado:** *Publicado* se ve en la web; *Oculto* no.
   - **Destacado:** el producto aparece primero.
3. **Variantes:** cada opción que se puede comprar, con su **precio**.
   - Si hay una sola, dejala como "Único".
   - Para combos, agregá una variante por combinación: "Solo", "Con dije en soga", etc.
   - **En stock** apagado: se muestra "Sin stock".
   - **Visible** apagado: esa opción y sus fotos desaparecen de la web.
4. **Fotos:** tocá **+ Agregar fotos**. En el celular se puede elegir de la galería o sacar la foto en el momento. Para cada foto:
   - **Variante que muestra:** por ejemplo, la foto del collar con dije va en "Con dije". Si la foto sirve para todas, dejá "General".
   - **Categorías:** marcá dónde tiene que aparecer, por ejemplo *Collares* y *Dijes*. Al marcar una categoría se despliegan sus subcategorías (*Escallas*, *Donas*…), que son **opcionales**. Si no marcás ninguna, la foto aparece solo en la categoría general. **Soga** no aparece en el menú de la web, pero queda guardada para filtros futuros.
   - **+ Nueva categoría / + Subcategoría:** si falta una sección, creala ahí mismo. Se guarda en el momento y la foto queda marcada en ella.
   - **Copiar categorías de la anterior:** atajo para cuando varias fotos van en las mismas secciones.
   - **← →** cambian el orden. La primera foto es la **portada** del producto.
   - **Descripción de la foto:** una frase corta de lo que se ve.
5. **Guardar**.

### ¿Dónde aparece cada foto?

- En **Todos los productos** se ve una tarjeta por producto, con la primera foto.
- En **cada categoría** se ve una tarjeta por variante que tenga una foto con esa categoría. Por eso el mismo collar puede aparecer "solo" en *Escallas* y "con dije" en *Dijes*.

## Categorías

Pestaña **Categorías**, arriba del panel. Son las secciones del menú de la web. Tocá una categoría para desplegar sus subcategorías. Todo se guarda solo, sin botón "Guardar".

| Querés… | Hacé esto |
| --- | --- |
| Cambiar el nombre | Editalo y tocá Enter o salí del campo. La dirección de la sección en la web cambia con el nombre. |
| Que no se vea en el menú | Apagá **En el menú**. Sirve para etiquetas internas, como *Soga*. |
| Cambiar el orden del menú | Flechas **↑ ↓** |
| Agregar una categoría | Campo **Nueva categoría** al final de la página |
| Agregar una subcategoría | Desplegá la categoría y usá el campo de abajo |
| Eliminar | **Eliminar**. Se borran también sus subcategorías. Las fotos **no** se borran: solo dejan de aparecer en esa sección. |

## Portada (carrusel de inicio)

Pestaña **Portada**. Son las fotos grandes que pasan solas al entrar a la web. Como en los productos, los cambios se aplican al tocar **Guardar**.

1. **+ Agregar diapositiva** y elegí una o varias fotos. Conviene que sean horizontales, con la pieza en el centro.
2. Para cada diapositiva completá:
   - **Título** y **subtítulo:** el texto sobre la foto. Ambos son opcionales.
   - **El botón lleva a:** una categoría, todos los productos o "Sin botón".
   - **Texto del botón:** por ejemplo "Ver escallas".
   - **Activa:** apagada, la diapositiva queda guardada pero no se muestra.
3. **← →** cambian el orden y **Cambiar foto** reemplaza la imagen.
4. **Guardar**.

> Si no hay ninguna diapositiva activa, la web muestra 3 de ejemplo para que la portada nunca quede vacía.

## Dar de baja

| Situación | Qué hacer |
| --- | --- |
| Se vendió y no hay más, pero querés que se siga viendo | Variante → **En stock** apagado |
| No querés que se vea por un tiempo | Producto → **Oculto** |
| No lo vas a vender nunca más | Abrilo → **Eliminar producto** al final. Es definitivo y borra las fotos. |

> Recomendación: preferí **Oculto** antes que eliminar; siempre se puede volver a publicar.

## Preguntas frecuentes

**¿Las fotos tienen que ser livianas?** No. El panel las achica solo antes de subirlas.

**¿Pueden editar las dos a la vez?** Sí, pero no el *mismo* producto al mismo tiempo: queda guardado lo de la última que toque "Guardar".

**Cambié el nombre y el link sigue igual.** Es a propósito: así no se rompen los links que ya compartiste por Instagram o WhatsApp.

**Salí sin guardar.** El panel avisa antes de salir de un producto con cambios sin guardar.
