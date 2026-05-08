import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { EmptyState } from '@/components/EmptyState';
import { KpiCard } from '@/components/KpiCard';
import { itensEstoque, movimentacoesEstoque, estoqueConfig } from '@/data/mockEstoque';
import { useApp } from '@/contexts/AppContext';
import {
  getAlertaEstoque, calcEstoqueSummary, getMovimentacoesDoItem,
  ALERTA_ESTOQUE_LABELS, ALERTA_ESTOQUE_CLASSES, ALERTA_ESTOQUE_DOT_CLASSES,
  TIPO_MOVIMENTACAO_LABELS, getMovimentacaoClass, formatMovimentacaoQtd,
  CATEGORIA_LABELS,
} from '@/lib/estoqueStatus';
import { formatDate, unidades } from '@/data/mockData';
import type { ItemEstoque, MovimentacaoEstoque, TipoMovimentacao, CategoriaEstoque } from '@/data/stockTypes';
import {
  Package, AlertTriangle, Shield, Search, ChevronRight, Layers,
  ArrowUpCircle, ArrowDownCircle, ToggleLeft, History, Plus, X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Local form state types — strongly typed, no `any`
// ---------------------------------------------------------------------------

interface NovoItemForm {
  nome: string;
  descricao: string;
  categoria: CategoriaEstoque;
  marca: string;
  referencia: string;
  unidadeId: string;
  saldoInicial: string;
  estoqueMinimo: string;
  precoCusto: string;
  precoVenda: string;
  ativo: boolean;
}

interface NovaMovimentacaoForm {
  itemId: string;
  tipo: TipoMovimentacao;
  quantidade: string;
  osVinculadaId: string;
  osVinculadaNumero: string;
  observacao: string;
}

const ITEM_FORM_EMPTY: NovoItemForm = {
  nome: '', descricao: '', categoria: 'armacao', marca: '', referencia: '',
  unidadeId: '', saldoInicial: '0', estoqueMinimo: '1',
  precoCusto: '', precoVenda: '', ativo: true,
};

const MOV_FORM_EMPTY: NovaMovimentacaoForm = {
  itemId: '', tipo: 'entrada', quantidade: '1',
  osVinculadaId: '', osVinculadaNumero: '', observacao: '',
};

type EstoqueView = 'itens' | 'movimentacoes';
type AlertaFilter = 'todos' | 'zerado' | 'baixo' | 'ok';

export default function EstoquePage() {
  const { selectedUnidadeId, hasPermission, currentUser } = useApp();
  const [view, setView] = useState<EstoqueView>('itens');
  const [search, setSearch] = useState('');
  const [alertaFilter, setAlertaFilter] = useState<AlertaFilter>('todos');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Session-local state — initialized from mock data
  const [itens, setItens] = useState<ItemEstoque[]>(itensEstoque);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>(movimentacoesEstoque);

  // Modal state
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [movModalOpen, setMovModalOpen] = useState(false);
  const [itemForm, setItemForm] = useState<NovoItemForm>({ ...ITEM_FORM_EMPTY, unidadeId: currentUser.unidadeId });
  const [movForm, setMovForm] = useState<NovaMovimentacaoForm>({ ...MOV_FORM_EMPTY });

  const canManageStock = hasPermission(['admin', 'gestor']);
  const canRegisterMov = hasPermission(['admin', 'gestor', 'operador']);

  // Handlers
  const handleSalvarItem = () => {
    if (!itemForm.nome.trim() || !itemForm.unidadeId) {
      toast.error('Preencha nome e unidade.');
      return;
    }
    const novoItem: ItemEstoque = {
      id: `sku-${Date.now()}`,
      unidadeId: itemForm.unidadeId,
      nome: itemForm.nome.trim(),
      descricao: itemForm.descricao || undefined,
      categoria: itemForm.categoria,
      marca: itemForm.marca || undefined,
      referencia: itemForm.referencia || undefined,
      saldoAtual: parseFloat(itemForm.saldoInicial) || 0,
      estoqueMinimo: parseFloat(itemForm.estoqueMinimo) || 1,
      precoCusto: itemForm.precoCusto ? parseFloat(itemForm.precoCusto) : undefined,
      precoVenda: itemForm.precoVenda ? parseFloat(itemForm.precoVenda) : undefined,
      ativo: itemForm.ativo,
      criadoEm: new Date().toISOString(),
    };
    setItens(prev => [...prev, novoItem]);
    setItemForm({ ...ITEM_FORM_EMPTY, unidadeId: currentUser.unidadeId });
    setItemModalOpen(false);
    toast.success('Item cadastrado com sucesso.');
  };

  const handleSalvarMovimentacao = () => {
    if (!movForm.itemId || !movForm.tipo || !movForm.quantidade) {
      toast.error('Preencha item, tipo e quantidade.');
      return;
    }
    const qtd = parseFloat(movForm.quantidade);
    if (isNaN(qtd) || qtd <= 0) { toast.error('Quantidade inválida.'); return; }
    const itemAlvo = itens.find(i => i.id === movForm.itemId);
    if (!itemAlvo) return;

    const novaMov: MovimentacaoEstoque = {
      id: `mov-${Date.now()}`,
      itemId: movForm.itemId,
      unidadeId: itemAlvo.unidadeId,
      tipo: movForm.tipo,
      quantidade: qtd,
      osId: movForm.osVinculadaId || undefined,
      osNumero: movForm.osVinculadaNumero || undefined,
      usuarioId: currentUser.id,
      usuarioNome: currentUser.nome,
      observacao: movForm.observacao || undefined,
      dataMovimentacao: new Date().toISOString(),
    };

    // Update local saldo
    const positivos: TipoMovimentacao[] = ['entrada', 'ajuste_positivo', 'devolucao'];
    const delta = positivos.includes(movForm.tipo) ? qtd : -qtd;
    setItens(prev => prev.map(i =>
      i.id === movForm.itemId ? { ...i, saldoAtual: Math.max(0, i.saldoAtual + delta) } : i
    ));
    setMovimentacoes(prev => [novaMov, ...prev]);
    setMovForm({ ...MOV_FORM_EMPTY });
    setMovModalOpen(false);
    toast.success(`Movimentação registrada — ${TIPO_MOVIMENTACAO_LABELS[movForm.tipo]}`);
  };

  // --- Module gate: if disabled, show friendly "module off" screen ---
  if (!estoqueConfig.habilitado) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
            <ToggleLeft className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Módulo de Estoque desabilitado</h1>
            <p className="text-[13px] text-muted-foreground mt-1 max-w-sm">
              O módulo de estoque está desabilitado para esta configuração.
              Entre em contato com o administrador para ativar.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // --- RBAC: only admin, gestor, operador can access stock ---
  if (!hasPermission(['admin', 'gestor', 'operador'])) {
    return (
      <AppLayout>
        <EmptyState icon={Shield} title="Acesso restrito" description="Apenas gestores, operadores e administradores podem acessar o estoque." />
      </AppLayout>
    );
  }

  // --- Data scoping by unit (uses session-local state) ---
  const relevantItens = itens.filter(i =>
    i.ativo &&
    (selectedUnidadeId === 'todas' || i.unidadeId === selectedUnidadeId)
  );
  const relevantMovs = movimentacoes.filter(m =>
    selectedUnidadeId === 'todas' || m.unidadeId === selectedUnidadeId
  );

  const summary = calcEstoqueSummary(relevantItens);

  // --- Item filtering ---
  let displayItens = relevantItens;
  if (alertaFilter !== 'todos') {
    displayItens = displayItens.filter(i => getAlertaEstoque(i) === alertaFilter);
  }
  if (search) {
    const q = search.toLowerCase();
    displayItens = displayItens.filter(i =>
      i.nome.toLowerCase().includes(q) ||
      (i.marca?.toLowerCase().includes(q)) ||
      (i.referencia?.toLowerCase().includes(q))
    );
  }

  // --- Selected item movements ---
  const selectedItem = selectedItemId ? relevantItens.find(i => i.id === selectedItemId) : null;
  const selectedMovs = selectedItemId
    ? getMovimentacoesDoItem(selectedItemId, relevantMovs)
    : [];

  // Items available for movimentação modal
  const itensAtivos = itens.filter(i => i.ativo);

  // --- Recent movements (all items) ---
  const recentMovs = [...relevantMovs]
    .sort((a, b) => b.dataMovimentacao.localeCompare(a.dataMovimentacao))
    .slice(0, 30);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              Estoque
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {summary.totalItens} itens cadastrados
              {summary.itensComAlerta > 0 && (
                <span className="text-warning ml-1">— {summary.itensComAlerta} com alerta</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canRegisterMov && (
              <Button
                variant="outline" size="sm" className="h-9 text-[13px]"
                onClick={() => { setMovForm({ ...MOV_FORM_EMPTY }); setMovModalOpen(true); }}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />Registrar Movimentação
              </Button>
            )}
            {canManageStock && (
              <Button
                size="sm" className="h-9 text-[13px] font-semibold"
                onClick={() => { setItemForm({ ...ITEM_FORM_EMPTY, unidadeId: currentUser.unidadeId }); setItemModalOpen(true); }}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />Cadastrar Item
              </Button>
            )}
            <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-[11px] font-semibold text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Módulo ativo
            </div>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Total de Itens" value={summary.totalItens} icon={Layers} />
          <KpiCard title="Em Alerta" value={summary.itensComAlerta} icon={AlertTriangle} />
          <KpiCard title="Sem Estoque" value={summary.itensZerados} icon={Package} />
          <KpiCard title="Saldo Adequado" value={summary.itensOk} icon={Package} />
        </div>

        {/* Alert bar */}
        {summary.itensComAlerta > 0 && (
          <div className="page-card px-6 py-4 border-warning/20 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-warning">
                {summary.itensZerados > 0 && `${summary.itensZerados} item(ns) sem estoque. `}
                {summary.itensBaixos > 0 && `${summary.itensBaixos} item(ns) abaixo do mínimo.`}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {displayItens
                  .filter(i => getAlertaEstoque(i) !== 'ok')
                  .slice(0, 5)
                  .map(i => (
                    <button
                      key={i.id}
                      onClick={() => { setSelectedItemId(i.id); setView('itens'); }}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${ALERTA_ESTOQUE_CLASSES[getAlertaEstoque(i)]}`}
                    >
                      {i.nome} — {i.saldoAtual} un.
                    </button>
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {/* View tabs */}
        <div className="flex items-center gap-1.5 border-b border-border pb-0">
          {([
            ['itens', 'Itens em Estoque'],
            ['movimentacoes', `Movimentações (${relevantMovs.length})`],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`px-4 py-2.5 text-[12px] font-semibold transition-colors border-b-2 -mb-px ${
                view === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* --- ITEMS VIEW --- */}
        {view === 'itens' && (
          <div className={`grid gap-6 ${selectedItem ? 'lg:grid-cols-3' : ''}`}>
            <div className={selectedItem ? 'lg:col-span-2' : ''}>
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="relative max-w-xs flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar item, marca, referência..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="h-9 pl-9 text-[13px]"
                  />
                </div>
                <div className="flex gap-1.5">
                  {([
                    ['todos', 'Todos', summary.totalItens],
                    ['zerado', 'Sem estoque', summary.itensZerados],
                    ['baixo', 'Baixo', summary.itensBaixos],
                    ['ok', 'OK', summary.itensOk],
                  ] as const).map(([key, label, count]) => (
                    <button
                      key={key}
                      onClick={() => setAlertaFilter(key)}
                      className={`rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                        alertaFilter === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {label} <span className="opacity-70">{count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Items table */}
              <div className="page-card">
                {displayItens.length === 0 ? (
                  <EmptyState icon={Package} title="Nenhum item encontrado" description="Ajuste os filtros de busca." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="table-header px-5 py-3 text-left w-3">Status</th>
                          <th className="table-header px-5 py-3 text-left">Item</th>
                          <th className="table-header px-5 py-3 text-left">Categoria</th>
                          <th className="table-header px-5 py-3 text-left">Ref.</th>
                          <th className="table-header px-5 py-3 text-center">Saldo</th>
                          <th className="table-header px-5 py-3 text-center">Mínimo</th>
                          <th className="table-header px-5 py-3 text-center w-8" />
                        </tr>
                      </thead>
                      <tbody>
                        {displayItens.map(item => {
                          const alerta = getAlertaEstoque(item);
                          const isSelected = selectedItemId === item.id;
                          return (
                            <tr
                              key={item.id}
                              onClick={() => setSelectedItemId(isSelected ? null : item.id)}
                              className={`border-b border-border/40 last:border-0 cursor-pointer transition-colors ${
                                isSelected ? 'bg-primary/5' : 'hover:bg-muted/40'
                              }`}
                            >
                              <td className="px-5 py-3">
                                <span className={`h-2.5 w-2.5 rounded-full inline-block ${ALERTA_ESTOQUE_DOT_CLASSES[alerta]}`} />
                              </td>
                              <td className="px-5 py-3">
                                <p className="font-medium text-foreground">{item.nome}</p>
                                {item.marca && <p className="text-[11px] text-muted-foreground">{item.marca}</p>}
                              </td>
                              <td className="px-5 py-3 text-[12px] text-muted-foreground">
                                {CATEGORIA_LABELS[item.categoria]}
                              </td>
                              <td className="px-5 py-3 font-mono text-[11px] text-muted-foreground">
                                {item.referencia || '—'}
                              </td>
                              <td className="px-5 py-3 text-center">
                                <span className={`text-sm font-bold ${
                                  alerta === 'zerado' ? 'text-destructive' :
                                  alerta === 'baixo' ? 'text-warning' : 'text-success'
                                }`}>
                                  {item.saldoAtual}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-center text-[12px] text-muted-foreground">
                                {item.estoqueMinimo}
                              </td>
                              <td className="px-5 py-3 text-center">
                                <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground/50 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
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

            {/* Item detail / history sidebar */}
            {selectedItem && (
              <div className="page-card p-6 space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Detalhe</p>
                    <h2 className="text-sm font-bold text-foreground leading-tight">{selectedItem.nome}</h2>
                    {selectedItem.marca && <p className="text-[12px] text-muted-foreground">{selectedItem.marca}</p>}
                  </div>
                  <button
                    onClick={() => setSelectedItemId(null)}
                    className="text-muted-foreground hover:text-foreground text-[11px] font-medium"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2.5">
                  {[
                    ['Categoria', CATEGORIA_LABELS[selectedItem.categoria]],
                    ['Referência', selectedItem.referencia || '—'],
                    ['Saldo atual', String(selectedItem.saldoAtual)],
                    ['Estoque mínimo', String(selectedItem.estoqueMinimo)],
                    ...(selectedItem.precoCusto ? [['Custo', `R$ ${selectedItem.precoCusto.toFixed(2)}`]] : []),
                    ...(selectedItem.precoVenda ? [['Preço venda', `R$ ${selectedItem.precoVenda.toFixed(2)}`]] : []),
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-[12px]">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium text-foreground">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Alert badge */}
                <div>
                  <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold ${ALERTA_ESTOQUE_CLASSES[getAlertaEstoque(selectedItem)]}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${ALERTA_ESTOQUE_DOT_CLASSES[getAlertaEstoque(selectedItem)]}`} />
                    {ALERTA_ESTOQUE_LABELS[getAlertaEstoque(selectedItem)]}
                  </span>
                </div>

                {/* Movement history */}
                <div className="border-t border-border pt-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <History className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Histórico</p>
                  </div>
                  {selectedMovs.length === 0 ? (
                    <p className="text-[12px] text-muted-foreground">Nenhuma movimentação registrada.</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedMovs.slice(0, 8).map(mov => (
                        <div key={mov.id} className="flex items-start gap-2.5">
                          <div className={`mt-0.5 shrink-0 ${getMovimentacaoClass(mov)}`}>
                            {mov.tipo === 'entrada' || mov.tipo === 'ajuste_positivo' || mov.tipo === 'devolucao'
                              ? <ArrowUpCircle className="h-3.5 w-3.5" />
                              : <ArrowDownCircle className="h-3.5 w-3.5" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] font-semibold text-foreground">
                                {TIPO_MOVIMENTACAO_LABELS[mov.tipo]}
                              </p>
                              <span className={`text-[11px] font-bold tabular-nums ${getMovimentacaoClass(mov)}`}>
                                {formatMovimentacaoQtd(mov)}
                              </span>
                            </div>
                            {mov.osNumero && (
                              <Link to={`/ordens/${mov.osId}`} className="text-[10px] text-primary hover:underline">
                                {mov.osNumero}
                              </Link>
                            )}
                            {mov.observacao && (
                              <p className="text-[10px] text-muted-foreground truncate">{mov.observacao}</p>
                            )}
                            <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                              {formatDate(mov.dataMovimentacao.split('T')[0])} · {mov.usuarioNome}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- MOVEMENTS VIEW --- */}
        {view === 'movimentacoes' && (
          <div className="page-card">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold text-foreground">
                Histórico de Movimentações — {recentMovs.length} registros recentes
              </h2>
            </div>
            {recentMovs.length === 0 ? (
              <EmptyState icon={History} title="Nenhuma movimentação" description="Nenhum registro de movimentação para esta seleção." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="table-header px-5 py-3 text-left">Data</th>
                      <th className="table-header px-5 py-3 text-left">Item</th>
                      <th className="table-header px-5 py-3 text-left">Tipo</th>
                      <th className="table-header px-5 py-3 text-left">OS</th>
                      <th className="table-header px-5 py-3 text-center">Qtd</th>
                      <th className="table-header px-5 py-3 text-left">Usuário</th>
                      <th className="table-header px-5 py-3 text-left">Obs.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMovs.map(mov => {
                      const item = itensEstoque.find(i => i.id === mov.itemId);
                      return (
                        <tr key={mov.id} className="border-b border-border/40 last:border-0 hover:bg-muted/40">
                          <td className="px-5 py-3 text-[12px] text-muted-foreground whitespace-nowrap">
                            {formatDate(mov.dataMovimentacao.split('T')[0])}
                          </td>
                          <td className="px-5 py-3">
                            <p className="text-[13px] font-medium text-foreground">{item?.nome || mov.itemId}</p>
                            {item?.marca && <p className="text-[10px] text-muted-foreground">{item.marca}</p>}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-[11px] font-semibold ${getMovimentacaoClass(mov.tipo)}`}>
                              {TIPO_MOVIMENTACAO_LABELS[mov.tipo]}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            {mov.osId ? (
                              <Link to={`/ordens/${mov.osId}`} className="text-[12px] text-primary hover:underline font-medium">
                                {mov.osNumero}
                              </Link>
                            ) : <span className="text-muted-foreground text-[12px]">—</span>}
                          </td>
                          <td className={`px-5 py-3 text-center text-sm font-bold tabular-nums ${getMovimentacaoClass(mov.tipo)}`}>
                            {formatMovimentacaoQtd(mov)}
                          </td>
                          <td className="px-5 py-3 text-[12px] text-muted-foreground">{mov.usuarioNome}</td>
                          <td className="px-5 py-3 text-[11px] text-muted-foreground max-w-[180px] truncate">
                            {mov.observacao || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Module info footer */}
        <div className="page-card px-6 py-4 flex items-center gap-3 border-dashed">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-foreground">Módulo de Estoque — Opcional</p>
            <p className="text-[12px] text-muted-foreground">
              Este módulo pode ser habilitado ou desabilitado por unidade ou por rede. A OS e o financeiro funcionam independentemente do estoque.
            </p>
          </div>
        </div>
      </div>

      {/* ── Modal: Cadastrar Item ─────────────────────────────────────── */}
      {itemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-sm font-bold text-foreground">Cadastrar Item de Estoque</h2>
              <button onClick={() => setItemModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Nome / Descrição <span className="text-destructive">*</span></label>
                  <Input placeholder="Ex: Armação Ray-Ban RB5228" value={itemForm.nome} onChange={e => setItemForm(f => ({ ...f, nome: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Categoria <span className="text-destructive">*</span></label>
                  <Select value={itemForm.categoria} onValueChange={v => setItemForm(f => ({ ...f, categoria: v as CategoriaEstoque }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.entries(CATEGORIA_LABELS) as [CategoriaEstoque, string][]).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Unidade <span className="text-destructive">*</span></label>
                  <Select value={itemForm.unidadeId} onValueChange={v => setItemForm(f => ({ ...f, unidadeId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {unidades.filter(u => u.ativa).map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Marca</label>
                  <Input placeholder="Ex: Ray-Ban" value={itemForm.marca} onChange={e => setItemForm(f => ({ ...f, marca: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">SKU / Referência</label>
                  <Input placeholder="Ex: RB5228-BLK" value={itemForm.referencia} onChange={e => setItemForm(f => ({ ...f, referencia: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Saldo Inicial</label>
                  <Input type="number" min={0} value={itemForm.saldoInicial} onChange={e => setItemForm(f => ({ ...f, saldoInicial: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Estoque Mínimo</label>
                  <Input type="number" min={0} value={itemForm.estoqueMinimo} onChange={e => setItemForm(f => ({ ...f, estoqueMinimo: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Custo Unitário (R$)</label>
                  <Input type="number" min={0} step={0.01} placeholder="0,00" value={itemForm.precoCusto} onChange={e => setItemForm(f => ({ ...f, precoCusto: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Preço de Venda (R$)</label>
                  <Input type="number" min={0} step={0.01} placeholder="0,00" value={itemForm.precoVenda} onChange={e => setItemForm(f => ({ ...f, precoVenda: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Observações / Fornecedor</label>
                  <Textarea rows={2} placeholder="Informações adicionais, fornecedor, lote..." value={itemForm.descricao} onChange={e => setItemForm(f => ({ ...f, descricao: e.target.value }))} />
                </div>
                <div className="sm:col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="ativo-item" checked={itemForm.ativo} onChange={e => setItemForm(f => ({ ...f, ativo: e.target.checked }))} className="accent-primary" />
                  <label htmlFor="ativo-item" className="text-[12px] font-medium text-muted-foreground">Item ativo (visível no estoque)</label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setItemModalOpen(false)}>Cancelar</Button>
              <Button size="sm" className="font-semibold" onClick={handleSalvarItem}>Cadastrar Item</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Registrar Movimentação ────────────────────────────── */}
      {movModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-sm font-bold text-foreground">Registrar Movimentação</h2>
              <button onClick={() => setMovModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Item <span className="text-destructive">*</span></label>
                <Select value={movForm.itemId} onValueChange={v => setMovForm(f => ({ ...f, itemId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione o item..." /></SelectTrigger>
                  <SelectContent>
                    {itensAtivos.map(i => (
                      <SelectItem key={i.id} value={i.id}>{i.nome}{i.marca ? ` — ${i.marca}` : ''} (saldo: {i.saldoAtual})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Tipo <span className="text-destructive">*</span></label>
                  <Select value={movForm.tipo} onValueChange={v => setMovForm(f => ({ ...f, tipo: v as TipoMovimentacao }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.entries(TIPO_MOVIMENTACAO_LABELS) as [TipoMovimentacao, string][])
                        // 'transferencia' oculta até existência de unidade de destino
                        .filter(([k]) => k !== 'transferencia')
                        .map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Quantidade <span className="text-destructive">*</span></label>
                  <Input type="number" min={1} value={movForm.quantidade} onChange={e => setMovForm(f => ({ ...f, quantidade: e.target.value }))} />
                </div>
              </div>
              {movForm.tipo === 'baixa_os' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">ID da OS</label>
                    <Input placeholder="os1" value={movForm.osVinculadaId} onChange={e => setMovForm(f => ({ ...f, osVinculadaId: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Nº da OS</label>
                    <Input placeholder="OS-2025-0001" value={movForm.osVinculadaNumero} onChange={e => setMovForm(f => ({ ...f, osVinculadaNumero: e.target.value }))} />
                  </div>
                </div>
              )}
              {/* Aviso de origem do estoque para baixas de OS externa */}
              {movForm.tipo === 'baixa_os' && (() => {
                const item = itensAtivos.find(i => i.id === movForm.itemId);
                const isCentral = item?.unidadeId === 'u0';
                return (
                  <div className={`rounded-md px-3 py-2.5 text-[11px] flex items-start gap-2 ${
                    isCentral
                      ? 'bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 text-violet-700 dark:text-violet-300'
                      : 'bg-muted/50 text-muted-foreground'
                  }`}>
                    <span className="mt-0.5 shrink-0">{isCentral ? '🏭' : 'ℹ️'}</span>
                    <span>
                      {isCentral
                        ? 'Origem do estoque: Central/Fábrica — movimentações de OS externas saem do estoque da Central.'
                        : 'Para OS externas, o item consumido deve pertencer ao estoque da Central/Fábrica.'}
                    </span>
                  </div>
                );
              })()}
              <div>
                <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Observação</label>
                <Textarea rows={2} placeholder="Motivo da movimentação, NF, referência..." value={movForm.observacao} onChange={e => setMovForm(f => ({ ...f, observacao: e.target.value }))} />
              </div>
              <div className="rounded-md bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
                Usuário: <span className="font-medium text-foreground">{currentUser.nome}</span> · Data/hora: <span className="font-medium text-foreground">{new Date().toLocaleString('pt-BR')}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setMovModalOpen(false)}>Cancelar</Button>
              <Button size="sm" className="font-semibold" onClick={handleSalvarMovimentacao}>Registrar</Button>
            </div>
          </div>
        </div>
      )}

    </AppLayout>
  );
}
