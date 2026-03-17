import { useEffect, useMemo, useState } from "react";

export function useMediaQuery(query: string, defaultValue = false): boolean {
  const getMatch = useMemo(() => {
    return () => {
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return defaultValue;
      }
      return window.matchMedia(query).matches;
    };
  }, [defaultValue, query]);

  const [matches, setMatches] = useState<boolean>(getMatch);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

    const mql = window.matchMedia(query);

    const onChange = () => {
      setMatches(mql.matches);
    };

    // Sync once in case query changed
    onChange();

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }

    // Safari legacy fallback
    // eslint-disable-next-line deprecation/deprecation
    mql.addListener(onChange);
    // eslint-disable-next-line deprecation/deprecation
    return () => mql.removeListener(onChange);
  }, [query]);

  return matches;
}

// Tailwind defaults: md >= 768px
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
