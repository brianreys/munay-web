/**
 * Repositorio del panel: punto único de acceso a los datos para escribir.
 *
 * Elige la implementación según la configuración:
 *  - Supabase configurado (.env.local) → repositorio-supabase.js
 *  - Sin configurar                    → repositorio-demo.js (localStorage)
 *
 * Ambas implementaciones exponen exactamente las mismas funciones:
 *
 *   modo                                  'demo' | 'supabase'
 *   obtenerUsuario()                      → { email, nombre } | null
 *   iniciarSesion(email, clave)           → { email, nombre }
 *   cerrarSesion()
 *   listarCategorias()                    → Categoria[]
 *   listarProductos()                     → Producto[] (incluye ocultos)
 *   guardarProducto(producto)             → crea o actualiza todo el producto
 *   actualizarProducto(id, { estado })    → cambio rápido desde la lista
 *   actualizarVariante(id, { enStock })   → cambio rápido desde la lista
 *   eliminarProducto(producto)
 *   guardarCategorias(categorias)         → crea o actualiza (nombre, orden, menú)
 *   eliminarCategoria(id)                 → también borra sus subcategorías
 *   listarPortada()                       → Diapositiva[] (incluye inactivas)
 *   guardarPortada(diapositivas)          → reemplaza todas (sube fotos nuevas:
 *                                           `archivo` escritorio, `archivoMovil` celular)
 *   obtenerColores()                      → { colorFondo, colorEncabezado }
 *   guardarColores(colores)
 *   listarVentas()                        → Venta[] (las más nuevas primero)
 *   registrarVenta({ varianteId, cantidad, precioUnitario, nota })
 *                                         → descuenta el stock (si la variante lo cuenta)
 *   anularVenta(id)                       → devuelve las unidades al stock
 *
 * Variantes: `cantidad` es un número de unidades, o null = "sin contar"
 * (funciona solo con En stock / Sin stock). Con número, "en stock" = cantidad > 0.
 *
 * Forma de un Producto: igual a la de `src/datos/catalogo-demo.js`. Las fotos
 * nuevas traen además `archivo` (Blob optimizado) y todavía no tienen `ruta`.
 */

import { supabaseConfigurado } from '../../js/servicios/supabase-cliente.js';
import * as repositorioDemo from './repositorio-demo.js';
import * as repositorioSupabase from './repositorio-supabase.js';

export const repositorio = supabaseConfigurado ? repositorioSupabase : repositorioDemo;
