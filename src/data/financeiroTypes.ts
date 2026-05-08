// =============================================================================
// ViOps — Generic Financial Domain Types
// =============================================================================
// Provedores financeiros são plugáveis. O domínio NÃO deve ser acoplado a
// bancos ou gateways específicos. Sicoob, Stone, Mercado Pago etc. são apenas
// exemplos de provedores, não tipos do domínio.
// =============================================================================

// ---------------------------------------------------------------------------
// Provedor Financeiro
// ---------------------------------------------------------------------------

/** Categoria operacional do provedor. */
export type TipoProvedor = 'banco' | 'gateway' | 'adquirente' | 'manual' | 'outro';

/**
 * Provedor financeiro plugável.
 * Instâncias vivem em mockProvedores.ts (demo) ou em uma configuração de rede real.
 * O ID deve seguir o padrão `prov_<slug>`, ex: 'prov_sicoob', 'prov_stone'.
 */
export interface ProvedorFinanceiro {
  id: string;               // e.g. 'prov_sicoob', 'prov_stone', 'prov_manual'
  nome: string;             // Display name, e.g. 'Sicoob', 'Stone', 'Manual'
  tipo: TipoProvedor;
  ativo: boolean;
  suportaBoleto: boolean;
  suportaPix: boolean;
  suportaCartao: boolean;
  suportaLinkPagamento: boolean;
  suportaQrCode: boolean;
  observacoes?: string;
}

// ---------------------------------------------------------------------------
// Tipo de Cobrança — genérico, sem menção a provedor
// ---------------------------------------------------------------------------

/**
 * Tipo de cobrança operacional.
 * O tipo descreve O QUE é cobrado. O provedor descreve QUEM processa.
 * Exemplo: tipo=boleto + provedor=Sicoob; tipo=link_pagamento + provedor=Stone.
 */
export type TipoCobranca =
  | 'boleto'           // Boleto bancário (qualquer banco)
  | 'pix'              // Pix (chave ou QR gerado pelo banco/gateway)
  | 'cartao_credito'
  | 'cartao_debito'
  | 'dinheiro'
  | 'transferencia'    // TED/DOC/TBF
  | 'link_pagamento'   // Link de cobrança gerado por gateway
  | 'qr_code'          // QR de pagamento (Pix ou gateway)
  | 'outro';

/** Labels de exibição para TipoCobranca. */
export const TIPO_COBRANCA_LABELS: Record<TipoCobranca, string> = {
  boleto:          'Boleto Bancário',
  pix:             'Pix',
  cartao_credito:  'Cartão de Crédito',
  cartao_debito:   'Cartão de Débito',
  dinheiro:        'Dinheiro',
  transferencia:   'Transferência (TED/DOC)',
  link_pagamento:  'Link de Pagamento',
  qr_code:         'QR Code',
  outro:           'Outro',
};

// ---------------------------------------------------------------------------
// Status da Cobrança
// ---------------------------------------------------------------------------

/**
 * Ciclo de vida de uma cobrança genérica.
 * Mais granular que ParcelaStatus — cobre estados de provedor.
 */
export type StatusCobranca =
  | 'rascunho'    // Registrada localmente, ainda não emitida ao provedor
  | 'gerada'      // Gerada no sistema interno
  | 'emitida'     // Registrada/emitida no provedor (ex: boleto registrado no banco)
  | 'enviada'     // Enviada ao cliente (WhatsApp, email, link etc.)
  | 'pendente'    // Aguardando pagamento do cliente
  | 'paga'        // Confirmada como paga
  | 'vencida'     // Passou da data de vencimento sem pagamento
  | 'expirada'    // Link/QR expirou
  | 'cancelada'   // Cancelada manualmente
  | 'falha';      // Erro de provedor

/** Labels de exibição para StatusCobranca. */
export const STATUS_COBRANCA_LABELS: Record<StatusCobranca, string> = {
  rascunho:  'Rascunho',
  gerada:    'Gerada',
  emitida:   'Emitida',
  enviada:   'Enviada',
  pendente:  'Pendente',
  paga:      'Paga',
  vencida:   'Vencida',
  expirada:  'Expirada',
  cancelada: 'Cancelada',
  falha:     'Falha',
};

/** Classes CSS para badges de StatusCobranca. */
export const STATUS_COBRANCA_CLASSES: Record<StatusCobranca, string> = {
  rascunho:  'bg-muted text-muted-foreground',
  gerada:    'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  emitida:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  enviada:   'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  pendente:  'bg-warning/10 text-warning',
  paga:      'bg-success/10 text-success',
  vencida:   'bg-destructive/10 text-destructive',
  expirada:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  cancelada: 'bg-muted text-muted-foreground line-through',
  falha:     'bg-destructive/20 text-destructive font-semibold',
};

// ---------------------------------------------------------------------------
// Cobrança — entidade central do módulo financeiro genérico
// ---------------------------------------------------------------------------

/**
 * Cobrança genérica vinculada a uma OS.
 *
 * Canal/origem são derivados da OS via `osId` usando `ordensServico` —
 * não duplicados aqui para evitar inconsistência entre dados.
 *
 * O `providerId` aponta para ProvedorFinanceiro.id (ex: 'prov_sicoob').
 * O `externalId` é o identificador no sistema do provedor (ex: nosso número do boleto).
 */
export interface Cobranca {
  // Identity
  id: string;
  osId: string;
  osNumero: string;
  clienteId: string;
  clienteNome: string;
  unidadeId: string;

  // Financial
  tipo: TipoCobranca;
  status: StatusCobranca;
  valor: number;
  vencimento: string;         // ISO date
  dataPagamento?: string;     // ISO date — set when status='paga'

  // Provider — optional, pluggable
  /** ID do ProvedorFinanceiro — ex: 'prov_sicoob'. Undefined = sem provedor registrado. */
  providerId?: string;

  // Provider reference data (optional — filled when integrated)
  externalId?: string;        // Provedor's own charge ID
  linhaDigitavel?: string;    // Boleto digitável line
  codigoBarras?: string;
  linkPagamento?: string;     // URL do link de pagamento / QR
  qrPayload?: string;         // Pix/QR payload string

  // Meta
  observacao?: string;
  criadaEm: string;           // ISO timestamp
  atualizadaEm?: string;      // ISO timestamp
}
