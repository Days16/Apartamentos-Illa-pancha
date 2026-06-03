import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Lang } from '../types';

const VALID_LANGS: Lang[] = ['ES', 'EN', 'FR', 'DE', 'PT'];

const HTML_LANG_CODE: Record<Lang, string> = {
  ES: 'es',
  EN: 'en',
  FR: 'fr',
  DE: 'de',
  PT: 'pt',
};

function getInitialLang(): Lang {
  try {
    // Prioridad 1: parámetro ?lang= en la URL (de hreflang o enlace directo)
    const urlParams = new URLSearchParams(window.location.search);
    const paramLang = urlParams.get('lang')?.toUpperCase() as Lang | undefined;
    if (paramLang && VALID_LANGS.includes(paramLang)) return paramLang;
    // Prioridad 2: preferencia guardada
    const stored = localStorage.getItem('illa_lang') as Lang;
    if (stored && VALID_LANGS.includes(stored)) return stored;
    // Prioridad 3: idioma del navegador
    const browserLang = navigator.language.slice(0, 2).toUpperCase();
    if (VALID_LANGS.includes(browserLang as Lang)) return browserLang as Lang;
  } catch {
    /* ignorar errores de localStorage en modo privado */
  }
  return 'ES';
}

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (es: string, en?: string) => string;
}

export const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  // Sincronizar atributo lang del documento con el idioma activo
  useEffect(() => {
    document.documentElement.lang = HTML_LANG_CODE[lang];
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem('illa_lang', l);
    } catch {
      /* ignorar */
    }
  };

  const t = (es: string, en?: string) => (lang === 'EN' ? en || es : es);
  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}
