"use client";

import { useId } from "react";
import { useAnimatedGaugeValue } from "@/hooks/useAnimatedGaugeValue";
import { gaugeColor } from "@/lib/colors";

const SIZE = 200;
const STROKE = 14;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

interface CircularGaugeProps {
  label: string;
  value: number;
  className?: string;
}

export function CircularGauge({ label, value, className = "" }: CircularGaugeProps) {
  const filterId = useId().replace(/:/g, "");
  const display = useAnimatedGaugeValue(value);
  const pct = Math.min(1, Math.max(0, display / 100));
  const offset = C * (1 - pct);
  const colors = gaugeColor(display);

  return (
    <div
      className={`relative flex flex-col items-center rounded-2xl border border-white/[0.08] bg-[#12181f]/90 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.55)] ${className}`}
    >
      <p className="mb-3 text-center text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90 transform"
          aria-hidden
        >
          <defs>
            <filter id={`glow-${filterId}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={STROKE}
          />
          {/* Segment ticks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const a = (tick / 100) * 2 * Math.PI - Math.PI / 2;
            const x1 = SIZE / 2 + (R - STROKE / 2 - 4) * Math.cos(a);
            const y1 = SIZE / 2 + (R - STROKE / 2 - 4) * Math.sin(a);
            const x2 = SIZE / 2 + (R + 6) * Math.cos(a);
            const y2 = SIZE / 2 + (R + 6) * Math.sin(a);
            return (
              <line
                key={tick}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(148,163,184,0.35)"
                strokeWidth={1.5}
                className="pointer-events-none"
              />
            );
          })}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            filter={`url(#glow-${filterId})`}
            style={{
              transition: "stroke 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-mono text-4xl font-semibold tabular-nums tracking-tight"
            style={{
              color: colors.stroke,
              textShadow: `0 0 24px ${colors.glow}`,
              transition: "color 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {Math.round(display)}
          </span>
          <span className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">
            {colors.label}
          </span>
        </div>
      </div>
    </div>
  );
}
