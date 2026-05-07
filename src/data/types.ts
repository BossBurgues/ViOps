// =============================================================================
// ViOps — Domain Types
// Central domain model. All business-critical types live here.
// Keep this file free of UI logic, helpers, and mock data.
// =============================================================================

// ---------------------------------------------------------------------------
// RBAC
// ---------------------------------------------------------------------------

export type UserRole =
  | 'admin'
  | 'gestor'
  | 'vendedor'
  | 'operador'
  | 'financeiro';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  unidadeId: string;
  ativo: boolean;
  avatar?: string;
}

// ---------------------------------------------------------------------------
// Network / Units
// ---------------------------------------------------------------------------

export interface Rede {
  id: string;
  nome: string;
  cnpj: string;
}

export interface Unidade {
  id: string;
  redeId: string;
  nome: string;
  cidade: string;
  uf: string;
  telefone: string;
  ativa: boolean;
}

// ---------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------

export interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  cidade: string;
  uf: string;
  dataCadastro: string;
}

// ---------------------------------------------------------------------------
// OS Status — explicit state machine
// ---------------------------------------------------------------------------
// Flow: aberta → enviada_central → recebida_central → producao
//        → pendencia → pronta → enviada_unidade → entregue
// Terminal states: cancelada
// Legacy alias 'recebida' kept for backward compat with existing mock data.
// Legacy alias 'enviada' kept for backward compat with existing mock data.
// ---------------------------------------------------------------------------

export type OSStatus =
  | 'aberta'            // OS criada na loja, ainda não enviada à central
  | 'enviada_central'   // Enviada pela loja para a central de produção
  | 'recebida'          // Recebida/confirmada na central (legacy compat: 'recebida')
  | 'producao'          // Em produção/laboratório
  | 'pendencia'         // Produção pausada por pendência (receita, insumo etc.)
  | 'pronta'            // Produção concluída, aguardando envio
  | 'enviada'           // Enviada da central de volta para a unidade (legacy compat)
  | 'enviada_unidade'   // Alias semântico mais explícito para 'enviada'
  | 'entregue'          // Entregue ao cliente
  | 'cancelada';        // Terminal — OS cancelada

// ---------------------------------------------------------------------------
// Sale Origin — mandatory on every OS
// ---------------------------------------------------------------------------

export type OrigemVenda = 'otica' | 'externa';

// ---------------------------------------------------------------------------
// Payment — Methods, Intents, Status
// ---------------------------------------------------------------------------

/** All supported payment methods. Add new ones here as integrations grow. */
export type PaymentMethod =
  | 'pix'
  | 'dinheiro'
  | 'cartao_credito'
  | 'cartao_debito'
  | 'boleto'
  | 'cheque'
  | 'link_pagamento'  // Mercado Pago or similar link-based charge
  | 'qr_code';        // QR-code-based (Pix QR, MP QR etc.)

/** Lifecycle of a payment link or QR charge sent to the customer. */
export type PaymentIntentStatus =
  | 'gerado'    // Link/QR created internally — not yet sent to customer
  | 'enviado'   // Sent to customer (WhatsApp, email, SMS etc.)
  | 'aberto'    // Customer opened the link (optional, provider-dependent)
  | 'pendente'  // Customer hasn't paid yet
  | 'pago'      // Confirmed as paid by provider callback or manual baixa
  | 'expirado'  // Expired without payment
  | 'falhou';   // Provider returned an error or charge was rejected

/** Lifecycle of a boleto. Distinct from PaymentIntentStatus intentionally. */
export type BoletoStatus =
  | 'gerado'
  | 'emitido'   // Registered with bank
  | 'enviado'
  | 'pendente'
  | 'pago'
  | 'vencido'   // Overdue (boleto-specific term)
  | 'cancelado';

/**
 * Represents a payment link, QR code, or Mercado Pago charge.
 * Optional on Pagamento — only present when a link/QR charge was created.
 */
export interface PaymentIntent {
  id: string;
  provider: 'mercado_pago' | 'pix_manual' | 'outro';
  externalId?: string;        // Provider's own charge ID
  status: PaymentIntentStatus;
  url?: string;               // Payment link URL
  qrCode?: string;            // QR code string / base64
  geradoEm: string;           // ISO timestamp
  enviadoEm?: string;
  paidAt?: string;
  expiresAt?: string;
  valor: number;
}

/**
 * Represents a boleto bancário.
 * Optional on Pagamento — only present when a boleto was issued.
 * Fields prefixed with `sicoob` are specific to Sicoob integration.
 */
