import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { KpiCard } from '@/components/KpiCard';
import { StatusBadge } from '@/components/StatusBadge';
import { ordensServico, formatCurrency, formatDate, unidades, clientes } from '@/data/mockData';
import { useApp } from '@/contexts/AppContext';
import { BarChart3, TrendingUp, Users, FileText, Shield, Timer, Truck, AlertTriangle, DollarSign, Download, FileSpreadsheet, FileDown, Lock, Info } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { Link } from 'react-router-dom';
import { TablePagination } from '@/components/TablePagination';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { Tooltip as UTooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { recordAudit, buildExportFilename, formatAuditTimestamp } from '@/lib/audit';

const COLORS = ['hsl(213 56% 28%)', 'hsl(207 75% 48%)', 'hsl(38 85% 48%)', 'hsl(158 50% 38%)', 'hsl(213 56% 48%)', 'hsl(0 60% 48%)'];

type ReportTab = 'geral' | 'financeiro' | 'clientes' | 'unidades';
type ExportCell = string | number | null | undefined;
type ExportRow = Record<string, ExportCell>;

function buildFinancialRows() {
  return ordensServico.map(os => {
    const parcelas = os.pagamento?.parcelas || [];
    const pagas = parcelas.filter(p => p.status === 'paga');
    const pendentes = parcelas.filter(p => p.status === 'pendente');
    const vencidas = pendentes.filter(p => p.vencimento < '2025-04-12');
    const primeiraVencida = [...vencidas].sort((a, b) => a.vencimento.localeCompare(b.vencimento))[0];
    const cliente = clientes.find(c => c.id === os.clienteId);

    return {
      clienteNome: os.clienteNome,
      cpf: cliente?.cpf || '-',
      osNumero: os.numero,
      unidade: os.unidadeNome.replace('Visual Premium - ', ''),
      totalParcelas: parcelas.length,
      parcelasVencidas: vencidas.length,
      parcelasPagas: pagas.length,
      valorTotal: os.valorTotal,
      valorPago: pagas.reduce((s, p) => s + p.valor, 0),
      valorAberto: pendentes.reduce((s, p) => s + p.valor, 0),
      primeiraVencida: primeiraVencida?.vencimento || null,
      statusFinanceiro: vencidas.length > 0 ? 'Inadimplente' : pendentes.length > 0 ? 'Pendente' : 'Quitado',
      statusOS: os.status,
    };
  });
}

function buildClientRows() {
  return clientes.map(c => {
    const osCliente = ordensServico.filter(os => os.clienteId === c.id);
    const parcelas = osCliente.flatMap(os => os.pagamento?.parcelas || []);
    const pagas = parcelas.filter(p => p.status === 'paga');
    const pendentes = parcelas.filter(p => p.status === 'pendente');
    const vencidas = pendentes.filter(p => p.vencimento < '2025-04-12');
    const primeiraVencida = [...vencidas].sort((a, b) => a.vencimento.localeCompare(b.vencimento))[0];

    return {
      nome: c.nome,
      cpf: c.cpf,
      telefone: c.telefone,
      totalOS: osCliente.length,
      totalParcelas: parcelas.length,
      parcelasPagas: pagas.length,
      parcelasVencidas: vencidas.length,
      valorTotal: osCliente.reduce((s, os) => s + os.valorTotal, 0),
      valorPago: pagas.reduce((s, p) => s + p.valor, 0),
      valorAberto: pendentes.reduce((s, p) => s + p.valor, 0),
      primeiraVencida: primeiraVencida?.vencimento || null,
      statusFinanceiro: vencidas.length > 0 ? 'Inadimplente' : pendentes.length > 0 ? 'Pendente' : 'Quitado',
    };
  });
}

interface ExportMeta {
  unidadeNome: string;
  userName: string;
  userRole: string;
  generatedAt: Date;
  reportTitle: string;
}

function metaHeaderLines(meta: ExportMeta): string[] {
  return [
    `# Relatorio: ${meta.reportTitle}`,
    `# Unidade: ${meta.unidadeNome}`,
    `# Periodo: ${meta.generatedAt.getFullYear()}`,
    `# Gerado em: ${formatAuditTimestamp(meta.generatedAt.toISOString())}`,
    `# Usuario: ${meta.userName} (${meta.userRole})`,
    '',
  ];
}

function downloadCSV(data: ExportRow[], filename: string, meta: ExportMeta) {
  if (data.length === 0) {
    toast.error('Nenhum dado disponivel para exportar');
    return;
  }
  const headers = Object.keys(data[0]);
  const csv = [
    ...metaHeaderLines(meta),
    headers.join(';'),
    ...data.map(row => headers.map(h => {
      const val = row[h];
      return typeof val === 'number' ? val.toFixed(2).replace('.', ',') : `"${val ?? ''}"`;
    }).join(';'))
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('Exportacao concluida', { description: filename });
}

function downloadExcel(data: ExportRow[], filename: string, meta: ExportMeta) {
  if (data.length === 0) {
    toast.error('Nenhum dado disponivel para exportar');
    return;
  }
  const headers = Object.keys(data[0]);
  let xml = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">';
  xml += '<Worksheet ss:Name="Relatorio"><Table>';

  // Metadata rows
  metaHeaderLines(meta).forEach(line => {
    xml += `<Row><Cell><Data ss:Type="String">${line.replace(/^# ?/, '')}</Data></Cell></Row>`;
  });

  // Header row
  xml += '<Row>';
  headers.forEach(h => { xml += `<Cell><Data ss:Type="String">${h}</Data></Cell>`; });
  xml += '</Row>';

  // Data rows
  data.forEach(row => {
    xml += '<Row>';
    headers.forEach(h => {
      const val = row[h];
      const type = typeof val === 'number' ? 'Number' : 'String';
      xml += `<Cell><Data ss:Type="${type}">${val ?? ''}</Data></Cell>`;
    });
    xml += '</Row>';
  });

  xml += '</Table></Worksheet></Workbook>';

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('Exportacao concluida', { description: filename });
}

export default function RelatoriosPage() {
  const { hasPermission, selectedUnidadeId, currentUser } = useApp();
  const [tab, setTab] = useState<ReportTab>('geral');
  const [finPage, setFinPage] = useState(1);
  const [clientPage, setClientPage] = useState(1);

  if (!hasPermission(['admin', 'gestor'])) {
    return (
      <AppLayout>
        <EmptyState icon={Shield} title="Acesso restrito" description="Apenas gestores e administradores podem visualizar relatorios." />
      </AppLayout>
    );
  }

  // Export permission rules:
  // - admin: pode exportar tudo (CSV, Excel, todos os relatorios).
  // - gestor: pode exportar visao geral e por unidade da SUA rede; relatorios financeiros e por cliente apenas com escopo restrito a unidade selecionada.
  const canExportFinancial = hasPermission(['admin']) || (hasPermission(['gestor']) && selectedUnidadeId !== 'todas');
  const canExportClient = hasPermission(['admin']) || (hasPermission(['gestor']) && selectedUnidadeId !== 'todas');
  const canExportGeneral = hasPermission(['admin', 'gestor']);

  const unidadeNomeAtual = selectedUnidadeId === 'todas'
    ? 'Todas as unidades'
    : (unidades.find(u => u.id === selectedUnidadeId)?.nome.replace('Visual Premium - ', '') || 'Unidade');

  const relevantOS = ordensServico.filter(os =>
    selectedUnidadeId === 'todas' || os.unidadeId === selectedUnidadeId
  );

  const totalOS = relevantOS.length;
  const ticketMedio = totalOS > 0 ? relevantOS.reduce((s, os) => s + os.valorTotal, 0) / totalOS : 0;
  const faturamentoTotal = relevantOS.reduce((s, os) => s + os.valorTotal, 0);

  const entregues = relevantOS.filter(os => os.status === 'entregue' && os.dataEntrega);
  const avgProduction = entregues.length > 0
    ? (entregues.reduce((s, os) => {
        const diff = new Date(os.dataEntrega!).getTime() - new Date(os.dataCriacao).getTime();
        return s + diff / 86400000;
      }, 0) / entregues.length).toFixed(1)
    : '-';

  const allParcelas = relevantOS.flatMap(os => os.pagamento?.parcelas || []);
  const vencidas = allParcelas.filter(p => p.status === 'pendente' && p.vencimento < '2025-04-12');
  const inadRate = allParcelas.length > 0 ? ((vencidas.length / allParcelas.length) * 100).toFixed(1) : '0';

  const porUnidade = unidades.filter(u => u.ativa).map(u => ({
    ...u,
    os: relevantOS.filter(os => os.unidadeId === u.id).length,
    faturamento: relevantOS.filter(os => os.unidadeId === u.id).reduce((s, os) => s + os.valorTotal, 0),
  }));

  const porStatus = ['recebida', 'producao', 'pendencia', 'pronta', 'enviada', 'entregue'] as const;
  const statusData = porStatus.map((status, i) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: relevantOS.filter(os => os.status === status).length,
    color: COLORS[i % COLORS.length],
  })).filter(d => d.value > 0);

  const unitChartData = porUnidade.map(u => ({
    name: u.nome.replace('Visual Premium - ', ''),
    os: u.os,
    faturamento: u.faturamento,
  }));

  // Financial report data
  const finRows = buildFinancialRows().filter(r =>
    selectedUnidadeId === 'todas' || ordensServico.find(os => os.numero === r.osNumero)?.unidadeId === selectedUnidadeId
  );
  const FIN_PAGE_SIZE = 8;
  const finTotalPages = Math.max(1, Math.ceil(finRows.length / FIN_PAGE_SIZE));
  const finSafePage = Math.min(finPage, finTotalPages);
  const finPaginated = finRows.slice((finSafePage - 1) * FIN_PAGE_SIZE, finSafePage * FIN_PAGE_SIZE);

  // Client report data
  const clientRows = buildClientRows();
  const CLI_PAGE_SIZE = 8;
  const cliTotalPages = Math.max(1, Math.ceil(clientRows.length / CLI_PAGE_SIZE));
  const cliSafePage = Math.min(clientPage, cliTotalPages);
  const cliPaginated = clientRows.slice((cliSafePage - 1) * CLI_PAGE_SIZE, cliSafePage * CLI_PAGE_SIZE);

  const tabs: { key: ReportTab; label: string }[] = [
    { key: 'geral', label: 'Visao Geral' },
    { key: 'financeiro', label: 'Financeiro' },
    { key: 'clientes', label: 'Por Cliente' },
    { key: 'unidades', label: 'Por Unidade' },
  ];

  const buildMeta = (reportTitle: string): ExportMeta => ({
    unidadeNome: unidadeNomeAtual,
    userName: currentUser.nome,
    userRole: currentUser.role,
    generatedAt: new Date(),
    reportTitle,
  });

  const auditExport = (reportKey: string, count: number, filename: string) => {
    recordAudit({
      action: 'export',
      userId: currentUser.id,
      userName: currentUser.nome,
      userRole: currentUser.role,
      unidadeId: selectedUnidadeId === 'todas' ? undefined : selectedUnidadeId,
      unidadeNome: unidadeNomeAtual,
      resource: `Relatorio ${reportKey}`,
      details: `Exportou ${count} linha(s) — ${filename}`,
      metadata: { reportKey, count, filename },
    });
  };

  const denyExport = () =>
    toast.error('Exportacao restrita', {
      description: 'Selecione uma unidade especifica ou solicite acesso ao administrador.',
    });

  const finData = finRows.map(r => ({
    'Cliente': r.clienteNome,
    'CPF': r.cpf,
    'OS': r.osNumero,
    'Unidade': r.unidade,
    'Total Parcelas': r.totalParcelas,
    'Parcelas Pagas': r.parcelasPagas,
    'Parcelas Vencidas': r.parcelasVencidas,
    'Valor Total': r.valorTotal,
    'Valor Pago': r.valorPago,
    'Valor Aberto': r.valorAberto,
    'Primeira Vencida': r.primeiraVencida || '-',
    'Status Financeiro': r.statusFinanceiro,
  }));

  const cliData = clientRows.map(r => ({
    'Cliente': r.nome,
    'CPF': r.cpf,
    'Telefone': r.telefone,
    'Total OS': r.totalOS,
    'Total Parcelas': r.totalParcelas,
    'Parcelas Pagas': r.parcelasPagas,
    'Parcelas Vencidas': r.parcelasVencidas,
    'Valor Total': r.valorTotal,
    'Valor Pago': r.valorPago,
    'Valor Aberto': r.valorAberto,
    'Primeira Vencida': r.primeiraVencida || '-',
    'Status Financeiro': r.statusFinanceiro,
  }));

  const handleExportFinCSV = () => {
    if (!canExportFinancial) return denyExport();
    const filename = buildExportFilename({ reportKey: 'financeiro', ext: 'csv', unidadeNome: unidadeNomeAtual, userName: currentUser.nome });
    downloadCSV(finData, filename, buildMeta('Relatorio Financeiro por OS'));
    auditExport('Financeiro', finData.length, filename);
  };

  const handleExportFinExcel = () => {
    if (!canExportFinancial) return denyExport();
    const filename = buildExportFilename({ reportKey: 'financeiro', ext: 'xls', unidadeNome: unidadeNomeAtual, userName: currentUser.nome });
    downloadExcel(finData, filename, buildMeta('Relatorio Financeiro por OS'));
    auditExport('Financeiro', finData.length, filename);
  };

  const handleExportCliCSV = () => {
    if (!canExportClient) return denyExport();
    const filename = buildExportFilename({ reportKey: 'clientes', ext: 'csv', unidadeNome: unidadeNomeAtual, userName: currentUser.nome });
    downloadCSV(cliData, filename, buildMeta('Relatorio por Cliente'));
    auditExport('Clientes', cliData.length, filename);
  };

  const handleExportCliExcel = () => {
    if (!canExportClient) return denyExport();
    const filename = buildExportFilename({ reportKey: 'clientes', ext: 'xls', unidadeNome: unidadeNomeAtual, userName: currentUser.nome });
    downloadExcel(cliData, filename, buildMeta('Relatorio por Cliente'));
    auditExport('Clientes', cliData.length, filename);
  };

  const renderExportButtons = (canExport: boolean, onCsv: () => void, onExcel?: () => void, restrictionMsg = 'Exportacao restrita. Selecione uma unidade especifica ou solicite acesso ao administrador.') => (
    <div className="flex items-center gap-2">
      {canExport ? (
        <>
          <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={onCsv}>
            <FileDown className="mr-1 h-3 w-3" />CSV
          </Button>
          {onExcel && (
            <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={onExcel}>
              <FileSpreadsheet className="mr-1 h-3 w-3" />Excel
            </Button>
          )}
        </>
      ) : (
        <UTooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}>
              <Button variant="outline" size="sm" className="h-8 text-[11px] opacity-60 cursor-not-allowed" disabled>
                <Lock className="mr-1 h-3 w-3" />Exportacao bloqueada
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent><p className="text-[12px] max-w-xs">{restrictionMsg}</p></TooltipContent>
        </UTooltip>
      )}
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Relatorios e Indicadores</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Analise consolidada · Escopo: <span className="font-medium text-foreground">{unidadeNomeAtual}</span>
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              Exportacoes incluem metadados e ficam registradas em <Link to="/auditoria" className="font-semibold text-primary hover:underline">Auditoria</Link>
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 border-b border-border pb-0">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-[12px] font-semibold transition-colors border-b-2 -mb-px ${
                tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'geral' && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              <KpiCard title="Total de OS" value={totalOS} icon={FileText} />
              <KpiCard title="Ticket Medio" value={ticketMedio} icon={TrendingUp} isCurrency />
              <KpiCard title="Faturamento" value={faturamentoTotal} icon={DollarSign} isCurrency />
              <KpiCard title="Tempo Medio" value={`${avgProduction}d`} icon={Timer} />
              <KpiCard title="Entregues" value={entregues.length} icon={Truck} />
              <KpiCard title="Inadimplencia" value={`${inadRate}%`} icon={AlertTriangle} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="page-card p-6">
                <h2 className="text-sm font-semibold text-foreground mb-4">Volume por Unidade</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={unitChartData} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 16% 91%)" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(215 12% 48%)' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(215 12% 48%)' }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(214 16% 91%)', fontSize: 12 }} />
                    <Bar dataKey="os" fill="hsl(213 56% 28%)" radius={[4, 4, 0, 0]} name="Ordens" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="page-card p-6">
                <h2 className="text-sm font-semibold text-foreground mb-4">Distribuicao por Status</h2>
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" stroke="none">
                        {statusData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {statusData.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-[12px]">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ backgroundColor: d.color }} />
                          <span className="text-muted-foreground">{d.name}</span>
                        </div>
                        <span className="font-semibold text-foreground">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Status breakdown */}
            <div className="page-card p-6">
              <h2 className="section-title mb-5">Distribuicao Detalhada por Status</h2>
              <div className="space-y-4">
                {porStatus.map(status => {
                  const count = relevantOS.filter(os => os.status === status).length;
                  const pct = totalOS > 0 ? (count / totalOS) * 100 : 0;
                  return (
                    <div key={status} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <StatusBadge status={status} />
                        <span className="text-sm font-bold text-foreground">{count} <span className="text-muted-foreground font-normal">({pct.toFixed(0)}%)</span></span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 'financeiro' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Relatorio Financeiro por OS</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">Escopo: {unidadeNomeAtual} · {finRows.length} linha(s)</p>
              </div>
              {renderExportButtons(canExportFinancial, handleExportFinCSV, handleExportFinExcel,
                'Gestores podem exportar relatorios financeiros apenas com uma unidade especifica selecionada. Apenas administradores exportam consolidado.')}
            </div>

            <div className="page-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="table-header px-4 py-3 text-left">Cliente</th>
                      <th className="table-header px-4 py-3 text-left">CPF</th>
                      <th className="table-header px-4 py-3 text-left">OS</th>
                      <th className="table-header px-4 py-3 text-left">Unidade</th>
                      <th className="table-header px-4 py-3 text-center">Parcelas</th>
                      <th className="table-header px-4 py-3 text-center">Pagas</th>
                      <th className="table-header px-4 py-3 text-center">Vencidas</th>
                      <th className="table-header px-4 py-3 text-right">Valor Total</th>
                      <th className="table-header px-4 py-3 text-right">Pago</th>
                      <th className="table-header px-4 py-3 text-right">Aberto</th>
                      <th className="table-header px-4 py-3 text-left">1a Vencida</th>
                      <th className="table-header px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finPaginated.map((r, i) => (
                      <tr key={i} className={`border-b border-border/40 last:border-0 transition-colors hover:bg-muted/40 ${r.statusFinanceiro === 'Inadimplente' ? 'bg-destructive/[0.02]' : ''}`}>
                        <td className="px-4 py-3 font-medium text-foreground text-[13px]">{r.clienteNome}</td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-[11px]">{r.cpf}</td>
                        <td className="px-4 py-3 font-medium text-primary text-[13px]">{r.osNumero}</td>
                        <td className="px-4 py-3 text-muted-foreground text-[12px]">{r.unidade}</td>
                        <td className="px-4 py-3 text-center text-foreground">{r.totalParcelas}</td>
                        <td className="px-4 py-3 text-center text-success font-medium">{r.parcelasPagas}</td>
                        <td className="px-4 py-3 text-center text-destructive font-medium">{r.parcelasVencidas || '-'}</td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">{formatCurrency(r.valorTotal)}</td>
                        <td className="px-4 py-3 text-right text-success">{formatCurrency(r.valorPago)}</td>
                        <td className="px-4 py-3 text-right text-foreground">{formatCurrency(r.valorAberto)}</td>
                        <td className="px-4 py-3 text-muted-foreground text-[12px]">{r.primeiraVencida ? formatDate(r.primeiraVencida) : '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`status-badge ${r.statusFinanceiro === 'Quitado' ? 'status-pronta' : r.statusFinanceiro === 'Inadimplente' ? 'status-cancelada' : 'status-pendencia'}`}>
                            {r.statusFinanceiro}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {finTotalPages > 1 && (
                <TablePagination currentPage={finSafePage} totalPages={finTotalPages} totalItems={finRows.length} pageSize={FIN_PAGE_SIZE} onPageChange={setFinPage} />
              )}
            </div>
          </div>
        )}

        {tab === 'clientes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Relatorio por Cliente</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">{clientRows.length} cliente(s) · CRM operacional</p>
              </div>
              {renderExportButtons(canExportClient, handleExportCliCSV, handleExportCliExcel,
                'Gestores podem exportar relatorios por cliente apenas com unidade selecionada. Administradores exportam consolidado.')}
            </div>

            <div className="page-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="table-header px-4 py-3 text-left">Cliente</th>
                      <th className="table-header px-4 py-3 text-left">CPF</th>
                      <th className="table-header px-4 py-3 text-left">Telefone</th>
                      <th className="table-header px-4 py-3 text-center">OS</th>
                      <th className="table-header px-4 py-3 text-center">Parcelas</th>
                      <th className="table-header px-4 py-3 text-center">Pagas</th>
                      <th className="table-header px-4 py-3 text-center">Vencidas</th>
                      <th className="table-header px-4 py-3 text-right">Valor Total</th>
                      <th className="table-header px-4 py-3 text-right">Pago</th>
                      <th className="table-header px-4 py-3 text-right">Aberto</th>
                      <th className="table-header px-4 py-3 text-left">1a Vencida</th>
                      <th className="table-header px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cliPaginated.map((r, i) => (
                      <tr key={i} className={`border-b border-border/40 last:border-0 transition-colors hover:bg-muted/40 ${r.statusFinanceiro === 'Inadimplente' ? 'bg-destructive/[0.02]' : ''}`}>
                        <td className="px-4 py-3 font-medium text-foreground text-[13px]">{r.nome}</td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-[11px]">{r.cpf}</td>
                        <td className="px-4 py-3 text-muted-foreground text-[12px]">{r.telefone}</td>
                        <td className="px-4 py-3 text-center font-medium text-foreground">{r.totalOS}</td>
                        <td className="px-4 py-3 text-center text-foreground">{r.totalParcelas}</td>
                        <td className="px-4 py-3 text-center text-success font-medium">{r.parcelasPagas}</td>
                        <td className="px-4 py-3 text-center text-destructive font-medium">{r.parcelasVencidas || '-'}</td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">{formatCurrency(r.valorTotal)}</td>
                        <td className="px-4 py-3 text-right text-success">{formatCurrency(r.valorPago)}</td>
                        <td className="px-4 py-3 text-right text-foreground">{formatCurrency(r.valorAberto)}</td>
                        <td className="px-4 py-3 text-muted-foreground text-[12px]">{r.primeiraVencida ? formatDate(r.primeiraVencida) : '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`status-badge ${r.statusFinanceiro === 'Quitado' ? 'status-pronta' : r.statusFinanceiro === 'Inadimplente' ? 'status-cancelada' : 'status-pendencia'}`}>
                            {r.statusFinanceiro}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {cliTotalPages > 1 && (
                <TablePagination currentPage={cliSafePage} totalPages={cliTotalPages} totalItems={clientRows.length} pageSize={CLI_PAGE_SIZE} onPageChange={setClientPage} />
              )}
            </div>
          </div>
        )}

        {tab === 'unidades' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Desempenho por Unidade</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">{porUnidade.length} unidade(s) ativa(s) na rede</p>
              </div>
              {renderExportButtons(canExportGeneral, () => {
                const filename = buildExportFilename({ reportKey: 'unidades', ext: 'csv', unidadeNome: unidadeNomeAtual, userName: currentUser.nome });
                const data = porUnidade.map(u => ({
                  'Unidade': u.nome,
                  'Cidade': u.cidade,
                  'UF': u.uf,
                  'OS': u.os,
                  'Faturamento': u.faturamento,
                  'Ticket Medio': u.os > 0 ? u.faturamento / u.os : 0,
                  'Participacao %': totalOS > 0 ? ((u.os / totalOS) * 100) : 0,
                }));
                downloadCSV(data, filename, buildMeta('Desempenho por Unidade'));
                auditExport('Unidades', data.length, filename);
              })}
            </div>

            <div className="page-card p-6">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={unitChartData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 16% 91%)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(215 12% 48%)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(215 12% 48%)' }} />
                  <Tooltip formatter={(value: number, name: string) => [name === 'faturamento' ? formatCurrency(value) : value, name === 'faturamento' ? 'Faturamento' : 'OS']} contentStyle={{ borderRadius: 8, border: '1px solid hsl(214 16% 91%)', fontSize: 12 }} />
                  <Bar dataKey="os" fill="hsl(213 56% 28%)" radius={[4, 4, 0, 0]} name="OS" />
                  <Bar dataKey="faturamento" fill="hsl(207 75% 48%)" radius={[4, 4, 0, 0]} name="Faturamento" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="page-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="table-header px-6 py-3.5 text-left">Unidade</th>
                    <th className="table-header px-6 py-3.5 text-left">Cidade</th>
                    <th className="table-header px-6 py-3.5 text-center">OS</th>
                    <th className="table-header px-6 py-3.5 text-right">Faturamento</th>
                    <th className="table-header px-6 py-3.5 text-right">Ticket Medio</th>
                    <th className="table-header px-6 py-3.5 text-center">Participacao</th>
                  </tr>
                </thead>
                <tbody>
                  {porUnidade.map(u => {
                    const pct = totalOS > 0 ? ((u.os / totalOS) * 100).toFixed(0) : '0';
                    return (
                      <tr key={u.id} className="border-b border-border/40 last:border-0 transition-colors hover:bg-muted/40">
                        <td className="px-6 py-3 font-medium text-foreground">{u.nome}</td>
                        <td className="px-6 py-3 text-muted-foreground">{u.cidade}/{u.uf}</td>
                        <td className="px-6 py-3 text-center font-medium text-foreground">{u.os}</td>
                        <td className="px-6 py-3 text-right font-medium text-foreground">{formatCurrency(u.faturamento)}</td>
                        <td className="px-6 py-3 text-right text-muted-foreground">{u.os > 0 ? formatCurrency(u.faturamento / u.os) : '-'}</td>
                        <td className="px-6 py-3 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[11px] text-muted-foreground">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
