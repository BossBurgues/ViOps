// Centralized audit log for governance and traceability.
// All critical actions (exports, OS status changes, financial baixa,
// document attach/remove, settings changes) should be recorded here.

export type AuditAction =
  | 'export'
  | 'os_status_change'
  | 'financial_baixa'
  | 'document_attach'
  | 'document_remove'
  | 'settings_change';

export interface AuditEntry {
  id: string;
  timestamp: string; // ISO
  action: AuditAction;
  userId: string;
  userName: string;
  userRole: string;
  unidadeId?: string;
  unidadeNome?: string;
  resource: string; // e.g. "OS-2025-0001", "Relatorio Financeiro", "Configuracoes/Operacional"
  details?: string; // human-readable summary
  metadata?: Record<string, unknown>; // additional structured data
}

const STORAGE_KEY = 'viops:audit_log';
const MAX_ENTRIES = 500;

function readLog(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLog(entries: AuditEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // localStorage unavailable — silent fail (audit is best-effort on client)
  }
}

export function recordAudit(entry: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry {
  const full: AuditEntry = {
    ...entry,
    id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  };
  const log = readLog();
  log.unshift(full);
  writeLog(log);
  return full;
}

export function getAuditLog(filter?: { action?: AuditAction; resource?: string; userId?: string }): AuditEntry[] {
  let log = readLog();
  if (filter?.action) log = log.filter(e => e.action === filter.action);
  if (filter?.resource) log = log.filter(e => e.resource === filter.resource);
  if (filter?.userId) log = log.filter(e => e.userId === filter.userId);
  return log;
}

export function clearAuditLog() {
  writeLog([]);
}

// Build a standardized export filename:
// viops_<reportKey>_<unidadeSlug>_<YYYYMMDD-HHmm>_<userSlug>.<ext>
export function buildExportFilename(opts: {
  reportKey: string;
  ext: 'csv' | 'xls' | 'pdf' | 'xlsx';
  unidadeNome?: string;
  userName: string;
  date?: Date;
}): string {
  const d = opts.date ?? new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  const slug = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 32);
  const unidade = opts.unidadeNome ? slug(opts.unidadeNome) : 'todas-unidades';
  const user = slug(opts.userName);
  return `viops_${slug(opts.reportKey)}_${unidade}_${stamp}_${user}.${opts.ext}`;
}

export function formatAuditTimestamp(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
