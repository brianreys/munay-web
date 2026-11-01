-- =============================================================================
-- MUNAY · Esquema de base de datos (Supabase / PostgreSQL)
-- -----------------------------------------------------------------------------
-- Cómo usarlo: Supabase → SQL Editor → pegar este archivo completo → Run.
-- Luego ejecutar `semilla.sql` para cargar las categorías iniciales.
-- Explicación del modelo: docs/MODELO-DE-DATOS.md
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. ADMINISTRADORES
-- Lista de usuarios (de Supabase Auth) que pueden editar el catálogo.
-- Se cargan a mano después de crear cada usuario (ver docs/SUPABASE.md).
-- -----------------------------------------------------------------------------
create table public.administradores (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  nombre    text not null,
  creado_en timestamptz not null default now()
);

-- Devuelve true si el usuario logueado es administrador.
-- `security definer` permite consultar la tabla aunque tenga RLS activado.
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.administradores where user_id = auth.uid());
$$;


-- -----------------------------------------------------------------------------
-- 2. CATEGORÍAS
-- Árbol de dos niveles: Collares → Escallas / Donas / Mil vueltas, etc.
-- `en_menu = false` sirve para etiquetas internas que no se muestran en el
-- menú (ej: "soga"), pero que igual pueden asignarse a una foto.
-- El id es legible a propósito (ej: 'collares-escallas') para simplificar la
-- carga manual y los datos de ejemplo.
-- -----------------------------------------------------------------------------
create table public.categorias (
  id        text primary key,
  slug      text not null,                      -- parte de la URL: 'escallas'
  nombre    text not null,                      -- texto visible: 'Escallas'
  padre_id  text references public.categorias (id) on delete restrict,
  en_menu   boolean not null default true,
  orden     integer not null default 0,
  constraint categorias_slug_unico unique nulls not distinct (padre_id, slug)
);


-- -----------------------------------------------------------------------------
-- 3. PRODUCTOS
-- Un producto agrupa variantes y fotos (ej: "Collar Cuarzo Rosa").
-- `estado`: 'publicado' → visible en la web | 'oculto' → no se muestra.
-- -----------------------------------------------------------------------------
create table public.productos (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,       -- URL: #/producto/collar-cuarzo-rosa
  nombre             text not null,
  descripcion        text not null default '',
  etiqueta_variante  text not null default 'Opciones', -- o 'Color' para gorras
  estado             text not null default 'oculto'
                     check (estado in ('publicado', 'oculto')),
  destacado          boolean not null default false,
  orden              integer not null default 0,
  creado_en          timestamptz not null default now(),
  actualizado_en     timestamptz not null default now()
);


-- -----------------------------------------------------------------------------
-- 4. VARIANTES
-- Cada opción comprable de un producto, con su propio precio y stock.
-- Ej: "Solo", "Con dije de ágata en soga", o un color de gorra.
-- `en_stock = false` → se muestra con la etiqueta "Sin stock".
-- `visible  = false` → la variante (y sus fotos) no se muestran.
-- -----------------------------------------------------------------------------
create table public.variantes (
  id           uuid primary key default gen_random_uuid(),
  producto_id  uuid not null references public.productos (id) on delete cascade,
  nombre       text not null,
  precio       numeric(12, 2) not null check (precio >= 0),
  en_stock     boolean not null default true,
  visible      boolean not null default true,
  orden        integer not null default 0
);

create index variantes_producto_idx on public.variantes (producto_id);


-- -----------------------------------------------------------------------------
-- 5. FOTOS
-- `ruta` es la ubicación del archivo dentro del bucket 'productos' de Storage
-- (ej: 'collar-cuarzo-rosa/1730380000-frente.webp').
-- `variante_id` es opcional: si está vacío, la foto es "general" del producto.
-- -----------------------------------------------------------------------------
create table public.fotos (
  id           uuid primary key default gen_random_uuid(),
  producto_id  uuid not null references public.productos (id) on delete cascade,
  variante_id  uuid references public.variantes (id) on delete set null,
  ruta         text not null,
  alt          text not null default '',      -- descripción para accesibilidad
  orden        integer not null default 0
);

create index fotos_producto_idx on public.fotos (producto_id);


-- -----------------------------------------------------------------------------
-- 6. FOTO ↔ CATEGORÍAS (muchos a muchos)
-- Acá vive la idea central del catálogo: cada FOTO se etiqueta con una o más
-- categorías, y aparece en cada una de ellas.
-- -----------------------------------------------------------------------------
create table public.foto_categorias (
  foto_id       uuid not null references public.fotos (id) on delete cascade,
  categoria_id  text not null references public.categorias (id) on delete cascade,
  primary key (foto_id, categoria_id)
);

