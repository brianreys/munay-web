/**
 * Datos de EJEMPLO para desarrollar y probar la web sin base de datos.
 *
 * Tienen exactamente la misma forma que devuelve el proveedor de Supabase
 * (ver `src/js/servicios/proveedores/supabase.js`), así el resto de la web
 * no distingue de dónde vienen los datos.
 *
 * ⚠️ Los precios y nombres de piedras son de ejemplo: reemplazar al cargar el
 * catálogo real en Supabase.
 */

import { PORTADA_PREDETERMINADA } from './portada-predeterminada.js';

/** Carpeta de las fotos de ejemplo, respetando dónde está publicada la web. */
const DEMO = `${import.meta.env.BASE_URL}demo/`;

/** Árbol de categorías — debe coincidir con `supabase/semilla.sql`. */
const categorias = [
  { id: 'collares', slug: 'collares', nombre: 'Collares', padreId: null, enMenu: true, orden: 1 },
  { id: 'collares-escallas', slug: 'escallas', nombre: 'Escallas', padreId: 'collares', enMenu: true, orden: 1 },
  { id: 'collares-donas', slug: 'donas', nombre: 'Donas', padreId: 'collares', enMenu: true, orden: 2 },
  { id: 'collares-mil-vueltas', slug: 'mil-vueltas', nombre: 'Mil vueltas', padreId: 'collares', enMenu: true, orden: 3 },
  { id: 'pulseras', slug: 'pulseras', nombre: 'Pulseras', padreId: null, enMenu: true, orden: 2 },
  { id: 'pulseras-escallas', slug: 'escallas', nombre: 'Escallas', padreId: 'pulseras', enMenu: true, orden: 1 },
  { id: 'pulseras-donas', slug: 'donas', nombre: 'Donas', padreId: 'pulseras', enMenu: true, orden: 2 },
  { id: 'dijes', slug: 'dijes', nombre: 'Dijes', padreId: null, enMenu: true, orden: 3 },
  { id: 'gorras', slug: 'gorras', nombre: 'Gorras', padreId: null, enMenu: true, orden: 4 },
  { id: 'soga', slug: 'soga', nombre: 'Soga', padreId: null, enMenu: false, orden: 90 },
];

