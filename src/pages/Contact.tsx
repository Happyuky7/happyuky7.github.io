// Imports Libraries
import React, { useEffect, useMemo, useState } from "react";

// Imports Components
import VideoBackground from "@components/videoBackground/VideoBackground";
import { useLanguage } from "@i18n/LanguageContext";

import { FaXTwitter } from "react-icons/fa6";
import { FaGithub, FaLinkedin, FaYoutube, FaTwitch, FaDiscord, FaEnvelope, FaCopy, FaCheck } from "react-icons/fa";
import { SiPixiv } from "react-icons/si";
import { HiClock, HiLocationMarker } from "react-icons/hi";

const Contact: React.FC = () => {
  const { t, language } = useLanguage();

  const EMAIL = "happyrogelio7developer@gmail.com";
  const X_TWITTER_URL = "https://x.com/happyuky7";
  const DISCORD_USER = "Happy7";
  const DISCORD_URL = "https://discord.com/users/Happy7";
  const DISCORD_SERVER_URL = "https://discord.gg/3EebYUyeUX";
  const TIMEZONE = "GMT-3 (Chile)";
  const RESPONSE_TIME = "24–72h";

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // Update periodically; minute precision is enough for display.
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const locale = useMemo(() => {
    return language === 'es' ? 'es-ES' : language === 'ja' || language === 'jp' ? 'ja-JP' : 'en-US';
  }, [language]);

  const formatTime24 = (date: Date, timeZone?: string) => {
    try {
      return new Intl.DateTimeFormat(locale, {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(date);
    } catch {
      return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getHourInZone = (date: Date, timeZone?: string) => {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: '2-digit',
        hour12: false,
      }).formatToParts(date);
      const hourStr = parts.find((p) => p.type === 'hour')?.value;
      const hour = Number.parseInt(hourStr ?? '', 10);
      return Number.isFinite(hour) ? hour : null;
    } catch {
      return null;
    }
  };

  const getTimeZoneOffsetMinutes = (date: Date, timeZone: string) => {
    // Returns the offset of `timeZone` from UTC in minutes at the given `date`.
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(date);

    const get = (type: string) => parts.find((p) => p.type === type)?.value;
    const year = Number(get('year'));
    const month = Number(get('month'));
    const day = Number(get('day'));
    const hour = Number(get('hour'));
    const minute = Number(get('minute'));
    const second = Number(get('second'));

    const asUTC = Date.UTC(year, month - 1, day, hour, minute, second);
    return Math.round((asUTC - date.getTime()) / 60000);
  };

  const formatDiff = (diffMinutes: number) => {
    const sign = diffMinutes === 0 ? '' : diffMinutes > 0 ? '+' : '-';
    const abs = Math.abs(diffMinutes);
    const hours = Math.floor(abs / 60);
    const mins = abs % 60;
    if (hours === 0 && mins === 0) return '0h';
    if (mins === 0) return `${sign}${hours}h`;
    if (hours === 0) return `${sign}${mins}m`;
    return `${sign}${hours}h ${mins}m`;
  };

  const chileTimeDisplay = useMemo(() => {
    const hour = getHourInZone(now, 'America/Santiago');
    const period = hour === null ? '' : hour < 12 ? 'AM' : 'PM';
    return `${formatTime24(now, 'America/Santiago')} ${period}`.trim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, locale]);

  const localTimeDisplay = useMemo(() => {
    const hour = getHourInZone(now);
    const period = hour === null ? '' : hour < 12 ? 'AM' : 'PM';
    return `${formatTime24(now)} ${period}`.trim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, locale]);

  const diffWithChile = useMemo(() => {
    try {
      const chileOffset = getTimeZoneOffsetMinutes(now, 'America/Santiago');
      const localOffset = -now.getTimezoneOffset();
      // Positive means viewer is ahead of Chile.
      return formatDiff(localOffset - chileOffset);
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  const copyToClipboard = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1200);
    } catch (e) {
      console.error("Clipboard error:", e);
    }
  };

  const socialLinks = useMemo(
    () => [
      {
        icon: <FaGithub className="text-4xl" />,
        name: "GitHub",
        url: "https://github.com/Happyuky7",
        username: "@Happyuky7",
        hoverColor: "group-hover:text-white",
      },
      {
        icon: <FaLinkedin className="text-4xl" />,
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/mathias-iribarren-retamal/",
        username: "",
        hoverColor: "group-hover:text-blue-500",
      },
      {
        icon: <FaXTwitter className="text-4xl" />,
        name: "X / Twitter",
        url: "https://twitter.com/happyuky7",
        username: "@happyuky7",
        hoverColor: "group-hover:text-sky-400",
      },
      {
        icon: <FaYoutube className="text-4xl" />,
        name: "YouTube",
        url: "https://www.youtube.com/@Happyuky7",
        username: "@Happyuky7",
        hoverColor: "group-hover:text-red-500",
      },
      {
        icon: <FaTwitch className="text-4xl" />,
        name: "Twitch",
        url: "https://www.twitch.tv/happyuky7",
        username: "happyuky7",
        hoverColor: "group-hover:text-purple-500",
      },
      {
        icon: <SiPixiv className="text-4xl" />,
        name: "Pixiv",
        url: "https://www.pixiv.net/en/users/80207354",
        username: "Happy7",
        hoverColor: "group-hover:text-blue-400",
      },
    ],
    []
  );

  // Form sin backend (abre mail)
  // Nota: el formulario está comentado más abajo; si se vuelve a habilitar,
  // se puede reintroducir el estado y el mailtoLink.

  return (
    <>
      <VideoBackground videoSrc="/assets/video/background11.gif" overlay={true} />

      <div className="relative z-10">
        {/* Header */}
        <section className="pt-32 pb-6 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="section-title mb-4">{t("contact.title")}</h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">{t("contact.description")}</p>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 pb-16 space-y-14">
          {/* Quick Contact Cards */}
          <section>
            <h2 className="text-3xl font-bold mb-6 text-center">{t("contact.quickTitle")}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div className="card">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-primary text-3xl">
                      <FaEnvelope />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg text-white">{t("contact.emailTitle")}</h3>
                      <p className="text-sm text-gray-400 break-all">{EMAIL}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
                    <button
                      onClick={() => copyToClipboard(EMAIL, "email")}
                      className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 transition"
                    >
                      {copiedKey === "email" ? <FaCheck /> : <FaCopy />}
                      {copiedKey === "email" ? t("contact.copied") : t("contact.copy")}
                    </button>

                    <a
                      href={`mailto:${EMAIL}`}
                      className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-dark hover:bg-primary/90 transition"
                    >
                      {t("contact.sendEmail")}
                    </a>
                  </div>
                </div>
              </div>

              {/* Twiiter (X) */}
              <div className="card">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-primary text-3xl">
                      <FaXTwitter />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg text-white">{t("contact.xTitle")}</h3>
                      <p className="text-sm text-gray-400">@Happyuky7</p>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto">
                    <a
                      href={X_TWITTER_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-dark hover:bg-primary/90 transition"
                    >
                      {t("contact.openX")}
                    </a>
                  </div>
                </div>
              </div>

              {/* Discord */}
              <div className="card">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-blue-500 text-3xl">
                      <FaDiscord />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg text-white">{t("contact.discordTitle")}</h3>
                      <p className="text-sm text-gray-400">{DISCORD_USER}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
                    <button
                      onClick={() => copyToClipboard(DISCORD_USER, "discord")}
                      className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 transition"
                    >
                      {copiedKey === "discord" ? <FaCheck /> : <FaCopy />}
                      {copiedKey === "discord" ? t("contact.copied") : t("contact.copy")}
                    </button>

                    <a
                      href={DISCORD_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-white/10 transition"
                    >
                      {t("contact.openDiscord")}
                    </a>
                  </div>
                </div>
              </div>

              {/* Discord Server */}
              <div className="card">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-blue-500 text-3xl">
                      <FaDiscord />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg text-white">{t("contact.discordServerTitle")}</h3>
                      <p className="text-sm text-gray-400 break-all">{DISCORD_SERVER_URL.replace(/^https?:\/\//, "")}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
                    <button
                      onClick={() => copyToClipboard(DISCORD_SERVER_URL, "discord")}
                      className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 transition"
                    >
                      {copiedKey === "discord" ? <FaCheck /> : <FaCopy />}
                      {copiedKey === "discord" ? t("contact.copied") : t("contact.copy")}
                    </button>

                    <a
                      href={DISCORD_SERVER_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-white/10 transition"
                    >
                      {t("contact.openDiscord")}
                    </a>
                  </div>
                </div>
              </div>

              {/* Response time */}
              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="text-primary text-3xl">
                    <HiClock />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">{t("contact.responseTitle")}</h3>
                    <p className="text-sm text-gray-400">
                      {t("contact.responseText")} <span className="text-white font-semibold">{RESPONSE_TIME}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      ({language === 'es' ? 'Considera horario despierto' : language === 'ja' || language === 'jp' ? '起きている時間帯を考慮してください' : 'Please consider awake hours'})
                    </p>
                  </div>
                </div>
              </div>

              {/* Timezone */}
              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="text-primary text-3xl">
                    <HiLocationMarker />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">{t("contact.timezoneTitle")}</h3>
                    <p className="text-sm text-gray-400">
                      {t("contact.timezoneText")} <span className="text-white font-semibold">{TIMEZONE}</span>
                      <span className="text-white/70"> · </span>
                      <span className="text-white font-semibold">{chileTimeDisplay}</span>
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      {language === 'es' ? 'Tu hora' : language === 'ja' || language === 'jp' ? 'あなたの時間' : 'Your time'}:{' '}
                      <span className="text-white/80">{localTimeDisplay}</span>
                      {diffWithChile ? (
                        <>
                          <span className="text-white/50"> · </span>
                          <span className="text-white/80">
                            {language === 'es' ? 'Diferencia' : language === 'ja' || language === 'jp' ? '時差' : 'Difference'}: {diffWithChile}
                          </span>
                        </>
                      ) : null}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ✅ Social Media */}
          <section>
            <h2 className="text-3xl font-bold mb-8 text-center">{t("contact.socialMedia")}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card group hover:scale-[1.02] transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className={`text-gray-400 transition-all duration-300 ${social.hoverColor}`}>
                      {social.icon}
                    </div>

                    <div>
                      <h3 className="font-bold text-lg text-white mb-1">{social.name}</h3>
                      <p className="text-sm text-gray-400">{social.username}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* Contact Form */}
          {/*<section>
            <h2 className="text-3xl font-bold mb-6 text-center">{t("contact.formTitle")}</h2>

            <div className="card max-w-3xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder={t("contact.formName")}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-primary/60"
                />

                <input
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder={t("contact.formEmail")}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-primary/60"
                />

                <select
                  value={form.topic}
                  onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))}
                  aria-label="Topic"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-primary/60 md:col-span-2"
                >
                  <option className="bg-dark" value="Freelance / Project">
                    Freelance / Project
                  </option>
                  <option className="bg-dark" value="Software Development">
                    Software Development
                  </option>
                  <option className="bg-dark" value="ESP32 / Raspberry / IoT">
                    ESP32 / Raspberry / IoT
                  </option>
                  <option className="bg-dark" value="AI / LLMs">
                    AI / LLMs
                  </option>
                  <option className="bg-dark" value="Content / Collaboration">
                    Content / Collaboration
                  </option>
                </select>

                <textarea
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  placeholder={t("contact.formMessage")}
                  rows={5}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-primary/60 md:col-span-2"
                />

                <div className="md:col-span-2 flex flex-col md:flex-row items-center justify-between gap-3">
                  <p className="text-sm text-gray-400">
                    {t("contact.formHint")}
                  </p>

                  <a
                    href={mailtoLink}
                    className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 font-semibold text-dark transition hover:scale-[1.02] hover:bg-primary/90"
                  >
                    {t("contact.formButton")}
                  </a>
                </div>
              </div>
            </div>
          </section>*/}
        </div>
      </div>
    </>
  );
};

export default Contact;
