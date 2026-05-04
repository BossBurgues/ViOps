import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { EmptyState } from '@/components/EmptyState';
import { clientes, formatDate, ordensServico, formatCurrency } from '@/data/mockData';
import { useApp } from '@/contexts/AppContext';
import { isParcelaVencida } from '@/lib/financialStatus';
import { Input } from '@/components/ui/input';
import { Search, Plus, Users, MoreHorizontal, Eye, FileText, DollarSign, AlertTriangle, Phone, Mail, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TablePagination } from '@/components/TablePagination';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/StatusBadge';

const PAGE_SIZE = 6;

export default function ClientesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { hasPermission } = useApp();
  const canCreate = hasPermission(['admin', 'gestor', 'vendedor']);

  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.cpf.includes(search) ||
    c.telefone.includes(search)
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const getClientFinancials = (clienteId: string) => {
    const osCliente = ordensServico.filter(os => os.clienteId === clienteId);
    const parcelas = osCliente.flatMap(os => os.pagamento?.parcelas || []);
    const pagas = parcelas.filter(p => p.status === 'paga');
    const pendentes = parcelas.filter(p => p.status === 'pendente');
    const vencidas = pendentes.filter(p => isParcelaVencida(p));
    return {
      totalOS: osCliente.length,
      valorTotal: osCliente.reduce((s, os) => s + os.valorTotal, 0),
      parcelas: parcelas.length,
      pagas: pagas.length,
      vencidas: vencidas.length,
      valorAberto: pendentes.reduce((s, p) => s + p.valor, 0),
      valorVencido: vencidas.reduce((s, p) => s + p.valor, 0),
      status: vencidas.length > 0 ? 'inadimplente' : pendentes.length > 0 ? 'pendente' : 'adimplente',
    };
  };

  const selectedClient = selectedClientId ? clientes.find(c => c.id === selectedClientId) : null;
  const selectedFin = selectedClient ? getClientFinancials(selectedClient.id) : null;
  const selectedOS = selectedClient ? ordensServico.filter(os => os.clienteId === selectedClient.id) : [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Clientes</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} clientes encontrados</p>
          </div>
          {canCreate && (
            <Button size="sm" className="h-9 text-[13px] font-semibold" onClick={() => toast.info('Formulario em desenvolvimento')}>
              <Plus className="mr-1.5 h-4 w-4" />Novo Cliente
            </Button>
          )}
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF ou telefone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-10 pl-9 text-[13px]"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className={`${selectedClient ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <div className="page-card">
              {filtered.length === 0 ? (
                <EmptyState icon={Users} title="Nenhum cliente encontrado" description="Tente ajustar a busca ou cadastrar um novo cliente." />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="table-header px-5 py-3.5 text-left">Nome</th>
                          <th className="table-header px-5 py-3.5 text-left">CPF</th>
                          <th className="table-header px-5 py-3.5 text-left">Telefone</th>
                          <th className="table-header px-5 py-3.5 text-center">OS</th>
                          <th className="table-header px-5 py-3.5 text-center">Parcelas</th>
                          <th className="table-header px-5 py-3.5 text-right">Aberto</th>
                          <th className="table-header px-5 py-3.5 text-left">Situacao</th>
                          <th className="table-header px-5 py-3.5 text-center w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginated.map((c) => {
                          const fin = getClientFinancials(c.id);
                          return (
                            <tr
                              key={c.id}
                              className={`border-b border-border/40 last:border-0 transition-colors hover:bg-muted/40 cursor-pointer ${
                                selectedClientId === c.id ? 'bg-primary/[0.04]' : ''
                              } ${fin.status === 'inadimplente' ? 'bg-destructive/[0.02]' : ''}`}
                              onClick={() => setSelectedClientId(c.id === selectedClientId ? null : c.id)}
                            >
                              <td className="px-5 py-3 font-medium text-foreground">{c.nome}</td>
                              <td className="px-5 py-3 text-muted-foreground font-mono text-[11px]">{c.cpf}</td>
                              <td className="px-5 py-3 text-foreground text-[13px]">{c.telefone}</td>
                              <td className="px-5 py-3 text-center">
                                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-muted px-1.5 text-[11px] font-semibold text-foreground">{fin.totalOS}</span>
                              </td>
                              <td className="px-5 py-3 text-center text-[12px] text-muted-foreground">{fin.parcelas}</td>
                              <td className="px-5 py-3 text-right font-medium text-foreground text-[13px]">{formatCurrency(fin.valorAberto)}</td>
                              <td className="px-5 py-3">
                                <span className={`status-badge ${fin.status === 'adimplente' ? 'status-pronta' : fin.status === 'inadimplente' ? 'status-cancelada' : 'status-pendencia'}`}>
                                  {fin.status === 'adimplente' ? 'Adimplente' : fin.status === 'inadimplente' ? 'Inadimplente' : 'Pendente'}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-center" onClick={e => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="rounded-md p-1.5 hover:bg-muted text-muted-foreground">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem onClick={() => setSelectedClientId(c.id)}>
                                      <Eye className="mr-2 h-4 w-4" />Ver Detalhes
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => toast.info('Em desenvolvimento')}>
                                      <FileText className="mr-2 h-4 w-4" />Historico OS
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
                    <TablePagination currentPage={safePage} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Client detail sidebar */}
          {selectedClient && selectedFin && (
            <div className="page-card p-6 space-y-5 h-fit sticky top-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Ficha do Cliente</h3>
                <button onClick={() => setSelectedClientId(null)} className="rounded-md p-1 hover:bg-muted text-muted-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-base font-bold text-foreground">{selectedClient.nome}</p>
                  <p className="text-[12px] text-muted-foreground font-mono mt-0.5">{selectedClient.cpf}</p>
                </div>
                <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />{selectedClient.telefone}
                </div>
                <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />{selectedClient.email}
                </div>
                <p className="text-[12px] text-muted-foreground">{selectedClient.cidade}/{selectedClient.uf} — Desde {formatDate(selectedClient.dataCadastro)}</p>
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Financeiro</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-[10px] text-muted-foreground">Total</p>
                    <p className="text-sm font-bold text-foreground">{formatCurrency(selectedFin.valorTotal)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-[10px] text-muted-foreground">Em Aberto</p>
                    <p className="text-sm font-bold text-foreground">{formatCurrency(selectedFin.valorAberto)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[12px] py-1">
                  <span className="text-muted-foreground">Parcelas: {selectedFin.pagas}/{selectedFin.parcelas}</span>
                  {selectedFin.vencidas > 0 && (
                    <span className="text-destructive font-medium flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />{selectedFin.vencidas} vencida(s)
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ordens de Servico ({selectedOS.length})</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedOS.map(os => (
                    <Link key={os.id} to={`/ordens/${os.id}`} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="text-[13px] font-medium text-primary">{os.numero}</p>
                        <p className="text-[11px] text-muted-foreground">{formatDate(os.dataCriacao)}</p>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={os.status} />
                        <p className="text-[11px] font-medium text-foreground mt-1">{formatCurrency(os.valorTotal)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
