-- =============================================================================
-- MUNAY · Administradoras del panel
-- Ejecutar DESPUÉS de crear las cuentas en Authentication → Users.
-- Los UID salen de esa pantalla. Para sumar a alguien más, agregar una fila.
-- =============================================================================

insert into public.administradores (user_id, nombre) values
  ('b1cd62fd-41b2-4b80-9a17-8f2fd0572384', 'Fiore'),
  ('7b9e65d0-5b2f-4e89-b001-1ae070610883', 'Brian')
on conflict (user_id) do update set nombre = excluded.nombre;
