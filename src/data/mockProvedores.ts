// =============================================================================
// ViOps — Mock: Provedores Financeiros
// =============================================================================
// Dados de demonstração. Sem credenciais, sem integração real.
// IDs seguem padrão prov_<slug> para consistência com Cobranca.providerId.
// =============================================================================

import { ProvedorFinanceiro } from './financeiroTypes';

export const provedoresFinanceiros: ProvedorFinanceiro[] = [
  {
    id: 'prov_sicoob',
    nome: 'Sicoob',
    tipo: 'banco',
    ativo: true,
    suportaBoleto: true,
    suportaPix: true,
    suportaCartao: false,
    suportaLinkPagamento: false,
    suportaQrCode: false,
    observacoes: 'Banco cooperativo — boleto e Pix via API bancária.',
  },
  {
    id: 'prov_itau',
    nome: 'Itaú',
    tipo: 'banco',
    ativo: true,
    suportaBoleto: true,
    suportaPix: true,
    suportaCartao: false,
    suportaLinkPagamento: false,
    suportaQrCode: false,
  },
  {
    id: 'prov_bb',
    nome: 'Banco do Brasil',
    tipo: 'banco',
    ativo: true,
    suportaBoleto: true,
    suportaPix: true,
    suportaCartao: false,
    suportaLinkPagamento: false,
    suportaQrCode: false,
  },
  {
    id: 'prov_stone',
    nome: 'Stone',
    tipo: 'gateway',
    ativo: true,
    suportaBoleto: false,
    suportaPix: true,
    suportaCartao: true,
    suportaLinkPagamento: true,
    suportaQrCode: true,
    observacoes: 'Gateway de pagamento — link de cobrança, QR code e cartão.',
  },
  {
    id: 'prov_cielo',
    nome: 'Cielo',
    tipo: 'adquirente',
    ativo: true,
    suportaBoleto: false,
    suportaPix: true,
    suportaCartao: true,
    suportaLinkPagamento: false,
    suportaQrCode: true,
  },
  {
    id: 'prov_manual',
    nome: 'Manual',
    tipo: 'manual',
    ativo: true,
    suportaBoleto: true,
    suportaPix: true,
    suportaCartao: true,
    suportaLinkPagamento: false,
    suportaQrCode: false,
    observacoes: 'Registro manual — sem integração externa. Qualquer meio de pagamento.',
  },
  {
    id: 'prov_outro',
    nome: 'Outro Provedor',
    tipo: 'outro',
    ativo: true,
    suportaBoleto: true,
    suportaPix: true,
    suportaCartao: true,
    suportaLinkPagamento: true,
    suportaQrCode: true,
  },
];

/** Lookup por ID — helper para UI. */
export function getProvedorById(id: string): ProvedorFinanceiro | undefined {
  return provedoresFinanceiros.find(p => p.id === id);
}
