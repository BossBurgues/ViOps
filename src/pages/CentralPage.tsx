import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ordensServico, formatDate, formatCurrency } from '@/data/mockData';
import { useApp } from '@/contexts/AppContext';
import { getAvailableTransitions } from '@/data/osWorkflow';
import { OSStatus } from '@/data/types';
import {
  getDaysInStatus, getSLAStatus, getSLAClass, getSLABorderClass,
  getFactoryDisplayRef, hasCalctoolRegistration, isPendingExternalBaixa,
  getFactoryPriorityClass, PRODUCTION_STATUS_LABELS, PRODUCTION_STATUS_CLASSES,
} from '@/lib/factoryStatus';
import { Link } from 'react-router-dom';
import {
  Clock, AlertTriangle, Package, Factory, ArrowRight, Timer, Shield,
  Cpu, ExternalLink, CheckCircle, BarChart2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { recordAudit } from '@/lib/audit';

const filaStatuses: OSStatus[] = ['recebida', 'producao', 'pendencia', 'pronta'];

export default function CentralPage() {
  const { selectedUnidadeId, hasPermission, currentUser } = useApp();
  const canOperate = hasPermission(['admin', 'operador']);
  const [confirmAction, setConfirmAction] = useState<{ title: string; desc: string; action: () => void } | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

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
  const criticos = allOS.filter(os => getSLAStatus(getDaysInStatus(os.historico), os.status) === 'critical');
  const urgentes = allOS.filter(os => getSLAStatus(getDaysInStatus(os.historico), os.status) === 'warning');

  const avgDays = totalNaFila > 0
    ? (allOS.reduce((s, os) => s + getDaysInStatus(os.historico), 0) / totalNaFila).toFixed(1)
    : '0';

  const comRefExterna = allOS.filter(os => !!os.factoryRef?.externalId || !!os.factoryRef?.calctoolRxId).length;
  const pendenteBaixa = allOS.filter(os => isPendingExternalBaixa(os.factoryRef)).length;

  const handleQuickAction = (os: typeof ordensServico[0], label: string, toStatus?: string) => {
    recordAudit({
      action: 'os_status_change',
      userId: currentUser.id,
      userName: currentUser.nome,
      userRole: currentUser.role,
      unidadeId: os.unidadeId,
      unidadeNome: os.unidadeNome,
      resource: os.numero,
      details: `${label} via Central${toStatus ? ` → ${toStatus}` : ''}`,
      metadata: { from: os.status, to: toStatus, via: 'central_page' },
    });
    toast.success(`"${label}" executado para ${os.numero}`, {
      description: `Atualizado por ${currentUser.nome}`,
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Central / Fábrica</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalNaFila} OS na fila
              {criticos.length > 0 && <span className="text-destructive ml-1">— {criticos.length} crítico(s)</span>}
              {urgentes.length > 0 && criticos.length === 0 && <span className="text-warning ml-1">— {urgentes.length} requerem atenção</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('kanban')}
              className={`rounded-md px-3 py-1.5 text-[11px] font-semibold transition-colors ${viewMode === 'kanban' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`rounded-md px-3 py-1.5 text-[11px] font-semibold transition-colors ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              Tabela
            </button>
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-6">
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
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tempo Médio</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">dias na fila</p>
            </div>
            <span className="text-2xl font-bold text-foreground">{avgDays}</span>
          </div>
          <div className="page-card px-5 py-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Com Ref. Externa</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {pendenteBaixa > 0 && <span className="text-warning">{pendenteBaixa} baixa(s) pendente(s)</span>}
                {pendenteBaixa === 0 && 'todas baixadas'}
              </p>
            </div>
            <span className="text-2xl font-bold text-foreground">{comRefExterna}</span>
          </div>
        </div>

        {/* Kanban view */}
        {viewMode === 'kanban' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filaStatuses.map(status => {
              const osList = allOS
                .filter(os => os.status === status)
                .sort((a, b) => getDaysInStatus(b.historico) - getDaysInStatus(a.historico));
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
                        const days = getDaysInStatus(os.historico);
                        const sla = getSLAStatus(days, os.status);
                        const ref = getFactoryDisplayRef(os.factoryRef);
                        const hasCt = hasCalctoolRegistration(os.factoryRef);
                        const pendBaixa = isPendingExternalBaixa(os.factoryRef);
                        const prodStatus = os.factoryRef?.producaoStatus;
                        const transitions = getAvailableTransitions(os.status, currentUser.role, {
                          hasOverduePayments: false,
                          allPaymentsPaid: true,
                        });
                        const primaryAction = transitions.find(t => t.to !== 'cancelada' && !t.blockReason);

                        return (
                          <div key={os.id} className={`rounded-lg px-3 py-3 transition-colors hover:bg-muted/40 ${getSLABorderClass(sla)}`}>
                            <div className="flex items-center justify-between">
                              <Link to={`/ordens/${os.id}`} className="text-sm font-semibold text-primary hover:underline">{os.numero}</Link>
                              <div className="flex items-center gap-1">
                                {sla !== 'ok' && <AlertTriangle className={`h-3.5 w-3.5 ${sla === 'critical' ? 'text-destructive' : 'text-warning'}`} />}
                                {hasCt && <Cpu className="h-3 w-3 text-sky-500" title="Calctool RX 2.0" />}
                              </div>
                            </div>
                            <p className="text-[13px] text-foreground mt-0.5">{os.clienteNome}</p>

                            {/* Factory ref */}
                            {ref && (
                              <div className="mt-1.5 flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                                <ExternalLink className="h-2.5 w-2.5" />
                                <span>{ref}</span>
                                {pendBaixa && <span className="ml-1 rounded bg-warning/10 px-1 py-0.5 text-[9px] font-semibold text-warning">Baixa pendente</span>}
                              </div>
                            )}

                            {/* Production status */}
                            {prodStatus && (
                              <div className="mt-1">
                                <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-semibold ${PRODUCTION_STATUS_CLASSES[prodStatus]}`}>
                                  {PRODUCTION_STATUS_LABELS[prodStatus]}
                                </span>
                              </div>
                            )}

                            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>{os.unidadeNome.replace('Visual Premium - ', '')}</span>
                              <span className={`flex items-center gap-1 font-medium ${getSLAClass(sla)}`}>
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
                                        action: () => handleQuickAction(os, primaryAction.label, primaryAction.to),
                                      });
                                    } else {
                                      handleQuickAction(os, primaryAction.label, primaryAction.to);
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
        )}

        {/* Table view */}
        {viewMode === 'table' && (
          <div className="page-card">
            <div className="border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Todas as OS na Central ({allOS.length})</h2>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive inline-block" /> Crítico (5+ dias ou pendência)</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning inline-block" /> Atenção (3+ dias)</span>
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
                      <th className="table-header px-6 py-3.5 text-left">Número</th>
                      <th className="table-header px-6 py-3.5 text-left">Cliente</th>
                      <th className="table-header px-6 py-3.5 text-left">Unidade</th>
                      <th className="table-header px-6 py-3.5 text-left">Status</th>
                      <th className="table-header px-6 py-3.5 text-left">Produção</th>
                      <th className="table-header px-6 py-3.5 text-left">Ref. Fábrica</th>
                      <th className="table-header px-6 py-3.5 text-left">Calctool</th>
                      <th className="table-header px-6 py-3.5 text-left">Previsão</th>
                      <th className="table-header px-6 py-3.5 text-center">Dias</th>
                      <th className="table-header px-6 py-3.5 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...allOS].sort((a, b) => getDaysInStatus(b.historico) - getDaysInStatus(a.historico)).map(os => {
                      const days = getDaysInStatus(os.historico);
                      const sla = getSLAStatus(days, os.status);
                      const ref = getFactoryDisplayRef(os.factoryRef);
                      const prodStatus = os.factoryRef?.producaoStatus;
                      return (
                        <tr key={os.id} className="border-b border-border/40 last:border-0 transition-colors hover:bg-muted/40">
                          <td className="px-6 py-3">
                            <span className={`h-2.5 w-2.5 rounded-full inline-block ${sla === 'critical' ? 'bg-destructive' : sla === 'warning' ? 'bg-warning' : 'bg-success'}`} />
                          </td>
                          <td className="px-6 py-3 font-medium text-primary">
                            <Link to={`/ordens/${os.id}`} className="hover:underline">{os.numero}</Link>
                          </td>
                          <td className="px-6 py-3 text-foreground">{os.clienteNome}</td>
                          <td className="px-6 py-3 text-muted-foreground text-[12px]">{os.unidadeNome.replace('Visual Premium - ', '')}</td>
                          <td className="px-6 py-3"><StatusBadge status={os.status} /></td>
                          <td className="px-6 py-3">
                            {prodStatus ? (
                              <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${PRODUCTION_STATUS_CLASSES[prodStatus]}`}>
                                {PRODUCTION_STATUS_LABELS[prodStatus]}
                              </span>
                            ) : <span className="text-[12px] text-muted-foreground">—</span>}
                          </td>
                          <td className="px-6 py-3">
                            {ref ? (
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-[11px] text-foreground">{ref}</span>
                                {isPendingExternalBaixa(os.factoryRef) && (
                                  <span className="rounded bg-warning/10 px-1 py-0.5 text-[9px] font-semibold text-warning">Baixa pendente</span>
                                )}
                              </div>
                            ) : <span className="text-[12px] text-muted-foreground">—</span>}
                          </td>
                          <td className="px-6 py-3">
                            {os.factoryRef?.calctoolRxId ? (
                              <div className="flex items-center gap-1">
                                <Cpu className="h-3 w-3 text-sky-500" />
                                <span className="font-mono text-[11px] text-sky-600 dark:text-sky-400">{os.factoryRef.calctoolRxId}</span>
                              </div>
                            ) : <span className="text-[12px] text-muted-foreground">—</span>}
                          </td>
                          <td className="px-6 py-3 text-muted-foreground text-[12px]">{formatDate(os.dataPrevisao)}</td>
                          <td className={`px-6 py-3 text-center font-medium ${getSLAClass(sla)}`}>{days}d</td>
                          <td className="px-6 py-3 text-right font-medium text-foreground">{formatCurrency(os.valorTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
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
