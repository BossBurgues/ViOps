import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/contexts/AppContext';
import { EmptyState } from '@/components/EmptyState';
import { TablePagination } from '@/components/TablePagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Shield, Search, Activity, FileDown, Download, RefreshCw, Trash2, FileSpreadsheet, DollarSign, Paperclip, Settings as SettingsIcon, Workflow } from 'lucide-react';
import { getAuditLog, AuditEntry, AuditAction, formatAuditTimestamp, recordAudit, clearAuditLog, buildExportFilename } from '@/lib/audit';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ConfirmDialog';

const PAGE_SIZE = 12;

const actionLabels: Record<AuditAction, string> = {
  export: 'Exportacao',
  os_status_change: 'Mudanca de Status (OS)',
  financial_baixa: 'Baixa Financeira',
  document_attach: 'Anexo de Documento',
  document_remove: 'Remocao de Documento',
  settings_change: 'Alteracao de Configuracoes',
};

const actionIcons: Record<AuditAction, typeof Download> = {
  export: Download,
  os_status_change: Workflow,
  financial_baixa: DollarSign,
  document_attach: Paperclip,
  document_remove: Paperclip,
  settings_change: SettingsIcon,
};

const actionColors: Record<AuditAction, string> = {
  export: 'bg-info/10 text-info',
  os_status_change: 'bg-primary/10 text-primary',
  financial_baixa: 'bg-success/10 text-success',
  document_attach: 'bg-accent text-accent-foreground',
  document_remove: 'bg-destructive/10 text-destructive',
  settings_change: 'bg-warning/10 text-warning',
};

