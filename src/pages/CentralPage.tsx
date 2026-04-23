import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ordensServico, formatDate, formatCurrency } from '@/data/mockData';
import { useApp } from '@/contexts/AppContext';
import { getAvailableTransitions } from '@/data/osWorkflow';
import { OSStatus } from '@/data/types';
import { Link } from 'react-router-dom';
import { Clock, AlertTriangle, Package, Factory, ArrowRight, Timer, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const filaStatuses: OSStatus[] = ['recebida', 'producao', 'pendencia', 'pronta'];

function getDaysInStatus(os: typeof ordensServico[0]) {
  const lastEvent = os.historico[os.historico.length - 1];
  if (!lastEvent) return 0;
  const eventDate = new Date(lastEvent.data.split(' ')[0]);
  return Math.max(0, Math.floor((new Date('2025-04-12').getTime() - eventDate.getTime()) / 86400000));
}

function getSLAStatus(days: number, status: OSStatus): 'ok' | 'warning' | 'critical' {
  if (status === 'pendencia') return 'critical';
  if (days >= 5) return 'critical';
  if (days >= 3) return 'warning';
  return 'ok';
}

export default function CentralPage() {
  const { selectedUnidadeId, hasPermission, currentUser } = useApp();
  const canOperate = hasPermission(['admin', 'operador']);
  const [confirmAction, setConfirmAction] = useState<{ title: string; desc: string; action: () => void } | null>(null);

  if (!hasPermission(['admin', 'gestor', 'operador'])) {
    return (
      <AppLayout>
        <EmptyState icon={Shield} title="Acesso restrito" description="Apenas operadores, gestores e administradores podem acessar a Central." />
      </AppLayout>
    );
  }

  const allOS = ordensServico.filter(os =>
    filaStatuses.includes(os.status) &&
    (selectedUnidadeId === 'todas' || os.unidadeId === selectedUnidadeId)
  );

  const totalNaFila = allOS.length;
  const urgentes = allOS.filter(os => getSLAStatus(getDaysInStatus(os), os.status) !== 'ok');
  const criticos = allOS.filter(os => getSLAStatus(getDaysInStatus(os), os.status) === 'critical');

  // Avg time calc
  const avgDays = totalNaFila > 0
    ? (allOS.reduce((s, os) => s + getDaysInStatus(os), 0) / totalNaFila).toFixed(1)
    : '0';

  const handleQuickAction = (os: typeof ordensServico[0], label: string) => {
    toast.success(`"${label}" executado para ${os.numero}`, {
      description: `Atualizado por ${currentUser.nome}`,
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Central / Fabrica</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalNaFila} OS na fila
              {criticos.length > 0 && <span className="text-destructive ml-1">— {criticos.length} critico(s)</span>}
              {urgentes.length > 0 && criticos.length === 0 && <span className="text-warning ml-1">— {urgentes.length} requerem atencao</span>}
            </p>
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
          {filaStatuses.map(status => {
            const count = allOS.filter(os => os.status === status).length;
            return (
              <div key={status} className="page-card px-5 py-4 flex items-center justify-between">
                <div>
                  <StatusBadge status={status} />
                  <p className="text-[11px] text-muted-foreground mt-1.5">{count === 0 ? 'Nenhuma' : `${count} ordem${count > 1 ? 's' : ''}`}</p>
                </div>
                <span className="text-2xl font-bold text-foreground">{count}</span>
              </div>
            );
          })}
          <div className="page-card px-5 py-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tempo Medio</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">dias na fila</p>
            </div>
            <span className="text-2xl font-bold text-foreground">{avgDays}</span>
          </div>
        </div>

        {/* Kanban */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filaStatuses.map(status => {
            const osList = allOS
              .filter(os => os.status === status)
              .sort((a, b) => getDaysInStatus(b) - getDaysInStatus(a));
            return (
              <div key={status} className="page-card flex flex-col">
                <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                  <StatusBadge status={status} />
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-xs font-bold text-foreground">{osList.length}</span>
                </div>
                <div className="flex-1 divide-y divide-border/40 p-2">
                  {osList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Package className="h-5 w-5 text-muted-foreground/40 mb-2" />
                      <p className="text-[12px] text-muted-foreground">Nenhuma OS</p>
                    </div>
                  ) : (
                    osList.map(os => {
                      const days = getDaysInStatus(os);
                      const sla = getSLAStatus(days, os.status);
                      const transitions = getAvailableTransitions(os.status, currentUser.role, {
                        hasOverduePayments: false,
                        allPaymentsPaid: true,
                      });
                      const primaryAction = transitions.find(t => t.to !== 'cancelada' && !t.blockReason);

                      return (
                        <div key={os.id} className={`rounded-lg px-3 py-3 transition-colors hover:bg-muted/40 ${
                          sla === 'critical' ? 'border-l-2 border-l-destructive' :
                          sla === 'warning' ? 'border-l-2 border-l-warning' : ''
                        }`}>
                          <div className="flex items-center justify-between">
                            <Link to={`/ordens/${os.id}`} className="text-sm font-semibold text-primary hover:underline">{os.numero}</Link>
                            <div className="flex items-center gap-1">
                              {sla !== 'ok' && (
                                <AlertTriangle className={`h-3.5 w-3.5 ${sla === 'critical' ? 'text-destructive' : 'text-warning'}`} />
                              )}
                            </div>
                          </div>
                          <p className="text-[13px] text-foreground mt-0.5">{os.clienteNome}</p>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>{os.unidadeNome.replace('Visual Premium - ', '')}</span>
                            <span className={`flex items-center gap-1 font-medium ${
                              sla === 'critical' ? 'text-destructive' : sla === 'warning' ? 'text-warning' : ''
                            }`}>
                              <Clock className="h-3 w-3" />{days}d
                            </span>
                          </div>
                          <div className="mt-1 text-[11px] text-muted-foreground">
                            Prev: {formatDate(os.dataPrevisao)} — {formatCurrency(os.valorTotal)}
                          </div>
                          {canOperate && primaryAction && (
                            <div className="mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[11px] w-full"
                                onClick={() => {
                                  if (primaryAction.requiresConfirmation) {
                                    setConfirmAction({
                                      title: primaryAction.label,
                                      desc: primaryAction.confirmMessage || `Confirma "${primaryAction.label}" para ${os.numero}?`,
                                      action: () => handleQuickAction(os, primaryAction.label),
                                    });
                                  } else {
                                    handleQuickAction(os, primaryAction.label);
                                  }
                                }}
                              >
                                <ArrowRight className="mr-1 h-3 w-3" />
                                {primaryAction.label}
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Full table */}
        <div className="page-card">
          <div className="border-b border-border px-6 py-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Todas as OS na Central ({allOS.length})</h2>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive inline-block" /> Critico (5+ dias)</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning inline-block" /> Atencao (3+ dias)</span>
            </div>
          </div>
          {allOS.length === 0 ? (
            <EmptyState icon={Factory} title="Nenhuma OS na fila" description="Todas as ordens foram processadas." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="table-header px-6 py-3.5 text-left w-3">SLA</th>
                    <th className="table-header px-6 py-3.5 text-left">Numero</th>
                    <th className="table-header px-6 py-3.5 text-left">Cliente</th>
                    <th className="table-header px-6 py-3.5 text-left">Unidade</th>
                    <th className="table-header px-6 py-3.5 text-left">Status</th>
                    <th className="table-header px-6 py-3.5 text-left">Previsao</th>
                    <th className="table-header px-6 py-3.5 text-center">Dias</th>
                    <th className="table-header px-6 py-3.5 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {[...allOS].sort((a, b) => getDaysInStatus(b) - getDaysInStatus(a)).map(os => {
                    const days = getDaysInStatus(os);
                    const sla = getSLAStatus(days, os.status);
                    return (
                      <tr key={os.id} className="border-b border-border/40 last:border-0 transition-colors hover:bg-muted/40">
                        <td className="px-6 py-3">
                          <span className={`h-2.5 w-2.5 rounded-full inline-block ${
                            sla === 'critical' ? 'bg-destructive' : sla === 'warning' ? 'bg-warning' : 'bg-success'
                          }`} />
                        </td>
                        <td className="px-6 py-3 font-medium text-primary">
                          <Link to={`/ordens/${os.id}`} className="hover:underline">{os.numero}</Link>
                        </td>
                        <td className="px-6 py-3 text-foreground">{os.clienteNome}</td>
                        <td className="px-6 py-3 text-muted-foreground">{os.unidadeNome.replace('Visual Premium - ', '')}</td>
                        <td className="px-6 py-3"><StatusBadge status={os.status} /></td>
                        <td className="px-6 py-3 text-muted-foreground">{formatDate(os.dataPrevisao)}</td>
                        <td className={`px-6 py-3 text-center font-medium ${
                          sla === 'critical' ? 'text-destructive' : sla === 'warning' ? 'text-warning' : 'text-foreground'
                        }`}>{days}d</td>
                        <td className="px-6 py-3 text-right font-medium text-foreground">{formatCurrency(os.valorTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmAction?.title || ''}
        description={confirmAction?.desc || ''}
        onConfirm={() => {
          confirmAction?.action();
          setConfirmAction(null);
        }}
      />
    </AppLayout>
  );
}
