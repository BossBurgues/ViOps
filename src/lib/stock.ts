// =============================================================================
// ViOps — Optional Stock / Inventory Module
// =============================================================================
// This module is OPTIONAL. It must never be imported unconditionally by core
// pages or components. Only activate when the inventory feature flag is on.
//
// Types are defined in src/data/types.ts (ItemEstoque, MovimentacaoEstoque).
// This file contains helpers, constants, and derived logic for the stock module.
// =============================================================================

import { ItemEstoque, MovimentacaoEstoque, MovimentacaoEstoqueTipo } from '@/data/types';

// ---------------------------------------------------------------------------
// Stock status derivation
// ---------------------------------------------------------------------------

export type StockAlertLevel = 'ok' | 'low' | 'out';

/**
 * Returns the alert level for an item based on available vs minimum quantity.
 */
export function getStockAlertLevel(item: ItemEstoque): StockAlertLevel {
  if (item.quantidadeDisponivel <= 0) return 'out';
  if (item.quantidadeDisponivel <= item.quantidadeMinima) return 'low';
  return 'ok';
}

/**
 * Returns the net quantity (available minus reserved).
 */
export function getNetQuantity(item: ItemEstoque): number {
  return item.quantidadeDisponivel - item.quantidadeReservada;
}

// ---------------------------------------------------------------------------
// Stock movement labels — for display in audit trails and reports
// ---------------------------------------------------------------------------

export const MOVIMENTACAO_LABELS: Record<MovimentacaoEstoqueTipo, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  ajuste: 'Ajuste de Inventário',
  reserva: 'Reserva para OS',
  cancelamento_reserva: 'Cancelamento de Reserva',
};

export const STOCK_ALERT_LABELS: Record<StockAlertLevel, string> = {
  ok: 'Estoque normal',
  low: 'Estoque baixo',
  out: 'Sem estoque',
};

// ---------------------------------------------------------------------------
// Mock data helpers — for development/demo only
// ---------------------------------------------------------------------------

/** Returns an empty stock movement stub for forms. */
export function createEmptyMovimentacao(
  itemEstoqueId: string,
  tipo: MovimentacaoEstoqueTipo,
  userId: string,
): Omit<MovimentacaoEstoque, 'id' | 'saldoApos'> {
  return {
    itemEstoqueId,
    tipo,
    quantidade: 0,
    userId,
    timestamp: new Date().toISOString(),
    observacoes: '',
  };
}
