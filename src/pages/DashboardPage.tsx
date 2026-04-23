import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { KpiCard } from '@/components/KpiCard';
import { StatusBadge } from '@/components/StatusBadge';
import { ordensServico, formatCurrency, formatDate, unidades, clientes } from '@/data/mockData';
import { useApp } from '@/contexts/AppContext';
import { FileText, Factory, CheckCircle, Truck, AlertTriangle, DollarSign, TrendingUp, Clock, GripVertical, Settings2, RotateCcw, BarChart3, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';

const chartData = [
  { name: 'Jan', valor: 8200 },
  { name: 'Fev', valor: 11400 },
  { name: 'Mar', valor: 9800 },
  { name: 'Abr', valor: 16440 },
];

type WidgetId = 'kpis' | 'chart' | 'recent_os' | 'alerts' | 'production' | 'flow' | 'financial_summary' | 'status_pie';

interface Widget {
  id: WidgetId;
  label: string;
  fixed?: boolean;
  visible: boolean;
  size: 'full' | 'two-thirds' | 'third' | 'half';
}

const defaultWidgets: Widget[] = [
  { id: 'kpis', label: 'KPIs Principais', fixed: true, visible: true, size: 'full' },
  { id: 'chart', label: 'Faturamento Mensal', visible: true, size: 'two-thirds' },
  { id: 'alerts', label: 'Alertas e Pendencias', visible: true, size: 'third' },
  { id: 'recent_os', label: 'OS Recentes', visible: true, size: 'two-thirds' },
  { id: 'production', label: 'Fila de Producao', visible: true, size: 'third' },
  { id: 'financial_summary', label: 'Resumo Financeiro', visible: true, size: 'half' },
  { id: 'status_pie', label: 'Distribuicao por Status', visible: true, size: 'half' },
  { id: 'flow', label: 'Fluxo Operacional', visible: true, size: 'third' },
];

const COLORS = ['hsl(213 56% 28%)', 'hsl(207 75% 48%)', 'hsl(38 85% 48%)', 'hsl(158 50% 38%)', 'hsl(213 56% 48%)', 'hsl(0 60% 48%)'];

export default function DashboardPage() {
  const { selectedUnidadeId, currentUser } = useApp();
  const [widgets, setWidgets, resetWidgets] = useDashboardLayout<Widget[]>(
    { userId: currentUser.id, role: currentUser.role, unidadeId: selectedUnidadeId },
    defaultWidgets,
  );
  const [configMode, setConfigMode] = useState(false);
  const [draggedId, setDraggedId] = useState<WidgetId | null>(null);

  const relevantOS = ordensServico.filter(os =>
    selectedUnidadeId === 'todas' || os.unidadeId === selectedUnidadeId
  );

  const osAbertas = relevantOS.filter(os => os.status === 'recebida').length;
  const osProducao = relevantOS.filter(os => os.status === 'producao').length;
  const osProntas = relevantOS.filter(os => os.status === 'pronta' || os.status === 'enviada').length;
  const osEntregues = relevantOS.filter(os => os.status === 'entregue').length;
  const osPendencias = relevantOS.filter(os => os.status === 'pendencia').length;
  const totalFaturamento = relevantOS.reduce((sum, os) => sum + os.valorTotal, 0);
  const ticketMedio = relevantOS.length > 0 ? totalFaturamento / relevantOS.length : 0;

  const osRecentes = [...relevantOS].sort((a, b) => b.dataCriacao.localeCompare(a.dataCriacao)).slice(0, 6);

  const allParcelas = relevantOS.flatMap(os => (os.pagamento?.parcelas || []).map(p => ({ ...p, osId: os.id })));
  const parcelasVencidas = allParcelas.filter(p => p.status === 'pendente' && p.vencimento < '2025-04-12');
  const totalVencido = parcelasVencidas.reduce((s, p) => s + p.valor, 0);
  const totalRecebido = allParcelas.filter(p => p.status === 'paga').reduce((s, p) => s + p.valor, 0);
  const totalPendente = allParcelas.filter(p => p.status === 'pendente').reduce((s, p) => s + p.valor, 0);

  const statusData = (['recebida', 'producao', 'pendencia', 'pronta', 'enviada', 'entregue'] as const).map((status, i) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: relevantOS.filter(os => os.status === status).length,
    color: COLORS[i % COLORS.length],
  })).filter(d => d.value > 0);

  const toggleWidget = (id: WidgetId) => {
    setWidgets(prev => prev.map(w => w.id === id && !w.fixed ? { ...w, visible: !w.visible } : w));
  };

  const moveWidget = (from: number, to: number) => {
    setWidgets(prev => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  };

  const handleDragStart = (id: WidgetId) => setDraggedId(id);
  const handleDragOver = (e: React.DragEvent, targetId: WidgetId) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;
    const fromIdx = widgets.findIndex(w => w.id === draggedId);
    const toIdx = widgets.findIndex(w => w.id === targetId);
    if (fromIdx !== -1 && toIdx !== -1 && !widgets[fromIdx].fixed && !widgets[toIdx].fixed) {
      moveWidget(fromIdx, toIdx);
    }
  };
  const handleDragEnd = () => setDraggedId(null);

  const resetLayout = () => {
    resetWidgets();
    toast.success('Layout restaurado para o padrao', {
      description: `Perfil: ${currentUser.role} — Unidade: ${selectedUnidadeId === 'todas' ? 'todas' : selectedUnidadeId}`,
    });
  };

  const visibleWidgets = widgets.filter(w => w.visible);

  const renderWidget = (widget: Widget) => {
    switch (widget.id) {
      case 'kpis':
        return (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiCard title="OS Abertas" value={osAbertas} icon={FileText} />
            <KpiCard title="Em Producao" value={osProducao} icon={Factory} />
            <KpiCard title="Prontas / Enviadas" value={osProntas} icon={CheckCircle} />
            <KpiCard title="Entregues" value={osEntregues} icon={Truck} />
            <KpiCard title="Pendencias" value={osPendencias} icon={AlertTriangle} />
            <KpiCard title="Faturamento" value={totalFaturamento} icon={DollarSign} isCurrency />
          </div>
        );

      case 'chart':
        return (
          <div className="page-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Faturamento Mensal</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">Ultimos 4 meses — Ticket medio: {formatCurrency(ticketMedio)}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-success">
                <TrendingUp className="h-3.5 w-3.5" />+12%
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 16% 91%)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(215 12% 48%)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(215 12% 48%)' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Faturamento']} contentStyle={{ borderRadius: 8, border: '1px solid hsl(214 16% 91%)', fontSize: 12 }} />
                <Bar dataKey="valor" fill="hsl(213 56% 28%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'recent_os':
        return (
          <div className="page-card">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold text-foreground">Ordens de Servico Recentes</h2>
              <Link to="/ordens" className="text-[12px] font-semibold text-primary hover:underline">Ver todas</Link>
            </div>
            {osRecentes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-6 w-6 text-muted-foreground/40 mb-2" />
                <p className="text-[13px] text-muted-foreground">Nenhuma OS nesta unidade</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="table-header px-6 py-3 text-left">Numero</th>
                      <th className="table-header px-6 py-3 text-left">Cliente</th>
                      <th className="table-header px-6 py-3 text-left">Unidade</th>
                      <th className="table-header px-6 py-3 text-left">Status</th>
                      <th className="table-header px-6 py-3 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {osRecentes.map((os) => (
                      <tr key={os.id} className="border-b border-border/40 last:border-0 transition-colors hover:bg-muted/40">
                        <td className="px-6 py-3 font-medium text-primary">
                          <Link to={`/ordens/${os.id}`} className="hover:underline">{os.numero}</Link>
                        </td>
                        <td className="px-6 py-3 text-foreground">{os.clienteNome}</td>
                        <td className="px-6 py-3 text-muted-foreground">{os.unidadeNome.replace('Visual Premium - ', '')}</td>
                        <td className="px-6 py-3"><StatusBadge status={os.status} /></td>
                        <td className="px-6 py-3 text-right font-medium text-foreground">{formatCurrency(os.valorTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case 'alerts':
        return (
          <div className="page-card">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold text-foreground">Alertas e Pendencias</h2>
            </div>
            <div className="divide-y divide-border/40 px-6">
              {osPendencias > 0 && (
                <div className="flex items-start gap-3 py-4">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{osPendencias} OS com pendencia</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Verificar receitas e documentacao</p>
                  </div>
                </div>
              )}
              {parcelasVencidas.length > 0 && (
                <div className="flex items-start gap-3 py-4">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                    <DollarSign className="h-3.5 w-3.5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{parcelasVencidas.length} parcelas vencidas</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{formatCurrency(totalVencido)} em atraso</p>
                  </div>
                </div>
              )}
              {osProntas > 0 && (
                <div className="flex items-start gap-3 py-4">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-info/10">
                    <Truck className="h-3.5 w-3.5 text-info" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{osProntas} OS aguardando retirada</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Prontas ou em transito</p>
                  </div>
                </div>
              )}
              {osPendencias === 0 && parcelasVencidas.length === 0 && osProntas === 0 && (
                <div className="flex items-center gap-3 py-6">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <p className="text-[13px] text-muted-foreground">Nenhum alerta no momento</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'production':
        return (
          <div className="page-card px-6 py-5">
            <h3 className="section-title mb-4">Fila de Producao</h3>
            <div className="space-y-3">
              {(['recebida', 'producao', 'pronta', 'enviada'] as const).map(status => {
                const count = relevantOS.filter(os => os.status === status).length;
                const total = relevantOS.length || 1;
                const pct = (count / total) * 100;
                return (
                  <div key={status} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <StatusBadge status={status} />
                      <span className="text-sm font-bold text-foreground">{count}</span>
                    </div>
                    <div className="h-1 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'financial_summary':
        return (
          <div className="page-card px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Resumo Financeiro</h3>
              <Link to="/financeiro" className="text-[11px] font-semibold text-primary hover:underline">Ver detalhes</Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-[13px] text-muted-foreground">Total Recebido</span>
                <span className="text-[13px] font-semibold text-success">{formatCurrency(totalRecebido)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-[13px] text-muted-foreground">Total Pendente</span>
                <span className="text-[13px] font-semibold text-foreground">{formatCurrency(totalPendente)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-[13px] text-muted-foreground">Total Vencido</span>
                <span className="text-[13px] font-semibold text-destructive">{formatCurrency(totalVencido)}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[13px] text-muted-foreground">Parcelas Vencidas</span>
                <span className="text-[13px] font-bold text-destructive">{parcelasVencidas.length}</span>
              </div>
            </div>
          </div>
        );

      case 'status_pie':
        return (
          <div className="page-card px-6 py-5">
            <h3 className="section-title mb-4">Distribuicao por Status</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" stroke="none">
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {statusData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: d.color }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="font-semibold text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'flow':
        return (
          <div className="page-card px-6 py-5">
            <h3 className="section-title mb-4">Fluxo Operacional</h3>
            <div className="space-y-2">
              {[
                { label: 'Loja', desc: 'Cadastro e atendimento', icon: '1' },
                { label: 'Central', desc: 'Producao e controle', icon: '2' },
                { label: 'Financeiro', desc: 'Pagamentos e baixas', icon: '3' },
                { label: 'Entrega', desc: 'Conclusao ao cliente', icon: '4' },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{step.icon}</span>
                  <div>
                    <p className="text-[12px] font-medium text-foreground">{step.label}</p>
                    <p className="text-[10px] text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Layout grouping
  const getGridClass = (size: Widget['size']) => {
    switch (size) {
      case 'full': return 'col-span-full';
      case 'two-thirds': return 'lg:col-span-2';
      case 'third': return 'lg:col-span-1';
      case 'half': return 'lg:col-span-1';
    }
  };

  // Group widgets into rows for layout
  const renderWidgetGrid = () => {
    const result: React.ReactNode[] = [];
    let i = 0;
    const vis = visibleWidgets;

    while (i < vis.length) {
      const w = vis[i];
      if (w.size === 'full') {
        result.push(
          <div
            key={w.id}
            draggable={configMode && !w.fixed}
            onDragStart={() => handleDragStart(w.id)}
            onDragOver={(e) => handleDragOver(e, w.id)}
            onDragEnd={handleDragEnd}
            className={`${configMode && !w.fixed ? 'ring-1 ring-dashed ring-primary/20 rounded-lg' : ''} ${draggedId === w.id ? 'opacity-50' : ''}`}
          >
            {configMode && !w.fixed && (
              <div className="flex items-center gap-2 mb-1.5 px-1">
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground cursor-grab" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{w.label}</span>
              </div>
            )}
            {renderWidget(w)}
          </div>
        );
        i++;
      } else {
        // Collect a row of non-full widgets
        const row: Widget[] = [];
        let colCount = 0;
        while (i < vis.length && vis[i].size !== 'full' && colCount < 3) {
          const cols = vis[i].size === 'two-thirds' ? 2 : 1;
          if (colCount + cols > 3) break;
          row.push(vis[i]);
          colCount += cols;
          i++;
        }
        result.push(
          <div key={`row-${row[0].id}`} className="grid gap-6 lg:grid-cols-3">
            {row.map(rw => (
              <div
                key={rw.id}
                className={`${getGridClass(rw.size)} ${configMode ? 'ring-1 ring-dashed ring-primary/20 rounded-lg' : ''} ${draggedId === rw.id ? 'opacity-50' : ''}`}
                draggable={configMode}
                onDragStart={() => handleDragStart(rw.id)}
                onDragOver={(e) => handleDragOver(e, rw.id)}
                onDragEnd={handleDragEnd}
              >
                {configMode && (
                  <div className="flex items-center gap-2 mb-1.5 px-1">
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground cursor-grab" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{rw.label}</span>
                  </div>
                )}
                {renderWidget(rw)}
              </div>
            ))}
          </div>
        );
      }
    }
    return result;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Visao geral da operacao
              {selectedUnidadeId !== 'todas' && ` — Filtrado por unidade`}
              <span className="ml-2 text-[11px] text-muted-foreground/70">
                · Layout pessoal salvo automaticamente
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {configMode && (
              <>
                <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={resetLayout}>
                  <RotateCcw className="mr-1 h-3 w-3" />Restaurar
                </Button>
                {widgets.filter(w => !w.fixed).map(w => (
                  <button
                    key={w.id}
                    onClick={() => toggleWidget(w.id)}
                    className={`rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                      w.visible ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {w.label.split(' ')[0]}
                  </button>
                ))}
              </>
            )}
            <Button
              variant={configMode ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-[11px]"
              onClick={() => {
                setConfigMode(!configMode);
                if (configMode) toast.success('Layout salvo para este perfil/unidade');
              }}
            >
              {configMode ? <Save className="mr-1 h-3 w-3" /> : <Settings2 className="mr-1 h-3 w-3" />}
              {configMode ? 'Salvar Layout' : 'Configurar'}
            </Button>
          </div>
        </div>

        {configMode && (
          <div className="page-card px-4 py-3 border-dashed flex items-center gap-3">
            <Settings2 className="h-4 w-4 text-primary shrink-0" />
            <p className="text-[12px] text-muted-foreground">
              <span className="font-semibold text-foreground">Modo de configuracao ativo.</span>{' '}
              Arraste os widgets para reorganizar. O layout e persistido por usuario, perfil e unidade selecionada.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {renderWidgetGrid()}
        </div>
      </div>
    </AppLayout>
  );
}
