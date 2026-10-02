import type { ReactNode } from "react";
import { HiLink, HiSparkles } from "react-icons/hi";

/**
 * NOTE ABOUT THIS FILE
 *
 * These are MY OWN SITES / PLACES, not code projects and not social accounts.
 *
 * Three buckets, three homes - keep them apart or this page turns into a
 * duplicate of the other two:
 *  - Things I BUILT for others to use (repos, plugins, tools)
 *      -> public/jsons/projects-real.json, shown on /projects
 *  - Accounts where you can FOLLOW or CONTACT me (GitHub, Discord, X, ...)
 *      -> the social list in NavBar.tsx and the grid on /contact
 *  - Places of mine you can VISIT and hang around
 *      -> this file
 *
 * `order` is a RANKING value, same idea as `level` in `skills/skillsData.tsx`:
 * it expresses hierarchy (what deserves the most prominence), it is NOT a
 * quality score. Lower `order` renders first. To re-rank, change the numbers.
 *
 * Only the stable bits live here (url, host, icon, ranking). The prose is
 * translated: each entry reads `elsewhere.sites.<id>.tagline` and
 * `elsewhere.sites.<id>.blurb` from src/locales/*.json. `name` stays here
 * because it is the site's own branding, not copy to translate.
 *
 * Adding a site? Three places: this array, an `elsewhere.sites.<id>` entry in
 * ALL 12 locale files, and the ELSEWHERE_SITES mirror in
 * scripts/generate-static-seo.mjs (that script runs in Node and cannot import
 * this file).
 */
export interface ElsewhereSite {
  id: string;
  /** The site's own branding - intentionally not translated. */
  name: string;
  url: string;
  /** Hostname shown on the card, without protocol. */
  host: string;
  icon: ReactNode;
  /** Tailwind colour the icon fades to on hover, like the /contact cards. */
  hoverColor: string;
  /** Relative ranking - lower renders first. See note above. */
  order: number;
}

export const elsewhereSites: ElsewhereSite[] = [
  {
    id: "whatever",
    name: "Whatever",
    url: "https://whatever.happyuky7.com/",
    host: "whatever.happyuky7.com",
    icon: <HiSparkles className="text-4xl" />,
    hoverColor: "group-hover:text-pink-400",
    order: 10,
  },
  {
    id: "links",
    name: "All My Links",
    url: "https://happyuky7.com/links/",
    host: "happyuky7.com/links",
    icon: <HiLink className="text-4xl" />,
    hoverColor: "group-hover:text-primary",
    order: 20,
  },
];

/** Sites sorted by their ranking. Use this instead of the raw array. */
export const sortedElsewhereSites = (): ElsewhereSite[] =>
  [...elsewhereSites].sort((a, b) => a.order - b.order);
