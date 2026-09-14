import type { ReactNode } from "react";
import { FaBrain, FaCamera, FaRobot, FaServer, FaVrCardboard } from "react-icons/fa";
import { HiCube, HiPencilAlt } from "react-icons/hi";
import { SiApachemaven, SiGithub, SiGradle, SiLmstudio, SiNvidia, SiOllama, SiRust } from "react-icons/si";

const devicon = (path: string) => `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${path}`;

/**
 * NOTE ABOUT `level`
 *
 * `level` is a RANKING value, not a literal "I know X% of this" measurement.
 * Treat it as a way to express hierarchy: how much weight/prominence a skill
 * should have relative to the others, so the more relevant ones stand out.
 *
 * How it is actually consumed:
 *  - The rendering order of the cards comes from the ORDER OF THE ARRAYS below,
 *    not from `level`. To move a skill up or down, move its line.
 *  - `level` fills the progress bar and the `%` shown in the "full" skin only
 *    (the "minimal" and "stealth" skins ignore it). See `SkillsSection.tsx`.
 *  - `getSkillsByMinLevel()` uses it to filter.
 *
 * Valid range: 0-100 (clamped at render time).
 */
export interface Skill {
  name: string;
  icon: string | ReactNode;
  /** Relative ranking (0-100), used for hierarchy/prominence - see note above. */
  level: number;
  color?: string;
}

export interface SkillsCategories {
  programmingLanguages: Skill[];
  tools: Skill[];
  creative: Skill[];
  other: Skill[];
}

export const skillsCategories: SkillsCategories = {
  programmingLanguages: [
    { name: "Java", icon: devicon("java/java-original.svg"), level: 40 },
    { name: "JavaScript", icon: devicon("javascript/javascript-original.svg"), level: 30 },
    { name: "TypeScript", icon: devicon("typescript/typescript-original.svg"), level: 15 },
    { name: "Python", icon: devicon("python/python-original.svg"), level: 35 },
    { name: "Rust", icon: <SiRust />, color: "text-orange-300", level: 8 },
    { name: "C++", icon: devicon("cplusplus/cplusplus-original.svg"), level: 5 },
    { name: "C#", icon: devicon("csharp/csharp-original.svg"), level: 5 },
    { name: "Lua", icon: devicon("lua/lua-original.svg"), level: 25 },
    { name: "Bash", icon: devicon("bash/bash-original.svg"), level: 20 },
    { name: "HTML", icon: devicon("html5/html5-original.svg"), level: 80 },
    { name: "CSS", icon: devicon("css3/css3-original.svg"), level: 50 },
    { name: "Julia", icon: devicon("julia/julia-original.svg"), level: 35 },
  ],
  tools: [
    { name: "React", icon: devicon("react/react-original.svg"), level: 30 },
    { name: "Vite", icon: devicon("vitejs/vitejs-original.svg"), level: 30 },
    { name: "Tailwind CSS", icon: devicon("tailwindcss/tailwindcss-original.svg"), level: 35 },
    { name: "Node.js", icon: devicon("nodejs/nodejs-original.svg"), level: 55 },
    { name: "NPM", icon: devicon("npm/npm-original-wordmark.svg"), level: 55 },
    { name: "pnpm", icon: devicon("pnpm/pnpm-original.svg"), level: 40 },
    { name: "MongoDB", icon: devicon("mongodb/mongodb-original.svg"), level: 15 },
    { name: "Redis", icon: devicon("redis/redis-original.svg"), level: 10 },
    { name: "MySQL", icon: devicon("mysql/mysql-original.svg"), level: 20 },
    { name: "SQLite", icon: devicon("sqlite/sqlite-original.svg"), level: 20 },
    { name: "Git", icon: devicon("git/git-original.svg"), level: 40 },
    { name: "GitHub", icon: <SiGithub />, color: "text-white", level: 45 },
    { name: "VS Code", icon: devicon("vscode/vscode-original.svg"), level: 60 },
    { name: "Maven", icon: <SiApachemaven />, color: "text-red-400", level: 25 },
    { name: "Gradle", icon: <SiGradle />, color: "text-teal-300", level: 20 },
    { name: "Nginx", icon: devicon("nginx/nginx-original.svg"), level: 65 },
    { name: "Docker", icon: devicon("docker/docker-original.svg"), level: 10 },
    { name: "Linux", icon: devicon("linux/linux-original.svg"), level: 12 },
    { name: "Arduino", icon: devicon("arduino/arduino-original.svg"), level: 25 },
  ],
  creative: [
    { name: "Blender", icon: devicon("blender/blender-original.svg"), level: 3 },
    { name: "Unity", icon: devicon("unity/unity-original.svg"), level: 42 },
    { name: "Krita", icon: <HiPencilAlt />, color: "text-purple-400", level: 5 },
    { name: "3D Print", icon: <HiCube />, color: "text-orange-500", level: 45 },
    { name: "VRChat Unity", icon: <FaVrCardboard />, color: "text-blue-400", level: 40 },
    { name: "Photography", icon: <FaCamera />, color: "text-emerald-400", level: 45 },
  ],
  other: [
    { name: "Spigot/Paper", icon: <FaServer />, color: "text-orange-600", level: 45 },
    { name: "BungeeCord", icon: <FaServer />, color: "text-yellow-600", level: 38 },
    { name: "Mojang AuthLib", icon: <FaServer />, color: "text-emerald-500", level: 30 },
    { name: "Discord.js", icon: devicon("discordjs/discordjs-original.svg"), level: 35 },
    { name: "AI/ML", icon: <FaRobot />, color: "text-purple-500", level: 16 },
    { name: "OpenAI API", icon: <FaBrain />, color: "text-teal-300", level: 20 },
    { name: "Ollama", icon: <SiOllama />, color: "text-white", level: 25 },
    { name: "LM Studio", icon: <SiLmstudio />, color: "text-emerald-400", level: 25 },
    { name: "NVIDIA CUDA", icon: <SiNvidia />, color: "text-[#76B900]", level: 10 },
    { name: "AutoDesk", icon: <HiCube />, color: "text-blue-600", level: 49 },
  ],
};

export const allSkills: Skill[] = [
  ...skillsCategories.programmingLanguages,
  ...skillsCategories.tools,
  ...skillsCategories.creative,
  ...skillsCategories.other,
];

export const getSkillsByCategory = (category: keyof SkillsCategories): Skill[] => skillsCategories[category];

export const getSkillsByMinLevel = (minLevel: number): Skill[] => allSkills.filter((skill) => skill.level >= minLevel);
