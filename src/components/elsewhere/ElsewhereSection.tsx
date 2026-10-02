import { useMemo } from "react";
import { HiExternalLink } from "react-icons/hi";

import { useLanguage } from "@i18n/LanguageContext";
import { sortedElsewhereSites } from "@components/elsewhere/elsewhereData";

/**
 * `showHeading` is off on the /elsewhere page, which already has its own <h1>
 * and description - rendering both stacked two near-identical titles.
 */
export default function ElsewhereSection({ showHeading = true }: { showHeading?: boolean }) {
  const { t } = useLanguage();
  const sites = useMemo(() => sortedElsewhereSites(), []);

  return (
    <section id="elsewhere" className="scroll-mt-28 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {showHeading ? (
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              <span className="bg-linear-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                {t("elsewhere.title")}
              </span>
            </h2>
            <p className="mt-3 max-w-3xl mx-auto text-lg text-white/80">{t("elsewhere.subtitle")}</p>
          </div>
        ) : null}

        <div
          className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${
            sites.length >= 3 ? "lg:grid-cols-3" : "mx-auto max-w-4xl"
          }`}
        >
          {sites.map((site) => (
            <a
              key={site.id}
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card group flex h-full flex-col hover:scale-[1.02] transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className={`text-gray-400 transition-all duration-300 ${site.hoverColor}`}>
                  {site.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-lg text-white mb-1">{site.name}</h3>
                  <p className="text-sm text-gray-400">{t(`elsewhere.sites.${site.id}.tagline`)}</p>
                </div>

                <HiExternalLink
                  className="h-5 w-5 shrink-0 text-gray-600 transition-colors duration-300 group-hover:text-primary"
                  aria-hidden="true"
                />
              </div>

              <p className="mt-4 text-sm text-gray-300 leading-relaxed">{t(`elsewhere.sites.${site.id}.blurb`)}</p>

              <p className="mt-auto pt-4 font-mono text-xs text-gray-500">{site.host}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