export default function AuditoriaPage() {
  const { hasPermission, currentUser } = useApp();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<AuditAction | 'todos'>('todos');
  const [page, setPage] = useState(1);
  const [confirmClear, setConfirmClear] = useState(false);

  const reload = () => setEntries(getAuditLog());

  useEffect(() => {
    reload();
  }, []);

  if (!hasPermission(['admin'])) {
    return (
      <AppLayout>
        <EmptyState icon={Shield} title="Acesso restrito" description="Apenas administradores podem visualizar o log de auditoria." />
      </AppLayout>
    );
  }

  let filtered = entries;
  if (actionFilter !== 'todos') filtered = filtered.filter(e => e.action === actionFilter);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(e =>
      e.userName.toLowerCase().includes(q) ||
      e.resource.toLowerCase().includes(q) ||
      (e.details || '').toLowerCase().includes(q),
    );
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const counts: Record<AuditAction | 'todos', number> = {
    todos: entries.length,
    export: entries.filter(e => e.action === 'export').length,
    os_status_change: entries.filter(e => e.action === 'os_status_change').length,
    financial_baixa: entries.filter(e => e.action === 'financial_baixa').length,
    document_attach: entries.filter(e => e.action === 'document_attach').length,
    document_remove: entries.filter(e => e.action === 'document_remove').length,
    settings_change: entries.filter(e => e.action === 'settings_change').length,
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.error('Nenhum registro para exportar');
      return;
    }
    const filename = buildExportFilename({
      reportKey: 'auditoria',
      ext: 'csv',
      userName: currentUser.nome,
    });
    const headers = ['Data/Hora', 'Acao', 'Usuario', 'Perfil', 'Unidade', 'Recurso', 'Detalhes'];
    const rows = filtered.map(e => [
      formatAuditTimestamp(e.timestamp),
      actionLabels[e.action],
      e.userName,
      e.userRole,
      e.unidadeNome || '-',
      e.resource,
      (e.details || '').replace(/[\r\n;]/g, ' '),
    ]);
    const csv = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.map(c => `"${c}"`).join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    recordAudit({
      action: 'export',
      userId: currentUser.id,
      userName: currentUser.nome,
      userRole: currentUser.role,
      resource: 'Log de Auditoria',
      details: `Exportou ${filtered.length} registro(s) — ${filename}`,
    });
    reload();
    toast.success('Auditoria exportada', { description: filename });
  };

  const filterTabs: { key: AuditAction | 'todos'; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'export', label: 'Exportacoes' },
    { key: 'os_status_change', label: 'OS' },
    { key: 'financial_baixa', label: 'Financeiro' },
    { key: 'document_attach', label: 'Anexos' },
    { key: 'document_remove', label: 'Remocoes' },
    { key: 'settings_change', label: 'Configuracoes' },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-foreground">Auditoria e Governanca</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Trilha completa de acoes criticas — {entries.length} registro(s) no log local
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 text-[12px]" onClick={reload}>
              <RefreshCw className="mr-1.5 h-3 w-3" />Atualizar
            </Button>
            <Button variant="outline" size="sm" className="h-9 text-[12px]" onClick={handleExport} disabled={filtered.length === 0}>
              <FileDown className="mr-1.5 h-3 w-3" />Exportar CSV
            </Button>
            <Button variant="outline" size="sm" className="h-9 text-[12px] text-destructive hover:text-destructive" onClick={() => setConfirmClear(true)} disabled={entries.length === 0}>
              <Trash2 className="mr-1.5 h-3 w-3" />Limpar
            </Button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-0">
          {filterTabs.map(t => (
            <button
              key={t.key}
              onClick={() => { setActionFilter(t.key); setPage(1); }}
              className={`px-4 py-2.5 text-[12px] font-semibold transition-colors border-b-2 -mb-px ${
                actionFilter === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label} <span className="opacity-60 ml-1">{counts[t.key]}</span>
            </button>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por usuario, recurso ou descricao..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="h-10 pl-9 text-[13px]" />
        </div>

        <div className="page-card">
          {paginated.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="Nenhum registro de auditoria"
              description={entries.length === 0
                ? 'Acoes criticas (exportacoes, mudancas de status, baixas, anexos e configuracoes) serao registradas aqui automaticamente.'
                : 'Ajuste os filtros para visualizar registros.'}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="table-header px-5 py-3.5 text-left">Data / Hora</th>
                      <th className="table-header px-5 py-3.5 text-left">Acao</th>
                      <th className="table-header px-5 py-3.5 text-left">Usuario</th>
                      <th className="table-header px-5 py-3.5 text-left">Unidade</th>
                      <th className="table-header px-5 py-3.5 text-left">Recurso</th>
                      <th className="table-header px-5 py-3.5 text-left">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(e => {
                      const Icon = actionIcons[e.action];
                      return (
                        <tr key={e.id} className="border-b border-border/40 last:border-0 hover:bg-muted/40">
                          <td className="px-5 py-3 text-[12px] text-muted-foreground font-mono whitespace-nowrap">{formatAuditTimestamp(e.timestamp)}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${actionColors[e.action]}`}>
                                <Icon className="h-3 w-3" />
                              </span>
                              <span className="text-[12px] font-medium text-foreground">{actionLabels[e.action]}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <p className="text-[13px] text-foreground">{e.userName}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{e.userRole}</p>
                          </td>
                          <td className="px-5 py-3 text-[12px] text-muted-foreground">{e.unidadeNome || '-'}</td>
                          <td className="px-5 py-3 text-[12px] font-medium text-primary">{e.resource}</td>
                          <td className="px-5 py-3 text-[12px] text-muted-foreground max-w-md">{e.details || '-'}</td>
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

        <div className="page-card px-6 py-4 flex items-start gap-3 border-dashed">
          <Activity className="h-4 w-4 text-info mt-0.5" />
          <div>
            <p className="text-[13px] font-medium text-foreground">Trilha de auditoria local</p>
            <p className="text-[12px] text-muted-foreground">
              Os registros sao mantidos no navegador para fins de demonstracao. Em producao, a trilha sera persistida no backend com retencao configuravel e exportacao para sistemas de SIEM.
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Limpar log de auditoria"
        description="Esta acao removera todos os registros locais de auditoria. Confirma?"
        onConfirm={() => {
          clearAuditLog();
          reload();
          toast.success('Log de auditoria limpo');
        }}
      />
    </AppLayout>
  );
}
