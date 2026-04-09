"use client";

import { useEffect, useRef } from "react";
import { useDashboardStore } from "@/store/dashboardStore";

/**
 * Drives pseudo signal mode on an irregular ~500–1000ms schedule.
 */
export function useSimulationEngine(enabled: boolean) {
  const tick = useDashboardStore((s) => s.tickSimulation);
  const startSimulation = useDashboardStore((s) => s.startSimulation);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    startSimulation();
    const schedule = () => {
      const delay = 500 + Math.random() * 500;
      timeoutRef.current = setTimeout(() => {
        tick();
        schedule();
      }, delay);
    };
    tick();
    schedule();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [enabled, startSimulation, tick]);
}

