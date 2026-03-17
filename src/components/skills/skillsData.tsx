import type { ReactNode } from "react";
import { FaRobot, FaServer, FaVrCardboard } from "react-icons/fa";
import { HiCube, HiPencilAlt } from "react-icons/hi";

export interface Skill {
  name: string;
  icon: string | ReactNode;
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
    { name: "Java", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg", level: 40 },
    { name: "JavaScript", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg", level: 30 },
    { name: "Python", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg", level: 35 },
    { name: "HTML", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg", level: 80 },
    { name: "CSS", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg", level: 50 },
    { name: "TypeScript", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg", level: 15 },
    { name: "C++", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg", level: 5 },
    { name: "C#", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg", level: 5 },
    { name: "Julia", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/julia/julia-original.svg", level: 35 },
  ],
  tools: [
    { name: "Node.js", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg", level: 55 },
    { name: "MongoDB", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg", level: 15 },
    { name: "Redis", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg", level: 10 },
    { name: "Git", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg", level: 40 },
    { name: "NPM", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/npm/npm-original-wordmark.svg", level: 55 },
    { name: "Nginx", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nginx/nginx-original.svg", level: 65 },
    { name: "Docker", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg", level: 10 },
    { name: "Linux", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg", level: 12 },
    { name: "Arduino", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/arduino/arduino-original.svg", level: 25 },
  ],
  creative: [
    { name: "Blender", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/blender/blender-original.svg", level: 3 },
    { name: "Unity", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/unity/unity-original.svg", level: 42 },
    { name: "Krita", icon: <HiPencilAlt />, color: "text-purple-400", level: 5 },
    { name: "3D Print", icon: <HiCube />, color: "text-orange-500", level: 45 },
    { name: "VRChat Unity", icon: <FaVrCardboard />, color: "text-blue-400", level: 40 },
  ],
  other: [
    { name: "Spigot/Paper", icon: <FaServer />, color: "text-orange-600", level: 45 },
    { name: "BungeeCord", icon: <FaServer />, color: "text-yellow-600", level: 38 },
    { name: "AI/ML", icon: <FaRobot />, color: "text-purple-500", level: 16 },
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
