import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { OSDocDisplay, type OSDocumento } from '@/components/OSDocumentos';
import { ordensServico, formatCurrency, formatDate, unidades, clientes } from '@/data/mockData';
import { useApp } from '@/contexts/AppContext';
import { getAvailableTransitions, canEditOS, getStatusStep } from '@/data/osWorkflow';
import {
  ArrowLeft, Clock, User, MapPin, Calendar, CreditCard, FileText, Paperclip,
  CheckCircle, AlertTriangle, Edit, Truck, MoreHorizontal, Lock, ArrowRight,
  Eye, Shield, History, Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { recordAudit } from '@/lib/audit';

const PIPELINE_STEPS = [
  { label: 'Recebida', step: 0 },
  { label: 'Producao', step: 1 },
  { label: 'Pronta', step: 2 },
  { label: 'Enviada', step: 3 },
  { label: 'Entregue', step: 4 },
];

type StatusAuditEntry = (typeof ordensServico)[number]['historico'][number] & { type: 'status' };
type DocumentAuditEntry = { id: string; data: string; status: (typeof ordensServico)[number]['status']; descricao: string; usuario: string; type: 'document'; detail: string; };
type AuditEntry = StatusAuditEntry | DocumentAuditEntry;

// Mock documents for demo
const MOCK_DOCS: Record<string, OSDocumento[]> = {
  os1: [
    { id: 'doc1', nome: 'receita-maria-helena.pdf', tipo: 'application/pdf', tamanho: 245000, categoria: 'receita', dataUpload: '2025-03-01T09:25:00', usuario: 'Fernando Costa' },
    { id: 'doc2', nome: 'guia-consulta-oftalmologica.pdf', tipo: 'application/pdf', tamanho: 182000, categoria: 'guia_medica', dataUpload: '2025-03-01T09:28:00', usuario: 'Fernando Costa' },
  ],
  os3: [
    { id: 'doc3', nome: 'prescricao-ana-paula.jpg', tipo: 'image/jpeg', tamanho: 1250000, categoria: 'receita', dataUpload: '2025-04-03T10:05:00', usuario: 'Fernando Costa' },
  ],
  os7: [
    { id: 'doc4', nome: 'receita-claudia-od-oe.pdf', tipo: 'application/pdf', tamanho: 310000, categoria: 'receita', dataUpload: '2025-04-07T15:10:00', usuario: 'Juliana Ribeiro' },
    { id: 'doc5', nome: 'laudo-topografia-corneal.pdf', tipo: 'application/pdf', tamanho: 520000, categoria: 'laudo', dataUpload: '2025-04-07T15:12:00', usuario: 'Juliana Ribeiro' },
    { id: 'doc6', nome: 'comprovante-entrada-cartao.pdf', tipo: 'application/pdf', tamanho: 98000, categoria: 'comprovante', dataUpload: '2025-04-07T15:20:00', usuario: 'Juliana Ribeiro' },
  ],
};

export default function OSDetalhePage() {
  const { id } = useParams();
  const { currentUser, hasPermission } = useApp();
  const os = ordensServico.find(o => o.id === id);
  const [confirmAction, setConfirmAction] = useState<{ title: string; desc: string; action: () => void; variant?: 'default' | 'destructive' } | null>(null);

  if (!os) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">Ordem de servico nao encontrada</p>
          <p className="text-[13px] text-muted-foreground mb-4">A OS solicitada nao existe ou foi removida.</p>
          <Link to="/ordens" className="text-sm font-medium text-primary hover:underline">Voltar para Ordens</Link>
        </div>
      </AppLayout>
    );
  }

  const cliente = clientes.find(c => c.id === os.clienteId);
  const unidade = unidades.find(u => u.id === os.unidadeId);
  const osDocs = MOCK_DOCS[os.id] || [];

  // Financial
  const parcelas = os.pagamento?.parcelas || [];
  const pagas = parcelas.filter(p => p.status === 'paga');
  const pendentes = parcelas.filter(p => p.status === 'pendente');
  const vencidas = pendentes.filter(p => p.vencimento < '2025-04-12');
  const totalPago = pagas.reduce((s, p) => s + p.valor, 0);
  const totalPendente = pendentes.reduce((s, p) => s + p.valor, 0);

  // Workflow
  const currentStep = getStatusStep(os.status);
  const editCheck = canEditOS(os.status, currentUser.role);
  const transitions = getAvailableTransitions(os.status, currentUser.role, {
    hasOverduePayments: vencidas.length > 0,
    allPaymentsPaid: pendentes.length === 0,
  });

  const canUpdateFinancial = hasPermission(['admin', 'financeiro']);
  const canEdit = editCheck.allowed;

  const handleAction = (label: string, isStatusChange = false, toStatus?: string) => {
    if (isStatusChange) {
      recordAudit({
        action: 'os_status_change',
        userId: currentUser.id,
        userName: currentUser.nome,
        userRole: currentUser.role,
        unidadeId: os.unidadeId,
        unidadeNome: os.unidadeNome,
        resource: os.numero,
        details: `${label} — status anterior: ${os.status}${toStatus ? ` → ${toStatus}` : ''}`,
        metadata: { from: os.status, to: toStatus, action: label },
      });
    }
    toast.success(`Acao "${label}" executada com sucesso`, {
      description: `OS ${os.numero} atualizada por ${currentUser.nome}`,
    });
  };

  // Build audit trail with doc events
  const docAuditEvents: DocumentAuditEntry[] = osDocs.map(d => ({
    id: `audit-doc-${d.id}`,
    data: d.dataUpload,
    status: os.status,
    descricao: `Documento anexado: ${d.nome}`,
    usuario: d.usuario,
    type: 'document' as const,
    detail: `Categoria: ${d.categoria.replace('_', ' ')} | Tamanho: ${(d.tamanho / 1024).toFixed(0)} KB`,
  }));

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <Link to="/ordens" className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-foreground">{os.numero}</h1>
                <StatusBadge status={os.status} />
                {vencidas.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                    <AlertTriangle className="h-3 w-3" />Inadimplente
                  </span>
                )}
                {osDocs.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/8 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    <Paperclip className="h-3 w-3" />{osDocs.length} doc(s)
                  </span>
                )}
              </div>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                Criada em {formatDate(os.dataCriacao)} por {os.vendedorNome} — {os.unidadeNome}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit ? (
              <Button variant="outline" size="sm" className="h-9 text-[13px]" onClick={() => handleAction('Editar OS')}>
                <Edit className="mr-1.5 h-3.5 w-3.5" />Editar
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 text-[13px] opacity-50 cursor-not-allowed" disabled>
                    <Lock className="mr-1.5 h-3.5 w-3.5" />Editar
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p className="text-[12px]">{editCheck.reason}</p></TooltipContent>
              </Tooltip>
            )}
            {transitions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="h-9 text-[13px] font-semibold">
                    <ArrowRight className="mr-1.5 h-3.5 w-3.5" />Avancar Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {transitions.map(t => (
                    <DropdownMenuItem
                      key={`${t.from}-${t.to}`}
                      disabled={!!t.blockReason}
                      onClick={() => {
                        if (t.blockReason) {
                          toast.error(t.blockReason);
                          return;
                        }
                        if (t.requiresConfirmation) {
                          setConfirmAction({
                            title: t.label,
                            desc: t.confirmMessage || `Confirma "${t.label}" para ${os.numero}?`,
                            action: () => handleAction(t.label, true, t.to),
                            variant: t.to === 'cancelada' ? 'destructive' : 'default',
                          });
                        } else {
                          handleAction(t.label, true, t.to);
                        }
                      }}
                    >
                      <span className="flex-1">{t.label}</span>
                      {t.blockReason && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleAction('Imprimir OS')}>
                  <FileText className="mr-2 h-4 w-4" />Imprimir OS
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction('Duplicar OS')}>
                  <FileText className="mr-2 h-4 w-4" />Duplicar OS
                </DropdownMenuItem>
                {canEdit && (
                  <DropdownMenuItem onClick={() => handleAction('Anexar documento')}>
                    <Upload className="mr-2 h-4 w-4" />Anexar Documento
                  </DropdownMenuItem>
                )}
                {canUpdateFinancial && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleAction('Registrar Pagamento')}>
                      <CreditCard className="mr-2 h-4 w-4" />Registrar Pagamento
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Status pipeline */}
        {os.status !== 'cancelada' && (
          <div className="page-card px-6 py-4">
            <div className="flex items-center justify-between">
              {PIPELINE_STEPS.map((ps, i) => {
                const isActive = currentStep === ps.step;
                const isDone = currentStep > ps.step;
                const isPending = ps.step === 1 && os.status === 'pendencia';
                return (
                  <div key={ps.label} className="flex items-center flex-1">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                        isActive ? (isPending ? 'bg-warning text-warning-foreground' : 'bg-primary text-primary-foreground') :
                        isDone ? 'bg-primary/15 text-primary' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {isDone ? <CheckCircle className="h-4 w-4" /> : isPending ? <AlertTriangle className="h-4 w-4" /> : i + 1}
                      </div>
                      <span className={`text-[10px] font-medium ${
                        isActive ? (isPending ? 'text-warning' : 'text-primary') : isDone ? 'text-primary' : 'text-muted-foreground'
                      }`}>
                        {isPending ? 'Pendencia' : ps.label}
                      </span>
                    </div>
                    {i < PIPELINE_STEPS.length - 1 && (
                      <div className={`flex-1 h-px mx-2 ${isDone ? 'bg-primary/30' : 'bg-border'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Blocked warnings */}
        {vencidas.length > 0 && ['pronta', 'enviada'].includes(os.status) && (
          <div className="page-card px-6 py-4 border-destructive/20 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-destructive">Entrega bloqueada por inadimplencia</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Existem {vencidas.length} parcela(s) vencida(s) totalizando {formatCurrency(vencidas.reduce((s,p) => s + p.valor, 0))}. Regularize o financeiro para liberar a entrega.
              </p>
            </div>
          </div>
        )}

        {/* Financial summary bar */}
        {os.pagamento && (
          <div className="page-card flex flex-wrap items-center gap-6 px-6 py-3.5">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-[12px] font-medium text-muted-foreground">{os.pagamento.formaPagamento}</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-4 text-[12px]">
              <span className="text-muted-foreground">Total: <span className="font-semibold text-foreground">{formatCurrency(os.valorTotal)}</span></span>
              <span className="text-muted-foreground">Pago: <span className="font-semibold text-[hsl(var(--success))]">{formatCurrency(totalPago)}</span></span>
              {totalPendente > 0 && (
                <span className="text-muted-foreground">Pendente: <span className={`font-semibold ${vencidas.length > 0 ? 'text-destructive' : 'text-[hsl(var(--warning))]'}`}>{formatCurrency(totalPendente)}</span></span>
              )}
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
              {pagas.length}/{parcelas.length} parcelas pagas
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Client + Unit data */}
            <div className="page-card p-6">
              <h2 className="section-title mb-5">Dados do Pedido</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Cliente</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{os.clienteNome}</p>
                    {cliente && <p className="text-[12px] text-muted-foreground">{cliente.telefone} — {cliente.email}</p>}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Unidade de Origem</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{os.unidadeNome}</p>
                    {unidade && <p className="text-[12px] text-muted-foreground">{unidade.cidade}/{unidade.uf} — {unidade.telefone}</p>}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Previsao de Entrega</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{formatDate(os.dataPrevisao)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Truck className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Data de Entrega</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{os.dataEntrega ? formatDate(os.dataEntrega) : 'Aguardando'}</p>
                  </div>
                </div>
              </div>
              {os.observacoes && (
                <div className="mt-5 rounded-lg bg-muted/50 p-4">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Observacoes</p>
                  <p className="text-sm text-foreground leading-relaxed">{os.observacoes}</p>
                </div>
              )}
            </div>

            {/* Itens */}
            <div className="page-card">
              <div className="border-b border-border px-6 py-4">
                <h2 className="section-title">Itens do Pedido</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="table-header px-6 py-3 text-left">Descricao</th>
                      <th className="table-header px-6 py-3 text-left">Tipo</th>
                      <th className="table-header px-6 py-3 text-center">Qtd</th>
                      <th className="table-header px-6 py-3 text-right">Unit.</th>
                      <th className="table-header px-6 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {os.itens.map(item => (
                      <tr key={item.id} className="border-b border-border/40 last:border-0">
                        <td className="px-6 py-3 font-medium text-foreground">{item.descricao}</td>
                        <td className="px-6 py-3 text-muted-foreground">{item.tipo}</td>
                        <td className="px-6 py-3 text-center">{item.quantidade}</td>
                        <td className="px-6 py-3 text-right text-muted-foreground">{formatCurrency(item.valorUnitario)}</td>
                        <td className="px-6 py-3 text-right font-medium text-foreground">{formatCurrency(item.valorUnitario * item.quantidade)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border">
                      <td colSpan={4} className="px-6 py-3.5 text-right text-sm font-bold text-foreground">Total</td>
                      <td className="px-6 py-3.5 text-right text-sm font-bold text-foreground">{formatCurrency(os.valorTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Parcelas */}
            {os.pagamento && (
              <div className="page-card">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <h2 className="section-title">Parcelas — {os.pagamento.formaPagamento}</h2>
                  </div>
                  {canUpdateFinancial ? (
                    <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => handleAction('Baixar parcela')}>
                      Registrar Baixa
                    </Button>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 text-[12px] opacity-50 cursor-not-allowed" disabled>
                          <Lock className="mr-1 h-3 w-3" />Registrar Baixa
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p className="text-[12px]">Apenas perfis financeiros podem registrar baixa.</p></TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="table-header px-6 py-3 text-left">Parcela</th>
                        <th className="table-header px-6 py-3 text-left">Vencimento</th>
                        <th className="table-header px-6 py-3 text-right">Valor</th>
                        <th className="table-header px-6 py-3 text-left">Situacao</th>
                        <th className="table-header px-6 py-3 text-left">Pagamento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parcelas.map(p => {
                        const isOverdue = p.status === 'pendente' && p.vencimento < '2025-04-12';
                        return (
                          <tr key={p.id} className="border-b border-border/40 last:border-0">
                            <td className="px-6 py-3 text-foreground">{p.numero}/{parcelas.length}</td>
                            <td className={`px-6 py-3 ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>{formatDate(p.vencimento)}</td>
                            <td className="px-6 py-3 text-right font-medium text-foreground">{formatCurrency(p.valor)}</td>
                            <td className="px-6 py-3">
                              <span className={`status-badge ${
                                p.status === 'paga' ? 'status-pronta' : isOverdue ? 'status-cancelada' : 'status-pendencia'
                              }`}>
                                {p.status === 'paga' ? 'Paga' : isOverdue ? 'Vencida' : 'Pendente'}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-[12px] text-muted-foreground">{p.dataPagamento ? formatDate(p.dataPagamento) : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Documents section */}
            <OSDocDisplay documentos={osDocs} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Audit trail */}
            <div className="page-card p-6">
              <div className="flex items-center gap-2 mb-5">
                <History className="h-3.5 w-3.5 text-muted-foreground" />
                <h2 className="section-title">Historico e Auditoria</h2>
              </div>
              <div className="space-y-0">
                {([...os.historico.map<StatusAuditEntry>(h => ({ ...h, type: 'status' })), ...docAuditEvents] as AuditEntry[])
                  .sort((a, b) => a.data.localeCompare(b.data))
                  .map((h, i, arr) => (
                  <div key={h.id} className="relative pl-7 pb-6 last:pb-0">
                    <div className={`absolute left-0 top-1 z-10 h-3.5 w-3.5 rounded-full border-2 ${
                      h.type === 'document' ? 'border-primary/60 bg-primary/10' : 'border-primary bg-card'
                    }`} />
                    {i < arr.length - 1 && (
                      <div className="absolute left-[6px] top-5 h-[calc(100%-8px)] w-px bg-border" />
                    )}
                    <div className="space-y-1">
                      {h.type === 'document' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-primary/8 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                          <Paperclip className="h-2.5 w-2.5" />Documento
                        </span>
                      ) : (
                        <StatusBadge status={h.status} />
                      )}
                      <p className="text-sm text-foreground leading-relaxed">{h.descricao}</p>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />{h.data}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
                        <User className="h-3 w-3" />por {h.usuario}
                      </div>
                      {h.type === 'document' && h.detail && (
                        <div className="mt-1.5 rounded bg-muted/60 px-2.5 py-1.5 text-[10px] text-muted-foreground">
                          <p>{h.detail}</p>
                        </div>
                      )}
                      {h.type === 'status' && h.status === 'producao' && i <= 2 && (
                        <div className="mt-1.5 rounded bg-muted/60 px-2.5 py-1.5 text-[10px] text-muted-foreground space-y-0.5">
                          <p>Status: Recebida → Em Producao</p>
                          <p>Acao: Automatica (fila de producao)</p>
                        </div>
                      )}
                      {h.type === 'status' && h.status === 'pendencia' && (
                        <div className="mt-1.5 rounded bg-[hsl(var(--warning)/0.05)] border border-[hsl(var(--warning)/0.1)] px-2.5 py-1.5 text-[10px] text-muted-foreground space-y-0.5">
                          <p>Status: Em Producao → Pendencia</p>
                          <p>Motivo: {h.descricao}</p>
                          <p>Acao: Manual pelo operador</p>
                        </div>
                      )}
                      {h.type === 'status' && h.status === 'entregue' && (
                        <div className="mt-1.5 rounded bg-primary/5 border border-primary/10 px-2.5 py-1.5 text-[10px] text-muted-foreground space-y-0.5">
                          <p>Status: Enviada → Entregue</p>
                          <p>Acao: Manual pelo vendedor</p>
                          <p>Unidade: {os.unidadeNome}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="page-card p-6 space-y-4">
              <h2 className="section-title">Resumo</h2>
              <div className="space-y-3 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vendedor</span>
                  <span className="font-medium text-foreground">{os.vendedorNome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unidade</span>
                  <span className="font-medium text-foreground">{os.unidadeNome.replace('Visual Premium - ', '')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Itens</span>
                  <span className="font-medium text-foreground">{os.itens.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Documentos</span>
                  <span className="font-medium text-foreground">{osDocs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor Total</span>
                  <span className="font-bold text-foreground">{formatCurrency(os.valorTotal)}</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="text-muted-foreground">Dias em andamento</span>
                  <span className="font-medium text-foreground">
                    {Math.max(0, Math.floor((new Date('2025-04-12').getTime() - new Date(os.dataCriacao).getTime()) / 86400000))}
                  </span>
                </div>
              </div>
            </div>

            {/* Traceability */}
            <div className="page-card p-6 space-y-4">
              <h2 className="section-title">Rastreabilidade</h2>
              <div className="space-y-2">
                {[
                  { label: 'Loja', desc: `Criada em ${os.unidadeNome.replace('Visual Premium - ', '')}`, done: true },
                  { label: 'Documentos', desc: osDocs.length > 0 ? `${osDocs.length} anexo(s)` : 'Sem documentos', done: osDocs.length > 0 },
                  { label: 'Central', desc: currentStep >= 1 ? 'Em processamento' : 'Aguardando', done: currentStep >= 1 },
                  { label: 'Financeiro', desc: pagas.length > 0 ? `${pagas.length}/${parcelas.length} parcelas pagas` : 'Sem pagamento', done: pagas.length > 0 },
                  { label: 'Entrega', desc: os.dataEntrega ? `Entregue em ${formatDate(os.dataEntrega)}` : 'Aguardando', done: !!os.dataEntrega },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                      s.done ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {s.done ? <CheckCircle className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                    <div>
                      <p className="text-[12px] font-medium text-foreground">{s.label}</p>
                      <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmAction?.title || ''}
        description={confirmAction?.desc || ''}
        variant={confirmAction?.variant}
        onConfirm={() => {
          confirmAction?.action();
          setConfirmAction(null);
        }}
      />
    </AppLayout>
  );
}
