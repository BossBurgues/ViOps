// =============================================================================
// ViOps — Stock / Inventory Domain Helpers
// Pure business logic for the optional stock module.
// Pages and components should import from here, not inline business rules.
// =============================================================================

import { ItemEstoque, MovimentacaoEstoque, AlertaEstoque, TipoMovimentacao, CategoriaEstoque } from '@/data/stockTypes';

// ---------------------------------------------------------------------------
// Alert thresholds
// ---------------------------------------------------------------------------

/**
 * Returns the stock alert level for a given item.
 * 'zerado' = no stock, 'baixo' = below minimum, 'ok' = healthy.
 */
export function getAlertaEstoque(item: ItemEstoque): AlertaEstoque {
  if (item.saldoAtual <= 0) return 'zerado';
  if (item.saldoAtual <= item.estoqueMinimo) return 'baixo';
  return 'ok';
}

export const ALERTA_ESTOQUE_LABELS: Record<AlertaEstoque, string> = {
  ok: 'Saldo adequado',
  baixo: 'Estoque baixo',
  zerado: 'Sem estoque',
};

export const ALERTA_ESTOQUE_CLASSES: Record<AlertaEstoque, string> = {
  ok: 'bg-success/10 text-success',
  baixo: 'bg-warning/10 text-warning',
  zerado: 'bg-destructive/10 text-destructive',
};

export const ALERTA_ESTOQUE_DOT_CLASSES: Record<AlertaEstoque, string> = {
  ok: 'bg-success',
  baixo: 'bg-warning',
  zerado: 'bg-destructive',
};

// ---------------------------------------------------------------------------
// Movement type labels and directions
// ---------------------------------------------------------------------------

export const TIPO_MOVIMENTACAO_LABELS: Record<TipoMovimentacao, string> = {
  entrada: 'Entrada',
  saida: 'Saída manual',
  baixa_os: 'Baixa por OS',
  ajuste_positivo: 'Ajuste positivo',
  ajuste_negativo: 'Ajuste negativo',
  devolucao: 'Devolução',
  transferencia: 'Transferência',
};

/** Returns +1 (increases stock) or -1 (decreases stock) for a movement type. */
export function getMovimentacaoDirecao(tipo: TipoMovimentacao): 1 | -1 {
  const positive: TipoMovimentacao[] = ['entrada', 'ajuste_positivo', 'devolucao'];
  return positive.includes(tipo) ? 1 : -1;
}

export function getMovimentacaoClass(tipo: TipoMovimentacao): string {
  const dir = getMovimentacaoDirecao(tipo);
  return dir === 1 ? 'text-success' : tipo === 'baixa_os' ? 'text-primary' : 'text-destructive';
}

// ---------------------------------------------------------------------------
// Category labels
// ---------------------------------------------------------------------------

export const CATEGORIA_LABELS: Record<CategoriaEstoque, string> = {
  armacao: 'Armação',
  lente: 'Lente',
  acessorio: 'Acessório',
  solucao: 'Solução',
  embalagem: 'Embalagem',
  outro: 'Outro',
};

// ---------------------------------------------------------------------------
// Summary helpers
// ---------------------------------------------------------------------------

export interface EstoqueSummary {
  totalItens: number;
  itensZerados: number;
  itensBaixos: number;
  itensOk: number;
  itensComAlerta: number;
}

/**
 * Derives aggregate alert counts for a collection of items.
 */
export function calcEstoqueSummary(itens: ItemEstoque[]): EstoqueSummary {
  const alertas = itens.map(getAlertaEstoque);
  return {
    totalItens: itens.length,
    itensZerados: alertas.filter(a => a === 'zerado').length,
    itensBaixos: alertas.filter(a => a === 'baixo').length,
    itensOk: alertas.filter(a => a === 'ok').length,
    itensComAlerta: alertas.filter(a => a !== 'ok').length,
  };
}

/**
 * Returns the movements for a specific item, most recent first.
 */
export function getMovimentacoesDoItem(
  itemId: string,
  movimentacoes: MovimentacaoEstoque[],
): MovimentacaoEstoque[] {
  return [...movimentacoes]
    .filter(m => m.itemId === itemId)
    .sort((a, b) => b.dataMovimentacao.localeCompare(a.dataMovimentacao));
}

/**
 * Returns all movements linked to a given OS.
 */
export function getMovimentacoesDaOS(
  osId: string,
  movimentacoes: MovimentacaoEstoque[],
): MovimentacaoEstoque[] {
  return movimentacoes.filter(m => m.osId === osId);
}

/**
 * Formats the signed quantity for display (e.g. "+5" or "-2").
 */
export function formatMovimentacaoQtd(mov: MovimentacaoEstoque): string {
  const dir = getMovimentacaoDirecao(mov.tipo);
  return `${dir > 0 ? '+' : ''}${dir * mov.quantidade}`;
}
