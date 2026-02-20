import { createContext, useContext, useState } from 'react';

export const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState('ES');
  // t(textoES, textoEN) — devuelve el texto según el idioma activo
  const t = (es, en) => lang === 'EN' ? (en || es) : es;
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
