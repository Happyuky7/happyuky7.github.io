import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type BackgroundMode = "animated" | "static";

const STORAGE_KEY = "ui.background.mode";

type BackgroundContextValue = {
  mode: BackgroundMode;
  setMode: (mode: BackgroundMode) => void;
  toggleMode: () => void;
};

const BackgroundContext = createContext<BackgroundContextValue | null>(null);

function readInitialMode(): BackgroundMode {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === "static" || raw === "animated" ? raw : "animated";
}

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<BackgroundMode>(() => readInitialMode());

  const setMode = useCallback((next: BackgroundMode) => {
    setModeState(next);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((m) => (m === "static" ? "animated" : "static"));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const value = useMemo<BackgroundContextValue>(() => ({ mode, setMode, toggleMode }), [mode, setMode, toggleMode]);

  return <BackgroundContext.Provider value={value}>{children}</BackgroundContext.Provider>;
}

export function useBackground() {
  const ctx = useContext(BackgroundContext);
  if (!ctx) throw new Error("useBackground must be used within BackgroundProvider");
  return ctx;
}
