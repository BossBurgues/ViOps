import { OSStatus } from '@/data/types';
import { statusLabels } from '@/data/mockData';
import { cn } from '@/lib/utils';

const statusStyles: Record<OSStatus, string> = {
  recebida: 'status-recebida',
  producao: 'status-producao',
  pendencia: 'status-pendencia',
  pronta: 'status-pronta',
  enviada: 'status-enviada',
  entregue: 'status-entregue',
  cancelada: 'status-cancelada',
};

export function StatusBadge({ status, className }: { status: OSStatus; className?: string }) {
  return (
    <span className={cn('status-badge', statusStyles[status], className)}>
      {statusLabels[status]}
    </span>
  );
}
