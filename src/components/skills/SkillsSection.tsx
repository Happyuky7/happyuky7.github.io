import { useMemo, useState } from "react";
import { useLanguage } from "@i18n/LanguageContext";
import { skillsCategories, type Skill } from "@components/skills/skillsData";

type SkillsTab = keyof typeof skillsCategories | "all";
type SkillsSkin = "minimal" | "stealth" | "full";

function clamp01(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function CategoryLabel({ tab }: { tab: SkillsTab }) {
  const { t } = useLanguage();
  if (tab === "all") return <>{t("home.skills.tabs.all")}</>;
  if (tab === "programmingLanguages") return <>{t("home.skills.tabs.programming")}</>;
  if (tab === "tools") return <>{t("home.skills.tabs.tools")}</>;
  if (tab === "creative") return <>{t("home.skills.tabs.creative")}</>;
  if (tab === "other") return <>{t("home.skills.tabs.other")}</>;
  return null;
}

function SkillIcon({ skill }: { skill: Skill }) {
  if (typeof skill.icon === "string") {
    if (!skill.icon) {
      return (
        <div className="grid h-6 w-6 place-items-center rounded-md bg-white/10 text-[11px] font-semibold text-white/80">
          {skill.name.slice(0, 1).toUpperCase()}
        </div>
      );
    }
    return (
      <img
        src={skill.icon}
        alt={skill.name}
        className="h-6 w-6 object-contain opacity-90"
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
      />
    );
  }

  return <span className={skill.color ?? "text-primary"}>{skill.icon}</span>;
}

function SkillCardModern({ skill, skin }: { skill: Skill; skin: SkillsSkin }) {
  const level = clamp01(skill.level);
  const showProgress = skin === "full";
  const showNumeric = skin === "full";
  const showLabel = skin === "full";

  if (skin === "minimal") {
    return (
      <div className="group rounded-2xl border border-white/10 bg-black/55 p-3 backdrop-blur transition hover:bg-white/10">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl">
            <SkillIcon skill={skill} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold text-white">{skill.name}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group rounded-2xl border border-white/10 bg-black/55 p-3 backdrop-blur transition hover:bg-white/10">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl">
          <SkillIcon skill={skill} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-white">{skill.name}</div>
          {showLabel ? <div className="mt-1 text-xs md:text-sm text-white/70">Level</div> : null}
        </div>
        {showNumeric ? <div className="text-sm font-semibold text-white/85 tabular-nums">{level}%</div> : null}
      </div>

      {showProgress ? (
        <div className="mt-2">
          <progress
            className="skill-progress h-2 w-full overflow-hidden rounded-full"
            value={level}
            max={100}
            aria-label={`${skill.name} level`}
          />
        </div>
      ) : null}
    </div>
  );
}

function normalizeSkillsSkin(raw: unknown): SkillsSkin {
  if (raw === "minimal" || raw === "stealth" || raw === "full") return raw;
  return "stealth";
}

export default function SkillsSection({ skin }: { skin?: SkillsSkin }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<SkillsTab>("all");

  const effectiveSkin = useMemo(() => {
    const env = import.meta.env as unknown as Record<string, unknown>;
    return skin ?? normalizeSkillsSkin(env["VITE_SKILLS_SKIN"]);
  }, [skin]);

  const allSkills = useMemo(() => {
    const flat: Skill[] = [
      ...skillsCategories.programmingLanguages,
      ...skillsCategories.tools,
      ...skillsCategories.creative,
      ...skillsCategories.other,
    ];
    return flat;
  }, []);

  const skills = useMemo(() => {
    const base = tab === "all" ? allSkills : (skillsCategories[tab] ?? allSkills);
    // Preserve the original order as defined in skillsData.tsx.
    return base;
  }, [allSkills, tab]);

  const tabs: SkillsTab[] = ["all", "programmingLanguages", "tools", "creative", "other"];

  return (
    <section id="skills" className="relative z-10 w-full scroll-mt-28 px-4 pb-20">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">
            <span className="text-primary">
              {t("home.skills.title")}
            </span>
          </h2>
          <p className="max-w-2xl text-lg text-white/80">{t("home.skills.subtitle")}</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              title={k}
              aria-label={`skills-tab-${k}`}
              className={
                k === tab
                  ? "rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm md:text-base text-white/90"
                  : "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm md:text-base text-white/75 hover:bg-white/10"
              }
            >
              <CategoryLabel tab={k} />
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {skills.map((s, idx) => (
            <SkillCardModern key={`${s.name}-${idx}`} skill={s} skin={effectiveSkin} />
          ))}
        </div>
      </div>
    </section>
  );
}