export interface Boleto {
  id: string;
  banco: string;              // e.g. 'Sicoob', 'Bradesco'
  externalId?: string;        // Bank's own boleto ID
  /** Sicoob: nosso número (bank's reference for this boleto) */
  nossoNumero?: string;
  /** Sicoob: código do caixa/agência */
  agencia?: string;
  /** Sicoob: conta corrente da empresa */
  contaCedente?: string;
  /** Sicoob: nome do cedente (empresa) */
  nomeCedente?: string;
  /** Sicoob: nome do sacado (cliente) */
  nomeSacado?: string;
  /** Sicoob: CPF/CNPJ do sacado */
  cpfCnpjSacado?: string;
  codigoBarras?: string;
  linhaDigitavel?: string;
  status: BoletoStatus;
  valorNominal: number;
  vencimento: string;         // ISO date
  emitidoEm?: string;
  paidAt?: string;
  url?: string;               // PDF link
  /** Optional: instructions to print on the boleto */
  instrucoes?: string;
}

/** Status of a single installment — covers both internal and provider states. */
export type ParcelaStatus =
  | 'pendente'
  | 'paga'
  | 'vencida'
  | 'cancelada';

/** A single installment of a payment plan. */
export interface Parcela {
  id: string;
  numero: number;
  valor: number;
  vencimento: string;         // ISO date
  status: ParcelaStatus;
  metodo?: PaymentMethod;     // May differ per installment in hybrid plans
  dataPagamento?: string;
  paymentIntent?: PaymentIntent; // Present if this parcela uses a link/QR
  boleto?: Boleto;               // Present if this parcela uses a boleto
}

/**
 * Aggregate financial status derived from all Parcelas of an OS.
 * Used in dashboards, filters, and reports — do not persist this.
 */
export type FinancialStatus =
  | 'pago'               // All parcelas paid
  | 'parcialmente_pago'  // Some paid, none overdue
  | 'pendente'           // None paid yet, none overdue
  | 'inadimplente'       // At least one overdue parcela
  | 'aguardando_link'    // Link gerado, aguardando pagamento
  | 'link_expirado'      // Link expirado sem pagamento
  | 'boleto_emitido'     // Boleto emitido, aguardando pagamento
  | 'boleto_vencido'     // Boleto vencido
  | 'cancelado';

/** Top-level payment block attached to an OS. */
export interface Pagamento {
  id: string;
  osId: string;
  /**
   * @deprecated Use `metodo` (typed). Keep for backward compatibility with
   * existing mock data until migration is complete.
   */
  formaPagamento: string;
  metodo?: PaymentMethod;                   // Typed replacement for formaPagamento
  valorTotal: number;
  valorEntrada?: number;                    // Down payment at sale time
  /** Method used for the complementary balance (after entrada). */
  metodoPagamentoComplementar?: PaymentMethod;
  /** Human-readable label for the complementary method (kept for display). */
  metodoPagamentoComplementarLabel?: string;
  /** Amount of the complementary charge (total - entrada). */
  valorComplementar?: number;
  /** Optional note about the payment arrangement. */
  observacoes?: string;
  parcelas: Parcela[];
}

// ---------------------------------------------------------------------------
// Factory / Production Reference
// ---------------------------------------------------------------------------

/**
 * Status of an OS within the factory/laboratory production flow.
 * Distinct from OSStatus — this tracks the internal production stage.
 */
export type ProductionStatus =
  | 'aguardando'        // Received by factory, not yet started
  | 'em_corte'          // Lens cutting phase
  | 'em_acabamento'     // Finishing/polishing
  | 'controle_qualidade'// Quality control
  | 'aprovado'          // QC passed, ready to ship
  | 'reprovado'         // QC failed, needs rework
  | 'em_retrabalho'     // Being reworked after QC failure
  | 'concluido';        // Production complete

/** An event in the factory history of an OS. */
export interface FactoryHistoryEvent {
  id: string;
  timestamp: string;          // ISO
  tipo: 'entrada' | 'saida' | 'status_change' | 'observacao' | 'calctool' | 'baixa_externa';
  descricao: string;
  usuario?: string;
  producaoStatus?: ProductionStatus;
}

/**
 * Optional reference to an external factory or production system.
 * All fields are optional — only attach when the OS has a factory linkage.
 */
export interface FactoryRef {
  // Core identifiers
  externalId?: string;          // ID in the external factory's system
  lote?: string;                // Production lot/batch

  // Calctool RX 2.0 integration fields
  calctoolRxId?: string;        // Reference registered in Calctool RX 2.0
  calctoolRxRegistradoEm?: string; // ISO timestamp of Calctool registration

  // External control/baixa system
  sistemaExternoId?: string;    // ID for baixa/control in external system (e.g. factory ERP)
  sistemaExternoNome?: string;  // e.g. 'Zeiss Visustore', 'Hoya iLog', 'Manual'
  baixaExternaRealizada?: boolean;
  baixaExternaEm?: string;      // ISO timestamp

  // Production status (internal tracking)
  producaoStatus?: ProductionStatus;

