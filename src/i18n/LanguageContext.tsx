import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, type Language, type TranslationDictionary } from './translations.js';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: TranslationDictionary;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'es',
  setLang: () => {},
  t: translations.es,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('wolfric_lang') as Language;
    if (saved && ['es', 'pt', 'en'].includes(saved)) {
      return saved;
    }
    // Auto-detect browser language if Portuguese or English
    const browserLang = navigator.language?.toLowerCase() || '';
    if (browserLang.startsWith('pt')) return 'pt';
    if (browserLang.startsWith('en')) return 'en';
    return 'es';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('wolfric_lang', newLang);
  };

  const value = {
    lang,
    setLang,
    t: translations[lang] || translations.es,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  return useContext(LanguageContext);
}
