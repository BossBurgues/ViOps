import { formatCurrency } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  isCurrency?: boolean;
  className?: string;
  accent?: string;
}

export function KpiCard({ title, value, icon: Icon, trend, trendUp, isCurrency, className, accent }: KpiCardProps) {
  const displayValue = isCurrency && typeof value === 'number' ? formatCurrency(value) : value;

  return (
    <div className={cn('kpi-card', className)}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', accent || 'bg-primary/6')}>
          <Icon className={cn('h-[18px] w-[18px]', accent ? 'text-current' : 'text-primary')} />
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight text-foreground">{displayValue}</p>
      {trend && (
        <p className={cn('mt-2 text-xs font-medium', trendUp ? 'text-success' : 'text-destructive')}>
          {trend}
        </p>
      )}
    </div>
  );
}
