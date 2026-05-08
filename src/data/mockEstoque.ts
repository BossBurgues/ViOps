// =============================================================================
// ViOps — Mock Stock Data
// Realistic demo data for the optional inventory module.
// This file is ONLY for demo/development. Business logic lives in estoqueStatus.ts.
// =============================================================================

import { ItemEstoque, MovimentacaoEstoque, EstoqueModuleConfig } from './stockTypes';

// ---------------------------------------------------------------------------
// Module feature flag — flip to false to hide the module entirely
// ---------------------------------------------------------------------------

export const estoqueConfig: EstoqueModuleConfig = {
  habilitado: true,
  label: 'Estoque',
};

// ---------------------------------------------------------------------------
// Mock items — scoped per unit
// ---------------------------------------------------------------------------

export const itensEstoque: ItemEstoque[] = [
  // Unit u1 — Centro
  {
    id: 'sku01', unidadeId: 'u1', categoria: 'armacao', nome: 'Armação Ray-Ban RB5228',
    marca: 'Ray-Ban', referencia: 'RB5228-BLK', saldoAtual: 3, estoqueMinimo: 5,
    precoCusto: 420.00, precoVenda: 900.00, ativo: true,
    criadoEm: '2025-01-10T08:00:00',
  },
  {
    id: 'sku02', unidadeId: 'u1', categoria: 'armacao', nome: 'Armação Prada SPR 01V',
    marca: 'Prada', referencia: 'SPR01V-GLD', saldoAtual: 1, estoqueMinimo: 3,
    precoCusto: 680.00, precoVenda: 1400.00, ativo: true,
    criadoEm: '2025-01-15T08:00:00',
  },
  {
    id: 'sku03', unidadeId: 'u1', categoria: 'lente', nome: 'Lente Essilor Varilux Comfort',
    marca: 'Essilor', referencia: 'VARILUX-CMF', saldoAtual: 12, estoqueMinimo: 8,
    precoCusto: 190.00, precoVenda: 375.00, ativo: true,
    criadoEm: '2025-01-10T08:00:00',
  },
  {
    id: 'sku04', unidadeId: 'u1', categoria: 'lente', nome: 'Lente Zeiss Individual 2',
    marca: 'Zeiss', referencia: 'ZEISS-IND2', saldoAtual: 0, estoqueMinimo: 4,
    precoCusto: 440.00, precoVenda: 900.00, ativo: true,
    criadoEm: '2025-01-10T08:00:00',
  },
  {
    id: 'sku05', unidadeId: 'u1', categoria: 'solucao', nome: 'Solução Multifuncional Renu',
    marca: 'Bausch+Lomb', referencia: 'RENU-360', saldoAtual: 18, estoqueMinimo: 6,
    precoCusto: 22.00, precoVenda: 45.00, ativo: true,
    criadoEm: '2025-01-20T08:00:00',
  },
  {
    id: 'sku06', unidadeId: 'u1', categoria: 'acessorio', nome: 'Estojo Rígido Premium',
    marca: 'ViOps', referencia: 'EST-RIG-01', saldoAtual: 7, estoqueMinimo: 10,
    precoCusto: 12.00, precoVenda: 25.00, ativo: true,
    criadoEm: '2025-02-01T08:00:00',
  },
  // Unit u2 — Batel
  {
    id: 'sku07', unidadeId: 'u2', categoria: 'armacao', nome: 'Armação Tom Ford FT5401',
    marca: 'Tom Ford', referencia: 'TF5401-BRN', saldoAtual: 2, estoqueMinimo: 3,
    precoCusto: 890.00, precoVenda: 1800.00, ativo: true,
    criadoEm: '2025-01-12T08:00:00',
  },
  {
    id: 'sku08', unidadeId: 'u2', categoria: 'lente', nome: 'Lente Transitions Signature Gen 8',
    marca: 'Transitions', referencia: 'TRANS-G8-MF', saldoAtual: 6, estoqueMinimo: 4,
    precoCusto: 370.00, precoVenda: 750.00, ativo: true,
    criadoEm: '2025-01-12T08:00:00',
  },
  {
    id: 'sku09', unidadeId: 'u2', categoria: 'armacao', nome: 'Armação Grazi Collection GZ3090',
    marca: 'Grazi', referencia: 'GZ3090-RSG', saldoAtual: 4, estoqueMinimo: 3,
    precoCusto: 260.00, precoVenda: 550.00, ativo: true,
    criadoEm: '2025-01-12T08:00:00',
  },
  // Unit u0 — Central / Fábrica (itens consumidos pelas OS externas)
  {
    id: 'sku10', unidadeId: 'u0', categoria: 'lente', nome: 'Lente Zeiss Individual 2 (Central)',
    marca: 'Zeiss', referencia: 'ZEISS-IND2-CTR', saldoAtual: 6, estoqueMinimo: 4,
    precoCusto: 440.00, precoVenda: 900.00, ativo: true,
    criadoEm: '2025-01-10T08:00:00',
  },
  {
    id: 'sku11', unidadeId: 'u0', categoria: 'armacao', nome: 'Armação Tom Ford FT5401 (Central)',
    marca: 'Tom Ford', referencia: 'TF5401-CTR', saldoAtual: 4, estoqueMinimo: 2,
    precoCusto: 890.00, precoVenda: 1800.00, ativo: true,
    criadoEm: '2025-01-12T08:00:00',
  },
  {
    id: 'sku12', unidadeId: 'u0', categoria: 'lente', nome: 'Lente Transitions Signature Gen 8 (Central)',
    marca: 'Transitions', referencia: 'TRANS-G8-CTR', saldoAtual: 8, estoqueMinimo: 3,
    precoCusto: 370.00, precoVenda: 750.00, ativo: true,
    criadoEm: '2025-01-12T08:00:00',
  },
];

