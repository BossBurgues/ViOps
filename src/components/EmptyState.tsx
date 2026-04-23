import { LucideIcon, SearchX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon = SearchX, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6', className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      {description && <p className="text-[13px] text-muted-foreground text-center max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
