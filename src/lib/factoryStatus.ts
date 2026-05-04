// =============================================================================
// ViOps — Factory / Production Domain Helpers
// Centralizes all logic for deriving production state and SLA from factory data.
// Imported by CentralPage, OSDetalhePage, and future factory modules.
// =============================================================================

import { ProductionStatus, FactoryRef, OSStatus } from '@/data/types';
import { TODAY_ISO } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Production status labels & classes
// ---------------------------------------------------------------------------

export const PRODUCTION_STATUS_LABELS: Record<ProductionStatus, string> = {
  aguardando: 'Aguardando',
  em_corte: 'Em Corte',
  em_acabamento: 'Acabamento',
  controle_qualidade: 'Controle de Qualidade',
  aprovado: 'Aprovado no CQ',
  reprovado: 'Reprovado no CQ',
  em_retrabalho: 'Em Retrabalho',
  concluido: 'Produção Concluída',
};

export const PRODUCTION_STATUS_CLASSES: Record<ProductionStatus, string> = {
  aguardando: 'bg-muted text-muted-foreground',
  em_corte: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  em_acabamento: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  controle_qualidade: 'bg-warning/10 text-warning',
  aprovado: 'bg-success/10 text-success',
  reprovado: 'bg-destructive/10 text-destructive',
  em_retrabalho: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  concluido: 'bg-primary/10 text-primary',
};

// ---------------------------------------------------------------------------
// SLA helpers — centralized here, removing the hardcoded logic from CentralPage
// ---------------------------------------------------------------------------

export type SLAStatus = 'ok' | 'warning' | 'critical';

const SLA_THRESHOLDS = {
  warning: 3, // days
  critical: 5, // days
} as const;

/**
 * Calculates how many days an OS has been in its current status,
 * based on the last history event. Uses TODAY_ISO so it's always current.
 */
export function getDaysInStatus(
  historico: Array<{ data: string }>,
  referenceDate: string = TODAY_ISO,
): number {
  if (historico.length === 0) return 0;
  const lastEvent = historico[historico.length - 1];
  const eventDate = new Date(lastEvent.data.split(' ')[0] + 'T00:00:00');
  const ref = new Date(referenceDate + 'T00:00:00');
  return Math.max(0, Math.floor((ref.getTime() - eventDate.getTime()) / 86400000));
}

/**
 * Returns the SLA status based on days in status and OS status.
 * Pendência is always critical regardless of days.
 */
export function getSLAStatus(days: number, status: OSStatus): SLAStatus {
  if (status === 'pendencia') return 'critical';
  if (days >= SLA_THRESHOLDS.critical) return 'critical';
  if (days >= SLA_THRESHOLDS.warning) return 'warning';
  return 'ok';
}

export function getSLAClass(sla: SLAStatus): string {
  if (sla === 'critical') return 'text-destructive';
  if (sla === 'warning') return 'text-warning';
  return 'text-muted-foreground';
}

export function getSLABorderClass(sla: SLAStatus): string {
  if (sla === 'critical') return 'border-l-2 border-l-destructive';
  if (sla === 'warning') return 'border-l-2 border-l-warning';
  return '';
}

// ---------------------------------------------------------------------------
// FactoryRef helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if this OS has an active factory linkage.
 */
export function hasFactoryLinkage(factoryRef?: FactoryRef): boolean {
  return !!(factoryRef && (factoryRef.externalId || factoryRef.lote || factoryRef.calctoolRxId));
}

/**
 * Returns true if Calctool RX 2.0 registration is present.
 */
export function hasCalctoolRegistration(factoryRef?: FactoryRef): boolean {
  return !!(factoryRef?.calctoolRxId);
}

/**
 * Returns true if external system baixa is pending (linkage exists but baixa not done).
 */
export function isPendingExternalBaixa(factoryRef?: FactoryRef): boolean {
  return !!(
    factoryRef &&
    (factoryRef.sistemaExternoId || factoryRef.externalId) &&
    !factoryRef.baixaExternaRealizada
  );
}

/**
 * Formats the primary factory reference for display.
 * Priority: externalId > lote > calctoolRxId
 */
export function getFactoryDisplayRef(factoryRef?: FactoryRef): string | null {
  if (!factoryRef) return null;
  return factoryRef.externalId ?? factoryRef.lote ?? factoryRef.calctoolRxId ?? null;
}

/**
 * Returns a short label for the factory priority badge.
 */
export const FACTORY_PRIORITY_LABELS = {
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente',
} as const;

export function getFactoryPriorityClass(prioridade?: string): string {
  if (prioridade === 'urgente') return 'bg-destructive/10 text-destructive';
  if (prioridade === 'alta') return 'bg-warning/10 text-warning';
  return 'bg-muted text-muted-foreground';
}

// ---------------------------------------------------------------------------
// Factory event type labels — for history timeline display
// ---------------------------------------------------------------------------

export const FACTORY_EVENT_TYPE_LABELS = {
  entrada: 'Entrada na Fábrica',
  saida: 'Saída da Fábrica',
  status_change: 'Mudança de Status',
  observacao: 'Observação',
  calctool: 'Calctool RX 2.0',
  baixa_externa: 'Baixa em Sistema Externo',
} as const;
