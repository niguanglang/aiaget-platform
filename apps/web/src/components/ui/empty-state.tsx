import { cn } from '@/lib/utils';

export function EmptyState({
  action,
  className,
  description,
  title,
}: {
  action?: React.ReactNode;
  className?: string;
  description: string;
  title: string;
}) {
  return (
    <div className={cn('p-10 text-center', className)}>
      <div className="font-medium">{title}</div>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
