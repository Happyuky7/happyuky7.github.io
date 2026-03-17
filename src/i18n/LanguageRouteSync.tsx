import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "./LanguageContext";

function getLangFromPath(pathname: string): string | null {
  // match: /en, /es, /ja
  const match = pathname.match(/^\/(en|es|ja|zh|pt|pl|de|ru|th|fil|fr|ko)(\/|$)/);
  return match?.[1] ?? null;
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

