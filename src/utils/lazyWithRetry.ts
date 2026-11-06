import { lazy } from "react";
import type { ComponentType } from "react";

/**
 * Why this exists: every route in App.tsx is code-split, so the running
 * document references chunk files by content hash. When a new version is
 * deployed the old hashes stop existing on the server, and any tab still
 * holding the previous index.html gets a 404 for the chunk it asks for.
 *
 * React treats that rejected import as a render error. With no error boundary
 * above it the whole root unmounts and the page goes black (body is #0a0a0a),
 * which is exactly the "it suddenly turns black after deploying" symptom.
 *
 * So: retry once (covers a blip), then reload the document once to pick up the
 * new index.html with the new hashes. The sessionStorage stamp keeps a genuinely
 * broken network - offline, DNS, an asset that really is gone - from turning
 * into an endless reload loop; after the guard trips we rethrow and let
 * RootErrorBoundary show something the user can act on.
 */

const RELOAD_STAMP = "chunkReload.lastAttempt.v1";
const RELOAD_COOLDOWN_MS = 15_000;

function recentlyReloaded(): boolean {
  try {
    const raw = sessionStorage.getItem(RELOAD_STAMP);
    if (!raw) return false;
    const last = Number(raw);
    if (!Number.isFinite(last)) return false;
    return Date.now() - last < RELOAD_COOLDOWN_MS;
  } catch {
    // Private mode / blocked storage: assume we have not reloaded, but the
    // single retry below still limits how often we can get here.
    return false;
  }
}

function markReload(): void {
  try {
    sessionStorage.setItem(RELOAD_STAMP, String(Date.now()));
  } catch {
    /* storage unavailable - the retry above is the only guard left */
  }
}

// Mirrors React's own lazy() signature: props are the component's business,
// not this wrapper's, and ComponentType<unknown> rejects plain FC<{}> pages.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (firstError) {
      // One quiet retry: a dropped request on a flaky connection succeeds here.
      try {
        return await factory();
      } catch (secondError) {
        if (!recentlyReloaded()) {
          markReload();
          window.location.reload();

          // Keep the promise pending so React renders the Suspense fallback
          // instead of flashing an error for the moment before the reload.
          return await new Promise<{ default: T }>(() => {});
        }

        throw secondError ?? firstError;
      }
    }
  });
}

/**
 * Vite fires this when a module preload fails, which happens for the same
 * stale-deploy reason but before React ever tries to render the route.
 * Preventing the default stops Vite from rethrowing, and the same guarded
 * reload gets the tab onto the current build.
 */
export function installPreloadErrorHandler(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("vite:preloadError", (event) => {
    if (recentlyReloaded()) return;
    event.preventDefault();
    markReload();
    window.location.reload();
  });
}
