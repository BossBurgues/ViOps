import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/contexts/AppContext';
import { clientes, unidades, formatCurrency } from '@/data/mockData';
import { OrigemVenda, CanalOperacional } from '@/data/types';
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

// ---------------------------------------------------------------------------
// Local form type — all string fields for controlled inputs.
// Mirrors DadosAcaoExterna from types.ts but uses string for all inputs.
// ---------------------------------------------------------------------------

interface DadosAcaoExternaForm {
  nomeLocal: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  pontoReferencia: string;
  responsavelLocal: string;
  telefoneContato: string;
  vendedorEquipe: string;
  dataAcao: string;
  observacoesAcao: string;
}

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
  // External address — structured form replacing the old single-field localAcaoExterna
  const [dadosAcaoExterna, setDadosAcaoExterna] = useState<DadosAcaoExternaForm>({
    nomeLocal: '', cep: '', logradouro: '', numero: '', complemento: '',
    bairro: '', cidade: '', uf: '', pontoReferencia: '',
    responsavelLocal: '', telefoneContato: '', vendedorEquipe: '', dataAcao: '', observacoesAcao: '',
  });

  // Derived: the operational channel and responsible unit
  // External sales are ALWAYS assigned to the Central/Fábrica — derived by tipo, never by hardcoded ID.
  const unidadeCentral = unidades.find(u => u.tipo === 'central_fabrica');
  const canalOperacional: CanalOperacional = origemVenda === 'externa' ? 'externa' : 'loja';

  // Derived backward-compat field from structured data
  const localAcaoExternaDerived = [dadosAcaoExterna.nomeLocal, dadosAcaoExterna.cidade && dadosAcaoExterna.uf ? `${dadosAcaoExterna.cidade}/${dadosAcaoExterna.uf}` : (dadosAcaoExterna.cidade || dadosAcaoExterna.uf)].filter(Boolean).join(' — ');

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

  // Payment state — hybrid model: entrada + saldo complementar
  const [valorEntrada, setValorEntrada] = useState('');
  const [metodoEntrada, setMetodoEntrada] = useState('');
  const [statusEntrada, setStatusEntrada] = useState('paga');
  const [metodoComplementar, setMetodoComplementar] = useState('sem_saldo');
  const [numParcelas, setNumParcelas] = useState('1');
  const [vencimentoPrimeiraParcela, setVencimentoPrimeiraParcela] = useState('');
  const [statusCobranca, setStatusCobranca] = useState('pendente');
  const [referenciaComprovante, setReferenciaComprovante] = useState('');

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
    if (step === 'cliente') {
      if (!clienteId) return false;
      if (origemVenda === 'otica') return !!unidadeId;
      // Externa: require nomeLocal + cidade + uf + (vendedorEquipe or responsavelLocal)
      const d = dadosAcaoExterna;
      return !!d.nomeLocal.trim() && !!d.cidade.trim() && !!d.uf.trim() &&
        (!!d.vendedorEquipe.trim() || !!d.responsavelLocal.trim());
    }
    if (step === 'itens') return itens.length > 0 && itens.every(i => i.descricao && i.valorUnitario > 0);
    if (step === 'pagamento') return !!metodoEntrada;
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
    const temSaldo = metodoComplementar !== 'sem_saldo';
    const descPgto = temSaldo
      ? `Entrada ${metodoEntrada} + saldo ${metodoComplementar}`
      : metodoEntrada;
    toast.success('Ordem de Serviço criada com sucesso', {
      description: `OS ${origemVenda === 'externa' ? 'externa' : 'em ótica'} criada por ${currentUser.nome} para ${selectedCliente?.nome} — ${descPgto}`,
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
                {([['otica', 'Venda na Ótica', 'Atendimento presencial na loja', Store] as const, ['externa', 'Venda Externa (Central)', 'Venda de campo pela equipe externa da Central', MapPin] as const]).map(([key, label, desc, Icon]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setOrigemVenda(key);
                      if (key === 'externa') {
                        // Auto-assign to Central/Fábrica — external sales never belong to an ótica
                        setUnidadeId(CENTRAL_ID);
                        setLocalAcaoExterna('');
                      } else {
                        // Revert to the user's home unit when switching back to ótica
                        setUnidadeId(currentUser.unidadeId);
                        setLocalAcaoExterna('');
                      }
                    }}
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

              {/* Campos condicionais — venda externa: formulário estruturado */}
              {origemVenda === 'externa' && (
                <div className="rounded-xl border border-violet-200 bg-violet-50/50 dark:border-violet-900/40 dark:bg-violet-950/20 p-4 space-y-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">Dados da Ação Externa — Central/Fábrica</p>

                  {/* Unit info-box */}
                  <div className="rounded-lg border border-violet-300/60 bg-violet-100/40 dark:bg-violet-950/30 px-3 py-2.5 flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold text-violet-700 dark:text-violet-300">Unidade responsável: {unidadeCentral?.nome ?? 'Central / Fábrica'}</p>
                      <p className="text-[10px] text-violet-600/70 dark:text-violet-400/60">A venda externa pertence exclusivamente à Central — não a nenhuma ótica</p>
                    </div>
                  </div>

                  {/* Grid de campos estruturados */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Nome do Local / Empresa / Evento <span className="text-destructive">*</span></label>
                      <Input placeholder="Ex: Empresa Alfa Ltda, Evento SESC, Residência do cliente..." value={dadosAcaoExterna.nomeLocal} onChange={e => setDadosAcaoExterna(d => ({ ...d, nomeLocal: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Cidade <span className="text-destructive">*</span></label>
                      <Input placeholder="Curitiba" value={dadosAcaoExterna.cidade} onChange={e => setDadosAcaoExterna(d => ({ ...d, cidade: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">UF <span className="text-destructive">*</span></label>
                      <Input placeholder="PR" maxLength={2} className="uppercase" value={dadosAcaoExterna.uf} onChange={e => setDadosAcaoExterna(d => ({ ...d, uf: e.target.value.toUpperCase() }))} />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Vendedor / Equipe Externa <span className="text-destructive">*</span></label>
                      <Input placeholder="Nome do vendedor ou equipe responsável..." value={dadosAcaoExterna.vendedorEquipe} onChange={e => setDadosAcaoExterna(d => ({ ...d, vendedorEquipe: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Responsável no Local</label>
                      <Input placeholder="Ex: Gerente RH, Portaria..." value={dadosAcaoExterna.responsavelLocal} onChange={e => setDadosAcaoExterna(d => ({ ...d, responsavelLocal: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">CEP</label>
                      <Input placeholder="00000-000" value={dadosAcaoExterna.cep} onChange={e => setDadosAcaoExterna(d => ({ ...d, cep: e.target.value }))} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Logradouro</label>
                      <div className="flex gap-2">
                        <Input className="flex-1" placeholder="Rua, Av, Trav..." value={dadosAcaoExterna.logradouro} onChange={e => setDadosAcaoExterna(d => ({ ...d, logradouro: e.target.value }))} />
                        <Input className="w-24" placeholder="Nº" value={dadosAcaoExterna.numero} onChange={e => setDadosAcaoExterna(d => ({ ...d, numero: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Bairro</label>
                      <Input placeholder="Bairro" value={dadosAcaoExterna.bairro} onChange={e => setDadosAcaoExterna(d => ({ ...d, bairro: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Telefone de Contato</label>
                      <Input placeholder="(41) 99999-0000" value={dadosAcaoExterna.telefoneContato} onChange={e => setDadosAcaoExterna(d => ({ ...d, telefoneContato: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Data da Ação</label>
                      <Input type="date" value={dadosAcaoExterna.dataAcao} onChange={e => setDadosAcaoExterna(d => ({ ...d, dataAcao: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Ponto de Referência</label>
                      <Input placeholder="Ex: próx. ao banco, portaria B..." value={dadosAcaoExterna.pontoReferencia} onChange={e => setDadosAcaoExterna(d => ({ ...d, pontoReferencia: e.target.value }))} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Observações da Ação</label>
                      <Textarea rows={2} placeholder="Contexto, particularidades da visita externa..." value={dadosAcaoExterna.observacoesAcao} onChange={e => setDadosAcaoExterna(d => ({ ...d, observacoesAcao: e.target.value }))} />
                    </div>
                  </div>

                  <p className="text-[10px] text-violet-600/60 dark:text-violet-400/50 italic">
                    Campos marcados com <span className="text-destructive">*</span> são obrigatórios para avançar.
                  </p>
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

                {origemVenda === 'otica' && (
                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Unidade de Atendimento</label>
                    <Select value={unidadeId} onValueChange={setUnidadeId}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {unidades.filter(u => u.ativa && u.tipo !== 'central_fabrica').map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
              <div>
                <h2 className="text-sm font-semibold text-foreground">Condição de Pagamento</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">Configure a cobrança híbrida: entrada + método complementar.</p>
              </div>

              {/* Resumo do valor total */}
              <div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/15 px-4 py-3">
                <span className="text-[12px] text-muted-foreground">Valor Total da OS</span>
                <span className="text-base font-bold text-foreground">{formatCurrency(totalItens)}</span>
              </div>

              {/* ── Seção 1: Entrada ── */}
              <div className="space-y-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">1. Entrada</p>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Valor da Entrada (R$)</label>
                    <Input
                      type="number" min={0} step={0.01}
                      placeholder="0,00"
                      value={valorEntrada}
                      onChange={e => setValorEntrada(e.target.value)}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">0 = sem entrada (saldo integral)</p>
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Método da Entrada <span className="text-destructive">*</span></label>
                    <Select value={metodoEntrada} onValueChange={setMetodoEntrada}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="pix">Pix</SelectItem>
                        <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                        <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                        <SelectItem value="maquina_mp">Mercado Pago Máquina</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Status da Entrada</label>
                    <Select value={statusEntrada} onValueChange={setStatusEntrada}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paga">Paga</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Saldo auto-calculado */}
                {(() => {
                  const entrada = parseFloat(valorEntrada) || 0;
                  const saldo = totalItens - entrada;
                  return (
                    <div className={`flex items-center justify-between rounded-md px-3 py-2.5 ${
                      saldo < 0 ? 'bg-destructive/10 border border-destructive/30' : 'bg-muted/60 border border-border'
                    }`}>
                      <span className="text-[12px] text-muted-foreground">Saldo Restante</span>
                      <span className={`text-sm font-bold ${
                        saldo < 0 ? 'text-destructive' : saldo === 0 ? 'text-success' : 'text-foreground'
                      }`}>
                        {formatCurrency(Math.max(0, saldo))}
                        {saldo < 0 && <span className="ml-2 text-[10px] font-normal">(entrada maior que o total)</span>}
                        {saldo === 0 && entrada > 0 && <span className="ml-2 text-[10px] font-normal text-success">✔ Quitado na entrada</span>}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* ── Seção 2: Método Complementar ── */}
              <div className="space-y-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">2. Saldo / Método Complementar</p>

                <div>
                  <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Método para o Saldo</label>
                  <Select value={metodoComplementar} onValueChange={setMetodoComplementar}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sem_saldo">Sem saldo (entrada única / quitado)</SelectItem>
                      <SelectItem value="boleto">Boleto Sicoob</SelectItem>
                      <SelectItem value="pix">Pix</SelectItem>
                      <SelectItem value="cartao">Cartão (crédito ou débito)</SelectItem>
                      <SelectItem value="link_pagamento">Link Mercado Pago</SelectItem>
                      <SelectItem value="qr_mercado_pago">QR Code Mercado Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Campos condicionais — aparecem somente quando há saldo */}
                {metodoComplementar !== 'sem_saldo' && (
                  <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Parcelas do Saldo</label>
                        <Select value={numParcelas} onValueChange={setNumParcelas}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[1,2,3,4,5,6,7,8,9,10,12].map(n => {
                              const saldo = Math.max(0, totalItens - (parseFloat(valorEntrada) || 0));
                              return (
                                <SelectItem key={n} value={String(n)}>
                                  {n}x {n > 1 ? `de ${formatCurrency(saldo / n)}` : '(integral)'}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Vencimento 1ª Parcela</label>
                        <Input
                          type="date"
                          value={vencimentoPrimeiraParcela}
                          onChange={e => setVencimentoPrimeiraParcela(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Status da Cobrança</label>
                        <Select value={statusCobranca} onValueChange={setStatusCobranca}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gerada">Gerada</SelectItem>
                            <SelectItem value="enviada">Enviada ao cliente</SelectItem>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="paga">Paga</SelectItem>
                            <SelectItem value="vencida">Vencida</SelectItem>
                            <SelectItem value="expirada">Expirada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Info contextual por método */}
                    {metodoComplementar === 'boleto' && (
                      <div className="flex items-start gap-2 rounded-md bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/40 px-3 py-2">
                        <span className="text-[11px] text-sky-700 dark:text-sky-300">
                          🏦 Boleto Sicoob — a emissão será registrada manualmente após criação da OS.
                        </span>
                      </div>
                    )}
                    {(metodoComplementar === 'link_pagamento' || metodoComplementar === 'qr_mercado_pago') && (
                      <div className="flex items-start gap-2 rounded-md bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900/40 px-3 py-2">
                        <span className="text-[11px] text-violet-700 dark:text-violet-300">
                          🔗 Link / QR Mercado Pago — o link será gerado e enviado ao cliente após criação da OS. Não é cobrança automática.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Seção 3: Comprovante ── */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">3. Comprovante / Referência</p>
                <Input
                  placeholder="Nº do comprovante, referência do Pix, código de pagamento..."
                  value={referenciaComprovante}
                  onChange={e => setReferenciaComprovante(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">Opcional. Anote a referência do pagamento da entrada para rastreabilidade.</p>
              </div>

              {/* Resumo vivo */}
              {metodoEntrada && (
                <div className="rounded-lg border border-border divide-y divide-border/50">
                  <div className="px-4 py-2.5 flex justify-between text-[12px]">
                    <span className="text-muted-foreground">Entrada ({metodoEntrada})</span>
                    <span className={`font-semibold ${statusEntrada === 'paga' ? 'text-success' : 'text-warning'}`}>
                      {formatCurrency(parseFloat(valorEntrada) || 0)} — {statusEntrada}
                    </span>
                  </div>
                  {metodoComplementar !== 'sem_saldo' && (
                    <div className="px-4 py-2.5 flex justify-between text-[12px]">
                      <span className="text-muted-foreground">Saldo ({metodoComplementar}) {numParcelas}x</span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(Math.max(0, totalItens - (parseFloat(valorEntrada) || 0)))}
                      </span>
                    </div>
                  )}
                  <div className="px-4 py-2.5 flex justify-between text-[13px]">
                    <span className="font-bold text-foreground">Total</span>
                    <span className="font-bold text-foreground">{formatCurrency(totalItens)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP: Revisao */}
          {step === 'revisao' && (
            <div className="space-y-6">
              <h2 className="text-sm font-semibold text-foreground">Revisão Final</h2>
              <p className="text-[12px] text-muted-foreground -mt-4">Confira todos os dados antes de criar a Ordem de Serviço.</p>

              <div className="rounded-lg border border-border divide-y divide-border/60">
                <div className="px-4 py-3">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Contexto da Venda</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[12px]">
                    <div>
                      <span className="text-muted-foreground">Tipo: </span>
                      <span className="font-medium text-foreground">{origemVenda === 'externa' ? 'Venda Externa' : 'Venda na Ótica'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Canal: </span>
                      <span className="font-medium text-foreground capitalize">{canalOperacional}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Unidade responsável: </span>
                      <span className={`font-medium ${origemVenda === 'externa' ? 'text-violet-600 dark:text-violet-400' : 'text-foreground'}`}>
                        {origemVenda === 'externa'
                          ? (unidadeCentral?.nome ?? 'Central / Fábrica')
                          : unidades.find(u => u.id === unidadeId)?.nome ?? '-'
                        }
                      </span>
                    </div>
                    {localAcaoExternaDerived && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Local da ação: </span>
                        <span className="font-medium text-foreground">{localAcaoExternaDerived}</span>
                      </div>
                    )}
                  </div>
                </div>

              {/* Painel estruturado da Ação Externa — exibido apenas na revisão quando externa */}
              {origemVenda === 'externa' && dadosAcaoExterna.nomeLocal && (
                <div className="rounded-xl border border-violet-200 dark:border-violet-800/40 bg-violet-50/40 dark:bg-violet-950/10 p-4 space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">Dados da Ação Externa</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[12px]">
                    {dadosAcaoExterna.nomeLocal && <div className="col-span-2"><span className="text-muted-foreground">Local: </span><span className="font-medium text-foreground">{dadosAcaoExterna.nomeLocal}</span></div>}
                    {dadosAcaoExterna.vendedorEquipe && <div><span className="text-muted-foreground">Equipe/Vendedor: </span><span className="font-medium text-foreground">{dadosAcaoExterna.vendedorEquipe}</span></div>}
                    {dadosAcaoExterna.responsavelLocal && <div><span className="text-muted-foreground">Resp. local: </span><span className="font-medium text-foreground">{dadosAcaoExterna.responsavelLocal}</span></div>}
                    {(dadosAcaoExterna.cidade || dadosAcaoExterna.uf) && <div><span className="text-muted-foreground">Cidade/UF: </span><span className="font-medium text-foreground">{dadosAcaoExterna.cidade}{dadosAcaoExterna.uf ? `/${dadosAcaoExterna.uf}` : ''}</span></div>}
                    {dadosAcaoExterna.logradouro && <div><span className="text-muted-foreground">Endereço: </span><span className="font-medium text-foreground">{dadosAcaoExterna.logradouro}{dadosAcaoExterna.numero ? `, ${dadosAcaoExterna.numero}` : ''}</span></div>}
                    {dadosAcaoExterna.bairro && <div><span className="text-muted-foreground">Bairro: </span><span className="font-medium text-foreground">{dadosAcaoExterna.bairro}</span></div>}
                    {dadosAcaoExterna.cep && <div><span className="text-muted-foreground">CEP: </span><span className="font-medium text-foreground">{dadosAcaoExterna.cep}</span></div>}
                    {dadosAcaoExterna.telefoneContato && <div><span className="text-muted-foreground">Tel. contato: </span><span className="font-medium text-foreground">{dadosAcaoExterna.telefoneContato}</span></div>}
                    {dadosAcaoExterna.dataAcao && <div><span className="text-muted-foreground">Data da ação: </span><span className="font-medium text-foreground">{dadosAcaoExterna.dataAcao}</span></div>}
                    {dadosAcaoExterna.pontoReferencia && <div className="col-span-2"><span className="text-muted-foreground">Referência: </span><span className="font-medium text-foreground">{dadosAcaoExterna.pontoReferencia}</span></div>}
                    {dadosAcaoExterna.observacoesAcao && <div className="col-span-2"><span className="text-muted-foreground">Observações: </span><span className="font-medium text-foreground">{dadosAcaoExterna.observacoesAcao}</span></div>}
                  </div>
                </div>
              )}
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

              {/* Pagamento summary */}
              <div className="rounded-lg border border-border divide-y divide-border/60">
                <div className="px-4 py-3">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Pagamento</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[12px]">
                    <div>
                      <span className="text-muted-foreground">Total: </span>
                      <span className="font-bold text-foreground">{formatCurrency(totalItens)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Entrada: </span>
                      <span className="font-medium text-foreground">{formatCurrency(parseFloat(valorEntrada) || 0)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Método entrada: </span>
                      <span className="font-medium text-foreground capitalize">{metodoEntrada || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status entrada: </span>
                      <span className={`font-medium ${statusEntrada === 'paga' ? 'text-success' : 'text-warning'}`}>
                        {statusEntrada}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Saldo restante: </span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(Math.max(0, totalItens - (parseFloat(valorEntrada) || 0)))}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Método saldo: </span>
                      <span className="font-medium text-foreground">
                        {metodoComplementar === 'sem_saldo' ? 'Quitado' : metodoComplementar}
                      </span>
                    </div>
                    {metodoComplementar !== 'sem_saldo' && (
                      <>
                        <div>
                          <span className="text-muted-foreground">Parcelas: </span>
                          <span className="font-medium text-foreground">{numParcelas}x</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">1ª parcela: </span>
                          <span className="font-medium text-foreground">{vencimentoPrimeiraParcela || '-'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Status cobrança: </span>
                          <span className="font-medium text-foreground capitalize">{statusCobranca}</span>
                        </div>
                      </>
                    )}
                    {referenciaComprovante && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Comprovante: </span>
                        <span className="font-medium text-foreground font-mono text-[11px]">{referenciaComprovante}</span>
                      </div>
                    )}
                  </div>
                </div>
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
                  <p className="text-[13px] font-medium text-foreground">Pronto para criar</p>
                  <p className="text-[12px] text-muted-foreground">
                    A OS será criada com status <span className="font-semibold text-foreground">“Aberta”</span>.
                    Após a criação, utilize a OS para enviá-la à Central de Produção quando estiver pronta.
                  </p>
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
        title="Confirmar Criação da OS"
        description={`Criar OS de ${origemVenda === 'externa' ? 'venda externa (Central/Fábrica)' : 'venda na ótica'} para ${selectedCliente?.nome || 'cliente'} no valor de ${formatCurrency(totalItens)} com ${documentos.length} documento(s)? A OS será criada com status Aberta.`}
        confirmLabel="Criar OS"
        onConfirm={handleSubmit}
      />
    </AppLayout>
  );
}
