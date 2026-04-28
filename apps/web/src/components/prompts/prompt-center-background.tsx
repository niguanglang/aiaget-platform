'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group, Points } from 'three';

function PromptParticleField() {
  const ref = useRef<Points>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(140 * 3);

    for (let index = 0; index < 140; index += 1) {
      const stride = index * 3;
      values[stride] = (Math.random() - 0.5) * 10;
      values[stride + 1] = (Math.random() - 0.5) * 4.5;
      values[stride + 2] = (Math.random() - 0.5) * 4.5;
    }

    return values;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;

    ref.current.rotation.y = state.clock.elapsedTime * 0.018;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.18) * 0.035;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
      </bufferGeometry>
      <pointsMaterial color="#475569" opacity={0.28} size={0.016} sizeAttenuation transparent />
    </points>
  );
}

function FloatingGeometry() {
  const ref = useRef<Group>(null);

  useFrame((state) => {
    if (!ref.current) return;

    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.22) * 0.12;
    ref.current.rotation.y = state.clock.elapsedTime * 0.05;
  });

  return (
    <group ref={ref} position={[2.8, 0.3, -1.4]}>
      <mesh>
        <icosahedronGeometry args={[0.75, 1]} />
        <meshBasicMaterial color="#334155" opacity={0.08} transparent wireframe />
      </mesh>
      <mesh rotation={[0.4, 0.8, 0.2]}>
        <torusGeometry args={[1.15, 0.006, 8, 96]} />
        <meshBasicMaterial color="#0f766e" opacity={0.16} transparent />
      </mesh>
    </group>
  );
}

export function PromptCenterBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(14,116,144,0.10),transparent_28%),radial-gradient(circle_at_88%_16%,rgba(71,85,105,0.08),transparent_30%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,0.99))]" />
      <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] [background-size:34px_34px]" />
      <Canvas
        camera={{ position: [0, 0, 5], fov: 52 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      >
        <PromptParticleField />
        <FloatingGeometry />
      </Canvas>
    </div>
  );
}
