import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@i18n/LanguageContext";
import { HiGlobeAlt } from "react-icons/hi";

import deFlag from "flag-icons/flags/4x3/de.svg?url";
import esFlag from "flag-icons/flags/4x3/es.svg?url";
import frFlag from "flag-icons/flags/4x3/fr.svg?url";
import gbFlag from "flag-icons/flags/4x3/gb.svg?url";
import jpFlag from "flag-icons/flags/4x3/jp.svg?url";
import krFlag from "flag-icons/flags/4x3/kr.svg?url";
import phFlag from "flag-icons/flags/4x3/ph.svg?url";
import plFlag from "flag-icons/flags/4x3/pl.svg?url";
import ptFlag from "flag-icons/flags/4x3/pt.svg?url";
import ruFlag from "flag-icons/flags/4x3/ru.svg?url";
import thFlag from "flag-icons/flags/4x3/th.svg?url";
import cnFlag from "flag-icons/flags/4x3/cn.svg?url";

const LanguageSelector: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { language } = useLanguage();

  const navigate = useNavigate();
  const location = useLocation();

  const languages = [
    { code: "en", name: "English", flag: gbFlag },
    { code: "es", name: "Español", flag: esFlag },
    { code: "ja", name: "日本語", flag: jpFlag },
    { code: "fr", name: "Français", flag: frFlag },
    { code: "de", name: "Deutsch", flag: deFlag },
    { code: "pt", name: "Português", flag: ptFlag },
    { code: "pl", name: "Polski", flag: plFlag },
    { code: "ru", name: "Русский", flag: ruFlag },
    { code: "zh", name: "简体中文", flag: cnFlag },
    { code: "ko", name: "한국어", flag: krFlag },
    { code: "th", name: "ไทย", flag: thFlag },
    { code: "fil", name: "Filipino", flag: phFlag },
  ];

  const handleLanguageChange = (code: string) => {
    // ✅ quitamos prefijo anterior si existe y lo reemplazamos
    const cleanPath = location.pathname.replace(/^\/(en|es|ja|jp|zh|pt|pl|de|ru|th|fil|fr|ko)(\/|$)/, "/");

    // evita doble //
    const finalPath = `/${code}${cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`}`;

    navigate(finalPath + location.search + location.hash);
    setMenuOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-lighter hover:bg-primary/20 transition-all duration-300 border border-primary/30 max-[360px]:px-2"
        aria-label="Change language"
      >
        <HiGlobeAlt className="text-xl text-primary" />
        <span className="text-sm font-semibold">
          <img
            src={languages.find((l) => l.code === language)?.flag}
            alt=""
            className="inline-block h-4 w-6 align-middle object-contain"
            loading="lazy"
            decoding="async"
          />{" "}
          {/*<span className="uppercase">{language}</span> */}
        </span>
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-dark-lighter rounded-lg shadow-xl border border-primary/30 z-50 overflow-hidden">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-all duration-300 ${
                  language === lang.code
                    ? "bg-primary/20 text-primary"
                    : "hover:bg-primary/10 text-gray-300"
                }`}
              >
                <img
                  src={lang.flag}
                  alt=""
                  className="h-5 w-7 object-contain"
                  loading="lazy"
                  decoding="async"
                />
                <span className="font-semibold">{lang.name}</span>
                {language === lang.code && <span className="ml-auto text-primary">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
