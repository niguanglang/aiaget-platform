'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group, LineSegments, Points } from 'three';

function ChannelParticleField() {
  const ref = useRef<Points>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(170 * 3);

    for (let index = 0; index < 170; index += 1) {
      const stride = index * 3;
      values[stride] = (Math.random() - 0.5) * 11;
      values[stride + 1] = (Math.random() - 0.5) * 4.4;
      values[stride + 2] = (Math.random() - 0.5) * 4.2;
    }

    return values;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;

    ref.current.rotation.y = state.clock.elapsedTime * 0.018;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.028;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
      </bufferGeometry>
      <pointsMaterial color="#334155" opacity={0.22} size={0.016} sizeAttenuation transparent />
    </points>
  );
}

function ChannelRouteLines() {
  const ref = useRef<LineSegments>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(78 * 6);

    for (let index = 0; index < 78; index += 1) {
      const base = index * 6;
      const x = (Math.random() - 0.5) * 8.8;
      const y = (Math.random() - 0.5) * 3.6;
      const z = (Math.random() - 0.5) * 3;
      values[base] = x;
      values[base + 1] = y;
      values[base + 2] = z;
      values[base + 3] = x + (Math.random() - 0.5) * 1.45;
      values[base + 4] = y + (Math.random() - 0.5) * 0.7;
      values[base + 5] = z + (Math.random() - 0.5) * 0.7;
    }

    return values;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;

    ref.current.rotation.y = state.clock.elapsedTime * 0.024;
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.12) * 0.018;
  });

  return (
    <lineSegments ref={ref} position={[2.2, 0.05, -1.2]}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
      </bufferGeometry>
      <lineBasicMaterial color="#0f766e" opacity={0.13} transparent />
    </lineSegments>
  );
}

function ChannelCore() {
  const ref = useRef<Group>(null);

  useFrame((state) => {
    if (!ref.current) return;

    ref.current.rotation.y = state.clock.elapsedTime * 0.035;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.18) * 0.045;
  });

  return (
    <group ref={ref} position={[3, 0.18, -1.6]}>
      <mesh rotation={[0.35, 0.55, 0.1]}>
        <icosahedronGeometry args={[0.72, 1]} />
        <meshBasicMaterial color="#2563eb" opacity={0.08} transparent wireframe />
      </mesh>
      <mesh rotation={[0.8, 0.2, 0.5]}>
        <torusGeometry args={[0.95, 0.006, 8, 96]} />
        <meshBasicMaterial color="#0891b2" opacity={0.14} transparent />
      </mesh>
    </group>
  );
}

export function ChannelCenterBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(37,99,235,0.08),transparent_29%),radial-gradient(circle_at_84%_14%,rgba(20,184,166,0.07),transparent_28%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,0.99))]" />
      <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="absolute inset-0 opacity-[0.035] [background-image:radial-gradient(#0f172a_0.65px,transparent_0.65px)] [background-size:14px_14px]" />
      <Canvas camera={{ position: [0, 0, 5], fov: 54 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <ChannelParticleField />
        <ChannelRouteLines />
        <ChannelCore />
      </Canvas>
    </div>
  );
}
