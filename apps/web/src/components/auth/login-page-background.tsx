import { cn } from '@/lib/utils';

export function LoginPageBackground({
  className,
  imageClassName,
}: {
  className?: string;
  imageClassName?: string;
}) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div
        className={cn('absolute inset-0 bg-cover bg-center bg-no-repeat', imageClassName)}
        style={{ backgroundImage: "url('/images/login/background.png')" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(247,251,255,0.18)_0%,rgba(242,248,255,0.06)_42%,rgba(214,229,253,0.04)_100%)]" />
    </div>
  );
}
