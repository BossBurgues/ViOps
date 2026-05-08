// =============================================================================
// ViOps — Financial Status Domain Helpers
// Centralizes all logic for deriving financial state from OS payment data.
// Import this module in pages and components instead of duplicating the logic.
// =============================================================================

import { Parcela, ParcelaStatus, Pagamento, FinancialStatus, PaymentIntentStatus, BoletoStatus, Boleto } from '@/data/types';
import { TODAY_ISO } from '@/lib/utils';
import type { OrigemVenda, CanalOperacional } from '@/data/types';

// ---------------------------------------------------------------------------
// Origin / Channel helpers — centralised to avoid duplication across pages.
// Always prefer canalOperacional (explicit) over origemVenda (legacy).
// ---------------------------------------------------------------------------

/**
 * Returns true when an OS origin is the store (ótica).
 * Handles undefined for backward-compat with legacy mock data.
 * Prefer isCanalLoja() when canalOperacional is available.
 */
export function isOrigemOtica(origem: OrigemVenda | undefined): boolean {
  return !origem || origem === 'otica';
}

/**
 * Returns true when an OS was sold through a store (presential atendimento).
 * Uses canalOperacional when available; falls back to origemVenda.
 * This is the preferred helper for dashboard/report canal segmentation.
 */
export function isCanalLoja(
  canalOperacional: CanalOperacional | undefined,
  origemVenda: OrigemVenda | undefined,
): boolean {
  if (canalOperacional) return canalOperacional === 'loja';
  return isOrigemOtica(origemVenda);
}

/**
 * Returns true when an OS was sold through the Central/Fábrica external channel.
 * External sales ALWAYS belong to the Central — never to individual óticas.
 * Uses canalOperacional when available; falls back to origemVenda.
 */
export function isCanalExterno(
  canalOperacional: CanalOperacional | undefined,
  origemVenda: OrigemVenda | undefined,
): boolean {
  if (canalOperacional) return canalOperacional === 'externa';
  return origemVenda === 'externa';
}

// ---------------------------------------------------------------------------
// Installment-level helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if a parcela is overdue.
 * Uses TODAY_ISO by default — pass a custom date only for testing/reporting.
 */
export function isParcelaVencida(
  parcela: Parcela,
  referenceDate: string = TODAY_ISO,
): boolean {
  return parcela.status === 'pendente' && parcela.vencimento < referenceDate;
}

/**
 * Returns the effective display status of a parcela, accounting for overdue state.
 * Use this instead of reading parcela.status directly in UI code.
 */
export function getParcelaDisplayStatus(
  parcela: Parcela,
  referenceDate: string = TODAY_ISO,
): 'paga' | 'vencida' | 'pendente' | 'cancelada' {
  if (parcela.status === 'paga') return 'paga';
  if (parcela.status === 'cancelada') return 'cancelada';
  if (isParcelaVencida(parcela, referenceDate)) return 'vencida';
  return 'pendente';
}

/**
 * Human-readable label for a parcela's effective status.
 */
export function getParcelaStatusLabel(
  parcela: Parcela,
  referenceDate: string = TODAY_ISO,
): string {
  const status = getParcelaDisplayStatus(parcela, referenceDate);
  const labels: Record<ReturnType<typeof getParcelaDisplayStatus>, string> = {
    paga: 'Paga',
    vencida: 'Vencida',
    pendente: 'Pendente',
    cancelada: 'Cancelada',
  };
  return labels[status];
}

/**
 * CSS class suffix for styling parcela status badges.
 * Maps to the existing `status-*` CSS tokens in the project.
 */
export function getParcelaStatusClass(
  parcela: Parcela,
  referenceDate: string = TODAY_ISO,
): string {
  const status = getParcelaDisplayStatus(parcela, referenceDate);
  const map: Record<ReturnType<typeof getParcelaDisplayStatus>, string> = {
    paga: 'status-pronta',
    vencida: 'status-cancelada',
    pendente: 'status-pendencia',
    cancelada: 'status-cancelada',
  };
  return map[status];
}

// ---------------------------------------------------------------------------
// Pagamento-level helpers
// ---------------------------------------------------------------------------

export interface ParcelaSummary {
  total: number;
  pagas: number;
  pendentes: number;
  vencidas: number;
  aVencer: number;
  valorTotal: number;
  valorPago: number;
  valorPendente: number;
  valorVencido: number;
  valorAVencer: number;
}

/**
 * Derives a summary of all parcelas for an OS or a collection.
 */
