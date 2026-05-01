'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { LineSegments, Points } from 'three';

function PermissionLattice() {
  const ref = useRef<LineSegments>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(68 * 6);

    for (let index = 0; index < 68; index += 1) {
      const base = index * 6;
      const seed = Math.sin(index * 21.19) * 10000;
      const seedB = Math.sin(index * 31.71) * 10000;
      const x = (seed - Math.floor(seed) - 0.5) * 9.2;
      const y = (seedB - Math.floor(seedB) - 0.5) * 3.6;
      const z = (Math.sin(index * 13.3) - 0.5) * 2.6;

      values[base] = x;
      values[base + 1] = y;
      values[base + 2] = z;
      values[base + 3] = x + Math.sin(index) * 0.72;
      values[base + 4] = y + Math.cos(index * 0.7) * 0.44;
      values[base + 5] = z + Math.sin(index * 0.5) * 0.44;
    }

    return values;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.015;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.12) * 0.026;
  });

  return (
    <lineSegments ref={ref}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
      </bufferGeometry>
      <lineBasicMaterial color="#1d4ed8" opacity={0.12} transparent />
    </lineSegments>
  );
}

function PermissionPoints() {
  const ref = useRef<Points>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(118 * 3);

    for (let index = 0; index < 118; index += 1) {
      const base = index * 3;
      const seed = Math.sin(index * 17.37) * 10000;
      const seedB = Math.sin(index * 9.91) * 10000;
      const seedC = Math.sin(index * 4.33) * 10000;

      values[base] = (seed - Math.floor(seed) - 0.5) * 9.4;
      values[base + 1] = (seedB - Math.floor(seedB) - 0.5) * 3.8;
      values[base + 2] = (seedC - Math.floor(seedC) - 0.5) * 2.8;
    }

    return values;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.012;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
      </bufferGeometry>
      <pointsMaterial color="#0f766e" opacity={0.19} size={0.018} sizeAttenuation transparent />
    </points>
  );
}

export function RoleCenterBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_10%,rgba(15,118,110,0.08),transparent_30%),radial-gradient(circle_at_84%_12%,rgba(37,99,235,0.08),transparent_28%),linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.99))]" />
      <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] [background-size:34px_34px]" />
      <Canvas camera={{ position: [0, 0, 5], fov: 52 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <PermissionPoints />
        <PermissionLattice />
      </Canvas>
    </div>
  );
}
