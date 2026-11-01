# Configurar Supabase

Tiempo estimado: 15 minutos. Se hace una sola vez.

## 1. Crear el proyecto

1. Crear una cuenta en <https://supabase.com> (gratis).
2. **New project**: nombre `munay` y región **South America (São Paulo)**, la más cercana. Guardar la contraseña de la base en un lugar seguro.

## 2. Crear las tablas

1. Menú **SQL Editor** → **New query**.
2. Pegar el contenido de [`supabase/esquema.sql`](../supabase/esquema.sql) → **Run**.
3. Nueva consulta con [`supabase/semilla.sql`](../supabase/semilla.sql) → **Run**.

> `esquema.sql` se ejecuta **una sola vez**. Si se corre de nuevo, falla con "already exists", y eso no rompe nada.

Para verificar, abrir **Table Editor**: deberían aparecer las tablas y, en `categorias`, Collares, Pulseras, Dijes, Gorras y Soga.

## 3. Crear las 2 usuarias administradoras

1. **Authentication → Sign In / Providers**: desactivar **"Allow new users to sign up"**. Así nadie más puede registrarse.
2. **Authentication → Users → Add user → Create new user**: cargar email y contraseña de cada administradora (2 veces).
3. Copiar el **UID** de cada usuaria y ejecutar en el SQL Editor lo siguiente. Las de Munay ya están en [`supabase/administradores.sql`](../supabase/administradores.sql).

```sql
insert into public.administradores (user_id, nombre) values
  ('UID-DE-LA-PRIMERA', 'Nombre 1'),
  ('UID-DE-LA-SEGUNDA', 'Nombre 2');
```

Solo las usuarias de esta tabla pueden crear, editar o borrar datos y fotos.

## 4. Conectar la web

1. **Project Settings → Data API**: copiar la **Project URL**. Luego, en **Project Settings → API Keys**, copiar la clave pública: la **publishable key** (`sb_publishable_...`) o, en la pestaña de claves *legacy*, la **anon public key** (`eyJ...`). Cualquiera de las dos funciona.
2. En la carpeta `munay-web`, copiar `.env.example` como `.env.local` y completar:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

3. Reiniciar `npm run dev`. La web ahora lee de Supabase y, mientras no se carguen productos, el catálogo aparece vacío.

> La clave pública (publishable / anon) es pública por diseño: la protección la dan las políticas RLS del esquema. **Nunca** usar la clave secreta (`sb_secret_...` o `service_role`) en la web.

## 5. Cargar productos

Entrá a `/admin.html` con una de las cuentas creadas y seguí la [guía del panel](GUIA-ADMIN.md).

> Los productos de la demo no se copian a Supabase: el catálogo real se carga desde cero en el panel. El carrusel de inicio se edita desde la pestaña **Portada** del panel. Mientras no haya diapositivas activas, la web muestra las 3 de `src/datos/portada-predeterminada.js`.

## Límites del plan gratuito (para tener en cuenta)

- 500 MB de base de datos y 1 GB de archivos: alcanza para miles de fotos optimizadas.
- Los proyectos gratuitos **se pausan tras 7 días sin actividad**. Con visitas a la web no pasa; si se pausa, se reactiva desde el dashboard.
