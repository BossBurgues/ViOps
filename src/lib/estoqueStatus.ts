// =============================================================================
// ViOps - Stock / Inventory Domain Helpers
// Pure business logic for the optional stock module.
// Pages and components should import from here, not inline business rules.
// =============================================================================

import { ItemEstoque, MovimentacaoEstoque, AlertaEstoque, TipoMovimentacao, CategoriaEstoque } from '@/data/stockTypes';

// ---------------------------------------------------------------------------
// Alert thresholds
// ---------------------------------------------------------------------------

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

const MOVIMENTACAO_DIRECAO: Record<TipoMovimentacao, 1 | -1> = {
  entrada: 1,
  ajuste_positivo: 1,
  devolucao: 1,
  saida: -1,
  baixa_os: -1,
  ajuste_negativo: -1,
  transferencia: -1,
};

export function getMovimentacaoDirecao(tipo: TipoMovimentacao): 1 | -1 {
  return MOVIMENTACAO_DIRECAO[tipo];
}

export function getMovimentacaoDelta(tipo: TipoMovimentacao, quantidade: number): number {
  return getMovimentacaoDirecao(tipo) * quantidade;
}

export function isQuantidadeMovimentacaoValida(quantidade: number): boolean {
  return Number.isFinite(quantidade) && quantidade > 0;
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

export function getMovimentacoesDoItem(
  itemId: string,
  movimentacoes: MovimentacaoEstoque[],
): MovimentacaoEstoque[] {
  return [...movimentacoes]
    .filter(m => m.itemId === itemId)
    .sort((a, b) => b.dataMovimentacao.localeCompare(a.dataMovimentacao));
}

export function getMovimentacoesDaOS(
  osId: string,
  movimentacoes: MovimentacaoEstoque[],
): MovimentacaoEstoque[] {
  return movimentacoes.filter(m => m.osId === osId);
}

export function formatMovimentacaoQtd(mov: MovimentacaoEstoque): string {
  const delta = getMovimentacaoDelta(mov.tipo, mov.quantidade);
  return `${delta > 0 ? '+' : ''}${delta}`;
}

// ---------------------------------------------------------------------------
// Domain validation helpers
// ---------------------------------------------------------------------------

export interface EstoqueOSContext {
  id: string;
  numero: string;
  unidadeId: string;
  origemVenda: 'otica' | 'externa';
  itens?: Array<{
    id: string;
    estoqueItemId?: string;
  }>;
}

export interface EstoqueValidationResult {
  valid: boolean;
  message?: string;
}

export function getUnidadeOperacionalParaBaixaOS(
  os: EstoqueOSContext,
  unidadeCentralId: string,
): string {
  return os.origemVenda === 'externa' ? unidadeCentralId : os.unidadeId;
}

export function getOSItemVinculadoAoEstoque(
  os: EstoqueOSContext | undefined,
  itemId: string,
): string | undefined {
  return os?.itens?.find(item => item.estoqueItemId === itemId)?.id;
}

export function getItensElegiveisParaMovimentacao(
  itens: ItemEstoque[],
  params: {
    tipo: TipoMovimentacao;
    selectedUnidadeId: string;
    currentUserUnidadeId: string;
    os?: EstoqueOSContext;
    unidadeCentralId: string;
  },
): ItemEstoque[] {
  if (params.tipo === 'baixa_os' && !params.os) {
    return [];
  }

  if (params.tipo === 'baixa_os' && params.os) {
    const unidadeOperacional = getUnidadeOperacionalParaBaixaOS(params.os, params.unidadeCentralId);
    const linkedItemIds = params.os.itens
      ?.map(item => item.estoqueItemId)
      .filter((itemId): itemId is string => Boolean(itemId));
    const itensDaUnidade = itens.filter(item => item.ativo && item.unidadeId === unidadeOperacional);
    return linkedItemIds && linkedItemIds.length > 0
      ? itensDaUnidade.filter(item => linkedItemIds.includes(item.id))
      : itensDaUnidade;
  }

  const unidadeOperacional = params.selectedUnidadeId === 'todas'
    ? params.currentUserUnidadeId
    : params.selectedUnidadeId;

  return itens.filter(item => item.ativo && item.unidadeId === unidadeOperacional);
}

export function validarMovimentacaoEstoque(params: {
  item: ItemEstoque;
  tipo: TipoMovimentacao;
  quantidade: number;
  os?: EstoqueOSContext;
  movimentacoes: MovimentacaoEstoque[];
  unidadeCentralId: string;
}): EstoqueValidationResult {
  if (!isQuantidadeMovimentacaoValida(params.quantidade)) {
    return { valid: false, message: 'Quantidade inválida.' };
  }

  const delta = getMovimentacaoDelta(params.tipo, params.quantidade);
  if (params.item.saldoAtual + delta < 0) {
    return { valid: false, message: 'Saldo insuficiente para registrar a movimentação.' };
  }

  if (params.tipo !== 'baixa_os') {
    return { valid: true };
  }

  if (!params.os) {
    return { valid: false, message: 'Selecione uma OS existente para registrar baixa por OS.' };
  }

  const unidadeOperacional = getUnidadeOperacionalParaBaixaOS(params.os, params.unidadeCentralId);
  if (params.item.unidadeId !== unidadeOperacional) {
    return params.os.origemVenda === 'externa'
      ? { valid: false, message: 'OS externa deve consumir apenas estoque da Central/Fábrica.' }
      : { valid: false, message: 'OS de ótica deve consumir estoque da própria unidade.' };
  }

  const linkedItemIds = params.os.itens
    ?.map(item => item.estoqueItemId)
    .filter((itemId): itemId is string => Boolean(itemId));

  if (linkedItemIds && linkedItemIds.length > 0 && !linkedItemIds.includes(params.item.id)) {
    return { valid: false, message: 'Item de estoque não está vinculado aos itens desta OS.' };
  }

  const baixaDuplicada = params.movimentacoes.some(mov =>
    mov.tipo === 'baixa_os' &&
    mov.osId === params.os?.id &&
    mov.itemId === params.item.id
  );

  if (baixaDuplicada) {
    return { valid: false, message: 'Já existe baixa por OS para este item nesta sessão.' };
  }

  return { valid: true };
}
