// Imports Libraries
import React from "react";

// Imports Components
import VideoBackground from "@components/videoBackground/VideoBackground";
import ElsewhereSection from "@components/elsewhere/ElsewhereSection";
import { useLanguage } from "@i18n/LanguageContext";

const Elsewhere: React.FC = () => {
  const { t } = useLanguage();

  return (
    <>
      <VideoBackground videoSrc="/assets/video/background10.gif" overlay={true} />

      <div className="relative z-10">
        {/* Header */}
        <section className="pt-32 pb-2 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <h1 className="section-title mb-4">{t("elsewhere.pageTitle")}</h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">{t("elsewhere.pageDescription")}</p>
            </div>
          </div>
        </section>

        <ElsewhereSection showHeading={false} />
      </div>
    </>
  );
};

export default Elsewhere;
