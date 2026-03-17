// Source of truth (EDIT THIS ONE): `skillsData.tsx`
// This file is only a shim so imports like `@components/skills/skillsData` work.
// Keep this file JSX-free to avoid Vite/esbuild parse errors.

export type { Skill, SkillsCategories } from "./skillsData.tsx";
export { skillsCategories, allSkills, getSkillsByCategory, getSkillsByMinLevel } from "./skillsData.tsx";
