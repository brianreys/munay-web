/**
 * Íconos SVG en línea (sin dependencias externas).
 * Usan `currentColor`, así toman el color del texto que los rodea.
 */

const atributos = 'aria-hidden="true" focusable="false" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';

export const ICONOS = {
  instagram: `<svg viewBox="0 0 24 24" ${atributos}><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor"/></svg>`,
  whatsapp: `<svg viewBox="0 0 24 24" ${atributos}><path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.4z"/><path d="M9 8.6c.2-.5.6-.6.9-.6h.5l.9 2.1-.6.8c.5 1 1.3 1.8 2.3 2.3l.8-.6 2.1.9v.5c0 .3-.1.7-.6.9-.8.4-2 .3-3.6-.7a9 9 0 0 1-2.9-2.9c-1-1.6-1.1-2.8-.8-3.7z"/></svg>`,
  camion: `<svg viewBox="0 0 24 24" ${atributos}><path d="M2 6h11v10H2zM13 9h4l4 4v3h-8"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>`,
  ubicacion: `<svg viewBox="0 0 24 24" ${atributos}><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>`,
  mano: `<svg viewBox="0 0 24 24" ${atributos}><path d="M12 21c-4.5-2.6-8-5.9-8-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 11c0 4.1-3.5 7.4-8 10z"/></svg>`,
  mensaje: `<svg viewBox="0 0 24 24" ${atributos}><path d="M4 5h16v11H9l-5 4z"/></svg>`,
  flechaIzquierda: `<svg viewBox="0 0 24 24" ${atributos}><path d="M15 5l-7 7 7 7"/></svg>`,
  flechaAbajo: `<svg viewBox="0 0 24 24" ${atributos.replace('width="20" height="20"', 'width="14" height="14"')}><path d="M6 9l6 6 6-6"/></svg>`,
  flechaDerecha: `<svg viewBox="0 0 24 24" ${atributos}><path d="M9 5l7 7-7 7"/></svg>`,
};
