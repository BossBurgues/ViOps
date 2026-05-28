// =============================================================================
// ViOps - Optional Stock / Inventory Module
// =============================================================================
// Compatibility facade. The canonical stock domain helper is estoqueStatus.ts.
// Keep this file thin so stock rules are not duplicated across lib modules.
// =============================================================================

import { ItemEstoque } from '@/data/stockTypes';
import {
  ALERTA_ESTOQUE_LABELS,
  TIPO_MOVIMENTACAO_LABELS,
  getAlertaEstoque,
} from './estoqueStatus';

export * from './estoqueStatus';

export type StockAlertLevel = 'ok' | 'low' | 'out';

export function getStockAlertLevel(item: ItemEstoque): StockAlertLevel {
  const alerta = getAlertaEstoque(item);
  if (alerta === 'zerado') return 'out';
  if (alerta === 'baixo') return 'low';
  return 'ok';
}

export function getDeficitQuantidade(item: ItemEstoque): number {
  return Math.max(0, item.estoqueMinimo - item.saldoAtual);
}

export const MOVIMENTACAO_LABELS = TIPO_MOVIMENTACAO_LABELS;

export const STOCK_ALERT_LABELS: Record<StockAlertLevel, string> = {
  ok: ALERTA_ESTOQUE_LABELS.ok,
  low: ALERTA_ESTOQUE_LABELS.baixo,
  out: ALERTA_ESTOQUE_LABELS.zerado,
};
