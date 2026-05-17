'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'blue' | 'purple' | 'green' | 'red' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  width?: string | number;
  height?: string | number;
  customSize?: boolean;
}

const glowColorMap = {
  blue: { base: 220, spread: 180 },
  purple: { base: 270, spread: 220 },
  green: { base: 145, spread: 160 },
  red: { base: 0, spread: 160 },
  orange: { base: 30, spread: 160 },
};

const sizeMap = {
  sm: 'h-64 w-48',
  md: 'h-80 w-64',
  lg: 'h-96 w-80',
};

type GlowCardStyle = CSSProperties & {
  '--backup-border'?: string;
  '--backdrop'?: string;
  '--base'?: number;
  '--bg-spot-opacity'?: string;
  '--border'?: string;
  '--border-light-opacity'?: string;
  '--border-size'?: string;
  '--border-spot-opacity'?: string;
  '--hue'?: string;
  '--lightness'?: string;
  '--outer'?: string;
  '--radius'?: string;
  '--saturation'?: string;
  '--size'?: string;
  '--spotlight-size'?: string;
  '--spread'?: number;
};

export function GlowCard({
  children,
  className,
  customSize = false,
  glowColor = 'blue',
  height,
  size = 'md',
  width,
}: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncPointer = (event: PointerEvent) => {
      const card = cardRef.current;

      if (!card) return;

      card.style.setProperty('--x', event.clientX.toFixed(2));
      card.style.setProperty('--xp', (event.clientX / window.innerWidth).toFixed(2));
      card.style.setProperty('--y', event.clientY.toFixed(2));
      card.style.setProperty('--yp', (event.clientY / window.innerHeight).toFixed(2));
    };

    document.addEventListener('pointermove', syncPointer);

    return () => document.removeEventListener('pointermove', syncPointer);
  }, []);

  const { base, spread } = glowColorMap[glowColor];
  const style: GlowCardStyle = {
    '--backdrop': 'hsl(220 26% 12% / 0.28)',
    '--backup-border': 'hsl(210 40% 98% / 0.12)',
    '--base': base,
    '--bg-spot-opacity': '0.12',
    '--border': '1',
    '--border-light-opacity': '0.85',
    '--border-size': 'calc(var(--border, 1) * 1px)',
    '--border-spot-opacity': '0.9',
    '--hue': 'calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))',
    '--lightness': '62',
    '--outer': '1',
    '--radius': '28',
    '--saturation': '92',
    '--size': '260',
    '--spotlight-size': 'calc(var(--size, 180) * 1px)',
    '--spread': spread,
    backgroundAttachment: 'fixed',
    backgroundColor: 'var(--backdrop, transparent)',
    backgroundImage: `radial-gradient(
      var(--spotlight-size) var(--spotlight-size) at
      calc(var(--x, 0) * 1px)
      calc(var(--y, 0) * 1px),
      hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 70) * 1%) / var(--bg-spot-opacity, 0.1)),
      transparent
    )`,
    backgroundPosition: '50% 50%',
    backgroundSize: 'calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)))',
    border: 'var(--border-size) solid var(--backup-border)',
    height: typeof height === 'number' ? `${height}px` : height,
    position: 'relative',
    touchAction: 'none',
    width: typeof width === 'number' ? `${width}px` : width,
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        'spotlight-card relative overflow-hidden rounded-[calc(var(--radius)*1px)] shadow-[0_24px_80px_-44px_rgba(0,0,0,0.85)] backdrop-blur-xl',
        customSize ? '' : sizeMap[size],
        className,
      )}
      data-glow-card
      style={style}
    >
      <div aria-hidden="true" className="spotlight-card__glow" data-glow-card-inner />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
