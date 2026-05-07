// =============================================================================
// ViOps — OS Status Domain Helpers
// Centralizes status-related logic that spans multiple pages/components.
// Use these helpers instead of duplicating status comparisons in UI code.
// =============================================================================

import type { OSStatus } from '@/data/types';
import { OS_STATUS_LABELS } from '@/data/types';

// ---------------------------------------------------------------------------
// Status equivalence helpers
// 'enviada' is a legacy alias for 'enviada_unidade'.
// Always use these helpers when checking "sent-back-to-unit" state so that
// both the canonical and legacy statuses are handled consistently.
// ---------------------------------------------------------------------------

/**
 * Returns true if the OS has been dispatched from the central back to the
 * originating unit — covers both the legacy 'enviada' and canonical
 * 'enviada_unidade' status values.
 */
export function isEnviadaUnidade(status: OSStatus): boolean {
  return status === 'enviada_unidade' || status === 'enviada';
}

/**
 * Returns true if the OS is in any production-phase status at the central.
 * Useful for UI guards that restrict editing while in the central.
 */
export function isNaCentral(status: OSStatus): boolean {
  return (
    status === 'recebida' ||
    status === 'producao'  ||
    status === 'pendencia' ||
    status === 'pronta'
  );
}

/**
 * Returns true if the OS has reached a terminal state (no more transitions).
 */
export function isOSTerminal(status: OSStatus): boolean {
  return status === 'entregue' || status === 'cancelada';
}

/**
 * Returns true if the OS is still at the originating unit (before dispatch).
 */
export function isNaUnidade(status: OSStatus): boolean {
  return status === 'aberta' || isEnviadaUnidade(status);
}

/**
 * Human-readable label for an OS status.
 * Falls back to OS_STATUS_LABELS from types.ts (source of truth).
 */
export function getOSStatusLabel(status: OSStatus): string {
  return OS_STATUS_LABELS[status] ?? status;
}

// ---------------------------------------------------------------------------
// Chart color tokens — single source of truth for dashboard visualizations.
// Keyed by semantic meaning so adding new statuses does not break colors.
// ---------------------------------------------------------------------------

export const OS_STATUS_CHART_COLORS: Partial<Record<OSStatus, string>> = {
  aberta:           'hsl(213 56% 28%)',
  enviada_central:  'hsl(207 75% 48%)',
  recebida:         'hsl(38 85% 48%)',
  producao:         'hsl(158 50% 38%)',
  pendencia:        'hsl(0 60% 48%)',
  pronta:           'hsl(213 56% 48%)',
  enviada_unidade:  'hsl(270 60% 48%)',
  enviada:          'hsl(270 60% 48%)', // legacy alias, same color
  entregue:         'hsl(158 60% 30%)',
  cancelada:        'hsl(0 0% 55%)',
};

/**
 * Returns the chart color for a given OS status.
 * Falls back to a neutral gray for any status not in the map.
 */
export function getOSStatusColor(status: OSStatus): string {
  return OS_STATUS_CHART_COLORS[status] ?? 'hsl(215 12% 48%)';
}
