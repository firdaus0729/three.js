import { useEffect, useRef, useState } from "react";

const EASE = 0.14;

/**
 * Smoothly eases displayed value toward target for gauge / UI animations.
 */
export function useAnimatedGaugeValue(target: number): number {
  const [display, setDisplay] = useState(target);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const step = () => {
      setDisplay((prev) => {
        const d = target - prev;
        if (Math.abs(d) < 0.05) return target;
        return prev + d * EASE;
      });
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, [target]);

  return display;
}
