// =============================================================================
// ViOps — Stock / Inventory Domain Types
// This module is OPTIONAL. The rest of the system MUST NOT depend on these
// types. An OS can reference a stock item by ID only — never by direct import.
// =============================================================================

// ---------------------------------------------------------------------------
// Item categories specific to optical stores
// ---------------------------------------------------------------------------

export type CategoriaEstoque =
  | 'armacao'
  | 'lente'
  | 'acessorio'
  | 'solucao'     // Cleaning solutions, eye drops
  | 'embalagem'   // Packaging
  | 'outro';

// ---------------------------------------------------------------------------
// Movement types — every stock change must be recorded as a movement
// ---------------------------------------------------------------------------

export type TipoMovimentacao =
  | 'entrada'         // Purchase / replenishment
  | 'saida'           // Manual withdrawal
  | 'baixa_os'        // Consumed by an OS (linked by osId)
  | 'ajuste_positivo' // Stock count correction (up)
  | 'ajuste_negativo' // Stock count correction (down)
  | 'devolucao'       // Returned item
  | 'transferencia';  // Between units (future)

// ---------------------------------------------------------------------------
// Stock item — represents a SKU in the catalog
// ---------------------------------------------------------------------------

export interface ItemEstoque {
  id: string;
  unidadeId: string;       // Items are scoped to a unit
  nome: string;
  descricao?: string;
  categoria: CategoriaEstoque;
  marca?: string;
  referencia?: string;     // Internal SKU / barcode
  /** Quantity currently in stock (derived from movements in a real system) */
  saldoAtual: number;
  /** Minimum stock level before alert is triggered */
  estoqueMinimo: number;
  /** Cost price (optional — for purchasing / cost tracking) */
  precoCusto?: number;
  /** Sale price (optional — if sold separately, not via OS) */
  precoVenda?: number;
  ativo: boolean;
  criadoEm: string;        // ISO
  atualizadoEm?: string;   // ISO
}

// ---------------------------------------------------------------------------
// Stock movement — immutable audit record of every stock change
// ---------------------------------------------------------------------------

export interface MovimentacaoEstoque {
  id: string;
  itemId: string;
  unidadeId: string;
  tipo: TipoMovimentacao;
  quantidade: number;      // Always positive; tipo determines direction
  /** OS number this movement is linked to, when tipo === 'baixa_os' */
  osId?: string;
  /** OS item line consumed by this movement, when the OS item is linked to stock */
  osItemId?: string;
  osNumero?: string;
  /** Person who registered the movement */
  usuarioId: string;
  usuarioNome: string;
  observacao?: string;
  dataMovimentacao: string; // ISO timestamp
}

// ---------------------------------------------------------------------------
// Alert threshold — derived, not persisted
// ---------------------------------------------------------------------------

export type AlertaEstoque = 'ok' | 'baixo' | 'zerado';

// ---------------------------------------------------------------------------
// Module feature flag — controls whether the stock module is visible/active.
// In a real implementation this would come from a settings service or feature
// flag provider. For demo purposes it is a simple constant.
// ---------------------------------------------------------------------------

export interface EstoqueModuleConfig {
  /** true = module is enabled for this rede / unit */
  habilitado: boolean;
  /** optional label override for the nav item */
  label?: string;
}
