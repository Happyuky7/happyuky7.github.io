// Imports Libraries
import React from 'react';
import { Link } from 'react-router-dom';
import { HiArrowRight } from 'react-icons/hi';
import { HiMail } from 'react-icons/hi';
import { HiChevronDown } from 'react-icons/hi';

// Imports Components
import VideoBackground from '@components/videoBackground/VideoBackground';
import { useLanguage } from '@i18n/LanguageContext';
import { withLang } from '@i18n/path';
import { publicPath } from '@/utils/publicPath';
import SkillsSection from "@components/skills/SkillsSection";
import RelevantProjectsSection from "@components/relevantProjects/RelevantProjectsSection";
import LanguagesSection from "@components/languages/LanguagesSection";
import { skillsCategories } from "@components/skills/skillsData";

// Styles
//import '@styles/Home.css';

const Home: React.FC = () => {
    const { t, tr, language } = useLanguage();
    const noWrapTitle = language !== "jp" && language !== "ja";
    const aboutParagraphs = tr("home.about-paragraphs") as string[];
    const userName = "Happyuky7";

    const heroSkillChips = React.useMemo(() => {
        const chips: string[] = [];
        const seen = new Set<string>();

        const add = (value: string | undefined) => {
            if (!value) return;
            if (seen.has(value)) return;
            seen.add(value);
            chips.push(value);
        };

        const normalizeLabel = (name: string) => {
            if (name === "JavaScript") return "JS";
            if (name === "TypeScript") return "TS";
            if (name === "AI/ML") return "IA";
            return name;
        };

        const hasAnyWebSkill = skillsCategories.programmingLanguages.some((s) =>
            s.level >= 15 && (s.name === "HTML" || s.name === "CSS" || s.name === "JavaScript" || s.name === "TypeScript")
        );

        if (hasAnyWebSkill) add("Web");

        // Prefer the ones you explicitly mentioned (only if you actually have them in the data)
        const preferred = ["Java", "Python", "JavaScript"];
        for (const name of preferred) {
            const found = skillsCategories.programmingLanguages.find((s) => s.name === name);
            if (found) add(normalizeLabel(found.name));
        }

        // Fill with top tools by level
        const toolsSorted = [...skillsCategories.tools].sort((a, b) => b.level - a.level);
        for (const tool of toolsSorted) {
            if (chips.length >= 5) break;
            add(normalizeLabel(tool.name));
        }

        // Final safety (keep it short and stable)
        return chips.slice(0, 5);
    }, []);


    const renderBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, index) => {
        
        if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={index}>{part.slice(2, -2)}</strong>;
        }

            return <span key={index}>{part}</span>;
        });
    };


    return (
        <>
            {/*<VideoBackground videoSrc="/assets/video/background4.mp4" overlay={true} />*/}
            <VideoBackground videoSrc="/assets/video/background7.gif" overlay={true} staticOverlay={true} />

            <div className="relative z-10">

                {/*<section className='min-h-screen flex items-center justify-center pt-0 px-4'>*/}
                <section className="home-hero min-h-dvh flex items-center justify-center px-4">
                    {/* Desktop / Tablet Layout */}
                    {/*<div className="hidden w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 text-left md:grid md:py-24 lg:grid-cols-2 lg:gap-12">*/}
                    <div className="home-hero-desktop hidden w-full max-w-6xl grid-cols-1 items-start gap-8 px-6 py-14 text-left md:grid md:grid-cols-2 md:gap-10 md:py-20 lg:items-center lg:gap-12">

                        <div className="space-y-6 reveal">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/80 backdrop-blur">
                                <span className="h-2 w-2 rounded-full bg-primary" />
                                {t("home.available")}
                            </div>

                            <div>
                                <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-4xl lg:text-5xl xl:text-6xl">
                                    <span className={noWrapTitle ? "whitespace-nowrap" : "block"}>
                                        {t("home.title-h1")}{" "}
                                        <span className="bg-linear-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
                                        {userName}
                                        </span>
                                    </span>
                                </h1>
                            </div>

                            <div className="relative max-w-xl pl-5">
                                <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] rounded-full bg-linear-to-b from-primary via-blue-500 opacity-80" aria-hidden="true" />
                                <div className="text-base leading-relaxed text-white/80 md:text-lg text-justify space-y-3">
                                    {aboutParagraphs?.map((p, i) => (
                                        <p key={i}>{renderBold(p)}</p>
                                    ))}
                                </div>
                            </div>


                            <ul className="flex flex-wrap gap-2 text-sm text-white/85">
                                {heroSkillChips.map((s) => (
                                    <li key={s} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                                        {s}
                                    </li>
                                ))}
                            </ul>


                            <div className="flex flex-wrap gap-3 pt-2">
                                <Link
                                    to={withLang(language, '/projects')}
                                    className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 font-semibold text-dark transition hover:scale-[1.02] hover:bg-primary/90"
                                    aria-label={t("home.view-projects")}
                                >
                                    {t("home.view-projects")}
                                    <HiArrowRight className="ml-2 h-5 w-5" />
                                </Link>

                                <Link
                                    to={withLang(language, '/contact')}
                                    className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-6 py-3 text-white transition hover:bg-white/10"
                                    aria-label={t("home.contact-me")}
                                >
                                    <HiMail className="mr-2 h-5 w-5" />
                                    {t("home.contact-me")}
                                </Link>
                            </div>
                        </div>

                        {/*<div className="mx-auto reveal delay-100">*/}
                        <div className="mx-auto md:ml-auto md:justify-self-end lg:translate-x-6 xl:translate-x-10 reveal delay-100">
                            <div className="relative">
                                <div className="absolute -inset-3 -z-10 rounded-full bg-primary/30 blur-2xl" />
                                <img
                                    src={publicPath('/assets/img/logo1.png')}
                                    alt="Happy7"
                                    className="h-44 w-44 rounded-full border border-white/10 object-cover shadow-2xl ring-4 ring-primary/40 sm:h-48 sm:w-48 md:h-52 md:w-52 lg:h-64 lg:w-64"
                                    loading="eager"
                                    decoding="async"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Mobile Layout Vertical */}
                    <div className="home-hero-mobile flex w-full max-w-xl flex-col items-center gap-10 px-6 py-16 pt-20 text-left md:hidden">
                        <div className="w-full space-y-6">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/80 backdrop-blur">
                                <span className="h-2 w-2 rounded-full bg-primary" />
                                {t("home.available")}
                            </div>

                            <h1 className="text-3xl font-bold leading-tight wrap-break-word sm:text-4xl -mt-3.5">
                                <span className={noWrapTitle ? "whitespace-normal wrap-break-word sm:whitespace-nowrap" : "block wrap-break-word"}>
                                    {t("home.title-h1")} {" "}
                                    <span className="bg-linear-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
                                        {userName}
                                    </span>
                                </span>
                            </h1>

                            <div className="home-hero-imageWrap flex justify-center">
                                <div className="reveal delay-100 relative">
                                    <div className="absolute -inset-2 -z-10 rounded-full bg-primary/30 blur-2xl" />
                                    <img
                                        src={publicPath('/assets/img/logo1.png')}
                                        alt="Happy7"
                                        className="home-hero-avatar h-40 w-40 rounded-full border border-white/10 object-cover shadow-2xl ring-4 ring-primary/40"
                                        loading="eager"
                                        decoding="async"
                                    />
                                </div>
                            </div>

                            <div className="home-hero-about relative pl-5">
                                <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] rounded-full bg-linear-to-b from-primary via-blue-500 opacity-80" aria-hidden="true" />
                                <div className="text-[16px] leading-relaxed text-white/80 md:text-lg text-justify space-y-3">
                                {aboutParagraphs?.map((p, i) => (
                                    <p key={i}>{renderBold(p)}</p>
                                    ))}
                                </div>
                            </div>

                            <ul className="flex flex-wrap gap-2 text-sm text-white/85">
                                {heroSkillChips.map((s) => (
                                    <li key={s} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                                        {s}
                                    </li>
                                ))}
                            </ul>

                            <div className="home-hero-actions flex w-full flex-col gap-3 pt-2">
                                <Link
                                    to={withLang(language, '/projects')}
                                    className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 font-semibold text-dark transition hover:scale-[1.02] hover:bg-primary/90"
                                    aria-label={t("home.view-projects")}
                                >
                                    {t("home.view-projects")}
                                    <HiArrowRight className="ml-2 h-5 w-5" />
                                </Link>

                                <Link
                                    to={withLang(language, '/contact')}
                                    className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-6 py-3 text-white transition hover:bg-white/10"
                                    aria-label={t("home.contact-me")}
                                >
                                    <HiMail className="mr-2 h-5 w-5" />
                                    {t("home.contact-me")}
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="relative z-10 -mt-2 sm:-mt-6 md:-mt-14 flex justify-center pb-4">
                    <button
                        type="button"
                        aria-label={t("home.scroll-down") ?? "Scroll down"}
                        onClick={() => document.getElementById("skills")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                        className="group inline-flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 backdrop-blur transition hover:bg-white/10 hover:text-white"
                    >
                        <HiChevronDown className="h-7 w-7 md:h-8 md:w-8 transition-transform duration-300 group-hover:translate-y-0.5" />
                    </button>
                </div>

                <SkillsSection />

                <LanguagesSection />

                <RelevantProjectsSection />


                


            </div>
        </>
    );
};

export default Home;