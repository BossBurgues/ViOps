import AppLayout from '@/components/AppLayout';
import { unidades, ordensServico, formatCurrency } from '@/data/mockData';
import { isParcelaVencida } from '@/lib/financialStatus';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Plus, MapPin, Phone, FileText, DollarSign, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function UnidadesPage() {
  const { hasPermission } = useApp();
  const canCreate = hasPermission(['admin']);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Unidades</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{unidades.length} unidades cadastradas na rede</p>
          </div>
          {canCreate && (
            <Button size="sm" className="h-9 text-[13px] font-semibold" onClick={() => toast.info('Em desenvolvimento')}>
              <Plus className="mr-1.5 h-4 w-4" />Nova Unidade
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {unidades.map((u) => {
            const osUnit = ordensServico.filter(os => os.unidadeId === u.id);
            const osCount = osUnit.length;
            const fat = osUnit.reduce((s, os) => s + os.valorTotal, 0);
            const parcelas = osUnit.flatMap(os => os.pagamento?.parcelas || []);
            const vencidas = parcelas.filter(p => isParcelaVencida(p));
            const pendencias = osUnit.filter(os => os.status === 'pendencia').length;
            const emProducao = osUnit.filter(os => os.status === 'producao').length;

            return (
              <div key={u.id} className={`page-card p-6 transition-all hover:shadow-sm ${!u.ativa ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{u.nome}</h3>
                    <div className="mt-2 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {u.cidade} - {u.uf}
                    </div>
                  </div>
                  <span className={`status-badge ${u.ativa ? 'status-pronta' : 'status-cancelada'}`}>
                    {u.ativa ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[13px] text-muted-foreground">
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
                    <span className="font-medium text-foreground">{emProducao}</span> em producao
                  </div>
                  {vencidas.length > 0 ? (
                    <div className="flex items-center gap-1.5 text-destructive">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="font-medium">{vencidas.length}</span> parcela(s) vencida(s)
                    </div>
                  ) : pendencias > 0 ? (
                    <div className="flex items-center gap-1.5 text-warning">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="font-medium">{pendencias}</span> pendencia(s)
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-success">
                      <Users className="h-3 w-3" />
                      <span className="font-medium">OK</span>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                {u.ativa && osCount > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Ticket medio</span>
                      <span className="font-medium text-foreground">{formatCurrency(fat / osCount)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