const productos = [
  {
    id: 'p-cuarzo-rosa',
    slug: 'collar-cuarzo-rosa',
    nombre: 'Collar Cuarzo Rosa',
    descripcion:
      'Escallas de cuarzo rosa intercaladas con mostacillas blancas.\nSe puede llevar solo o combinado con un dije de ágata en soga de gamuza.',
    etiquetaVariante: 'Opciones',
    estado: 'publicado',
    destacado: true,
    orden: 1,
    variantes: [
      { id: 'v-cuarzo-solo', nombre: 'Solo', precio: 18000, enStock: true, visible: true, orden: 1 },
      { id: 'v-cuarzo-dije', nombre: 'Con dije de ágata en soga', precio: 32000, enStock: true, visible: true, orden: 2 },
    ],
    fotos: [
      {
        id: 'f-cuarzo-solo',
        url: `${DEMO}collar-cuarzo-rosa.jpg`,
        alt: 'Collar de escallas de cuarzo rosa en un busto',
        varianteId: 'v-cuarzo-solo',
        orden: 1,
        categorias: ['collares-escallas'],
      },
      {
        // Esta foto aparece en Collares › Escallas y también en Dijes.
        id: 'f-cuarzo-dije',
        url: `${DEMO}collar-cuarzo-rosa-dije-agata.jpg`,
        alt: 'Collar de cuarzo rosa combinado con dije de ágata roja en soga de gamuza',
        varianteId: 'v-cuarzo-dije',
        orden: 2,
        categorias: ['collares-escallas', 'dijes', 'soga'],
      },
    ],
  },
  {
    id: 'p-dije-agata',
    slug: 'dije-agata-roja',
    nombre: 'Dije Ágata Roja',
    descripcion: 'Dije de ágata natural con terminación en plata, en soga de gamuza.',
    etiquetaVariante: 'Opciones',
    estado: 'publicado',
    destacado: false,
    orden: 2,
    variantes: [
      { id: 'v-agata-soga', nombre: 'Con soga de gamuza', precio: 16000, enStock: true, visible: true, orden: 1 },
    ],
    fotos: [
      {
        id: 'f-agata-soga',
        url: `${DEMO}collar-cuarzo-rosa-dije-agata.jpg`,
        alt: 'Dije de ágata roja colgando de una soga de gamuza marrón',
        varianteId: 'v-agata-soga',
        orden: 1,
        categorias: ['dijes', 'soga'],
      },
    ],
  },
  {
    id: 'p-amazonita',
    slug: 'collar-amazonita',
    nombre: 'Collar Amazonita',
    descripcion: 'Escallas de amazonita en tonos verde agua, con cristales transparentes.',
    etiquetaVariante: 'Opciones',
    estado: 'publicado',
    destacado: true,
    orden: 3,
    variantes: [
      { id: 'v-amazonita', nombre: 'Único', precio: 18000, enStock: true, visible: true, orden: 1 },
    ],
    fotos: [
      {
        id: 'f-amazonita',
        url: `${DEMO}collar-amazonita.jpg`,
        alt: 'Collar de escallas de amazonita verde agua en un busto',
        varianteId: null,
        orden: 1,
        categorias: ['collares-escallas'],
      },
    ],
  },
  {
    id: 'p-escallas-blancas',
    slug: 'collar-escallas-blancas',
    nombre: 'Collar Escallas Blancas',
    descripcion: 'Escallas de piedra blanca natural, de brillo suave y nacarado.',
    etiquetaVariante: 'Opciones',
    estado: 'publicado',
    destacado: false,
    orden: 4,
    variantes: [
      { id: 'v-blancas', nombre: 'Único', precio: 18000, enStock: true, visible: true, orden: 1 },
    ],
    fotos: [
      {
        id: 'f-blancas',
        url: `${DEMO}collar-escallas-blancas.jpg`,
        alt: 'Collar de escallas blancas en un busto',
        varianteId: null,
        orden: 1,
        categorias: ['collares-escallas'],
      },
    ],
  },
  {
    // Ejemplo de producto SIN STOCK: sigue visible, con la etiqueta.
    id: 'p-onix',
    slug: 'collar-onix-y-cuarzo',
    nombre: 'Collar Ónix y Cuarzo',
    descripcion: 'Piedras redondas de ónix negro y cuarzo turmalinado.',
    etiquetaVariante: 'Opciones',
    estado: 'publicado',
    destacado: false,
    orden: 5,
    variantes: [
      { id: 'v-onix', nombre: 'Único', precio: 20000, enStock: false, visible: true, orden: 1 },
    ],
    fotos: [
      {
        id: 'f-onix',
        url: `${DEMO}collar-onix-cuarzo.jpg`,
        alt: 'Collar de piedras redondas de ónix negro y cuarzo en un busto',
        varianteId: null,
        orden: 1,
        categorias: ['collares'],
      },
    ],
  },
  {
    // Ejemplo de producto OCULTO: no aparece en ningún lado de la web.
    id: 'p-gorra',
    slug: 'gorra-munay',
    nombre: 'Gorra Munay',
    descripcion: 'Gorra bordada.',
    etiquetaVariante: 'Color',
    estado: 'oculto',
    destacado: false,
    orden: 6,
    variantes: [
      { id: 'v-gorra-negra', nombre: 'Negra', precio: 15000, enStock: true, visible: true, orden: 1 },
      { id: 'v-gorra-beige', nombre: 'Beige', precio: 15000, enStock: true, visible: true, orden: 2 },
    ],
    fotos: [],
  },
];

export const CATALOGO_DEMO = { categorias, productos, portada: PORTADA_PREDETERMINADA };
