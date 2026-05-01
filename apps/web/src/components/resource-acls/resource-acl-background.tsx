'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Points } from 'three';

export function ResourceAclBackground() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[360px] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_16%,rgba(59,130,246,0.12),transparent_30%),radial-gradient(circle_at_82%_6%,rgba(20,184,166,0.12),transparent_28%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(248,250,252,0))]" />
      <Canvas camera={{ position: [0, 0, 5], fov: 46 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.7} />
        <AccessField />
      </Canvas>
    </div>
  );
}

function AccessField() {
  const pointsRef = useRef<Points>(null);
  const positions = useMemo(
    () =>
      new Float32Array(
        Array.from({ length: 140 * 3 }, (_, index) => {
          const axis = index % 3;
          const seed = Math.sin(index * 19.37) * 10000;
          const value = seed - Math.floor(seed);

          if (axis === 0) return (value - 0.5) * 8.2;
          if (axis === 1) return (value - 0.5) * 3.2;
          return (value - 0.5) * 2.6;
        }),
      ),
    [],
  );

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.026;
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.18) * 0.02;
  });

  return (
    <points ref={pointsRef} position={[1.55, 0.14, 0]}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
      </bufferGeometry>
      <pointsMaterial color="#1d4ed8" opacity={0.22} size={0.03} transparent />
    </points>
  );
}
