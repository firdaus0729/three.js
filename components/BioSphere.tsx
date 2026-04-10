"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshDistortMaterial } from "@react-three/drei";
import type { Mesh } from "three";
import { useDashboardStore } from "@/store/dashboardStore";
import { combinedStressRgb } from "@/lib/colors";

export function BioSphere() {
  const meshRef = useRef<Mesh>(null);
  const intensity = useDashboardStore((s) => s.intensity);
  const effort = useDashboardStore((s) => s.effort);
  const eventType = useDashboardStore((s) => s.eventType);

  const color = useMemo(
    () => combinedStressRgb(intensity, effort),
    [intensity, effort]
  );

  useFrame((state, delta) => {
    const m = meshRef.current;
    if (!m) return;
    const live = useDashboardStore.getState();
    const i = live.intensity;
    const e = live.effort;
    m.rotation.y += delta * 0.35;
    m.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.12;
    const pulse =
      1 +
      (i / 100) * 0.16 +
      (e / 100) * 0.08 +
      Math.sin(state.clock.elapsedTime * 2.8) * 0.055;
    m.scale.setScalar(pulse);
  });

  const alertBoost =
    eventType === "apnea"
      ? 0.26
      : eventType === "hypopnea"
        ? 0.2
        : eventType === "loud_snore"
        ? 0.14
        : eventType === "moderate_snore"
          ? 0.08
          : 0;

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.15, 64, 64]} />
      <MeshDistortMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.35 + intensity / 170 + alertBoost}
        roughness={0.2}
        metalness={0.62}
        distort={0.08 + effort / 120 + alertBoost * 0.9}
        speed={1.4 + intensity / 45 + alertBoost * 3}
      />
    </mesh>
  );
}

export function BioSceneContent() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 8, 4]} intensity={1.1} />
      <directionalLight position={[-4, 2, -6]} intensity={0.4} color="#7dd3fc" />
      <hemisphereLight args={["#87ceeb", "#1a1a24", 0.55]} />
      <BioSphere />
    </>
  );
}
