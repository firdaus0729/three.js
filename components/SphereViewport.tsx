"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { BioSceneContent } from "@/components/BioSphere";

function Fallback() {
  return (
    <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl border border-white/[0.08] bg-[#0d1218]">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
        <span className="text-xs tracking-wide">Initializing 3D view…</span>
      </div>
    </div>
  );
}

export function SphereViewport() {
  return (
    <div className="relative h-full min-h-[300px] w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0f1620] to-[#080b10] shadow-[0_16px_64px_rgba(0,0,0,0.5)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(34,211,238,0.08),transparent_55%)]" />
      <Suspense fallback={<Fallback />}>
        <Canvas
          camera={{ position: [0, 0, 4.2], fov: 42 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          className="h-full w-full"
        >
          <BioSceneContent />
        </Canvas>
      </Suspense>
      <div className="pointer-events-none absolute bottom-4 left-4 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-400 backdrop-blur-md">
        Live signal mesh
      </div>
    </div>
  );
}
