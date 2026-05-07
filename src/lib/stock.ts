// =============================================================================
// ViOps — Optional Stock / Inventory Module
// =============================================================================
// This module is OPTIONAL. It must never be imported unconditionally by core
// pages or components. Only activate when the inventory feature flag is on.
//
// Types are authoritative in src/data/stockTypes.ts.
// This file contains helpers, constants, and derived logic for the stock module.
// =============================================================================

import { ItemEstoque, MovimentacaoEstoque, TipoMovimentacao } from '@/data/stockTypes';

// ---------------------------------------------------------------------------
// Stock status derivation
// ---------------------------------------------------------------------------

export type StockAlertLevel = 'ok' | 'low' | 'out';

/**
 * Returns the alert level for an item based on available vs minimum quantity.
 */
export function getStockAlertLevel(item: ItemEstoque): StockAlertLevel {
  if (item.saldoAtual <= 0) return 'out';
  if (item.saldoAtual <= item.estoqueMinimo) return 'low';
  return 'ok';
}

/**
 * Returns how many units are below the minimum threshold.
 * Useful for aggregate alerts in EstoquePage.
 */
export function getDeficitQuantidade(item: ItemEstoque): number {
  return Math.max(0, item.estoqueMinimo - item.saldoAtual);
}

// ---------------------------------------------------------------------------
// Stock movement labels — for display in audit trails and reports
// ---------------------------------------------------------------------------

export const MOVIMENTACAO_LABELS: Record<TipoMovimentacao, string> = {
  entrada:          'Entrada',
  saida:            'Saída',
  baixa_os:         'Baixa por OS',
  ajuste_positivo:  'Ajuste positivo',
  ajuste_negativo:  'Ajuste negativo',
  devolucao:        'Devolução',
  transferencia:    'Transferência',
};

export const STOCK_ALERT_LABELS: Record<StockAlertLevel, string> = {
  ok:  'Estoque normal',
  low: 'Estoque baixo',
  out: 'Sem estoque',
};

// ---------------------------------------------------------------------------
// Mock data helpers — for development/demo only
// ---------------------------------------------------------------------------

/** Returns an empty stock movement stub for forms. */
export function createEmptyMovimentacao(
  itemId: string,
  tipo: TipoMovimentacao,
  usuarioId: string,
  usuarioNome: string,
  unidadeId: string,
): Omit<MovimentacaoEstoque, 'id'> {
  return {
    itemId,
    unidadeId,
    tipo,
    quantidade: 0,
    usuarioId,
    usuarioNome,
    dataMovimentacao: new Date().toISOString(),
    observacoes: '',
  };
}
