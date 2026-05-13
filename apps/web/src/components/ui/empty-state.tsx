import { cn } from '@/lib/utils';

export function EmptyState({
  action,
  className,
  title,
}: {
  action?: React.ReactNode;
  className?: string;
  description?: string;
  title: string;
}) {
  return (
    <div className={cn('p-10 text-center', className)}>
      <div className="font-medium">{title}</div>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
