import AppLayout from '@/components/AppLayout';
import { unidades, ordensServico, formatCurrency } from '@/data/mockData';
import { isParcelaVencida, isCanalExterno } from '@/lib/financialStatus';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import {
  Plus, MapPin, Phone, FileText, DollarSign, AlertTriangle,
  TrendingUp, Users, Factory, Link2, ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Derived metrics helpers — external-channel data lives on the Central unit
// ---------------------------------------------------------------------------

function buildCentralExternaMetrics() {
  const osExternas = ordensServico.filter(os =>
    isCanalExterno(os.canalOperacional, os.origemVenda)
  );
  const fatExterno = osExternas.reduce((s, os) => s + os.valorTotal, 0);
  const parcelasExternas = osExternas.flatMap(os => os.pagamento?.parcelas || []);
  const vencidasExternas = parcelasExternas.filter(p => isParcelaVencida(p)).length;
  const linksPendentes = parcelasExternas.filter(p =>
    p.paymentIntent && ['gerado', 'enviado', 'pendente'].includes(p.paymentIntent.status)
  ).length;
  return { osCount: osExternas.length, fatExterno, vencidasExternas, linksPendentes };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function UnidadesPage() {
  const { hasPermission } = useApp();
  const canCreate = hasPermission(['admin']);

  // Separate central hub from optical stores — Central/Fábrica is typed explicitly
  const centralUnit = unidades.find(u => u.tipo === 'central_fabrica');
  const oticaUnits   = unidades.filter(u => u.tipo !== 'central_fabrica');

  const ext = buildCentralExternaMetrics();

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Unidades</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {unidades.length} unidades cadastradas na rede
            </p>
          </div>
          {canCreate && (
            <Button
              size="sm"
              className="h-9 text-[13px] font-semibold"
              onClick={() => toast.info('Em desenvolvimento')}
            >
              <Plus className="mr-1.5 h-4 w-4" />Nova Unidade
            </Button>
          )}
        </div>

        {/* ── Central / Fábrica card — shown first, with Canal Externa panel ── */}
        {centralUnit && (() => {
          const osUnit = ordensServico.filter(os => os.unidadeId === centralUnit.id);
          const osCount = osUnit.length;
          const fat     = osUnit.reduce((s, os) => s + os.valorTotal, 0);
          return (
            <div className="rounded-2xl border-2 border-violet-300/60 dark:border-violet-700/40 bg-gradient-to-br from-violet-50/60 to-violet-100/30 dark:from-violet-950/30 dark:to-violet-900/10 p-6 space-y-5 shadow-sm">

              {/* Card header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15">
                    <Factory className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{centralUnit.nome}</h3>
                    <div className="mt-1 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                      <MapPin className="h-3 w-3" />{centralUnit.cidade} — {centralUnit.uf}
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground mt-0.5">
                      <Phone className="h-3 w-3" />{centralUnit.telefone}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="status-badge status-pronta">Ativa</span>
                  <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                    Central / Fábrica
                  </span>
                </div>
              </div>

              {/* OS geral da unidade */}
              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  <span className="font-medium text-foreground">{osCount}</span> OS na central
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                  <span className="font-medium text-foreground">{formatCurrency(fat)}</span>
                </div>
              </div>

              {/* ── Canal Externa — painel de métricas dedicado ── */}
              <div className="rounded-xl border border-violet-200/60 dark:border-violet-700/30 bg-white/60 dark:bg-violet-950/20 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-3.5 w-3.5 text-violet-500" />
                  <p className="text-[11px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                    Canal Externa — Métricas
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div className="space-y-0.5">
                    <p className="text-muted-foreground">OS externas</p>
                    <p className="text-base font-bold text-foreground">{ext.osCount}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-muted-foreground">Faturamento externo</p>
                    <p className="text-sm font-bold text-foreground">{formatCurrency(ext.fatExterno)}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-muted-foreground">Parcelas vencidas</p>
                    <p className={`text-sm font-bold ${ext.vencidasExternas > 0 ? 'text-destructive' : 'text-success'}`}>
                      {ext.vencidasExternas > 0 ? ext.vencidasExternas : '—'}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-muted-foreground">Links/QR pendentes</p>
                    <p className={`text-sm font-bold ${ext.linksPendentes > 0 ? 'text-warning' : 'text-muted-foreground'}`}>
                      {ext.linksPendentes > 0 ? (
                        <span className="flex items-center gap-1">
                          <Link2 className="h-3 w-3" />{ext.linksPendentes}
                        </span>
                      ) : '—'}
                    </p>
                  </div>
                </div>

                <p className="text-[10px] text-violet-600/60 dark:text-violet-400/50 italic">
                  Vendas externas são executadas pela Central/Fábrica — não pelas óticas.
                </p>
              </div>
            </div>
          );
        })()}

        {/* ── Óticas ─────────────────────────────────────────────────────── */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Óticas da Rede
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {oticaUnits.map((u) => {
              const osUnit    = ordensServico.filter(os => os.unidadeId === u.id);
              const osCount   = osUnit.length;
              const fat       = osUnit.reduce((s, os) => s + os.valorTotal, 0);
              const parcelas  = osUnit.flatMap(os => os.pagamento?.parcelas || []);
              const vencidas  = parcelas.filter(p => isParcelaVencida(p));
              const pendencias = osUnit.filter(os => os.status === 'pendencia').length;
              const emProducao = osUnit.filter(os => os.status === 'producao').length;

              return (
                <div
                  key={u.id}
                  className={`page-card p-6 transition-all hover:shadow-sm ${!u.ativa ? 'opacity-60' : ''}`}
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{u.nome}</h3>
                      <div className="mt-2 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />{u.cidade} — {u.uf}
                      </div>
                    </div>
                    <span className={`status-badge ${u.ativa ? 'status-pronta' : 'status-cancelada'}`}>
                      {u.ativa ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />{u.telefone}
                  </div>

                  {/* KPI row */}
                  <div className="mt-4 border-t border-border pt-3 grid grid-cols-2 gap-3 text-[12px]">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      <span className="font-medium text-foreground">{osCount}</span> OS
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <DollarSign className="h-3 w-3" />
                      <span className="font-medium text-foreground">{formatCurrency(fat)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      <span className="font-medium text-foreground">{emProducao}</span> em produção
                    </div>
                    {vencidas.length > 0 ? (
                      <div className="flex items-center gap-1.5 text-destructive">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="font-medium">{vencidas.length}</span> vencida(s)
                      </div>
                    ) : pendencias > 0 ? (
                      <div className="flex items-center gap-1.5 text-warning">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="font-medium">{pendencias}</span> pendência(s)
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-success">
                        <Users className="h-3 w-3" />
                        <span className="font-medium">OK</span>
                      </div>
                    )}
                  </div>

                  {/* Ticket médio */}
                  {u.ativa && osCount > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                        <span>Ticket médio</span>
                        <span className="font-medium text-foreground">{formatCurrency(fat / osCount)}</span>
                      </div>
                    </div>
                  )}

                  {/* Nota discreta: Externa é da Central */}
                  <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-1.5">
                    <Factory className="h-2.5 w-2.5 text-muted-foreground/50 shrink-0" />
                    <p className="text-[10px] text-muted-foreground/60 italic">
                      Vendas externas são geridas pela Central/Fábrica
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
