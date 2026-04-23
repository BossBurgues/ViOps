import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { TablePagination } from '@/components/TablePagination';
import { ordensServico, formatCurrency, formatDate } from '@/data/mockData';
import { useApp } from '@/contexts/AppContext';
import { OSStatus } from '@/data/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, FileText, MoreHorizontal, Eye, CreditCard, AlertTriangle } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const statusOptions: (OSStatus | 'todos')[] = ['todos', 'recebida', 'producao', 'pendencia', 'pronta', 'enviada', 'entregue', 'cancelada'];
const PAGE_SIZE = 6;

export default function OrdensPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OSStatus | 'todos'>('todos');
  const [page, setPage] = useState(1);
  const { selectedUnidadeId, hasPermission } = useApp();

  const filtered = ordensServico.filter(os => {
    const matchSearch = os.numero.toLowerCase().includes(search.toLowerCase()) ||
      os.clienteNome.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'todos' || os.status === statusFilter;
    const matchUnidade = selectedUnidadeId === 'todas' || os.unidadeId === selectedUnidadeId;
    return matchSearch && matchStatus && matchUnidade;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const canCreate = hasPermission(['admin', 'gestor', 'vendedor']);

  const getFinancialStatus = (os: typeof ordensServico[0]) => {
    if (!os.pagamento) return null;
    const pendentes = os.pagamento.parcelas.filter(p => p.status === 'pendente');
    const vencidas = pendentes.filter(p => p.vencimento < '2025-04-12');
    if (vencidas.length > 0) return 'vencida';
    if (pendentes.length > 0) return 'pendente';
    return 'paga';
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Ordens de Servico</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} ordens encontradas</p>
          </div>
          {canCreate && (
            <Link to="/ordens/nova">
              <Button size="sm" className="h-9 text-[13px] font-semibold">
                <Plus className="mr-1.5 h-4 w-4" />Nova OS
              </Button>
            </Link>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por numero ou cliente..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-10 pl-9 text-[13px]"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {statusOptions.map(s => {
              const count = s === 'todos'
                ? ordensServico.filter(os => selectedUnidadeId === 'todas' || os.unidadeId === selectedUnidadeId).length
                : ordensServico.filter(os => os.status === s && (selectedUnidadeId === 'todas' || os.unidadeId === selectedUnidadeId)).length;
              return (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                    statusFilter === s
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {s === 'todos' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
                  <span className="ml-1 opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="page-card">
          {filtered.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Nenhuma ordem encontrada"
              description="Tente ajustar os filtros ou criar uma nova ordem de servico."
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="table-header px-6 py-3.5 text-left">Numero</th>
                      <th className="table-header px-6 py-3.5 text-left">Cliente</th>
                      <th className="table-header px-6 py-3.5 text-left">Unidade</th>
                      <th className="table-header px-6 py-3.5 text-left">Status</th>
                      <th className="table-header px-6 py-3.5 text-left">Financeiro</th>
                      <th className="table-header px-6 py-3.5 text-left">Criacao</th>
                      <th className="table-header px-6 py-3.5 text-left">Previsao</th>
                      <th className="table-header px-6 py-3.5 text-right">Valor</th>
                      <th className="table-header px-6 py-3.5 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((os) => {
                      const fin = getFinancialStatus(os);
                      return (
                        <tr key={os.id} className={`border-b border-border/40 last:border-0 transition-colors hover:bg-muted/40 ${fin === 'vencida' ? 'bg-destructive/[0.02]' : ''}`}>
                          <td className="px-6 py-3 font-medium text-primary">
                            <Link to={`/ordens/${os.id}`} className="hover:underline flex items-center gap-1.5">
                              {os.numero}
                              {fin === 'vencida' && <AlertTriangle className="h-3 w-3 text-destructive" />}
                            </Link>
                          </td>
                          <td className="px-6 py-3 text-foreground">{os.clienteNome}</td>
                          <td className="px-6 py-3 text-muted-foreground">{os.unidadeNome.replace('Visual Premium - ', '')}</td>
                          <td className="px-6 py-3"><StatusBadge status={os.status} /></td>
                          <td className="px-6 py-3">
                            {fin && (
                              <span className={`status-badge ${fin === 'paga' ? 'status-pronta' : fin === 'vencida' ? 'status-cancelada' : 'status-pendencia'}`}>
                                {fin === 'paga' ? 'Quitada' : fin === 'vencida' ? 'Vencida' : 'Pendente'}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-muted-foreground">{formatDate(os.dataCriacao)}</td>
                          <td className="px-6 py-3 text-muted-foreground">{formatDate(os.dataPrevisao)}</td>
                          <td className="px-6 py-3 text-right font-medium text-foreground">{formatCurrency(os.valorTotal)}</td>
                          <td className="px-6 py-3 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="rounded-md p-1.5 hover:bg-muted text-muted-foreground">
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem asChild>
                                  <Link to={`/ordens/${os.id}`}><Eye className="mr-2 h-4 w-4" />Ver Detalhes</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link to={`/ordens/${os.id}`}><CreditCard className="mr-2 h-4 w-4" />Financeiro</Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <TablePagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  totalItems={filtered.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
