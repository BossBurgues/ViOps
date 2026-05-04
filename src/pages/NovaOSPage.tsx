import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/contexts/AppContext';
import { clientes, unidades, formatCurrency } from '@/data/mockData';
import { OrigemVenda } from '@/data/types';
import { OSOrigemBadge } from '@/components/OSOrigemBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft, Search, User, MapPin, Package, FileText, CreditCard,
  Plus, Trash2, CheckCircle, AlertTriangle, ChevronRight, Paperclip, Store,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { OSDocUpload, type OSDocumento, type DocCategoria } from '@/components/OSDocumentos';

type Step = 'cliente' | 'itens' | 'tecnico' | 'documentos' | 'pagamento' | 'revisao';

const STEPS: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: 'cliente', label: 'Cliente', icon: User },
  { key: 'itens', label: 'Itens', icon: Package },
  { key: 'tecnico', label: 'Receita', icon: FileText },
  { key: 'documentos', label: 'Documentos', icon: Paperclip },
  { key: 'pagamento', label: 'Pagamento', icon: CreditCard },
  { key: 'revisao', label: 'Revisao', icon: CheckCircle },
];

interface ItemOS {
  descricao: string;
  tipo: string;
  quantidade: number;
  valorUnitario: number;
}

export default function NovaOSPage() {
  const navigate = useNavigate();
  const { currentUser, hasPermission } = useApp();
  const [step, setStep] = useState<Step>('cliente');
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Form state
  const [origemVenda, setOrigemVenda] = useState<OrigemVenda>('otica');
  const [clienteId, setClienteId] = useState('');
  const [clienteSearch, setClienteSearch] = useState('');
  const [unidadeId, setUnidadeId] = useState(currentUser.unidadeId);
  const [prioridade, setPrioridade] = useState('normal');
  const [observacoes, setObservacoes] = useState('');
  const [localAcaoExterna, setLocalAcaoExterna] = useState('');

  // Items
  const [itens, setItens] = useState<ItemOS[]>([
    { descricao: '', tipo: 'Armacao', quantidade: 1, valorUnitario: 0 },
  ]);

  // Technical
  const [odEsferico, setOdEsferico] = useState('');
  const [odCilindrico, setOdCilindrico] = useState('');
  const [odEixo, setOdEixo] = useState('');
  const [oeEsferico, setOeEsferico] = useState('');
  const [oeCilindrico, setOeCilindrico] = useState('');
  const [oeEixo, setOeEixo] = useState('');
  const [adicao, setAdicao] = useState('');
  const [dp, setDp] = useState('');

  // Documents
  const [documentos, setDocumentos] = useState<OSDocumento[]>([]);

  // Payment
  const [formaPagamento, setFormaPagamento] = useState('');
  const [parcelas, setParcelas] = useState('1');

  if (!hasPermission(['admin', 'gestor', 'vendedor'])) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <AlertTriangle className="h-8 w-8 text-warning mb-3" />
          <p className="text-sm font-semibold text-foreground">Acesso restrito</p>
          <p className="text-[13px] text-muted-foreground mt-1">Apenas vendedores, gestores e administradores podem criar ordens de servico.</p>
        </div>
      </AppLayout>
    );
  }

  const selectedCliente = clientes.find(c => c.id === clienteId);
  const selectedUnidade = unidades.find(u => u.id === unidadeId);
  const filteredClientes = clienteSearch.length >= 2
    ? clientes.filter(c =>
        c.nome.toLowerCase().includes(clienteSearch.toLowerCase()) ||
        c.cpf.includes(clienteSearch)
      )
    : [];

  const totalItens = itens.reduce((s, i) => s + (i.valorUnitario * i.quantidade), 0);

  const addItem = () => setItens([...itens, { descricao: '', tipo: 'Lente', quantidade: 1, valorUnitario: 0 }]);
  const removeItem = (idx: number) => setItens(itens.filter((_, i) => i !== idx));
  const updateItem = <K extends keyof ItemOS>(idx: number, field: K, value: ItemOS[K]) => {
    setItens(prev => prev.map((item, index) => (index === idx ? { ...item, [field]: value } : item)));
  };

  const stepIndex = STEPS.findIndex(s => s.key === step);

  const canAdvance = () => {
    if (step === 'cliente') return !!clienteId && !!unidadeId;
    if (step === 'itens') return itens.length > 0 && itens.every(i => i.descricao && i.valorUnitario > 0);
    if (step === 'pagamento') return !!formaPagamento;
    return true;
  };

  const goNext = () => {
    if (stepIndex < STEPS.length - 1) setStep(STEPS[stepIndex + 1].key);
  };
  const goPrev = () => {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1].key);
  };

  const handleAddDocs = (newDocs: OSDocumento[]) => {
    setDocumentos(prev => [...prev, ...newDocs.map(d => ({ ...d, usuario: currentUser.nome }))]);
  };
  const handleRemoveDoc = (id: string) => {
    setDocumentos(prev => prev.filter(d => d.id !== id));
  };
  const handleCategoriaChange = (id: string, cat: DocCategoria) => {
    setDocumentos(prev => prev.map(d => d.id === id ? { ...d, categoria: cat } : d));
  };

  const handleSubmit = () => {
    toast.success('Ordem de Serviço criada com sucesso', {
      description: `OS ${origemVenda === 'externa' ? 'externa' : 'em ótica'} criada por ${currentUser.nome} para ${selectedCliente?.nome} com ${documentos.length} documento(s)`,
    });
    navigate('/ordens');
  };

  const hasReceita = documentos.some(d => d.categoria === 'receita');

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/ordens" className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">Nova Ordem de Servico</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">Preencha os dados para criar uma nova OS</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="page-card px-4 py-3">
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => {
              const isActive = s.key === step;
              const isDone = i < stepIndex;
              return (
                <div key={s.key} className="flex items-center gap-1 flex-1">
                  <button
                    onClick={() => i <= stepIndex && setStep(s.key)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-medium transition-colors ${
                      isActive ? 'bg-primary text-primary-foreground' :
                      isDone ? 'bg-primary/10 text-primary cursor-pointer' :
                      'text-muted-foreground'
                    }`}
                  >
                    <s.icon className="h-3.5 w-3.5" />
                    <span className="hidden lg:inline">{s.label}</span>
                    <span className="lg:hidden">{i + 1}</span>
                  </button>
                  {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="page-card p-6">
          {step === 'cliente' && (
            <div className="space-y-6">
              <h2 className="text-sm font-semibold text-foreground">Contexto da Venda</h2>

              {/* Origem da venda — seleção proeminente */}
              <div className="grid gap-3 sm:grid-cols-2">
                {([['otica', 'Venda na Ótica', 'Atendimento presencial na loja', Store] as const, ['externa', 'Venda Externa', 'Campo, empresa, visita ou evento', MapPin] as const]).map(([key, label, desc, Icon]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setOrigemVenda(key); if (key === 'otica') setLocalAcaoExterna(''); }}
                    className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                      origemVenda === key
                        ? key === 'externa'
                          ? 'border-violet-500 bg-violet-500/5'
                          : 'border-primary bg-primary/5'
                        : 'border-border hover:border-border/80 hover:bg-muted/40'
                    }`}
                  >
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      origemVenda === key
                        ? key === 'externa' ? 'bg-violet-500/15 text-violet-600' : 'bg-primary/15 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${
                        origemVenda === key
                          ? key === 'externa' ? 'text-violet-600' : 'text-primary'
                          : 'text-foreground'
                      }`}>{label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Campos condicionais — venda externa */}
              {origemVenda === 'externa' && (
                <div className="rounded-xl border border-violet-200 bg-violet-50/50 dark:border-violet-900/40 dark:bg-violet-950/20 p-4 space-y-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">Dados da Ação Externa</p>
                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Local da Ação</label>
                    <Input
                      placeholder="Ex: Empresa Alfa Ltda, Residência do cliente, Evento SESC..."
                      value={localAcaoExterna}
                      onChange={(e) => setLocalAcaoExterna(e.target.value)}
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">Onde ocorreu o atendimento externo</p>
                  </div>
                </div>
              )}

              <div className="border-t border-border pt-4 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Cliente e Unidade</h3>

                <div>
                  <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Buscar Cliente</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Nome ou CPF do cliente..."
                      value={clienteSearch}
                      onChange={(e) => { setClienteSearch(e.target.value); setClienteId(''); }}
                      className="pl-9"
                    />
                  </div>
                  {filteredClientes.length > 0 && !clienteId && (
                    <div className="mt-2 rounded-lg border border-border divide-y divide-border/40 max-h-48 overflow-y-auto">
                      {filteredClientes.map(c => (
                        <button
                          key={c.id}
                          onClick={() => { setClienteId(c.id); setClienteSearch(c.nome); }}
                          className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">{c.nome}</p>
                            <p className="text-[12px] text-muted-foreground">{c.cpf} — {c.telefone}</p>
                          </div>
                          <span className="text-[11px] text-muted-foreground">{c.cidade}/{c.uf}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedCliente && (
                    <div className="mt-3 rounded-lg bg-primary/5 border border-primary/10 p-4 flex items-start gap-3">
                      <User className="h-4 w-4 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{selectedCliente.nome}</p>
                        <p className="text-[12px] text-muted-foreground">{selectedCliente.cpf} — {selectedCliente.telefone} — {selectedCliente.email}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Unidade de Origem</label>
                    <Select value={unidadeId} onValueChange={setUnidadeId}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {unidades.filter(u => u.ativa).map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Prioridade</label>
                    <Select value={prioridade} onValueChange={setPrioridade}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP: Itens */}
          {step === 'itens' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Itens e Produtos</h2>
                <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={addItem}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />Adicionar Item
                </Button>
              </div>

              <div className="space-y-3">
                {itens.map((item, idx) => (
                  <div key={idx} className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Item {idx + 1}</span>
                      {itens.length > 1 && (
                        <button onClick={() => removeItem(idx)} className="rounded p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-4">
                      <div className="sm:col-span-2">
                        <label className="text-[11px] text-muted-foreground mb-1 block">Descricao</label>
                        <Input
                          placeholder="Ex: Armacao Titanium Classic"
                          value={item.descricao}
                          onChange={(e) => updateItem(idx, 'descricao', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground mb-1 block">Tipo</label>
                        <Select value={item.tipo} onValueChange={(v) => updateItem(idx, 'tipo', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Armacao">Armacao</SelectItem>
                            <SelectItem value="Lente">Lente</SelectItem>
                            <SelectItem value="Acessorio">Acessorio</SelectItem>
                            <SelectItem value="Servico">Servico</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-muted-foreground mb-1 block">Qtd</label>
                          <Input type="number" min={1} value={item.quantidade} onChange={(e) => updateItem(idx, 'quantidade', parseInt(e.target.value) || 1)} />
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground mb-1 block">Valor Un.</label>
                          <Input type="number" min={0} step={0.01} value={item.valorUnitario || ''} onChange={(e) => updateItem(idx, 'valorUnitario', parseFloat(e.target.value) || 0)} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end rounded-lg bg-muted/50 px-4 py-3">
                <span className="text-sm font-semibold text-foreground">Total: {formatCurrency(totalItens)}</span>
              </div>
            </div>
          )}

          {/* STEP: Tecnico */}
          {step === 'tecnico' && (
            <div className="space-y-6">
              <h2 className="text-sm font-semibold text-foreground">Dados Tecnicos da Receita</h2>
              <p className="text-[12px] text-muted-foreground -mt-4">Informe os dados da prescricao oftalmica. Campos opcionais.</p>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Olho Direito (OD)</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-muted-foreground mb-1 block">Esferico</label>
                      <Input placeholder="+0.00" value={odEsferico} onChange={(e) => setOdEsferico(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground mb-1 block">Cilindrico</label>
                      <Input placeholder="-0.00" value={odCilindrico} onChange={(e) => setOdCilindrico(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground mb-1 block">Eixo</label>
                      <Input placeholder="0" value={odEixo} onChange={(e) => setOdEixo(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Olho Esquerdo (OE)</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-muted-foreground mb-1 block">Esferico</label>
                      <Input placeholder="+0.00" value={oeEsferico} onChange={(e) => setOeEsferico(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground mb-1 block">Cilindrico</label>
                      <Input placeholder="-0.00" value={oeCilindrico} onChange={(e) => setOeCilindrico(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground mb-1 block">Eixo</label>
                      <Input placeholder="0" value={oeEixo} onChange={(e) => setOeEixo(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">Adicao (perto)</label>
                  <Input placeholder="+0.00" value={adicao} onChange={(e) => setAdicao(e.target.value)} />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">DP (dist. pupilar)</label>
                  <Input placeholder="62" value={dp} onChange={(e) => setDp(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Observacoes Tecnicas</label>
                <Textarea
                  placeholder="Informacoes adicionais, instrucoes especiais, tipo de tratamento..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* STEP: Documentos */}
          {step === 'documentos' && (
            <OSDocUpload
              documentos={documentos}
              onAdd={handleAddDocs}
              onRemove={handleRemoveDoc}
              onCategoriaChange={handleCategoriaChange}
            />
          )}

          {/* STEP: Pagamento */}
          {step === 'pagamento' && (
            <div className="space-y-6">
              <h2 className="text-sm font-semibold text-foreground">Condicao de Pagamento</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Forma de Pagamento</label>
                  <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="cartao_credito">Cartao de Credito</SelectItem>
                      <SelectItem value="cartao_debito">Cartao de Debito</SelectItem>
                      <SelectItem value="boleto">Boleto Bancario</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Parcelas</label>
                  <Select value={parcelas} onValueChange={setParcelas}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7,8,9,10,12].map(n => (
                        <SelectItem key={n} value={String(n)}>
                          {n}x de {formatCurrency(totalItens / n)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted-foreground">Valor Total</span>
                  <span className="font-bold text-foreground">{formatCurrency(totalItens)}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted-foreground">Forma</span>
                  <span className="font-medium text-foreground">{formaPagamento || '-'}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted-foreground">Parcelas</span>
                  <span className="font-medium text-foreground">{parcelas}x de {formatCurrency(totalItens / parseInt(parcelas))}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP: Revisao */}
          {step === 'revisao' && (
            <div className="space-y-6">
              <h2 className="text-sm font-semibold text-foreground">Revisão Final</h2>
              <p className="text-[12px] text-muted-foreground -mt-4">Confira todos os dados antes de criar a Ordem de Serviço.</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Origem da Venda</p>
                  <OSOrigemBadge origem={origemVenda} localAcao={localAcaoExterna || undefined} size="md" />
                  {origemVenda === 'externa' && !localAcaoExterna && (
                    <p className="text-[11px] text-warning">Local da ação não informado</p>
                  )}
                </div>
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Vendedor</p>
                  <p className="text-sm font-medium text-foreground">{currentUser.nome}</p>
                  <p className="text-[12px] text-muted-foreground">{selectedUnidade?.nome || '-'}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Cliente</p>
                  <p className="text-sm font-medium text-foreground">{selectedCliente?.nome || '-'}</p>
                  <p className="text-[12px] text-muted-foreground">{selectedCliente?.cpf}</p>
                </div>
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Prioridade</p>
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                    prioridade === 'urgente' ? 'bg-destructive/10 text-destructive' :
                    prioridade === 'alta' ? 'bg-warning/10 text-warning' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {prioridade.charAt(0).toUpperCase() + prioridade.slice(1)}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-border">
                <div className="border-b border-border px-4 py-3">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Itens ({itens.length})</p>
                </div>
                <div className="divide-y divide-border/40">
                  {itens.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.descricao || 'Sem descrição'}</p>
                        <p className="text-[12px] text-muted-foreground">{item.tipo} — {item.quantidade}x</p>
                      </div>
                      <span className="text-sm font-medium text-foreground">{formatCurrency(item.valorUnitario * item.quantidade)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border px-4 py-3 flex justify-between">
                  <span className="text-sm font-bold text-foreground">Total</span>
                  <span className="text-sm font-bold text-foreground">{formatCurrency(totalItens)}</span>
                </div>
              </div>

              {/* Documents summary */}
              <div className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Documentos ({documentos.length})</p>
                  {!hasReceita && documentos.length > 0 && (
                    <span className="text-[10px] font-medium text-warning">Sem receita anexada</span>
                  )}
                  {hasReceita && (
                    <span className="text-[10px] font-medium text-primary">Receita anexada</span>
                  )}
                </div>
                {documentos.length > 0 ? (
                  <div className="space-y-1">
                    {documentos.map(d => (
                      <div key={d.id} className="flex items-center justify-between text-[12px]">
                        <span className="text-foreground truncate">{d.nome}</span>
                        <span className="text-muted-foreground shrink-0 ml-2">{d.categoria.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] text-muted-foreground">Nenhum documento anexado</p>
                )}
              </div>

              <div className="rounded-lg border border-border p-4 space-y-2">
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Pagamento</p>
                <p className="text-sm font-medium text-foreground">{formaPagamento || '-'} — {parcelas}x de {formatCurrency(totalItens / parseInt(parcelas))}</p>
              </div>

              {observacoes && (
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Observações</p>
                  <p className="text-sm text-foreground">{observacoes}</p>
                </div>
              )}

              <div className="rounded-lg bg-muted/50 border border-border p-4 flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-[13px] font-medium text-foreground">Pronto para enviar</p>
                  <p className="text-[12px] text-muted-foreground">A OS será criada com status "Aberta" e encaminhada para a Central de Produção após confirmação.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" className="h-9 text-[13px]" onClick={goPrev} disabled={stepIndex === 0}>
            Voltar
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-muted-foreground">Etapa {stepIndex + 1} de {STEPS.length}</span>
            {step !== 'revisao' ? (
              <Button size="sm" className="h-9 text-[13px] font-semibold" onClick={goNext} disabled={!canAdvance()}>
                Proximo
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button size="sm" className="h-9 text-[13px] font-semibold" onClick={() => setConfirmOpen(true)} disabled={!canAdvance()}>
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                Criar Ordem de Servico
              </Button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirmar Criacao da OS"
        description={`Criar OS para ${selectedCliente?.nome || 'cliente'} no valor de ${formatCurrency(totalItens)} com ${documentos.length} documento(s)? A OS sera encaminhada para a Central de Producao.`}
        confirmLabel="Criar OS"
        onConfirm={handleSubmit}
      />
    </AppLayout>
  );
}
