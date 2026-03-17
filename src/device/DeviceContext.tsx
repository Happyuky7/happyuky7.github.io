import React, { createContext, useContext, useMemo } from "react";

import { useIsMobile, usePrefersReducedMotion } from "@/hooks/useMediaQuery";

export type DeviceInfo = {
  isMobile: boolean;
  isDesktop: boolean;
  prefersReducedMotion: boolean;
};

const DeviceContext = createContext<DeviceInfo | null>(null);

export function useDevice(): DeviceInfo {
  const ctx = useContext(DeviceContext);
  if (!ctx) throw new Error("useDevice must be used within a DeviceProvider");
  return ctx;
}

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();

  const value = useMemo<DeviceInfo>(() => {
    return {
      isMobile,
      isDesktop: !isMobile,
      prefersReducedMotion,
    };
  }, [isMobile, prefersReducedMotion]);

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}