export function calcParcelaSummary(
  parcelas: Parcela[],
  referenceDate: string = TODAY_ISO,
): ParcelaSummary {
  const pagas = parcelas.filter(p => p.status === 'paga');
  const pendentes = parcelas.filter(p => p.status === 'pendente');
  const vencidas = pendentes.filter(p => isParcelaVencida(p, referenceDate));
  const aVencer = pendentes.filter(p => !isParcelaVencida(p, referenceDate));

  return {
    total: parcelas.length,
    pagas: pagas.length,
    pendentes: pendentes.length,
    vencidas: vencidas.length,
    aVencer: aVencer.length,
    valorTotal: parcelas.reduce((s, p) => s + p.valor, 0),
    valorPago: pagas.reduce((s, p) => s + p.valor, 0),
    valorPendente: pendentes.reduce((s, p) => s + p.valor, 0),
    valorVencido: vencidas.reduce((s, p) => s + p.valor, 0),
    valorAVencer: aVencer.reduce((s, p) => s + p.valor, 0),
  };
}

/**
 * Derives the aggregate FinancialStatus of an OS from its Pagamento block.
 * Returns null if no pagamento exists.
 *
 * Priority order:
 * 1. No pagamento → null (caller decides default)
 * 2. All paid → 'pago'
 * 3. Any overdue → 'inadimplente'
 * 4. Any payment intent expired → 'link_expirado'
 * 5. Any payment intent active → 'aguardando_link'
 * 6. Any boleto overdue → 'boleto_vencido'
 * 7. Any boleto active → 'boleto_emitido'
 * 8. Some paid → 'parcialmente_pago'
 * 9. None paid → 'pendente'
 */
export function deriveFinancialStatus(
  pagamento: Pagamento | undefined,
  referenceDate: string = TODAY_ISO,
): FinancialStatus | null {
  if (!pagamento || pagamento.parcelas.length === 0) return null;

  const parcelas = pagamento.parcelas;
  const summary = calcParcelaSummary(parcelas, referenceDate);

  if (summary.pagas === summary.total) return 'pago';
  if (summary.vencidas > 0) return 'inadimplente';

  // Check payment intents
  const intents = parcelas.flatMap(p => p.paymentIntent ? [p.paymentIntent] : []);
  if (intents.some(i => i.status === 'expirado')) return 'link_expirado';
  const activeIntentStatuses: PaymentIntentStatus[] = ['gerado', 'enviado', 'aberto', 'pendente'];
  if (intents.some(i => activeIntentStatuses.includes(i.status))) return 'aguardando_link';

  // Check boletos
  const boletos = parcelas.flatMap(p => p.boleto ? [p.boleto] : []);
  if (boletos.some(b => b.status === 'vencido')) return 'boleto_vencido';
  if (boletos.some(b => ['emitido', 'enviado', 'pendente'].includes(b.status))) return 'boleto_emitido';

  if (summary.pagas > 0) return 'parcialmente_pago';
  return 'pendente';
}

/**
 * Human-readable label for a FinancialStatus value.
 */
export function getFinancialStatusLabel(status: FinancialStatus | null): string {
  if (!status) return 'Sem pagamento';
  const labels: Record<FinancialStatus, string> = {
    pago: 'Pago',
    parcialmente_pago: 'Parcialmente pago',
    pendente: 'Pendente',
    inadimplente: 'Inadimplente',
    aguardando_link: 'Aguardando link',
    link_expirado: 'Link expirado',
    boleto_emitido: 'Boleto emitido',
    boleto_vencido: 'Boleto vencido',
    cancelado: 'Cancelado',
  };
  return labels[status];
}

/**
 * CSS class suffix for styling FinancialStatus badges.
 */
export function getFinancialStatusClass(status: FinancialStatus | null): string {
  if (!status) return 'status-pendencia';
  const map: Record<FinancialStatus, string> = {
    pago: 'status-pronta',
    parcialmente_pago: 'status-pendencia',
    pendente: 'status-pendencia',
    inadimplente: 'status-cancelada',
    aguardando_link: 'status-recebida',
    link_expirado: 'status-cancelada',
    boleto_emitido: 'status-recebida',
    boleto_vencido: 'status-cancelada',
    cancelado: 'status-cancelada',
  };
  return map[status];
}

// ---------------------------------------------------------------------------
// PaymentIntent helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if a payment intent is in an active (non-terminal) state.
 * Active = not yet paid, not expired, not failed.
 */
export function isPaymentIntentActive(status: PaymentIntentStatus): boolean {
  return ['gerado', 'enviado', 'aberto', 'pendente'].includes(status);
}

/**
 * Returns true if a payment intent has reached a terminal state.
 */
export function isPaymentIntentTerminal(status: PaymentIntentStatus): boolean {
  return ['pago', 'expirado', 'falhou'].includes(status);
}

