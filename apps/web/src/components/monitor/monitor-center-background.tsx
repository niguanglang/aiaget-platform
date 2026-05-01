'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { LineSegments } from 'three';

function TraceWireframe() {
  const ref = useRef<LineSegments>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(88 * 6);

    for (let index = 0; index < 88; index += 1) {
      const base = index * 6;
      const x = (Math.random() - 0.5) * 10;
      const y = (Math.random() - 0.5) * 4;
      const z = (Math.random() - 0.5) * 3;
      values[base] = x;
      values[base + 1] = y;
      values[base + 2] = z;
      values[base + 3] = x + (Math.random() - 0.5) * 1.6;
      values[base + 4] = y + (Math.random() - 0.5) * 0.8;
      values[base + 5] = z + (Math.random() - 0.5) * 0.8;
    }

    return values;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.16) * 0.02;
  });

  return (
    <lineSegments ref={ref}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
      </bufferGeometry>
      <lineBasicMaterial color="#475569" opacity={0.12} transparent />
    </lineSegments>
  );
}

export function MonitorCenterBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(14,116,144,0.08),transparent_30%),radial-gradient(circle_at_86%_16%,rgba(37,99,235,0.08),transparent_28%),linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.99))]" />
      <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] [background-size:34px_34px]" />
      <Canvas camera={{ position: [0, 0, 5], fov: 55 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <TraceWireframe />
      </Canvas>
    </div>
  );
}
