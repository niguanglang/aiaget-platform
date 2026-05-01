'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group, Points } from 'three';

function KnowledgeParticleField() {
  const ref = useRef<Points>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(170 * 3);

    for (let index = 0; index < 170; index += 1) {
      const stride = index * 3;
      values[stride] = (Math.random() - 0.5) * 11;
      values[stride + 1] = (Math.random() - 0.5) * 4.8;
      values[stride + 2] = (Math.random() - 0.5) * 4.8;
    }

    return values;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;

    ref.current.rotation.y = state.clock.elapsedTime * 0.018;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.16) * 0.035;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
      </bufferGeometry>
      <pointsMaterial color="#475569" opacity={0.25} size={0.016} sizeAttenuation transparent />
    </points>
  );
}

function RetrievalWireframe() {
  const ref = useRef<Group>(null);

  useFrame((state) => {
    if (!ref.current) return;

    ref.current.rotation.y = state.clock.elapsedTime * 0.035;
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.18) * 0.06;
  });

  return (
    <group ref={ref} position={[3.1, 0.2, -1.7]}>
      <mesh rotation={[0.2, 0.8, 0.1]}>
        <boxGeometry args={[1.15, 1.15, 1.15, 3, 3, 3]} />
        <meshBasicMaterial color="#0f766e" opacity={0.08} transparent wireframe />
      </mesh>
      <mesh rotation={[0.7, 0.2, 0.45]}>
        <torusGeometry args={[1.05, 0.005, 8, 96]} />
        <meshBasicMaterial color="#334155" opacity={0.14} transparent />
      </mesh>
    </group>
  );
}

export function KnowledgeCenterBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(13,148,136,0.09),transparent_28%),radial-gradient(circle_at_86%_16%,rgba(51,65,85,0.08),transparent_30%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,0.99))]" />
      <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="absolute inset-0 opacity-[0.035] [background-image:radial-gradient(#0f172a_0.65px,transparent_0.65px)] [background-size:14px_14px]" />
      <Canvas
        camera={{ position: [0, 0, 5], fov: 52 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      >
        <KnowledgeParticleField />
        <RetrievalWireframe />
      </Canvas>
    </div>
  );
}
