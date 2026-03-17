import React, { createContext, useContext, useEffect, useState } from "react";

import enTranslations from "../locales/en.json";
import esTranslations from "../locales/es.json";
import jaTranslations from "../locales/ja.json";
import zhTranslations from "../locales/zh.json";
import ptTranslations from "../locales/pt.json";
import plTranslations from "../locales/pl.json";
import deTranslations from "../locales/de.json";
import ruTranslations from "../locales/ru.json";
import thTranslations from "../locales/th.json";
import filTranslations from "../locales/fil.json";
import frTranslations from "../locales/fr.json";
import koTranslations from "../locales/ko.json";

const translations: Record<string, any> = {
  en: enTranslations,
  es: esTranslations,
  ja: jaTranslations,
  zh: zhTranslations,
  pt: ptTranslations,
  pl: plTranslations,
  de: deTranslations,
  ru: ruTranslations,
  th: thTranslations,
  fil: filTranslations,
  fr: frTranslations,
  ko: koTranslations,
};


const getLangFromPath = () => {
  const match = window.location.pathname.match(/^\/(en|es|ja|jp|zh|pt|pl|de|ru|th|fil|fr|ko)(\/|$)/);
  const lang = match?.[1] ?? null;
  // Legacy alias: /jp/* should behave like Japanese (/ja/*)
  return lang === 'jp' ? 'ja' : lang;
};

const getInitialLanguage = (): string => {
  // ✅ 1) URL manda si existe (/en, /es, /ja)
  const urlLang = getLangFromPath();
  if (urlLang && translations[urlLang]) return urlLang;

  // ✅ 1.5) Global (unprefixed) routes are the default language.
  // This keeps '/' stable for SEO and avoids locale-dependent indexing.
  return "en";
};

export interface LanguageContextProps {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string) => string;
  tr: (key: string) => any;
}

const LanguageContext = createContext<LanguageContextProps>({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
  tr: (key) => key,
});

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<string>(getInitialLanguage);

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.lang = language;
  }, [language]);

  const getValueFromKey = (key: string) => {
    const keys = key.split(".");

    const from = (langKey: string) => {
      let value: any = translations[langKey];
      for (const k of keys) value = value?.[k];
      return value;
    };

    const primary = from(language);
    if (primary !== undefined) return primary;
    return from('en');
  };

  const t = (key: string): string => {
    const value = getValueFromKey(key);
    return typeof value === "string" ? value : key;
  };

  const tr = (key: string): any => {
    const value = getValueFromKey(key);
    return value ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tr }}>
      {children}
    </LanguageContext.Provider>
  );
};
