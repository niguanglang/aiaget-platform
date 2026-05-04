'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group, LineSegments, Points } from 'three';

function PluginParticleField() {
  const ref = useRef<Points>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(190 * 3);

    for (let index = 0; index < 190; index += 1) {
      const stride = index * 3;
      values[stride] = (Math.random() - 0.5) * 12;
      values[stride + 1] = (Math.random() - 0.5) * 4.8;
      values[stride + 2] = (Math.random() - 0.5) * 4.4;
    }

    return values;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;

    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.18) * 0.035;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
      </bufferGeometry>
      <pointsMaterial color="#475569" opacity={0.24} size={0.017} sizeAttenuation transparent />
    </points>
  );
}

function PluginLattice() {
  const ref = useRef<LineSegments>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(80 * 6);

    for (let index = 0; index < 80; index += 1) {
      const base = index * 6;
      const x = (Math.random() - 0.5) * 8;
      const y = (Math.random() - 0.5) * 3.8;
      const z = (Math.random() - 0.5) * 3;
      values[base] = x;
      values[base + 1] = y;
      values[base + 2] = z;
      values[base + 3] = x + (Math.random() - 0.5) * 1.1;
      values[base + 4] = y + (Math.random() - 0.5) * 1.1;
      values[base + 5] = z + (Math.random() - 0.5) * 0.8;
    }

    return values;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;

    ref.current.rotation.y = state.clock.elapsedTime * 0.026;
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.14) * 0.025;
  });

  return (
    <lineSegments ref={ref} position={[2.8, 0.15, -1.2]}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
      </bufferGeometry>
      <lineBasicMaterial color="#334155" opacity={0.12} transparent />
    </lineSegments>
  );
}

function PluginCore() {
  const ref = useRef<Group>(null);

  useFrame((state) => {
    if (!ref.current) return;

    ref.current.rotation.y = state.clock.elapsedTime * 0.04;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
  });

  return (
    <group ref={ref} position={[3.15, 0.2, -1.5]}>
      <mesh rotation={[0.2, 0.7, 0.1]}>
        <boxGeometry args={[1.15, 1.15, 1.15, 3, 3, 3]} />
        <meshBasicMaterial color="#2563eb" opacity={0.065} transparent wireframe />
      </mesh>
      <mesh rotation={[0.9, 0.25, 0.55]}>
        <torusGeometry args={[1.02, 0.006, 8, 96]} />
        <meshBasicMaterial color="#0f766e" opacity={0.16} transparent />
      </mesh>
    </group>
  );
}

export function PluginCenterBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_13%_12%,rgba(37,99,235,0.09),transparent_29%),radial-gradient(circle_at_86%_16%,rgba(13,148,136,0.08),transparent_30%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,0.99))]" />
      <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="absolute inset-0 opacity-[0.035] [background-image:radial-gradient(#0f172a_0.65px,transparent_0.65px)] [background-size:14px_14px]" />
      <Canvas camera={{ position: [0, 0, 5], fov: 53 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <PluginParticleField />
        <PluginLattice />
        <PluginCore />
      </Canvas>
    </div>
  );
}
