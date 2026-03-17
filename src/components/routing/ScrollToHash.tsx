import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function getIdFromHash(hash: string): string | null {
  if (!hash) return null;
  if (!hash.startsWith("#")) return null;
  const raw = hash.slice(1);
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * Smooth-scrolls to the element matching the current location.hash.
 * Retries briefly to handle lazy-loaded routes.
 */
export default function ScrollToHash() {
  const location = useLocation();
  const navigate = useNavigate();
  const prevPathSearchRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    const pathSearch = location.pathname + location.search;
    const prevPathSearch = prevPathSearchRef.current;
    prevPathSearchRef.current = pathSearch;

    const state = location.state as unknown as { scrollTo?: string } | null;
    const stateScrollTo = typeof state?.scrollTo === "string" && state.scrollTo.trim() ? state.scrollTo.trim() : null;
    const hashId = getIdFromHash(location.hash);
    const id = stateScrollTo || hashId;
    if (!id) {
      // Default behavior: when navigating to a new page without a hash target,
      // go to top (matches classic multi-page navigation expectations).
      // IMPORTANT: do not scroll-to-top when only the location state changes
      // (e.g., we clear one-shot scroll state via replace after scrolling).
      if (prevPathSearch != null && prevPathSearch !== pathSearch) {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
      return;
    }

    let cancelled = false;
    const startedAt = Date.now();
    const maxMs = 8000;
    const useSmooth = Boolean(stateScrollTo);

    let observer: MutationObserver | null = null;
    let timeoutId: number | null = null;

    const cleanup = () => {
      cancelled = true;
      if (observer) observer.disconnect();
      observer = null;
      if (timeoutId != null) window.clearTimeout(timeoutId);
      timeoutId = null;
    };

    const tryScroll = () => {
      if (cancelled) return;
      if (Date.now() - startedAt > maxMs) {
        cleanup();
        return;
      }

      const el = document.getElementById(id);

      if (el) {
        // If we're already basically there, don't animate again.
        const rect = el.getBoundingClientRect();
        const closeEnough = Math.abs(rect.top) < 8;
        el.scrollIntoView({
          behavior: closeEnough ? "auto" : useSmooth ? "smooth" : "auto",
          block: "start",
        });

        // Clear one-shot scroll state so back/forward doesn't re-trigger it.
        if (state?.scrollTo) {
          navigate(location.pathname + location.search + location.hash, { replace: true, state: null });
        }

        cleanup();
        return;
      }
      window.requestAnimationFrame(tryScroll);
    };

    // If the target element is rendered asynchronously (e.g., fetched markdown),
    // observe DOM changes and re-try as soon as it appears.
    observer = new MutationObserver(() => {
      if (cancelled) return;
      const el = document.getElementById(id);
      if (el) {
        tryScroll();
      }
    });
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["id"],
      });
    }

    timeoutId = window.setTimeout(() => cleanup(), maxMs + 100);

    // Defer to the next frame so layout is ready.
    window.requestAnimationFrame(tryScroll);

    return () => {
      cleanup();
    };
  }, [location.pathname, location.search, location.hash, location.state, navigate]);

  return null;
}
