-- =============================================================================
-- MUNAY · Migración 01: foto de celular en la portada + colores editables
-- -----------------------------------------------------------------------------
-- Para proyectos creados ANTES de este cambio. Supabase → SQL Editor → pegar
-- este archivo → Run. Se puede ejecutar más de una vez sin problema.
-- (Los proyectos nuevos ya lo tienen incluido en `esquema.sql`.)
-- =============================================================================

-- 1. Portada: foto vertical opcional para celular.
alter table public.portada add column if not exists ruta_movil text;

-- 2. Ajustes del sitio (por ahora, los colores de fondo y encabezado).
create table if not exists public.ajustes (
  clave          text primary key,             -- ej: 'color_fondo'
  valor          text not null,                -- ej: '#e4ccbf'
  actualizado_en timestamptz not null default now()
);

alter table public.ajustes enable row level security;

drop policy if exists "lectura publica" on public.ajustes;
create policy "lectura publica" on public.ajustes
  for select using (true);

drop policy if exists "admins gestionan" on public.ajustes;
create policy "admins gestionan" on public.ajustes
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

grant select on public.ajustes to anon, authenticated;
grant insert, update, delete on public.ajustes to authenticated;
