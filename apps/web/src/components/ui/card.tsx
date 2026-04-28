import { cn } from '@/lib/utils';

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        'rounded-lg border bg-background/85 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/72',
        className,
      )}
    >
      {children}
    </section>
  );
}
