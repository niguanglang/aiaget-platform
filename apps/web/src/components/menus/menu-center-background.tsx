'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Points } from 'three';

export function MenuCenterBackground() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[320px] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(14,165,233,0.14),transparent_28%),radial-gradient(circle_at_74%_8%,rgba(99,102,241,0.12),transparent_30%),linear-gradient(180deg,rgba(248,250,252,0.88),rgba(248,250,252,0))]" />
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.7} />
        <ParticleField />
      </Canvas>
    </div>
  );
}

function ParticleField() {
  const pointsRef = useRef<Points>(null);
  const positions = useMemo(
    () =>
      new Float32Array(
        Array.from({ length: 96 * 3 }, (_, index) => {
          const axis = index % 3;
          const seed = Math.sin(index * 17.17) * 10000;
          const value = seed - Math.floor(seed);

          if (axis === 0) return (value - 0.5) * 7.2;
          if (axis === 1) return (value - 0.5) * 3.2;
          return (value - 0.5) * 2.4;
        }),
      ),
    [],
  );

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.035;
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.18) * 0.035;
  });

  return (
    <points ref={pointsRef} position={[1.8, 0.2, 0]}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
      </bufferGeometry>
      <pointsMaterial color="#2563eb" opacity={0.26} size={0.035} transparent />
    </points>
  );
}
