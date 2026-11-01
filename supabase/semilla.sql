-- =============================================================================
-- MUNAY · Datos iniciales
-- Ejecutar DESPUÉS de `esquema.sql`. Carga el árbol de categorías del menú.
-- Para agregar una categoría nueva más adelante, seguir el mismo formato.
-- =============================================================================

insert into public.categorias (id, slug, nombre, padre_id, en_menu, orden) values
  -- Collares
  ('collares',              'collares',    'Collares',    null,       true,  1),
  ('collares-escallas',     'escallas',    'Escallas',    'collares', true,  1),
  ('collares-donas',        'donas',       'Donas',       'collares', true,  2),
  ('collares-mil-vueltas',  'mil-vueltas', 'Mil vueltas', 'collares', true,  3),
  -- Pulseras
  ('pulseras',              'pulseras',    'Pulseras',    null,       true,  2),
  ('pulseras-escallas',     'escallas',    'Escallas',    'pulseras', true,  1),
  ('pulseras-donas',        'donas',       'Donas',       'pulseras', true,  2),
  -- Dijes
  ('dijes',                 'dijes',       'Dijes',       null,       true,  3),
  -- Gorras
  ('gorras',                'gorras',      'Gorras',      null,       true,  4),
  -- Etiquetas internas (no aparecen en el menú)
  ('soga',                  'soga',        'Soga',        null,       false, 90)
on conflict (id) do nothing;
