import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaGithub, FaLinkedin, FaYoutube, FaTwitch, FaDiscord, FaTiktok, FaReddit } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { SiPixiv } from "react-icons/si";
import { publicPath } from "@/utils/publicPath";
import { HiMenu, HiX, HiDotsHorizontal } from "react-icons/hi";
import { HiPhotograph, HiVideoCamera } from "react-icons/hi";

import LanguageSelector from "@components/languageSelector/LanguageSelector";
import { useLanguage } from "@i18n/LanguageContext";
import { useDevice } from "@/device/DeviceContext";
import { useBackground } from "@/background/BackgroundContext";

const NavBar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [socialsOpen, setSocialsOpen] = useState(false);
  const socialsRef = useRef<HTMLDivElement | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [skillsInView, setSkillsInView] = useState(false);
  const location = useLocation();
  const { t, language } = useLanguage();
  const { isMobile } = useDevice();
  const { mode, toggleMode } = useBackground();

  // ✅ helper para crear rutas con idioma
  const withLang = (path: string) => {
    const clean = path.startsWith("/") ? path : `/${path}`;
    return `/${language}${clean}`;
  };

  // ✅ helper para detectar activo ignorando /en /es /ja
  const stripLangPrefix = (pathname: string) => {
    return pathname.replace(/^\/(en|es|ja|jp|zh|pt|pl|de|ru|th|fil|fr|ko)(\/|$)/, "/");
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (!isMobile) setMobileMenuOpen(false);
  }, [isMobile]);

  useEffect(() => {
    if (!socialsOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (socialsRef.current && !socialsRef.current.contains(event.target as Node)) setSocialsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSocialsOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [socialsOpen]);

  const socialLinks = [
    { icon: <FaGithub />, url: "https://github.com/Happyuky7", label: "GitHub" },
    { icon: <FaLinkedin />, url: "https://www.linkedin.com/in/mathias-iribarren-retamal/", label: "LinkedIn" },
    { icon: <FaXTwitter />, url: "https://x.com/Happyuky7", label: "X" },
    { icon: <FaDiscord />, url: "https://discord.gg/3EebYUyeUX", label: "Discord" },
    { icon: <FaYoutube />, url: "https://www.youtube.com/@Happyuky7", label: "YouTube" },
    { icon: <FaTwitch />, url: "https://www.twitch.tv/happyuky7", label: "Twitch" },
    { icon: <FaTiktok />, url: "https://www.tiktok.com/@happyuky7", label: "TikTok" },
    { icon: <SiPixiv />, url: "https://www.pixiv.net/en/users/80207354", label: "Pixiv" },
    { icon: <FaReddit />, url: "https://www.reddit.com/user/Happyuky7", label: "Reddit" },
  ];

  // ✅ tus links ahora siempre incluyen idioma
  const navLinks = [
    { to: withLang("/"), label: t("nav.home"), match: "/" },
    // Skills: scroll to section WITHOUT adding #hash to the URL
    { to: withLang("/"), label: t("nav.skills"), match: "skills", state: { scrollTo: "skills" } },
    { to: withLang("/projects"), label: t("nav.projects"), match: "/projects" },
    { to: withLang("/contact"), label: t("nav.contact"), match: "/contact" },
    { to: withLang("/blog"), label: t("nav.blog"), match: "/blog" },
    { to: withLang("/elsewhere"), label: t("nav.elsewhere"), match: "/elsewhere" },
  ] as const;

  const cleanPath = stripLangPrefix(location.pathname);

  const handleSkillsClick = (e: React.MouseEvent) => {
    // If we're already on Home, just scroll and keep the URL clean (no navigation).
    if (cleanPath === "/") {
      const el = document.getElementById("skills");
      if (el) {
        e.preventDefault();
        setMobileMenuOpen(false);
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  // Scrollspy: mark Skills active when the section is visible on Home.
  useEffect(() => {
    if (cleanPath !== "/") {
      setSkillsInView(false);
      return;
    }

    let cancelled = false;
    let observer: IntersectionObserver | null = null;
    let retryTimer: number | null = null;

    const setup = () => {
      const el = document.getElementById("skills");
      if (!el) return false;

      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry || cancelled) return;
          setSkillsInView(entry.isIntersecting);
        },
        {
          threshold: 0.2,
          // Helps align with a fixed navbar.
          rootMargin: "-80px 0px -60% 0px",
        }
      );

      observer.observe(el);
      return true;
    };

    if (!setup()) {
      // Home is lazy-loaded; retry once a moment later.
      retryTimer = window.setTimeout(() => setup(), 200);
    }

    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      observer?.disconnect();
    };
  }, [cleanPath]);

  const isActive = (match: string) => {
    // ✅ Skills activo cuando estás sobre la sección
    if (match === "skills") {
      return cleanPath === "/" && skillsInView;
    }

    // ✅ Home activo solo en /
    if (match === "/") {
        return cleanPath === "/";
    }

    // ✅ resto normal
    return cleanPath.startsWith(match);
  };


  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-dark/75 backdrop-blur-lg shadow-lg shadow-primary/10" : "bg-transparent"
      }`}
    >
      <div className="max-w-[88rem] min-[1900px]:max-w-[117rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[minmax(max-content,1fr)_auto_minmax(max-content,1fr)] items-center gap-4 lg:gap-8 h-20">
          {/* Logo */}
          <Link to={withLang("/")} className="navbar-brand col-start-1 flex min-w-0 items-center space-x-3 group pr-2 lg:pr-0">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden ring-2 ring-primary/50 group-hover:ring-primary transition-all">
              <img src={publicPath('/assets/img/logo.png')} alt="Happy7" className="w-full h-full object-cover" loading="eager" decoding="async" />
            </div>
            <span className="navbar-brand-text whitespace-nowrap text-xl sm:text-2xl font-bold bg-linear-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              Happyuky7
            </span>
          </Link>

          {/* Desktop Navigation (show from lg to avoid mid-size overflow) */}
          <div className="navbar-desktop-links col-start-2 hidden lg:flex items-center space-x-10">
            {navLinks.map((link) => (
              <Link
                key={`${link.match}-${link.to}`}
                to={link.to}
                state={(link as any).state}
                onClick={link.match === "skills" ? handleSkillsClick : undefined}
                className={`whitespace-nowrap text-lg font-medium transition-all duration-300 hover:text-primary ${
                  isActive(link.match) ? "text-primary" : "text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side - Desktop */}
          <div className="navbar-desktop-social col-start-3 justify-self-end hidden lg:flex items-center gap-6">
            <div className="hidden min-[1900px]:flex items-center space-x-5">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-primary transition-all duration-300 transform hover:scale-110"
                  aria-label={social.label}
                >
                  <span className="text-xl">{social.icon}</span>
                </a>
              ))}
            </div>
            {/* Under 1900px the full icon row cannot fit without pushing the nav
                off-centre, so the same links live behind this button instead of
                simply disappearing. */}
            <div ref={socialsRef} className="relative min-[1900px]:hidden">
              <button
                type="button"
                onClick={() => setSocialsOpen((open) => !open)}
                aria-expanded={socialsOpen}
                aria-haspopup="true"
                aria-label={t("nav.social")}
                title={t("nav.social")}
                className={`flex items-center justify-center rounded-lg border border-primary/30 px-3 py-2 transition-all duration-300 hover:bg-primary/20 hover:text-primary ${
                  socialsOpen ? "bg-primary/20 text-primary" : "bg-dark-lighter text-gray-300"
                }`}
              >
                <HiDotsHorizontal className="h-5 w-5" />
              </button>

              {socialsOpen ? (
                <div className="absolute right-0 top-full z-50 mt-2 grid w-max grid-cols-5 gap-2 rounded-xl border border-primary/25 bg-dark-lighter/95 p-3 shadow-lg shadow-black/40 backdrop-blur">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setSocialsOpen(false)}
                      className="grid h-9 w-9 place-items-center rounded-lg text-gray-400 transition-all duration-300 hover:bg-primary/15 hover:text-primary"
                      aria-label={social.label}
                      title={social.label}
                    >
                      <span className="text-xl">{social.icon}</span>
                    </a>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              <label
                title={mode === "static" ? "Animated background" : "Static background"}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-lighter hover:bg-primary/20 transition-all duration-300 border border-primary/30 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={mode === "static"}
                  onChange={toggleMode}
                  aria-label={mode === "static" ? "Switch to animated background" : "Switch to static background"}
                />
                <span className="relative inline-flex h-5 w-10 items-center rounded-full bg-black/30 border border-white/10" aria-hidden="true">
                  <span
                    className={
                      "absolute left-0.5 top-0.5 grid h-4 w-4 place-items-center rounded-full bg-primary/30 text-primary transition-transform duration-300 " +
                      (mode === "static" ? "translate-x-5" : "translate-x-0")
                    }
                  >
                    {mode === "static" ? <HiPhotograph className="h-3 w-3" /> : <HiVideoCamera className="h-3 w-3" />}
                  </span>
                </span>
              </label>

              <LanguageSelector />
            </div>
          </div>

          {/* Mobile Menu Button + Language Selector */}
          <div className="navbar-mobile-controls col-start-3 justify-self-end shrink-0 flex items-center gap-2 lg:hidden max-[430px]:gap-1">
            <LanguageSelector />
            <label
              title={mode === "static" ? "Animated background" : "Static background"}
                className="navbar-mobile-bg-toggle flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-lighter hover:bg-primary/20 transition-all duration-300 border border-primary/30 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={mode === "static"}
                onChange={toggleMode}
                aria-label={mode === "static" ? "Switch to animated background" : "Switch to static background"}
              />
              <span className="relative inline-flex h-5 w-10 items-center rounded-full bg-black/30 border border-white/10" aria-hidden="true">
                <span
                  className={
                    "absolute left-0.5 top-0.5 grid h-4 w-4 place-items-center rounded-full bg-primary/30 text-primary transition-transform duration-300 " +
                    (mode === "static" ? "translate-x-5" : "translate-x-0")
                  }
                >
                  {mode === "static" ? <HiPhotograph className="h-3 w-3" /> : <HiVideoCamera className="h-3 w-3" />}
                </span>
              </span>
            </label>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white text-3xl focus:outline-none hover:text-primary transition-colors max-[430px]:text-2xl"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <HiX /> : <HiMenu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`navbar-mobile-menu lg:hidden transition-all duration-300 ${
          mobileMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="px-4 pt-2 pb-6 space-y-4 bg-dark-lighter/75 backdrop-blur-lg">
          
          {navLinks.map((link) => (
            <Link
              key={`${link.match}-${link.to}`}
              to={link.to}
              state={(link as any).state}
              onClick={link.match === "skills" ? handleSkillsClick : undefined}
              className={`block text-lg font-medium py-3 px-4 rounded-lg transition-all duration-300 ${
                isActive(link.match)
                  ? "bg-primary/20 text-primary"
                  : "text-white hover:bg-primary/10 hover:text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Mobile Social Links */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-700">
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary transition-all duration-300 text-2xl"
                aria-label={social.label}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
