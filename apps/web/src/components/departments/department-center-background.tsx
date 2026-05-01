'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { LineSegments, Points } from 'three';

function OrganizationLines() {
  const ref = useRef<LineSegments>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(76 * 6);

    for (let index = 0; index < 76; index += 1) {
      const base = index * 6;
      const x = (Math.random() - 0.5) * 10;
      const y = (Math.random() - 0.5) * 4;
      const z = (Math.random() - 0.5) * 3;
      values[base] = x;
      values[base + 1] = y;
      values[base + 2] = z;
      values[base + 3] = x + (Math.random() - 0.5) * 1.2;
      values[base + 4] = y + (Math.random() - 0.5) * 0.8;
      values[base + 5] = z + (Math.random() - 0.5) * 0.8;
    }

    return values;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.018;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.14) * 0.025;
  });

  return (
    <lineSegments ref={ref}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
      </bufferGeometry>
      <lineBasicMaterial color="#0f766e" opacity={0.13} transparent />
    </lineSegments>
  );
}

function OrganizationPoints() {
  const ref = useRef<Points>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(120 * 3);

    for (let index = 0; index < 120; index += 1) {
      const base = index * 3;
      values[base] = (Math.random() - 0.5) * 10;
      values[base + 1] = (Math.random() - 0.5) * 4;
      values[base + 2] = (Math.random() - 0.5) * 3;
    }

    return values;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.014;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
      </bufferGeometry>
      <pointsMaterial color="#2563eb" opacity={0.18} size={0.018} sizeAttenuation transparent />
    </points>
  );
}

export function DepartmentCenterBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_13%_11%,rgba(13,148,136,0.09),transparent_28%),radial-gradient(circle_at_86%_14%,rgba(37,99,235,0.08),transparent_30%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,0.99))]" />
      <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] [background-size:34px_34px]" />
      <Canvas camera={{ position: [0, 0, 5], fov: 54 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <OrganizationPoints />
        <OrganizationLines />
      </Canvas>
    </div>
  );
}
