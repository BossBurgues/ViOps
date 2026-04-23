import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { rede, unidades } from '@/data/mockData';
import { useApp } from '@/contexts/AppContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/EmptyState';
import { Shield, Building2, Settings2, CreditCard, Bell, Database, Plug, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { recordAudit } from '@/lib/audit';

type ConfigTab = 'rede' | 'operacional' | 'financeiro' | 'notificacoes' | 'integracoes' | 'seguranca';

export default function ConfiguracoesPage() {
  const { hasPermission, currentUser } = useApp();
  const [tab, setTab] = useState<ConfigTab>('rede');

  const saveSettings = (section: string) => {
    recordAudit({
      action: 'settings_change',
      userId: currentUser.id,
      userName: currentUser.nome,
      userRole: currentUser.role,
      resource: `Configuracoes / ${section}`,
      details: `Atualizou parametros da secao "${section}"`,
    });
    toast.success(`${section} salvo com sucesso`);
  };

  if (!hasPermission(['admin'])) {
    return (
      <AppLayout>
        <EmptyState icon={Shield} title="Acesso restrito" description="Apenas administradores podem alterar as configuracoes do sistema." />
      </AppLayout>
    );
  }

  const tabs: { key: ConfigTab; label: string; icon: React.ElementType }[] = [
    { key: 'rede', label: 'Dados da Rede', icon: Building2 },
    { key: 'operacional', label: 'Operacional', icon: Settings2 },
    { key: 'financeiro', label: 'Financeiro', icon: CreditCard },
    { key: 'notificacoes', label: 'Notificacoes', icon: Bell },
    { key: 'integracoes', label: 'Integracoes', icon: Plug },
    { key: 'seguranca', label: 'Seguranca', icon: Lock },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Configuracoes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Parametros gerais do sistema</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar nav */}
          <div className="space-y-1">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`w-full flex items-center gap-3 rounded-lg px-4 py-2.5 text-[13px] font-medium transition-colors ${
                  tab === t.key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <t.icon className="h-4 w-4" />{t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="lg:col-span-3 max-w-2xl space-y-6">
            {tab === 'rede' && (
              <div className="page-card p-6 space-y-5">
                <h2 className="section-title">Dados da Rede</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-foreground">Nome da Rede</Label>
                    <Input defaultValue={rede.nome} className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-foreground">CNPJ</Label>
                    <Input defaultValue={rede.cnpj} className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-foreground">Razao Social</Label>
                    <Input defaultValue="Visual Premium Optica Ltda" className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-foreground">Inscricao Estadual</Label>
                    <Input defaultValue="123.456.789" className="h-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-foreground">Endereco</Label>
                  <Input defaultValue="Av. Sete de Setembro, 1234 - Centro, Curitiba - PR" className="h-10" />
                </div>
                <div className="border-t border-border pt-4">
                  <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Unidades Vinculadas</h3>
                  <div className="space-y-2">
                    {unidades.map(u => (
                      <div key={u.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5">
                        <div>
                          <p className="text-[13px] font-medium text-foreground">{u.nome}</p>
                          <p className="text-[11px] text-muted-foreground">{u.cidade}/{u.uf}</p>
                        </div>
                        <span className={`status-badge ${u.ativa ? 'status-pronta' : 'status-cancelada'}`}>
                          {u.ativa ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button className="h-10 text-[13px] font-semibold" onClick={() => saveSettings('Dados da Rede')}>
                  Salvar Alteracoes
                </Button>
              </div>
            )}

            {tab === 'operacional' && (
              <div className="page-card p-6 space-y-5">
                <h2 className="section-title">Parametros Operacionais</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-foreground">Prazo padrao de producao (dias)</Label>
                    <Input type="number" defaultValue="7" className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-foreground">Tolerancia de atraso (dias)</Label>
                    <Input type="number" defaultValue="3" className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-foreground">SLA Critico (dias)</Label>
                    <Input type="number" defaultValue="5" className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-foreground">SLA Alerta (dias)</Label>
                    <Input type="number" defaultValue="3" className="h-10" />
                  </div>
                </div>
                <div className="space-y-3 border-t border-border pt-4">
                  <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Regras de Negocio</h3>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-[13px] font-medium text-foreground">Bloquear entrega por inadimplencia</p>
                      <p className="text-[11px] text-muted-foreground">Impede entrega quando ha parcelas vencidas</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-[13px] font-medium text-foreground">Bloquear edicao apos producao</p>
                      <p className="text-[11px] text-muted-foreground">Impede alteracao de itens apos inicio da producao</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-[13px] font-medium text-foreground">Exigir receita medica</p>
                      <p className="text-[11px] text-muted-foreground">Documento obrigatorio para criacao de OS</p>
                    </div>
                    <Switch />
                  </div>
                </div>
                <Button className="h-10 text-[13px] font-semibold" onClick={() => saveSettings('Operacional')}>
                  Salvar Parametros
                </Button>
              </div>
            )}

            {tab === 'financeiro' && (
              <div className="page-card p-6 space-y-5">
                <h2 className="section-title">Parametros Financeiros</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-foreground">Dias de tolerancia para vencimento</Label>
                    <Input type="number" defaultValue="3" className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-foreground">Maximo de parcelas</Label>
                    <Input type="number" defaultValue="12" className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-foreground">Taxa de juros ao mes (%)</Label>
                    <Input type="number" defaultValue="2.0" step="0.1" className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-foreground">Multa por atraso (%)</Label>
                    <Input type="number" defaultValue="2.0" step="0.1" className="h-10" />
                  </div>
                </div>
                <div className="space-y-3 border-t border-border pt-4">
                  <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Formas de Pagamento Ativas</h3>
                  {['PIX', 'Cartao de Credito', 'Boleto Bancario', 'Dinheiro', 'Transferencia'].map(fp => (
                    <div key={fp} className="flex items-center justify-between py-1.5">
                      <span className="text-[13px] text-foreground">{fp}</span>
                      <Switch defaultChecked />
                    </div>
                  ))}
                </div>
                <Button className="h-10 text-[13px] font-semibold" onClick={() => saveSettings('Financeiro')}>
                  Salvar Parametros
                </Button>
              </div>
            )}

            {tab === 'notificacoes' && (
              <div className="page-card p-6 space-y-5">
                <h2 className="section-title">Notificacoes</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Notificar gestor sobre OS em pendencia', desc: 'Email automatico quando OS entrar em pendencia' },
                    { label: 'Alerta de parcela vencida', desc: 'Notificacao diaria de parcelas em atraso' },
                    { label: 'Resumo diario da operacao', desc: 'Email com indicadores do dia anterior' },
                    { label: 'OS pronta para retirada', desc: 'Notificar vendedor quando OS ficar pronta' },
                    { label: 'Alerta de SLA critico', desc: 'Notificar operador sobre OS com tempo excedido' },
                  ].map(n => (
                    <div key={n.label} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-[13px] font-medium text-foreground">{n.label}</p>
                        <p className="text-[11px] text-muted-foreground">{n.desc}</p>
                      </div>
                      <Switch />
                    </div>
                  ))}
                </div>
                <Button className="h-10 text-[13px] font-semibold" onClick={() => saveSettings('Notificacoes')}>
                  Salvar Preferencias
                </Button>
              </div>
            )}

            {tab === 'integracoes' && (
              <div className="space-y-4">
                {[
                  { nome: 'Gateway de Pagamento', desc: 'Integracao com gateway bancario para cobranca automatica', status: 'Disponivel em breve', icon: CreditCard },
                  { nome: 'Conciliacao Bancaria', desc: 'Importacao automatica de extratos e baixas', status: 'Disponivel em breve', icon: Database },
                  { nome: 'Nota Fiscal Eletronica', desc: 'Emissao automatica de NF-e vinculada a OS', status: 'Disponivel em breve', icon: Database },
                  { nome: 'ERP Contabil', desc: 'Exportacao de lancamentos para sistema contabil', status: 'Disponivel em breve', icon: Plug },
                ].map(integ => (
                  <div key={integ.nome} className="page-card p-5 flex items-center gap-4 border-dashed">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <integ.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-foreground">{integ.nome}</p>
                      <p className="text-[12px] text-muted-foreground">{integ.desc}</p>
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground bg-muted rounded-md px-3 py-1">{integ.status}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === 'seguranca' && (
              <div className="page-card p-6 space-y-5">
                <h2 className="section-title">Seguranca e Acesso</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-[13px] font-medium text-foreground">Autenticacao em dois fatores (2FA)</p>
                      <p className="text-[11px] text-muted-foreground">Exigir verificacao adicional no login</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-[13px] font-medium text-foreground">Expirar sessao apos inatividade</p>
                      <p className="text-[11px] text-muted-foreground">Desconectar automaticamente apos 30 minutos</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-[13px] font-medium text-foreground">Log de auditoria completo</p>
                      <p className="text-[11px] text-muted-foreground">Registrar todas as acoes de usuarios</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-[13px] font-medium text-foreground">Restringir acesso por IP</p>
                      <p className="text-[11px] text-muted-foreground">Permitir login apenas de IPs autorizados</p>
                    </div>
                    <Switch />
                  </div>
                </div>
                <div className="space-y-2 border-t border-border pt-4">
                  <Label className="text-[13px] font-medium text-foreground">Politica de senha</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-[11px] text-muted-foreground">Tamanho minimo</Label>
                      <Input type="number" defaultValue="8" className="h-9" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] text-muted-foreground">Validade (dias)</Label>
                      <Input type="number" defaultValue="90" className="h-9" />
                    </div>
                  </div>
                </div>
                <Button className="h-10 text-[13px] font-semibold" onClick={() => saveSettings('Seguranca')}>
                  Salvar Politicas
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
