import es from './locales/es.json';
import en from './locales/en.json';

// Traducciones estáticas de la interfaz (textos de botones, labels, etc.)
// Los textos de apartamentos vienen de mockData (name/nameEn, description/descriptionEn...)

export const ui = {
  ES: es,
  EN: en,
};

export const useT = (lang) => ui[lang] || ui.ES;
