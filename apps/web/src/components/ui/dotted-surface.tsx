'use client';

import { useTheme } from 'next-themes';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

import { cn } from '@/lib/utils';

type DottedSurfaceProps = Omit<React.ComponentProps<'div'>, 'ref'>;

export function DottedSurface({ className, ...props }: DottedSurfaceProps) {
  const { resolvedTheme, theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    animationId: number;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvasHost = canvasHostRef.current;

    if (!container || !canvasHost) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const isDarkTheme = resolvedTheme === 'dark' || theme === 'dark' || !resolvedTheme;

    let animationId = 0;

    try {
      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x05070b, 2000, 10000);

      const camera = new THREE.PerspectiveCamera(60, width / height, 1, 10000);
      camera.position.set(0, 380, 980);

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.setClearColor(scene.fog.color, 0);
      renderer.domElement.className = 'absolute inset-0 h-full w-full';

      canvasHost.innerHTML = '';
      canvasHost.appendChild(renderer.domElement);

      const separation = 120;
      const amountX = 52;
      const amountY = 72;
      const positions: number[] = [];
      const colors: number[] = [];
      const geometry = new THREE.BufferGeometry();

      for (let ix = 0; ix < amountX; ix += 1) {
        for (let iy = 0; iy < amountY; iy += 1) {
          positions.push(ix * separation - (amountX * separation) / 2, 0, iy * separation - (amountY * separation) / 2);
          colors.push(...(isDarkTheme ? [0.78, 0.84, 0.96] : [0.03, 0.16, 0.48]));
        }
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      const positionAttribute = geometry.getAttribute('position');
      const material = new THREE.PointsMaterial({
        opacity: 0.72,
        size: 12,
        sizeAttenuation: true,
        transparent: true,
        vertexColors: true,
      });
      const points = new THREE.Points(geometry, material);
      scene.add(points);

      let count = 0;

      const animate = () => {
        animationId = requestAnimationFrame(animate);

        const positionArray = positionAttribute.array as Float32Array;
        let i = 0;

        for (let ix = 0; ix < amountX; ix += 1) {
          for (let iy = 0; iy < amountY; iy += 1) {
            const index = i * 3;
            positionArray[index + 1] = Math.sin((ix + count) * 0.3) * 50 + Math.sin((iy + count) * 0.5) * 50;
            i += 1;
          }
        }

        positionAttribute.needsUpdate = true;
        renderer.render(scene, camera);
        count += 0.1;
        sceneRef.current = { scene, camera, renderer, animationId };
      };

      const handleResize = () => {
        if (!container.isConnected) return;

        const nextWidth = container.clientWidth || window.innerWidth;
        const nextHeight = container.clientHeight || window.innerHeight;

        if (!nextWidth || !nextHeight) return;

        camera.aspect = nextWidth / nextHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(nextWidth, nextHeight);
      };

      window.addEventListener('resize', handleResize);
      animate();

      sceneRef.current = { scene, camera, renderer, animationId };

      return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationId);
        scene.traverse((object) => {
          if (object instanceof THREE.Points) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach((item) => item.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
        renderer?.dispose();
        canvasHost.innerHTML = '';
        sceneRef.current = null;
      };
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('DottedSurface failed to initialize', error);
      }
    }
  }, [resolvedTheme, theme]);

  const isDarkTheme = resolvedTheme === 'dark' || theme === 'dark' || !resolvedTheme;

  return (
    <div ref={containerRef} className={cn('pointer-events-none absolute inset-0 z-[1] overflow-hidden', className)} {...props}>
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(148,163,184,0.52)_0.8px,transparent_1.15px)] bg-[length:28px_28px] opacity-35 animate-dots-drift',
          isDarkTheme ? 'mix-blend-screen' : 'mix-blend-multiply opacity-25',
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.38)_0.85px,transparent_1.2px)] bg-[length:28px_28px] opacity-20 animate-dots-drift-reverse',
          isDarkTheme ? 'blur-[0.35px] mix-blend-screen' : 'blur-[0.2px] mix-blend-multiply',
        )}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.15),transparent_38%),radial-gradient(circle_at_25%_25%,rgba(34,211,238,0.10),transparent_28%),radial-gradient(circle_at_75%_70%,rgba(16,185,129,0.09),transparent_26%)] opacity-80"
      />
      <div ref={canvasHostRef} className="absolute inset-0 z-10" />
    </div>
  );
}
