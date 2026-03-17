import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "./LanguageContext";

function getLangFromPath(pathname: string): string | null {
  // match: /en, /es, /ja
  const match = pathname.match(/^\/(en|es|ja|jp|zh|pt|pl|de|ru|th|fil|fr|ko)(\/|$)/);
  const lang = match?.[1] ?? null;
  // Legacy alias: /jp/* should behave like Japanese (/ja/*)
  return lang === 'jp' ? 'ja' : lang;
}

export default function LanguageRouteSync() {
  const location = useLocation();
  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    const urlLang = getLangFromPath(location.pathname);

    if (urlLang && urlLang !== language) {
      setLanguage(urlLang);
    }
  }, [location.pathname, language, setLanguage]);

  return null;
}

