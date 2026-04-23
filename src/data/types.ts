export type UserRole = 'admin' | 'gestor' | 'vendedor' | 'operador' | 'financeiro';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  unidadeId: string;
  ativo: boolean;
  avatar?: string;
}

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

export type OSStatus = 'recebida' | 'producao' | 'pendencia' | 'pronta' | 'enviada' | 'entregue' | 'cancelada';

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

export interface OrdemServico {
  id: string;
  numero: string;
  clienteId: string;
  clienteNome: string;
  unidadeId: string;
  unidadeNome: string;
  status: OSStatus;
  dataCriacao: string;
  dataPrevisao: string;
  dataEntrega?: string;
  valorTotal: number;
  observacoes: string;
  vendedorId: string;
  vendedorNome: string;
  itens: ItemOS[];
  historico: HistoricoOS[];
  pagamento?: Pagamento;
}

export interface ItemOS {
  id: string;
  descricao: string;
  tipo: string;
  quantidade: number;
  valorUnitario: number;
}

export interface HistoricoOS {
  id: string;
  data: string;
  status: OSStatus;
  descricao: string;
  usuario: string;
}

export interface Pagamento {
  id: string;
  osId: string;
  formaPagamento: string;
  valorTotal: number;
  parcelas: Parcela[];
}

export interface Parcela {
  id: string;
  numero: number;
  valor: number;
  vencimento: string;
  status: 'pendente' | 'paga' | 'vencida';
  dataPagamento?: string;
}
