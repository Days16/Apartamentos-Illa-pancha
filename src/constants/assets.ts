/**
 * Centralized assets for the website.
 * All static image URLs, icons, and local assets should be defined here.
 */

/** URL pública del sitio (sin barra final). Igual que en SEO.tsx / sitemap. */
export const siteUrl = (
  import.meta.env.VITE_SITE_URL || 'https://www.apartamentosillapancha.com'
).replace(/\/$/, '');

/** Enlace de Google Maps al negocio. Configurable via VITE_MAPS_URL en .env */
export const mapsUrl =
  import.meta.env.VITE_MAPS_URL?.trim() ||
  'https://www.google.com/maps?cid=17198103483666018074&g_mp=CiVnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLkdldFBsYWNlEAMYASAF&hl=es-ES&source=embed';

/** URL del iframe embed de Google Maps. Configurable via VITE_MAPS_EMBED_URL en .env
 *  IMPORTANTE: debe ser una URL /maps/embed?... — las URLs normales de Maps no funcionan en iframes. */
export const mapsEmbedUrl =
  import.meta.env.VITE_MAPS_EMBED_URL?.trim() ||
  'https://www.google.com/maps?q=43.5399657,-7.0410569&z=16&output=embed';

export const assets = {
  // Global / Branding
  logo: {
    text: 'Illa Pancha',
    url: null, // placeholder if we ever use an image logo
  },

  // Hero / General
  hero: {
    // Vista de Ribadeo con la ría del Eo al fondo — reemplaza con foto propia subida a /public o Supabase Storage
    background:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=2000',
    noise: 'https://www.transparenttextures.com/patterns/p6.png',
  },

  // Locations
  locations: {
    riaRibadeo:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=2000',
  },

  // Social / Contact
  social: {
    whatsapp: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg',
  },

  // Placeholders
  placeholders: {
    apartment:
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1000',
    photo:
      'https://images.unsplash.com/photo-1449156001437-af90bb4360e2?auto=format&fit=crop&q=80&w=800',
  },
};

export default assets;
