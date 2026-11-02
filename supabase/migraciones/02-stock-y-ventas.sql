-- =============================================================================
-- MUNAY · Migración 02: cantidad de stock y registro de ventas
-- -----------------------------------------------------------------------------
-- Supabase → SQL Editor → pegar este archivo → Run. Se puede ejecutar más de
-- una vez sin problema. (También en proyectos nuevos, después de esquema.sql.)
-- =============================================================================

-- 1. Cantidad de unidades por variante.
--    NULL = "sin contar": la variante funciona como antes (solo En stock / Sin stock).
alter table public.variantes
  add column if not exists cantidad integer check (cantidad is null or cantidad >= 0);

-- Cuando cambia la cantidad, "en_stock" se actualiza solo: 0 → Sin stock.
create or replace function public.sincronizar_stock()
returns trigger
language plpgsql
as $$
begin
  if new.cantidad is not null and (tg_op = 'INSERT' or new.cantidad is distinct from old.cantidad) then
    new.en_stock := new.cantidad > 0;
  end if;
  return new;
end;
$$;

drop trigger if exists variantes_stock on public.variantes;
create trigger variantes_stock
  before insert or update on public.variantes
  for each row execute function public.sincronizar_stock();

-- 2. Ventas. Se guarda una copia del nombre y el precio del momento, así el
--    historial no cambia si después se edita o se borra el producto.
create table if not exists public.ventas (
  id               uuid primary key default gen_random_uuid(),
  variante_id      uuid references public.variantes (id) on delete set null,
  producto_id      uuid references public.productos (id) on delete set null,
  producto_nombre  text not null,
  variante_nombre  text not null default '',
  cantidad         integer not null check (cantidad > 0),
  precio_unitario  numeric(12, 2) not null check (precio_unitario >= 0),
  nota             text not null default '',          -- ej: cliente, medio de pago
  anulada          boolean not null default false,
  creado_en        timestamptz not null default now(),
  creado_por       uuid default auth.uid() references auth.users (id) on delete set null
);

create index if not exists ventas_creado_en_idx on public.ventas (creado_en desc);

alter table public.ventas enable row level security;

-- Solo las administradoras ven y cargan ventas (la web pública no las lee).
drop policy if exists "admins gestionan" on public.ventas;
create policy "admins gestionan" on public.ventas
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

grant select, insert, update on public.ventas to authenticated;

-- 3. Registrar una venta: descuenta el stock y guarda la venta en un solo paso
--    (si las dos administradoras venden la última unidad a la vez, solo una pasa).
create or replace function public.registrar_venta(
  p_variante uuid,
  p_cantidad integer,
  p_precio numeric default null,
  p_nota text default ''
)
returns public.ventas
language plpgsql
set search_path = public
as $$
declare
  v public.variantes;
  p public.productos;
  venta public.ventas;
begin
  if not public.es_admin() then
    raise exception 'Tu cuenta no tiene permiso para registrar ventas.' using errcode = '42501';
  end if;
  if p_cantidad is null or p_cantidad <= 0 then
    raise exception 'La cantidad tiene que ser mayor a cero.';
  end if;

  select * into v from public.variantes where id = p_variante for update;
  if not found then
    raise exception 'El producto elegido ya no existe.';
  end if;

  if v.cantidad is not null then
    if v.cantidad < p_cantidad then
      raise exception 'No alcanza el stock: quedan % unidades.', v.cantidad;
    end if;
    update public.variantes set cantidad = cantidad - p_cantidad where id = v.id;
  end if;

  select * into p from public.productos where id = v.producto_id;

  insert into public.ventas (variante_id, producto_id, producto_nombre, variante_nombre, cantidad, precio_unitario, nota)
  values (v.id, p.id, p.nombre, v.nombre, p_cantidad, coalesce(p_precio, v.precio), coalesce(p_nota, ''))
  returning * into venta;

  return venta;
end;
$$;

-- 4. Anular una venta: la marca como anulada y devuelve las unidades al stock.
create or replace function public.anular_venta(p_venta uuid)
returns public.ventas
language plpgsql
set search_path = public
as $$
declare
  venta public.ventas;
begin
  if not public.es_admin() then
    raise exception 'Tu cuenta no tiene permiso para anular ventas.' using errcode = '42501';
  end if;

  select * into venta from public.ventas where id = p_venta for update;
  if not found then
    raise exception 'La venta no existe.';
  end if;
  if venta.anulada then
    raise exception 'Esta venta ya estaba anulada.';
  end if;

  update public.ventas set anulada = true where id = p_venta returning * into venta;
  update public.variantes set cantidad = cantidad + venta.cantidad
    where id = venta.variante_id and cantidad is not null;

  return venta;
end;
$$;

revoke execute on function public.registrar_venta(uuid, integer, numeric, text) from public, anon;
revoke execute on function public.anular_venta(uuid) from public, anon;
grant execute on function public.registrar_venta(uuid, integer, numeric, text) to authenticated;
grant execute on function public.anular_venta(uuid) to authenticated;
