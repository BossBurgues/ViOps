import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { usuarios, roleLabels, unidades } from '@/data/mockData';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Shield, Search, MoreHorizontal, Edit, Lock, Unlock } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { TablePagination } from '@/components/TablePagination';
import { toast } from 'sonner';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const PAGE_SIZE = 8;

const roleDescriptions: Record<string, string> = {
  admin: 'Acesso total a todas as funcionalidades, unidades e configuracoes do sistema.',
  gestor: 'Gerencia operacao e equipe da unidade. Visualiza relatorios e indicadores.',
  vendedor: 'Atende clientes, cria e acompanha OS. Acesso restrito a sua unidade.',
  operador: 'Opera a central/fabrica. Gerencia fila de producao e status de OS.',
  financeiro: 'Gerencia pagamentos, baixas e controle de inadimplencia.',
};

export default function UsuariosPage() {
  const { hasPermission } = useApp();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  if (!hasPermission(['admin'])) {
    return (
      <AppLayout>
        <EmptyState
          icon={Shield}
          title="Acesso restrito"
          description="Voce nao possui permissao para acessar a gestao de usuarios. Solicite acesso ao administrador da rede."
        />
      </AppLayout>
    );
  }

  const filtered = usuarios.filter(u =>
    u.nome.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    roleLabels[u.role].toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Role summary
  const roleCounts = Object.entries(roleLabels).map(([key, label]) => ({
    role: key,
    label,
    count: usuarios.filter(u => u.role === key).length,
    active: usuarios.filter(u => u.role === key && u.ativo).length,
  }));

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Usuarios e Permissoes</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{usuarios.length} usuarios cadastrados — {usuarios.filter(u => u.ativo).length} ativos</p>
          </div>
          <Button size="sm" className="h-9 text-[13px] font-semibold" onClick={() => toast.info('Em desenvolvimento')}>
            <Plus className="mr-1.5 h-4 w-4" />Novo Usuario
          </Button>
        </div>

        {/* Role summary cards */}
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {roleCounts.map(rc => (
            <div key={rc.role} className="page-card px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{rc.label}</p>
              <div className="flex items-end justify-between mt-1">
                <span className="text-xl font-bold text-foreground">{rc.count}</span>
                <span className="text-[11px] text-muted-foreground">{rc.active} ativo(s)</span>
              </div>
            </div>
          ))}
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou perfil..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-10 pl-9 text-[13px]"
          />
        </div>

        <div className="page-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="table-header px-6 py-3.5 text-left">Nome</th>
                  <th className="table-header px-6 py-3.5 text-left">E-mail</th>
                  <th className="table-header px-6 py-3.5 text-left">Perfil</th>
                  <th className="table-header px-6 py-3.5 text-left">Unidade</th>
                  <th className="table-header px-6 py-3.5 text-center">Status</th>
                  <th className="table-header px-6 py-3.5 text-center w-10"></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(u => {
                  const unidade = unidades.find(un => un.id === u.unidadeId);
                  return (
                    <tr key={u.id} className="border-b border-border/40 last:border-0 transition-colors hover:bg-muted/40">
                      <td className="px-6 py-3">
                        <div>
                          <p className="font-medium text-foreground">{u.nome}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{roleDescriptions[u.role]?.split('.')[0]}</p>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-6 py-3">
                        <span className="status-badge status-recebida">{roleLabels[u.role]}</span>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">{unidade?.nome.replace('Visual Premium - ', '') || 'Todas'}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`status-badge ${u.ativo ? 'status-pronta' : 'status-cancelada'}`}>
                          {u.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="rounded-md p-1.5 hover:bg-muted text-muted-foreground">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => toast.info('Em desenvolvimento')}>
                              <Edit className="mr-2 h-4 w-4" />Editar Usuario
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info('Em desenvolvimento')}>
                              <Shield className="mr-2 h-4 w-4" />Alterar Perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info('Em desenvolvimento')}>
                              {u.ativo ? <Lock className="mr-2 h-4 w-4" /> : <Unlock className="mr-2 h-4 w-4" />}
                              {u.ativo ? 'Desativar' : 'Reativar'}
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
        </div>

        {/* Permission matrix */}
        <div className="page-card p-6">
          <h2 className="section-title mb-4">Matriz de Permissoes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Modulo</th>
                  {Object.values(roleLabels).map(label => (
                    <th key={label} className="text-center py-2 px-2 font-semibold text-muted-foreground">{label.split('/')[0]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { modulo: 'Dashboard', perms: [true, true, true, true, true] },
                  { modulo: 'Ordens de Servico', perms: [true, true, true, true, false] },
                  { modulo: 'Criar OS', perms: [true, true, true, false, false] },
                  { modulo: 'Central / Fabrica', perms: [true, true, false, true, false] },
                  { modulo: 'Financeiro', perms: [true, true, false, false, true] },
                  { modulo: 'Baixa Financeira', perms: [true, false, false, false, true] },
                  { modulo: 'Clientes', perms: [true, true, true, false, false] },
                  { modulo: 'Relatorios', perms: [true, true, false, false, false] },
                  { modulo: 'Usuarios', perms: [true, false, false, false, false] },
                  { modulo: 'Configuracoes', perms: [true, false, false, false, false] },
                ].map(row => (
                  <tr key={row.modulo} className="border-b border-border/40">
                    <td className="py-2 px-3 font-medium text-foreground">{row.modulo}</td>
                    {row.perms.map((p, i) => (
                      <td key={i} className="py-2 px-2 text-center">
                        <span className={`inline-block h-4 w-4 rounded-full ${p ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground/30'}`}>
                          {p ? '✓' : '—'}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
