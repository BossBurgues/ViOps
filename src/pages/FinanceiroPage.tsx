import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { KpiCard } from '@/components/KpiCard';
import { EmptyState } from '@/components/EmptyState';
import { TablePagination } from '@/components/TablePagination';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ordensServico, formatCurrency, formatDate, unidades, clientes } from '@/data/mockData';
import { useApp } from '@/contexts/AppContext';
import {
  isParcelaVencida, getParcelaDisplayStatus, getParcelaStatusLabel, getParcelaStatusClass,
  calcHybridPaymentSummary,
  BOLETO_STATUS_LABELS, BOLETO_STATUS_CLASSES,
  PAYMENT_INTENT_STATUS_LABELS, PAYMENT_INTENT_STATUS_CLASSES,
} from '@/lib/financialStatus';
import { DollarSign, AlertTriangle, CheckCircle, Clock, TrendingUp, CreditCard, Search, Shield, Lock, FileDown, Users, Link2, FileText, Plug } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { recordAudit, buildExportFilename } from '@/lib/audit';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { cobrancas as todasCobrancas } from '@/data/mockCobrancas';
import { provedoresFinanceiros, getProvedorById } from '@/data/mockProvedores';
import {
  TIPO_COBRANCA_LABELS, STATUS_COBRANCA_LABELS, STATUS_COBRANCA_CLASSES,
  type TipoCobranca, type StatusCobranca,
} from '@/data/financeiroTypes';

type FinFilter = 'todos' | 'vencidas' | 'a_vencer' | 'pagas';
type FinView = 'parcelas' | 'boletos_links' | 'por_cliente' | 'por_unidade' | 'cobranças';