create index foto_categorias_categoria_idx on public.foto_categorias (categoria_id);


-- -----------------------------------------------------------------------------
-- 7. PORTADA (carrusel de la home)
-- -----------------------------------------------------------------------------
create table public.portada (
  id          uuid primary key default gen_random_uuid(),
  ruta        text not null,                -- archivo en el bucket 'portada'
  titulo      text not null default '',
  subtitulo   text not null default '',
  enlace      text not null default '#/productos',
  texto_boton text not null default 'Ver colección',
  activa      boolean not null default true,
  orden       integer not null default 0
);


-- -----------------------------------------------------------------------------
-- 8. Mantener `actualizado_en` al editar un producto
-- -----------------------------------------------------------------------------
create or replace function public.marcar_actualizado()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

create trigger productos_actualizado
  before update on public.productos
  for each row execute function public.marcar_actualizado();


-- =============================================================================
-- SEGURIDAD (Row Level Security)
-- Regla general: cualquiera puede LEER lo publicado; solo los administradores
-- pueden ESCRIBIR. La "anon key" que usa la web pública no puede modificar nada.
-- =============================================================================
alter table public.administradores enable row level security;
alter table public.categorias      enable row level security;
alter table public.productos       enable row level security;
alter table public.variantes       enable row level security;
alter table public.fotos           enable row level security;
alter table public.foto_categorias enable row level security;
alter table public.portada         enable row level security;

-- Administradores: cada admin puede ver la lista (no se edita desde la web).
create policy "admins leen administradores" on public.administradores
  for select to authenticated using (public.es_admin());

-- Categorías: lectura pública.
create policy "lectura publica" on public.categorias
  for select using (true);
create policy "admins gestionan" on public.categorias
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Productos: el público solo ve los publicados; los admins ven todo.
create policy "lectura publica" on public.productos
  for select using (estado = 'publicado' or public.es_admin());
create policy "admins gestionan" on public.productos
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Variantes: visibles si lo son ellas y su producto está publicado.
create policy "lectura publica" on public.variantes
  for select using (
    public.es_admin() or (
      visible and exists (
        select 1 from public.productos p
        where p.id = producto_id and p.estado = 'publicado'
      )
    )
  );
create policy "admins gestionan" on public.variantes
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Fotos: visibles si su producto está publicado.
-- (Las fotos de variantes ocultas se filtran en la web.)
create policy "lectura publica" on public.fotos
  for select using (
    public.es_admin() or exists (
      select 1 from public.productos p
      where p.id = producto_id and p.estado = 'publicado'
    )
  );
create policy "admins gestionan" on public.fotos
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

create policy "lectura publica" on public.foto_categorias
  for select using (true);
create policy "admins gestionan" on public.foto_categorias
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

create policy "lectura publica" on public.portada
  for select using (activa or public.es_admin());
create policy "admins gestionan" on public.portada
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Permisos de acceso por la API. Los proyectos nuevos de Supabase pueden no
-- otorgarlos automáticamente; RLS (arriba) sigue decidiendo QUÉ filas se ven.
grant select on
  public.categorias, public.productos, public.variantes,
  public.fotos, public.foto_categorias, public.portada
  to anon, authenticated;
grant select on public.administradores to authenticated;
grant insert, update, delete on
  public.categorias, public.productos, public.variantes,
  public.fotos, public.foto_categorias, public.portada
  to authenticated;


-- =============================================================================
-- STORAGE (archivos de fotos)
-- Dos buckets públicos de lectura: 'productos' y 'portada'.
-- Solo los administradores pueden subir, reemplazar o borrar archivos.
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('productos', 'productos', true), ('portada', 'portada', true)
on conflict (id) do nothing;

-- Las fotos se ven por su URL pública sin necesidad de esta política, pero
-- Supabase la exige para reemplazar (upsert) y borrar archivos desde el panel.
create policy "admins listan fotos" on storage.objects
  for select to authenticated
  using (bucket_id in ('productos', 'portada') and public.es_admin());

create policy "admins suben fotos" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('productos', 'portada') and public.es_admin());

create policy "admins editan fotos" on storage.objects
  for update to authenticated
  using (bucket_id in ('productos', 'portada') and public.es_admin());

create policy "admins borran fotos" on storage.objects
  for delete to authenticated
  using (bucket_id in ('productos', 'portada') and public.es_admin());
