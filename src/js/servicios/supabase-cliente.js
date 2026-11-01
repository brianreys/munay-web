/**
 * Cliente único de Supabase, compartido por la web pública y (a futuro) el
 * panel de administración.
 */

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const claveAnonima = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** true si el proyecto tiene Supabase configurado en `.env.local`. */
export const supabaseConfigurado = Boolean(url && claveAnonima);

/** Instancia del cliente, o null en modo demo. */
export const supabase = supabaseConfigurado ? createClient(url, claveAnonima) : null;

/** Nombres de los buckets de Storage (ver `supabase/esquema.sql`). */
export const BUCKETS = {
  productos: 'productos',
  portada: 'portada',
};

/**
 * Devuelve la URL pública de un archivo guardado en Storage.
 * @param {string} bucket
 * @param {string} ruta
 */
export function urlPublica(bucket, ruta) {
  return supabase.storage.from(bucket).getPublicUrl(ruta).data.publicUrl;
}
