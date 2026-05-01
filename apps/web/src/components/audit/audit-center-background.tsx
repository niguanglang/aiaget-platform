'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Points } from 'three';

function AuditField() {
  const ref = useRef<Points>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(140 * 3);

    for (let index = 0; index < 140; index += 1) {
      const stride = index * 3;
      values[stride] = (Math.random() - 0.5) * 10;
      values[stride + 1] = (Math.random() - 0.5) * 4;
      values[stride + 2] = (Math.random() - 0.5) * 3;
    }

    return values;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.018;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.18) * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
      </bufferGeometry>
      <pointsMaterial color="#475569" opacity={0.22} size={0.018} sizeAttenuation transparent />
    </points>
  );
}

export function AuditCenterBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(37,99,235,0.06),transparent_30%),radial-gradient(circle_at_86%_18%,rgba(15,118,110,0.06),transparent_28%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,0.99))]" />
      <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] [background-size:34px_34px]" />
      <Canvas camera={{ position: [0, 0, 5], fov: 55 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <AuditField />
      </Canvas>
    </div>
  );
}