  // Queue priority for factory floor
  prioridadeFabrica?: 'normal' | 'alta' | 'urgente';

  // Dates
  dataEnvioFabrica?: string;    // ISO timestamp
  dataRetornoFabrica?: string;  // ISO timestamp

  // Notes
  observacoes?: string;

  // History of factory events
  historico?: FactoryHistoryEvent[];
}


// ---------------------------------------------------------------------------
// Items on an OS
// ---------------------------------------------------------------------------

export type TipoItemOS =
  | 'Armacao'
  | 'Lente'
  | 'Acessorio'
  | 'Servico'
  | 'Outro';

export interface ItemOS {
  id: string;
  descricao: string;
  tipo: TipoItemOS;
  quantidade: number;
  valorUnitario: number;
  /** Optional: link to stock item when inventory module is active */
  estoqueItemId?: string;
}

// ---------------------------------------------------------------------------
// OS History / Audit Trail
// ---------------------------------------------------------------------------

export interface HistoricoOS {
  id: string;
  data: string;           // ISO timestamp
  status: OSStatus;
  descricao: string;
  usuario: string;
  userId?: string;        // For RBAC audit traceability
}

// ---------------------------------------------------------------------------
// Customer Signature
// ---------------------------------------------------------------------------

/** Captured during external sales for customer consent / acceptance. */
export interface AssinaturaCliente {
  capturadoEm: string;    // ISO timestamp
  usuario: string;        // Seller who captured
  /** Base64 data URL or a reference URI to stored signature image */
  dados: string;
}

// ---------------------------------------------------------------------------
// Ordem de Serviço — Core Entity
// ---------------------------------------------------------------------------

export interface OrdemServico {
  // Identity
  id: string;
  numero: string;

  // Customer
  clienteId: string;
  clienteNome: string;

  // Unit
  unidadeId: string;
  unidadeNome: string;

  // Sale context
  /**
   * Mandatory: 'otica' for in-store sales, 'externa' for field/external sales.
   * Defaults to 'otica' for existing records without this field.
   */
  origemVenda: OrigemVenda;
  /** Present when origemVenda === 'externa' and customer signature was captured */
  assinaturaCliente?: AssinaturaCliente;
  /**
   * For external sales: where the sale took place.
   * e.g. "Empresa Alfa Ltda", "Residência do cliente", "Evento SESC"
   */
  localAcaoExterna?: string;

  // Workflow
  status: OSStatus;
  dataCriacao: string;
  dataPrevisao: string;
  dataEntrega?: string;

  // Seller
  vendedorId: string;
  vendedorNome: string;

  // Value
  valorTotal: number;

  // Content
  observacoes: string;
  itens: ItemOS[];
  historico: HistoricoOS[];

  // Financial
  pagamento?: Pagamento;

  // Production / Factory
  factoryRef?: FactoryRef;

  // Priority
  prioridade?: 'normal' | 'alta' | 'urgente';
}

// ---------------------------------------------------------------------------
// Optional Stock Module — authoritative types live in stockTypes.ts
// ---------------------------------------------------------------------------
// This section exists for backward-compatibility and discoverability.
// Do NOT redefine ItemEstoque or MovimentacaoEstoque here — import from
// '@/data/stockTypes' when the inventory module is active.
// ---------------------------------------------------------------------------

export type { ItemEstoque, MovimentacaoEstoque } from './stockTypes';

// ---------------------------------------------------------------------------
// Convenience: Status label maps — typed to ensure exhaustiveness
// ---------------------------------------------------------------------------

/**
 * Human-readable labels for OSStatus values.
 * Typed as Partial<Record> since legacy statuses and new ones coexist.
 * Update this map whenever OSStatus union is extended.
 */
export const OS_STATUS_LABELS: Record<OSStatus, string> = {
  aberta: 'Aberta',
  enviada_central: 'Enviada para Central',
  recebida: 'Recebida na Central',
  producao: 'Em Produção',
  pendencia: 'Pendência',
  pronta: 'Pronta',
  enviada: 'Enviada para Unidade',
  enviada_unidade: 'Enviada para Unidade',
  entregue: 'Entregue',
  cancelada: 'Cancelada',
};

export const ORIGEM_VENDA_LABELS: Record<OrigemVenda, string> = {
  otica: 'Venda na Ótica',
  externa: 'Venda Externa',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  boleto: 'Boleto Bancário',
  cheque: 'Cheque',
  link_pagamento: 'Link de Pagamento',
  qr_code: 'QR Code',
};

export const PAYMENT_INTENT_STATUS_LABELS: Record<PaymentIntentStatus, string> = {
  gerado: 'Gerado',
  enviado: 'Enviado ao cliente',
  aberto: 'Aberto pelo cliente',
  pendente: 'Aguardando pagamento',
  pago: 'Pago',
  expirado: 'Expirado',
  falhou: 'Falhou',
};
