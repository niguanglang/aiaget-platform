'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Points } from 'three';

export function DataScopeBackground() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[340px] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(20,184,166,0.14),transparent_28%),radial-gradient(circle_at_78%_4%,rgba(59,130,246,0.12),transparent_28%),linear-gradient(180deg,rgba(248,250,252,0.9),rgba(248,250,252,0))]" />
      <Canvas camera={{ position: [0, 0, 5], fov: 48 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.72} />
        <DataNodes />
      </Canvas>
    </div>
  );
}

function DataNodes() {
  const pointsRef = useRef<Points>(null);
  const positions = useMemo(
    () =>
      new Float32Array(
        Array.from({ length: 120 * 3 }, (_, index) => {
          const axis = index % 3;
          const seed = Math.sin(index * 23.61) * 10000;
          const value = seed - Math.floor(seed);

          if (axis === 0) return (value - 0.5) * 7.4;
          if (axis === 1) return (value - 0.5) * 3.1;
          return (value - 0.5) * 2.2;
        }),
      ),
    [],
  );

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.03;
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.16) * 0.025;
  });

  return (
    <points ref={pointsRef} position={[1.7, 0.18, 0]}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
      </bufferGeometry>
      <pointsMaterial color="#0f766e" opacity={0.24} size={0.032} transparent />
    </points>
  );
}
