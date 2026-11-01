/**
 * Configuración y textos editables del sitio.
 * Todo lo que sea "contenido fijo" (contacto, textos institucionales) vive
 * acá para poder cambiarlo sin tocar la lógica de la web.
 */

export const SITIO = {
  nombre: 'Munay',
  lema: 'Piezas hechas a mano',

  instagram: {
    usuario: 'munay.piezas',
    url: 'https://www.instagram.com/munay.piezas/',
    // Abre directamente un mensaje directo (DM) con la cuenta.
    mensajeDirecto: 'https://ig.me/m/munay.piezas',
  },

  whatsapp: {
    // Formato internacional sin "+" ni espacios. Para celulares de Argentina
    // WhatsApp requiere el 9 después del 54: 54 9 2266 525892.
    numero: '5492266525892',
    visible: '+54 9 2266 52-5892',
  },

  envios: {
    titulo: 'Envíos a todo el país',
    gratisLocal: 'Envíos gratis en Tandil',
    detalle: 'Coordinamos el envío por mensaje una vez confirmado tu pedido.',
  },
};

/** Textos de la sección "Sobre Munay" (provisorios, para editar). */
export const SOBRE_MUNAY = {
  titulo: 'Sobre Munay',
  parrafos: [
    'Munay es una palabra quechua que habla de amor, del querer bonito. Así nace cada pieza: a mano, con tiempo y con intención.',
    'Trabajamos con piedras naturales y materiales nobles para crear collares, pulseras y dijes únicos, pensados para acompañarte todos los días.',
  ],
};
