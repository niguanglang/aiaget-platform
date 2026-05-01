'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Points } from 'three';

const noiseTexture =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.72'/%3E%3C/svg%3E\")";

function LoginParticleField() {
  const ref = useRef<Points>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(140 * 3);

    for (let index = 0; index < 140; index += 1) {
      const stride = index * 3;
      values[stride] = (Math.random() - 0.5) * 13;
      values[stride + 1] = (Math.random() - 0.5) * 6;
      values[stride + 2] = (Math.random() - 0.5) * 5;
    }

    return values;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;

    ref.current.rotation.y = state.clock.elapsedTime * 0.016;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.12) * 0.035;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
      </bufferGeometry>
      <pointsMaterial color="#7aa2ff" opacity={0.28} size={0.03} sizeAttenuation transparent />
    </points>
  );
}

export function LoginPageBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.97]"
        style={{ backgroundImage: "url('/images/login/hero-background.png')" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_16%,rgba(255,255,255,0.96),rgba(255,255,255,0.42)_34%,transparent_58%),radial-gradient(circle_at_87%_16%,rgba(158,188,255,0.34),rgba(158,188,255,0.14)_30%,transparent_58%),linear-gradient(90deg,rgba(255,255,255,0)_56%,rgba(206,221,255,0.10)_72%,rgba(183,205,255,0.20)_100%),linear-gradient(180deg,rgba(255,255,255,0.12),rgba(241,246,255,0.28))]" />
      <div className="absolute inset-y-[6%] right-[3.2%] w-[34%] rounded-[42px] bg-[radial-gradient(circle_at_62%_18%,rgba(184,205,255,0.26),transparent_32%),linear-gradient(180deg,rgba(223,233,255,0.12),rgba(196,214,255,0.08))] blur-2xl" />
      <div
        className="absolute inset-0 mix-blend-soft-light opacity-[0.05]"
        style={{ backgroundImage: noiseTexture, backgroundSize: '180px 180px' }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.06),transparent_30%)]" />
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={1.2} />
        <directionalLight intensity={0.65} position={[3, 4, 4]} />
        <LoginParticleField />
      </Canvas>
    </div>
  );
}
