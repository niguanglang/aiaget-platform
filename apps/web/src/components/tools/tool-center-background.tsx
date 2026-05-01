'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { LineSegments } from 'three';

function SignalMesh() {
  const ref = useRef<LineSegments>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(72 * 6);

    for (let index = 0; index < 72; index += 1) {
      const base = index * 6;
      const x = (Math.random() - 0.5) * 9;
      const y = (Math.random() - 0.5) * 4;
      const z = (Math.random() - 0.5) * 3;
      values[base] = x;
      values[base + 1] = y;
      values[base + 2] = z;
      values[base + 3] = x + (Math.random() - 0.5) * 1.2;
      values[base + 4] = y + (Math.random() - 0.5) * 1.2;
      values[base + 5] = z + (Math.random() - 0.5) * 0.9;
    }

    return values;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;

    ref.current.rotation.y = state.clock.elapsedTime * 0.03;
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.15) * 0.03;
  });

  return (
    <lineSegments ref={ref}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
      </bufferGeometry>
      <lineBasicMaterial color="#64748b" opacity={0.14} transparent />
    </lineSegments>
  );
}

export function ToolCenterBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(15,118,110,0.09),transparent_30%),radial-gradient(circle_at_84%_18%,rgba(37,99,235,0.08),transparent_28%),linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.99))]" />
      <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="absolute inset-0 opacity-[0.035] [background-image:radial-gradient(#0f172a_0.7px,transparent_0.7px)] [background-size:14px_14px]" />
      <Canvas camera={{ position: [0, 0, 5], fov: 55 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <SignalMesh />
      </Canvas>
    </div>
  );
}