export default function FinanceiroPage() {
  const { selectedUnidadeId, hasPermission, currentUser } = useApp();
  const [filter, setFilter] = useState<FinFilter>('todos');
  const [view, setView] = useState<FinView>('parcelas');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [confirmAction, setConfirmAction] = useState<{ title: string; desc: string; action: () => void } | null>(null);
  const canOperate = hasPermission(['admin', 'financeiro']);

  // Cobranças tab filters
  const [cobFiltroCanal, setCobFiltroCanal] = useState<'todos' | 'otica' | 'externa'>('todos');
  const [cobFiltroTipo, setCobFiltroTipo] = useState<'todos' | TipoCobranca>('todos');
  const [cobFiltroStatus, setCobFiltroStatus] = useState<'todos' | StatusCobranca>('todos');
  const [cobFiltroProvedor, setCobFiltroProvedor] = useState<'todos' | string>('todos');
  const [cobSearch, setCobSearch] = useState('');

  if (!hasPermission(['admin', 'gestor', 'financeiro'])) {
    return (
      <AppLayout>
        <EmptyState icon={Shield} title="Acesso restrito" description="Apenas perfis financeiros, gestores e administradores podem acessar este modulo." />
      </AppLayout>
    );
  }

  const relevantOS = ordensServico.filter(os =>
    selectedUnidadeId === 'todas' || os.unidadeId === selectedUnidadeId
  );

  const allParcelas = relevantOS.flatMap(os =>
    (os.pagamento?.parcelas || []).map(p => ({
      ...p,
      osId: os.id,
      osNumero: os.numero,
      clienteId: os.clienteId,
      clienteNome: os.clienteNome,
      unidadeId: os.unidadeId,
      unidadeNome: os.unidadeNome,
      osStatus: os.status,
      formaPagamento: os.pagamento?.formaPagamento || '',
    }))
  );

  const pagas = allParcelas.filter(p => p.status === 'paga');
  const pendentes = allParcelas.filter(p => p.status === 'pendente');
  const vencidas = pendentes.filter(p => isParcelaVencida(p));
  const aVencer = pendentes.filter(p => !isParcelaVencida(p));

  const totalRecebido = pagas.reduce((s, p) => s + p.valor, 0);
  const totalPendente = pendentes.reduce((s, p) => s + p.valor, 0);
  const totalVencido = vencidas.reduce((s, p) => s + p.valor, 0);
  const inadimplenciaRate = allParcelas.length > 0
    ? ((vencidas.length / allParcelas.length) * 100).toFixed(1) : '0';

  // Hybrid payment summaries — boletos and payment links
  const hybridOS = relevantOS.filter(os => os.pagamento?.valorEntrada && os.pagamento.metodoPagamentoComplementar);
  const boletosAtivos = relevantOS.flatMap(os =>
    (os.pagamento?.parcelas || []).flatMap(p =>
      p.boleto && ['emitido', 'enviado', 'pendente'].includes(p.boleto.status)
        ? [{ ...p.boleto, osId: os.id, osNumero: os.numero, clienteNome: os.clienteNome, unidadeId: os.unidadeId }]
        : []
    )
  );
  const linksAtivos = relevantOS.flatMap(os =>
    (os.pagamento?.parcelas || []).flatMap(p =>
      p.paymentIntent && ['gerado', 'enviado', 'pendente'].includes(p.paymentIntent.status)
        ? [{ ...p.paymentIntent, osId: os.id, osNumero: os.numero, clienteNome: os.clienteNome, unidadeId: os.unidadeId, parcelaValor: p.valor }]
        : []
    )
  );
  const totalEntradas = relevantOS.reduce((s, os) => s + (os.pagamento?.valorEntrada ?? 0), 0);

  // Client-level inadimplency
  const clientesInadimplentes = [...new Set(vencidas.map(v => v.clienteNome))];

  // By client aggregation
  const byClient = [...new Set(allParcelas.map(p => p.clienteId))].map(cid => {
    const cp = allParcelas.filter(p => p.clienteId === cid);
    const cpPagas = cp.filter(p => p.status === 'paga');
    const cpPend = cp.filter(p => p.status === 'pendente');
    const cpVenc = cpPend.filter(p => isParcelaVencida(p));
    const primeiraVenc = [...cpVenc].sort((a, b) => a.vencimento.localeCompare(b.vencimento))[0];
    const cliente = clientes.find(c => c.id === cid);
    return {
      clienteId: cid,
      clienteNome: cp[0]?.clienteNome || '-',
      cpf: cliente?.cpf || '-',
      totalParcelas: cp.length,
      pagas: cpPagas.length,
      vencidas: cpVenc.length,
      valorTotal: cp.reduce((s, p) => s + p.valor, 0),
      valorPago: cpPagas.reduce((s, p) => s + p.valor, 0),
      valorAberto: cpPend.reduce((s, p) => s + p.valor, 0),
      valorVencido: cpVenc.reduce((s, p) => s + p.valor, 0),
      primeiraVencida: primeiraVenc?.vencimento || null,
    };
  }).sort((a, b) => b.valorVencido - a.valorVencido);

  // By unit aggregation
  const byUnit = unidades.filter(u => u.ativa).map(u => {
    const up = allParcelas.filter(p => p.unidadeId === u.id);
    const upPagas = up.filter(p => p.status === 'paga');
    const upPend = up.filter(p => p.status === 'pendente');
    const upVenc = upPend.filter(p => isParcelaVencida(p));
    return {
      unidade: u.nome.replace('Visual Premium - ', ''),
      totalParcelas: up.length,
      pagas: upPagas.length,
      vencidas: upVenc.length,
      valorRecebido: upPagas.reduce((s, p) => s + p.valor, 0),
      valorAberto: upPend.reduce((s, p) => s + p.valor, 0),
      valorVencido: upVenc.reduce((s, p) => s + p.valor, 0),
    };
  });

  // ---------------------------------------------------------------------------
  // Cobranças tab — derive canal/origem from OS, apply filters
  // ---------------------------------------------------------------------------
  const cobWithOs = todasCobrancas.map(c => {
    const os = ordensServico.find(o => o.id === c.osId);
    return { ...c, origemVenda: os?.origemVenda ?? 'otica', canalOperacional: os?.canalOperacional ?? 'loja' };
  }).filter(c => selectedUnidadeId === 'todas' || c.unidadeId === selectedUnidadeId);

  const displayCobrancas = cobWithOs
    .filter(c => cobFiltroCanal === 'todos' || c.origemVenda === cobFiltroCanal)
    .filter(c => cobFiltroTipo === 'todos' || c.tipo === cobFiltroTipo)
    .filter(c => cobFiltroStatus === 'todos' || c.status === cobFiltroStatus)
    .filter(c => cobFiltroProvedor === 'todos' || c.providerId === cobFiltroProvedor)
    .filter(c => {
      if (!cobSearch) return true;
      const q = cobSearch.toLowerCase();
      return c.osNumero.toLowerCase().includes(q) || c.clienteNome.toLowerCase().includes(q);
    });

  const cobPagas      = displayCobrancas.filter(c => c.status === 'paga');
  const cobPendentes  = displayCobrancas.filter(c => ['pendente','gerada','emitida','enviada','rascunho'].includes(c.status));
  const cobVencidas   = displayCobrancas.filter(c => c.status === 'vencida');
  const cobTotal      = displayCobrancas.reduce((s, c) => s + c.valor, 0);
  const cobRecebido   = cobPagas.reduce((s, c) => s + c.valor, 0);
  const cobVencVal    = cobVencidas.reduce((s, c) => s + c.valor, 0);
  const cobTicket     = displayCobrancas.length > 0 ? cobTotal / displayCobrancas.length : 0;
  const cobPendCount  = cobPendentes.length;

  let displayParcelas = filter === 'vencidas' ? vencidas
    : filter === 'a_vencer' ? aVencer
    : filter === 'pagas' ? pagas
    : allParcelas;

  if (search) {
    displayParcelas = displayParcelas.filter(p =>
      p.osNumero.toLowerCase().includes(search.toLowerCase()) ||
      p.clienteNome.toLowerCase().includes(search.toLowerCase())
    );
  }

  displayParcelas = [...displayParcelas].sort((a, b) => a.vencimento.localeCompare(b.vencimento));

  const PAGE_SIZE = 8;
  const totalPages = Math.max(1, Math.ceil(displayParcelas.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = displayParcelas.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const chartData = [
    { name: 'Recebido', valor: totalRecebido, color: 'hsl(158 50% 38%)' },
    { name: 'A Vencer', valor: aVencer.reduce((s, p) => s + p.valor, 0), color: 'hsl(38 85% 48%)' },
    { name: 'Vencido', valor: totalVencido, color: 'hsl(0 60% 48%)' },
  ];

  const handleBaixa = (parcela: typeof allParcelas[0]) => {
    if (!canOperate) {
      toast.error('Apenas perfis financeiros podem registrar baixa.');
      return;
    }
    setConfirmAction({
      title: 'Registrar Baixa',
      desc: `Confirma a baixa da parcela ${parcela.numero} da ${parcela.osNumero} no valor de ${formatCurrency(parcela.valor)}?`,
      action: () => {
        recordAudit({
          action: 'financial_baixa',
          userId: currentUser.id,
          userName: currentUser.nome,
          userRole: currentUser.role,
          unidadeId: parcela.unidadeId,
          unidadeNome: parcela.unidadeNome,
          resource: parcela.osNumero,
          details: `Baixa da parcela ${parcela.numero}/${parcela.osNumero} — ${formatCurrency(parcela.valor)} — cliente ${parcela.clienteNome}`,
          metadata: { parcelaId: parcela.id, valor: parcela.valor },
        });
        toast.success('Baixa registrada com sucesso', {
          description: `Parcela ${parcela.numero} da ${parcela.osNumero} — ${currentUser.nome}`,
        });
      },
    });
  };

  const handleExportCSV = () => {
    const unidadeNome = selectedUnidadeId === 'todas'
      ? 'Todas as unidades'
      : (unidades.find(u => u.id === selectedUnidadeId)?.nome.replace('Visual Premium - ', '') || 'Unidade');
    const filename = buildExportFilename({
      reportKey: 'financeiro-parcelas',
      ext: 'csv',
      unidadeNome,
      userName: currentUser.nome,
    });
    const headers = ['OS', 'Cliente', 'Forma', 'Parcela', 'Vencimento', 'Valor', 'Situacao', 'Status OS'];
    const metaLines = [
      `# Relatorio: Parcelas Financeiras`,
      `# Unidade: ${unidadeNome}`,
      `# Gerado em: ${new Date().toLocaleString('pt-BR')}`,
      `# Usuario: ${currentUser.nome} (${currentUser.role})`,
      '',
    ];
    const rows = displayParcelas.map(p => {
      const displayStatus = getParcelaStatusLabel(p);
      return [p.osNumero, p.clienteNome, p.formaPagamento, p.numero, p.vencimento, p.valor.toFixed(2), displayStatus, p.osStatus];
    });
    const csv = '\uFEFF' + [...metaLines, headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    recordAudit({
      action: 'export',
      userId: currentUser.id,
      userName: currentUser.nome,
      userRole: currentUser.role,
      unidadeId: selectedUnidadeId === 'todas' ? undefined : selectedUnidadeId,
      unidadeNome,
      resource: 'Financeiro / Parcelas',
      details: `Exportou ${displayParcelas.length} parcela(s) — ${filename}`,
    });
    toast.success('Parcelas exportadas', { description: filename });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Financeiro</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Controle de pagamentos e parcelas — {allParcelas.length} parcelas no sistema
            </p>
          </div>
          {canOperate && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-9 text-[11px]" onClick={handleExportCSV}>
                <FileDown className="mr-1 h-3 w-3" />Exportar CSV
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <KpiCard title="Recebido" value={totalRecebido} icon={CheckCircle} isCurrency />
          <KpiCard title="A Receber" value={totalPendente} icon={Clock} isCurrency />
          <KpiCard title="Vencido" value={totalVencido} icon={AlertTriangle} isCurrency />
          <KpiCard title="Inadimplência" value={`${inadimplenciaRate}%`} icon={TrendingUp} />
          <KpiCard title="Clientes Inad." value={clientesInadimplentes.length} icon={Users} />
          <KpiCard title="Total Geral" value={totalRecebido + totalPendente} icon={DollarSign} isCurrency />
        </div>
        {/* Hybrid payment summary bar */}
        {hybridOS.length > 0 && (
          <div className="page-card px-6 py-3.5 flex flex-wrap items-center gap-6 text-[12px]">
            <div className="flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-semibold text-foreground">Cobranças Híbridas</span>
            </div>
            <span className="text-muted-foreground">{hybridOS.length} OS com entrada + saldo</span>
            <span className="text-muted-foreground">Entradas: <span className="font-semibold text-foreground">{formatCurrency(totalEntradas)}</span></span>
            {boletosAtivos.length > 0 && <span className="text-warning font-medium">{boletosAtivos.length} boleto(s) em aberto</span>}
            {linksAtivos.length > 0 && <span className="text-sky-600 dark:text-sky-400 font-medium">{linksAtivos.length} link(s) aguardando pagamento</span>}
          </div>
        )}

        {vencidas.length > 0 && (
          <div className="page-card px-6 py-4 border-destructive/20 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-destructive">{vencidas.length} parcela(s) vencida(s) — {formatCurrency(totalVencido)}</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Clientes: {clientesInadimplentes.join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* View tabs */}
        <div className="flex items-center gap-1.5 border-b border-border pb-0 flex-wrap">
          {([
            ['parcelas', 'Parcelas'],
            ['boletos_links', `Boletos & Links${boletosAtivos.length + linksAtivos.length > 0 ? ` (${boletosAtivos.length + linksAtivos.length})` : ''}`],
            ['por_cliente', 'Por Cliente'],
            ['por_unidade', 'Por Unidade'],
            ['cobranças', `Cobranças${cobPendCount > 0 ? ` (${cobPendCount})` : ''}`],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setView(key as FinView)}
              className={`px-4 py-2.5 text-[12px] font-semibold transition-colors border-b-2 -mb-px ${
                view === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {view === 'parcelas' && (
          <>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="page-card p-6 lg:col-span-2">
                <h2 className="text-sm font-semibold text-foreground mb-4">Composicao Financeira</h2>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData} layout="vertical" barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 16% 91%)" horizontal={false} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(215 12% 48%)' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(215 12% 48%)' }} width={80} />
                    <RechartsTooltip formatter={(value: number) => [formatCurrency(value), '']} contentStyle={{ borderRadius: 8, border: '1px solid hsl(214 16% 91%)', fontSize: 12 }} />
                    <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Quick stats */}
              <div className="page-card p-6 space-y-3">
                <h2 className="text-sm font-semibold text-foreground mb-2">Indicadores Rapidos</h2>
                <div className="space-y-2.5">
                  <div className="flex justify-between text-[13px]"><span className="text-muted-foreground">Parcelas Pagas</span><span className="font-semibold text-success">{pagas.length}</span></div>
                  <div className="flex justify-between text-[13px]"><span className="text-muted-foreground">Parcelas Pendentes</span><span className="font-semibold text-foreground">{pendentes.length}</span></div>
                  <div className="flex justify-between text-[13px]"><span className="text-muted-foreground">Parcelas Vencidas</span><span className="font-semibold text-destructive">{vencidas.length}</span></div>
                  <div className="flex justify-between text-[13px]"><span className="text-muted-foreground">Parcelas A Vencer</span><span className="font-semibold text-warning">{aVencer.length}</span></div>
                  <div className="border-t border-border pt-2 mt-2 flex justify-between text-[13px]"><span className="text-muted-foreground">Total Parcelas</span><span className="font-bold text-foreground">{allParcelas.length}</span></div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative max-w-xs flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar OS ou cliente..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="h-10 pl-9 text-[13px]" />
              </div>
              <div className="flex gap-1.5">
                {([['todos', 'Todos', allParcelas.length], ['vencidas', 'Vencidas', vencidas.length], ['a_vencer', 'A Vencer', aVencer.length], ['pagas', 'Pagas', pagas.length]] as const).map(([key, label, count]) => (
                  <button
                    key={key}
                    onClick={() => { setFilter(key as FinFilter); setPage(1); }}
                    className={`rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                      filter === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {label} <span className="opacity-70">{count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={`page-card ${filter === 'vencidas' && vencidas.length > 0 ? 'border-destructive/20' : ''}`}>
              {displayParcelas.length === 0 ? (
                <EmptyState icon={CreditCard} title="Nenhuma parcela encontrada" description="Ajuste os filtros para visualizar parcelas." />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="table-header px-5 py-3.5 text-left">OS</th>
                          <th className="table-header px-5 py-3.5 text-left">Cliente</th>
                          <th className="table-header px-5 py-3.5 text-left">Forma</th>
                          <th className="table-header px-5 py-3.5 text-left">Parcela</th>
                          <th className="table-header px-5 py-3.5 text-left">Vencimento</th>
                          <th className="table-header px-5 py-3.5 text-right">Valor</th>
                          <th className="table-header px-5 py-3.5 text-left">Situacao</th>
                          <th className="table-header px-5 py-3.5 text-center w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginated.map(p => {
                          const displayStatus = getParcelaDisplayStatus(p);
                          const isOverdue = displayStatus === 'vencida';
                          return (
                            <tr key={p.id} className={`border-b border-border/40 last:border-0 transition-colors hover:bg-muted/40 ${isOverdue ? 'bg-destructive/[0.02]' : ''}`}>
                              <td className="px-5 py-3 font-medium text-primary">
                                <Link to={`/ordens/${p.osId}`} className="hover:underline">{p.osNumero}</Link>
                              </td>
                              <td className="px-5 py-3 text-foreground">{p.clienteNome}</td>
                              <td className="px-5 py-3 text-muted-foreground text-[12px]">{p.formaPagamento}</td>
                              <td className="px-5 py-3 text-foreground">{p.numero}</td>
                              <td className={`px-5 py-3 ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>{formatDate(p.vencimento)}</td>
                              <td className="px-5 py-3 text-right font-medium text-foreground">{formatCurrency(p.valor)}</td>
                              <td className="px-5 py-3">
                                <span className={`status-badge ${getParcelaStatusClass(p)}`}>
                                  {getParcelaStatusLabel(p)}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-center">
                                {p.status !== 'paga' && (
                                  canOperate ? (
                                    <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => handleBaixa(p)}>Baixar</Button>
                                  ) : (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-7 text-[11px] opacity-50 cursor-not-allowed" disabled>
                                          <Lock className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent><p className="text-[12px]">Apenas perfis financeiros podem registrar baixa.</p></TooltipContent>
                                    </Tooltip>
                                  )
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {totalPages > 1 && (
                    <TablePagination currentPage={safePage} totalPages={totalPages} totalItems={displayParcelas.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
                  )}
                </>
              )}
            </div>
          </>
        )}

        {view === 'boletos_links' && (
          <div className="space-y-6">
            {/* Boletos Sicoob */}
            <div className="page-card">
              <div className="border-b border-border px-6 py-4 flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Boletos em Aberto ({boletosAtivos.length})</h2>
              </div>
              {boletosAtivos.length === 0 ? (
                <EmptyState icon={FileText} title="Nenhum boleto em aberto" description="Todos os boletos foram pagos ou cancelados." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="table-header px-5 py-3 text-left">OS</th>
                        <th className="table-header px-5 py-3 text-left">Cliente</th>
                        <th className="table-header px-5 py-3 text-left">Banco</th>
                        <th className="table-header px-5 py-3 text-left">Nosso Nº</th>
                        <th className="table-header px-5 py-3 text-left">Vencimento</th>
                        <th className="table-header px-5 py-3 text-right">Valor</th>
                        <th className="table-header px-5 py-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {boletosAtivos.map(b => (
                        <tr key={b.id} className="border-b border-border/40 last:border-0 hover:bg-muted/40">
                          <td className="px-5 py-3 font-medium text-primary">
                            <Link to={`/ordens/${b.osId}`} className="hover:underline">{b.osNumero}</Link>
                          </td>
                          <td className="px-5 py-3 text-foreground">{b.clienteNome}</td>
                          <td className="px-5 py-3 text-muted-foreground text-[12px]">{b.banco}</td>
                          <td className="px-5 py-3 font-mono text-[11px] text-muted-foreground">{b.nossoNumero || '—'}</td>
                          <td className="px-5 py-3 text-muted-foreground text-[12px]">{formatDate(b.vencimento)}</td>
                          <td className="px-5 py-3 text-right font-medium text-foreground">{formatCurrency(b.valorNominal)}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${BOLETO_STATUS_CLASSES[b.status]}`}>
                              {BOLETO_STATUS_LABELS[b.status]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Links de Pagamento */}
            <div className="page-card">
              <div className="border-b border-border px-6 py-4 flex items-center gap-3">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Links de Pagamento Ativos ({linksAtivos.length})</h2>
              </div>
              {linksAtivos.length === 0 ? (
                <EmptyState icon={Link2} title="Nenhum link ativo" description="Nenhum link de pagamento pendente no momento." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="table-header px-5 py-3 text-left">OS</th>
                        <th className="table-header px-5 py-3 text-left">Cliente</th>
                        <th className="table-header px-5 py-3 text-left">Provedor</th>
                        <th className="table-header px-5 py-3 text-left">ID Externo</th>
                        <th className="table-header px-5 py-3 text-left">Expira em</th>
                        <th className="table-header px-5 py-3 text-right">Valor</th>
                        <th className="table-header px-5 py-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linksAtivos.map(l => (
                        <tr key={l.id} className="border-b border-border/40 last:border-0 hover:bg-muted/40">
                          <td className="px-5 py-3 font-medium text-primary">
                            <Link to={`/ordens/${l.osId}`} className="hover:underline">{l.osNumero}</Link>
                          </td>
                          <td className="px-5 py-3 text-foreground">{l.clienteNome}</td>
                          <td className="px-5 py-3 text-muted-foreground text-[12px] capitalize">{l.provider.replace('_', ' ')}</td>
                          <td className="px-5 py-3 font-mono text-[11px] text-muted-foreground">{l.externalId || '—'}</td>
                          <td className="px-5 py-3 text-muted-foreground text-[12px]">{l.expiresAt ? formatDate(l.expiresAt.split('T')[0]) : '—'}</td>
                          <td className="px-5 py-3 text-right font-medium text-foreground">{formatCurrency(l.parcelaValor)}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${PAYMENT_INTENT_STATUS_CLASSES[l.status]}`}>
                              {PAYMENT_INTENT_STATUS_LABELS[l.status]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'por_cliente' && (
          <div className="page-card">
            <div className="border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Inadimplencia por Cliente</h2>
              <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => {
                const csv = '\uFEFF' + ['Cliente;CPF;Parcelas;Pagas;Vencidas;Valor Total;Valor Pago;Valor Aberto;Valor Vencido;1a Vencida',
                  ...byClient.map(r => [r.clienteNome, r.cpf, r.totalParcelas, r.pagas, r.vencidas, r.valorTotal.toFixed(2), r.valorPago.toFixed(2), r.valorAberto.toFixed(2), r.valorVencido.toFixed(2), r.primeiraVencida || '-'].join(';'))
                ].join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'inadimplencia_clientes.csv';
                a.click();
                URL.revokeObjectURL(url);
                toast.success('Exportado com sucesso');
              }}>
                <FileDown className="mr-1 h-3 w-3" />CSV
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="table-header px-5 py-3 text-left">Cliente</th>
                    <th className="table-header px-5 py-3 text-left">CPF</th>
                    <th className="table-header px-5 py-3 text-center">Parcelas</th>
                    <th className="table-header px-5 py-3 text-center">Pagas</th>
                    <th className="table-header px-5 py-3 text-center">Vencidas</th>
                    <th className="table-header px-5 py-3 text-right">Total</th>
                    <th className="table-header px-5 py-3 text-right">Pago</th>
                    <th className="table-header px-5 py-3 text-right">Aberto</th>
                    <th className="table-header px-5 py-3 text-right">Vencido</th>
                    <th className="table-header px-5 py-3 text-left">1a Vencida</th>
                  </tr>
                </thead>
                <tbody>
                  {byClient.map((r, i) => (
                    <tr key={i} className={`border-b border-border/40 last:border-0 hover:bg-muted/40 ${r.vencidas > 0 ? 'bg-destructive/[0.02]' : ''}`}>
                      <td className="px-5 py-3 font-medium text-foreground">{r.clienteNome}</td>
                      <td className="px-5 py-3 text-muted-foreground font-mono text-[11px]">{r.cpf}</td>
                      <td className="px-5 py-3 text-center">{r.totalParcelas}</td>
                      <td className="px-5 py-3 text-center text-success font-medium">{r.pagas}</td>
                      <td className="px-5 py-3 text-center text-destructive font-medium">{r.vencidas || '-'}</td>
                      <td className="px-5 py-3 text-right font-medium">{formatCurrency(r.valorTotal)}</td>
                      <td className="px-5 py-3 text-right text-success">{formatCurrency(r.valorPago)}</td>
                      <td className="px-5 py-3 text-right">{formatCurrency(r.valorAberto)}</td>
                      <td className="px-5 py-3 text-right text-destructive font-medium">{formatCurrency(r.valorVencido)}</td>
                      <td className="px-5 py-3 text-muted-foreground text-[12px]">{r.primeiraVencida ? formatDate(r.primeiraVencida) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'por_unidade' && (
          <div className="page-card">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold text-foreground">Financeiro por Unidade</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="table-header px-6 py-3 text-left">Unidade</th>
                    <th className="table-header px-6 py-3 text-center">Parcelas</th>
                    <th className="table-header px-6 py-3 text-center">Pagas</th>
                    <th className="table-header px-6 py-3 text-center">Vencidas</th>
                    <th className="table-header px-6 py-3 text-right">Recebido</th>
                    <th className="table-header px-6 py-3 text-right">Aberto</th>
                    <th className="table-header px-6 py-3 text-right">Vencido</th>
                  </tr>
                </thead>
                <tbody>
                  {byUnit.map((r, i) => (
                    <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-muted/40">
                      <td className="px-6 py-3 font-medium text-foreground">{r.unidade}</td>
                      <td className="px-6 py-3 text-center">{r.totalParcelas}</td>
                      <td className="px-6 py-3 text-center text-success font-medium">{r.pagas}</td>
                      <td className="px-6 py-3 text-center text-destructive font-medium">{r.vencidas || '-'}</td>
                      <td className="px-6 py-3 text-right text-success">{formatCurrency(r.valorRecebido)}</td>
                      <td className="px-6 py-3 text-right">{formatCurrency(r.valorAberto)}</td>
                      <td className="px-6 py-3 text-right text-destructive font-medium">{formatCurrency(r.valorVencido)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'cobranças' && (
          <div className="space-y-5">
            {/* KPIs das Cobranças */}
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <KpiCard title="Total" value={cobTotal} icon={DollarSign} isCurrency />
              <KpiCard title="Recebido" value={cobRecebido} icon={CheckCircle} isCurrency />
              <KpiCard title="Pendente" value={cobPendentes.reduce((s,c)=>s+c.valor,0)} icon={Clock} isCurrency />
              <KpiCard title="Vencido" value={cobVencVal} icon={AlertTriangle} isCurrency />
              <KpiCard title="Cobranças" value={displayCobrancas.length} icon={CreditCard} />
              <KpiCard title="Ticket Médio" value={cobTicket} icon={TrendingUp} isCurrency />
            </div>

            {/* Filtros operacionais */}
            <div className="page-card p-4 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Filtros</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    placeholder="OS ou cliente..."
                    value={cobSearch}
                    onChange={e => setCobSearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-[12px] outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <Select value={cobFiltroCanal} onValueChange={v => setCobFiltroCanal(v as typeof cobFiltroCanal)}>
                  <SelectTrigger className="h-9 text-[12px]"><SelectValue placeholder="Canal" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os canais</SelectItem>
                    <SelectItem value="otica">Ótica</SelectItem>
                    <SelectItem value="externa">Externa (Central)</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={cobFiltroTipo} onValueChange={v => setCobFiltroTipo(v as typeof cobFiltroTipo)}>
                  <SelectTrigger className="h-9 text-[12px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    {(Object.keys(TIPO_COBRANCA_LABELS) as (keyof typeof TIPO_COBRANCA_LABELS)[]).map(k => (
                      <SelectItem key={k} value={k}>{TIPO_COBRANCA_LABELS[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={cobFiltroStatus} onValueChange={v => setCobFiltroStatus(v as typeof cobFiltroStatus)}>
                  <SelectTrigger className="h-9 text-[12px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    {(Object.keys(STATUS_COBRANCA_LABELS) as (keyof typeof STATUS_COBRANCA_LABELS)[]).map(k => (
                      <SelectItem key={k} value={k}>{STATUS_COBRANCA_LABELS[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={cobFiltroProvedor} onValueChange={setCobFiltroProvedor}>
                  <SelectTrigger className="h-9 text-[12px]"><SelectValue placeholder="Provedor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os provedores</SelectItem>
                    {provedoresFinanceiros.filter(p => p.ativo).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tabela de Cobranças */}
            <div className="page-card">
              {displayCobrancas.length === 0 ? (
                <EmptyState icon={CreditCard} title="Nenhuma cobrança encontrada" description="Ajuste os filtros ou crie cobranças vinculadas às OS." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="table-header px-5 py-3 text-left">OS</th>
                        <th className="table-header px-5 py-3 text-left">Cliente</th>
                        <th className="table-header px-5 py-3 text-left">Canal</th>
                        <th className="table-header px-5 py-3 text-left">Tipo</th>
                        <th className="table-header px-5 py-3 text-left">Provedor</th>
                        <th className="table-header px-5 py-3 text-left">Vencimento</th>
                        <th className="table-header px-5 py-3 text-right">Valor</th>
                        <th className="table-header px-5 py-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayCobrancas.map(c => {
                        const prov = c.providerId ? getProvedorById(c.providerId) : undefined;
                        const isVenc = c.status === 'vencida';
                        return (
                          <tr key={c.id} className={`border-b border-border/40 last:border-0 hover:bg-muted/40 ${isVenc ? 'bg-destructive/[0.02]' : ''}`}>
                            <td className="px-5 py-3 font-medium text-primary">
                              <Link to={`/ordens/${c.osId}`} className="hover:underline">{c.osNumero}</Link>
                            </td>
                            <td className="px-5 py-3 text-foreground">{c.clienteNome}</td>
                            <td className="px-5 py-3 text-muted-foreground text-[11px]">
                              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${c.origemVenda === 'externa' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' : 'bg-muted text-muted-foreground'}`}>
                                {c.origemVenda === 'externa' ? 'Externa' : 'Ótica'}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-[12px] text-muted-foreground">{TIPO_COBRANCA_LABELS[c.tipo]}</td>
                            <td className="px-5 py-3 text-[12px] text-muted-foreground">{prov?.nome ?? '—'}</td>
                            <td className={`px-5 py-3 text-[12px] ${isVenc ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                              {formatDate(c.vencimento)}
                            </td>
                            <td className="px-5 py-3 text-right font-medium text-foreground">{formatCurrency(c.valor)}</td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${STATUS_COBRANCA_CLASSES[c.status]}`}>
                                {STATUS_COBRANCA_LABELS[c.status]}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="page-card px-6 py-4 flex items-center gap-3 border-dashed">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Plug className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-foreground">Provedores Financeiros Plugáveis</p>
            <p className="text-[12px] text-muted-foreground">Configure bancos, gateways e adquirentes como provedores externos. Boleto, Pix, link de pagamento e QR sem acoplamento a provedor específico.</p>
          </div>

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