// ---------------------------------------------------------------------------
// Mock movements — realistic history for the last 30 days
// ---------------------------------------------------------------------------

export const movimentacoesEstoque: MovimentacaoEstoque[] = [
  // Entries / replenishments
  {
    id: 'mov01', itemId: 'sku01', unidadeId: 'u1', tipo: 'entrada', quantidade: 5,
    usuarioId: 'usr1', usuarioNome: 'Ricardo Almeida',
    observacao: 'Reposição mensal — NF 4521',
    dataMovimentacao: '2025-04-01T10:00:00',
  },
  {
    id: 'mov02', itemId: 'sku03', unidadeId: 'u1', tipo: 'entrada', quantidade: 20,
    usuarioId: 'usr1', usuarioNome: 'Ricardo Almeida',
    observacao: 'Pedido trimestral Essilor — NF 9812',
    dataMovimentacao: '2025-04-01T10:15:00',
  },
  {
    id: 'mov03', itemId: 'sku04', unidadeId: 'u1', tipo: 'entrada', quantidade: 4,
    usuarioId: 'usr2', usuarioNome: 'Carla Mendes',
    observacao: 'Reposição emergencial Zeiss',
    dataMovimentacao: '2025-04-02T09:00:00',
  },
  // Baixas por OS
  {
    id: 'mov04', itemId: 'sku01', unidadeId: 'u1', tipo: 'baixa_os', quantidade: 1,
    osId: 'os1', osNumero: 'OS-2025-0001',
    usuarioId: 'usr3', usuarioNome: 'Fernando Costa',
    dataMovimentacao: '2025-03-01T11:00:00',
  },
  {
    id: 'mov05', itemId: 'sku03', unidadeId: 'u1', tipo: 'baixa_os', quantidade: 2,
    osId: 'os1', osNumero: 'OS-2025-0001',
    usuarioId: 'usr3', usuarioNome: 'Fernando Costa',
    dataMovimentacao: '2025-03-01T11:00:00',
  },
  // Baixa por OS externa os4 — estoque sai da Central/Fábrica (sku10)
  {
    id: 'mov06', itemId: 'sku10', unidadeId: 'u0', tipo: 'baixa_os', quantidade: 2,
    osId: 'os4', osNumero: 'OS-2025-0004',
    usuarioId: 'usr5', usuarioNome: 'Marcos Silva',
    observacao: 'Baixa OS externa — estoque Central/Fábrica',
    dataMovimentacao: '2025-04-06T09:00:00',
  },
  // Baixa por OS de loja os8 (ótica u1) — item sku04 da unidade Centro
  {
    id: 'mov07', itemId: 'sku04', unidadeId: 'u1', tipo: 'baixa_os', quantidade: 2,
    osId: 'os8', osNumero: 'OS-2025-0008',
    usuarioId: 'usr3', usuarioNome: 'Fernando Costa',
    observacao: 'Baixa OS loja — Zeiss Individual 2 — Centro',
    dataMovimentacao: '2025-04-10T09:00:00',
  },
  // Baixa por OS externa os7 — estoque sai da Central/Fábrica (sku11: Tom Ford)
  {
    id: 'mov11', itemId: 'sku11', unidadeId: 'u0', tipo: 'baixa_os', quantidade: 1,
    osId: 'os7', osNumero: 'OS-2025-0007',
    usuarioId: 'usr5', usuarioNome: 'Marcos Silva',
    observacao: 'Baixa OS externa — Tom Ford FT5401 — estoque Central/Fábrica',
    dataMovimentacao: '2025-04-07T15:00:00',
  },
  // Baixa por OS externa os9 — estoque sai da Central/Fábrica (sku12: Transitions)
  {
    id: 'mov12', itemId: 'sku12', unidadeId: 'u0', tipo: 'baixa_os', quantidade: 2,
    osId: 'os9', osNumero: 'OS-2025-0009',
    usuarioId: 'usr5', usuarioNome: 'Marcos Silva',
    observacao: 'Baixa OS externa — Transitions Signature Gen 8 — estoque Central/Fábrica',
    dataMovimentacao: '2025-04-09T08:30:00',
  },

  // Saída manual
  {
    id: 'mov08', itemId: 'sku01', unidadeId: 'u1', tipo: 'saida', quantidade: 1,
    usuarioId: 'usr2', usuarioNome: 'Carla Mendes',
    observacao: 'Mostruário danificado — descarte',
    dataMovimentacao: '2025-04-08T14:00:00',
  },
  // Ajuste positivo (contagem física)
  {
    id: 'mov09', itemId: 'sku05', unidadeId: 'u1', tipo: 'ajuste_positivo', quantidade: 3,
    usuarioId: 'usr2', usuarioNome: 'Carla Mendes',
    observacao: 'Ajuste após inventário — divergência no sistema anterior',
    dataMovimentacao: '2025-04-05T16:00:00',
  },
  // Unit u2 movements
  {
    id: 'mov10', itemId: 'sku07', unidadeId: 'u2', tipo: 'entrada', quantidade: 3,
    usuarioId: 'usr4', usuarioNome: 'Juliana Ribeiro',
    observacao: 'Chegada pedido Tom Ford',
    dataMovimentacao: '2025-04-03T10:00:00',
  },
  // Unit u0 — Central/Fábrica: entrada e baixas de OS externas
  {
    id: 'mov14', itemId: 'sku10', unidadeId: 'u0', tipo: 'entrada', quantidade: 10,
    usuarioId: 'usr5', usuarioNome: 'Marcos Silva',
    observacao: 'Estoque inicial Central — Zeiss Individual 2',
    dataMovimentacao: '2025-03-15T09:00:00',
  },
  {
    id: 'mov15', itemId: 'sku11', unidadeId: 'u0', tipo: 'entrada', quantidade: 6,
    usuarioId: 'usr5', usuarioNome: 'Marcos Silva',
    observacao: 'Estoque inicial Central — Tom Ford FT5401',
    dataMovimentacao: '2025-03-15T09:15:00',
  },
  {
    id: 'mov16', itemId: 'sku12', unidadeId: 'u0', tipo: 'entrada', quantidade: 10,
    usuarioId: 'usr5', usuarioNome: 'Marcos Silva',
    observacao: 'Estoque inicial Central — Transitions Signature Gen 8',
    dataMovimentacao: '2025-03-15T09:30:00',
  },
];

