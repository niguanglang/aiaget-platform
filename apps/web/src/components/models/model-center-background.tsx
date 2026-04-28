'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Points } from 'three';

function ParticleField() {
  const ref = useRef<Points>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(180 * 3);

    for (let index = 0; index < 180; index += 1) {
      const stride = index * 3;
      values[stride] = (Math.random() - 0.5) * 12;
      values[stride + 1] = (Math.random() - 0.5) * 5;
      values[stride + 2] = (Math.random() - 0.5) * 5;
    }

    return values;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;

    ref.current.rotation.y = state.clock.elapsedTime * 0.025;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.04;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
      </bufferGeometry>
      <pointsMaterial color="#64748b" opacity={0.34} size={0.018} sizeAttenuation transparent />
    </points>
  );
}

export function ModelCenterBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(59,130,246,0.10),transparent_30%),radial-gradient(circle_at_88%_18%,rgba(20,184,166,0.10),transparent_28%),linear-gradient(180deg,rgba(248,250,252,0.9),rgba(255,255,255,0.98))]" />
      <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] [background-size:32px_32px]" />
      <Canvas
        camera={{ position: [0, 0, 5], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      >
        <ParticleField />
      </Canvas>
    </div>
  );
}