export const PAYMENT_INTENT_STATUS_LABELS: Record<PaymentIntentStatus, string> = {
  gerado: 'Link gerado',
  enviado: 'Link enviado',
  aberto: 'Link aberto',
  pendente: 'Aguardando pagamento',
  pago: 'Pago via link',
  expirado: 'Link expirado',
  falhou: 'Falha no pagamento',
};

export const PAYMENT_INTENT_STATUS_CLASSES: Record<PaymentIntentStatus, string> = {
  gerado: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  enviado: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  aberto: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  pendente: 'bg-warning/10 text-warning',
  pago: 'bg-success/10 text-success',
  expirado: 'bg-destructive/10 text-destructive',
  falhou: 'bg-destructive/10 text-destructive',
};

// ---------------------------------------------------------------------------
// Boleto helpers
// ---------------------------------------------------------------------------

export function isBoletoOverdue(boleto: Boleto, referenceDate: string = TODAY_ISO): boolean {
  return (
    (boleto.status === 'emitido' || boleto.status === 'enviado' || boleto.status === 'pendente') &&
    boleto.vencimento < referenceDate
  );
}

export const BOLETO_STATUS_LABELS: Record<BoletoStatus, string> = {
  gerado: 'Boleto gerado',
  emitido: 'Emitido no banco',
  enviado: 'Enviado ao cliente',
  pendente: 'Aguardando pagamento',
  pago: 'Pago',
  vencido: 'Vencido',
  cancelado: 'Cancelado',
};

export const BOLETO_STATUS_CLASSES: Record<BoletoStatus, string> = {
  gerado: 'bg-muted text-muted-foreground',
  emitido: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  enviado: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  pendente: 'bg-warning/10 text-warning',
  pago: 'bg-success/10 text-success',
  vencido: 'bg-destructive/10 text-destructive',
  cancelado: 'bg-muted text-muted-foreground',
};

// ---------------------------------------------------------------------------
// Hybrid payment summary
// ---------------------------------------------------------------------------

export interface HybridPaymentSummary {
  valorTotal: number;
  valorEntrada: number;
  valorComplementar: number;
  /** Amount of complementar that is already paid */
  valorComplementarPago: number;
  /** Amount of complementar still pending */
  valorComplementarPendente: number;
  /** True when there is a down payment AND a complementary method */
  isHybrid: boolean;
  hasActiveBoleto: boolean;
  hasActivePaymentLink: boolean;
  hasExpiredLink: boolean;
  hasOverdueBoleto: boolean;
}

/**
 * Derives a full hybrid payment summary from a Pagamento block.
 * Covers: entrada + saldo in any complementary method.
 */
export function calcHybridPaymentSummary(
  pagamento: Pagamento | undefined,
  referenceDate: string = TODAY_ISO,
): HybridPaymentSummary {
  const empty: HybridPaymentSummary = {
    valorTotal: 0,
    valorEntrada: 0,
    valorComplementar: 0,
    valorComplementarPago: 0,
    valorComplementarPendente: 0,
    isHybrid: false,
    hasActiveBoleto: false,
    hasActivePaymentLink: false,
    hasExpiredLink: false,
    hasOverdueBoleto: false,
  };
  if (!pagamento) return empty;

  const parcelas = pagamento.parcelas;
  const pagas = parcelas.filter(p => p.status === 'paga');
  const pendentes = parcelas.filter(p => p.status === 'pendente');

  const valorEntrada = pagamento.valorEntrada ?? 0;
  const valorTotal = pagamento.valorTotal;
  const valorComplementar = pagamento.valorComplementar ?? (valorTotal - valorEntrada);
  const valorComplementarPago = pagas.reduce((s, p) => s + p.valor, 0) - Math.min(valorEntrada, pagas.reduce((s, p) => s + p.valor, 0));
  const valorComplementarPendente = pendentes.reduce((s, p) => s + p.valor, 0);

  const intents = parcelas.flatMap(p => p.paymentIntent ? [p.paymentIntent] : []);
  const boletos = parcelas.flatMap(p => p.boleto ? [p.boleto] : []);

  return {
    valorTotal,
    valorEntrada,
    valorComplementar,
    valorComplementarPago: Math.max(0, valorComplementarPago),
    valorComplementarPendente,
    isHybrid: valorEntrada > 0 && !!pagamento.metodoPagamentoComplementar,
    hasActiveBoleto: boletos.some(b => ['emitido', 'enviado', 'pendente'].includes(b.status)),
    hasActivePaymentLink: intents.some(i => isPaymentIntentActive(i.status)),
    hasExpiredLink: intents.some(i => i.status === 'expirado'),
    hasOverdueBoleto: boletos.some(b => isBoletoOverdue(b, referenceDate)),
  };
}
