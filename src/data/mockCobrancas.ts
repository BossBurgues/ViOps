// =============================================================================
// ViOps — Mock: Cobranças Genéricas
// =============================================================================
// Cobranças vinculadas às OS existentes do sistema.
// Canal/origem derivados da OS via osId — não duplicados aqui.
// Sem integração real, sem credenciais, sem chamadas a APIs.
// =============================================================================

import { Cobranca } from './financeiroTypes';

export const cobrancas: Cobranca[] = [
  // OS1 (ótica/u1) — Armação + Lentes — Cartão 3x — entregue/quitada
  {
    id: 'cob_os1_01',
    osId: 'os1', osNumero: 'OS-2025-0001',
    clienteId: 'c1', clienteNome: 'Maria Helena Souza',
    unidadeId: 'u1',
    tipo: 'cartao_credito',
    status: 'paga',
    valor: 1850.00,
    vencimento: '2025-03-01',
    dataPagamento: '2025-03-01',
    providerId: 'prov_cielo',
    externalId: 'CIE-TXN-001234',
    observacao: '3x no cartão de crédito',
    criadaEm: '2025-03-01T09:30:00',
    atualizadaEm: '2025-03-01T09:35:00',
  },

  // OS2 (ótica/u2) — Boleto 4x — em produção / pendente
  {
    id: 'cob_os2_01',
    osId: 'os2', osNumero: 'OS-2025-0002',
    clienteId: 'c2', clienteNome: 'Jose Carlos Pereira',
    unidadeId: 'u2',
    tipo: 'boleto',
    status: 'emitida',
    valor: 585.00,
    vencimento: '2025-04-10',
    providerId: 'prov_sicoob',
    externalId: 'SIC-BOL-00201',
    linhaDigitavel: '75691.23450 00002.012345 00000.001001 1 99200000058500',
    observacao: 'Parcela 1/4',
    criadaEm: '2025-04-02T14:30:00',
  },
  {
    id: 'cob_os2_02',
    osId: 'os2', osNumero: 'OS-2025-0002',
    clienteId: 'c2', clienteNome: 'Jose Carlos Pereira',
    unidadeId: 'u2',
    tipo: 'boleto',
    status: 'gerada',
    valor: 585.00,
    vencimento: '2025-05-10',
    providerId: 'prov_sicoob',
    observacao: 'Parcela 2/4',
    criadaEm: '2025-04-02T14:30:00',
  },

  // OS4 (externa/u0) — Cartão 6x — pendência
  {
    id: 'cob_os4_01',
    osId: 'os4', osNumero: 'OS-2025-0004',
    clienteId: 'c4', clienteNome: 'Roberto Martins',
    unidadeId: 'u0',
    tipo: 'cartao_credito',
    status: 'pendente',
    valor: 3200.00,
    vencimento: '2025-04-14',
    providerId: 'prov_cielo',
    observacao: '6x no cartão — aguardando receita para finalizar',
    criadaEm: '2025-04-05T11:00:00',
  },

  // OS7 (externa/u0) — Cartão 10x — em produção
  {
    id: 'cob_os7_01',
    osId: 'os7', osNumero: 'OS-2025-0007',
    clienteId: 'c7', clienteNome: 'Claudia Beatriz Ferreira',
    unidadeId: 'u0',
    tipo: 'cartao_credito',
    status: 'enviada',
    valor: 4500.00,
    vencimento: '2025-04-15',
    providerId: 'prov_stone',
    externalId: 'STN-CHR-007742',
    observacao: '10x no cartão de crédito',
    criadaEm: '2025-04-07T15:00:00',
    atualizadaEm: '2025-04-07T15:10:00',
  },

  // OS9 (externa/u0) — Entrada dinheiro + Boleto Sicoob para saldo
  {
    id: 'cob_os9_entrada',
    osId: 'os9', osNumero: 'OS-2025-0009',
    clienteId: 'c3', clienteNome: 'Ana Paula Rodrigues',
    unidadeId: 'u0',
    tipo: 'dinheiro',
    status: 'paga',
    valor: 900.00,
    vencimento: '2025-04-08',
    dataPagamento: '2025-04-08',
    providerId: 'prov_manual',
    observacao: 'Entrada em dinheiro na visita externa',
    criadaEm: '2025-04-08T10:00:00',
    atualizadaEm: '2025-04-08T10:05:00',
  },
  {
    id: 'cob_os9_saldo',
    osId: 'os9', osNumero: 'OS-2025-0009',
    clienteId: 'c3', clienteNome: 'Ana Paula Rodrigues',
    unidadeId: 'u0',
    tipo: 'boleto',
    status: 'emitida',
    valor: 1500.00,
    vencimento: '2025-05-16',
    providerId: 'prov_sicoob',
    externalId: 'SIC-BOL-00901',
    linhaDigitavel: '75691.23450 00001.234567 00000.990001 1 99920000150000',
    observacao: 'Saldo em boleto — Sicoob — vencimento 30 dias',
    criadaEm: '2025-04-14T16:00:00',
  },

  // OS10 (ótica/u1) — Entrada Pix + Link de Pagamento para saldo
  {
    id: 'cob_os10_entrada',
    osId: 'os10', osNumero: 'OS-2025-0010',
    clienteId: 'c6', clienteNome: 'Paulo Henrique Dias',
    unidadeId: 'u1',
    tipo: 'pix',
    status: 'paga',
    valor: 550.00,
    vencimento: '2025-04-11',
    dataPagamento: '2025-04-11',
    providerId: 'prov_manual',
    observacao: 'Entrada via Pix — confirmada na venda',
    criadaEm: '2025-04-11T14:20:00',
    atualizadaEm: '2025-04-11T14:22:00',
  },
  {
    id: 'cob_os10_saldo',
    osId: 'os10', osNumero: 'OS-2025-0010',
    clienteId: 'c6', clienteNome: 'Paulo Henrique Dias',
    unidadeId: 'u1',
    tipo: 'link_pagamento',
    status: 'enviada',
    valor: 1200.00,
    vencimento: '2025-04-18',
    providerId: 'prov_stone',
    externalId: 'STN-CHR-001023',
    linkPagamento: '/simulado/link-pagamento/cob_os10_saldo',
    observacao: 'Link de pagamento enviado via WhatsApp — aguardando confirmação',
    criadaEm: '2025-04-11T14:35:00',
    atualizadaEm: '2025-04-11T14:40:00',
  },
];
