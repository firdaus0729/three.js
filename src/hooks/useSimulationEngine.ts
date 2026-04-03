import { useEffect, useRef } from "react";
import { useDashboardStore } from "@/store/dashboardStore";

/**
 * Drives the pseudo signal engine on an irregular ~500–1000ms schedule.
 */
export function useSimulationEngine() {
  const tick = useDashboardStore((s) => s.tick);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
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
  }, [tick]);
}
