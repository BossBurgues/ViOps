import { Cliente, OrdemServico, Unidade, User, Rede } from './types';

export const rede: Rede = {
  id: 'r1',
  nome: 'Grupo Visual Premium',
  cnpj: '12.345.678/0001-90',
};

export const unidades: Unidade[] = [
  { id: 'u1', redeId: 'r1', nome: 'Visual Premium - Centro', cidade: 'Curitiba', uf: 'PR', telefone: '(41) 3333-1001', ativa: true },
  { id: 'u2', redeId: 'r1', nome: 'Visual Premium - Batel', cidade: 'Curitiba', uf: 'PR', telefone: '(41) 3333-1002', ativa: true },
  { id: 'u3', redeId: 'r1', nome: 'Visual Premium - Shopping Barigui', cidade: 'Curitiba', uf: 'PR', telefone: '(41) 3333-1003', ativa: true },
  { id: 'u4', redeId: 'r1', nome: 'Visual Premium - Londrina', cidade: 'Londrina', uf: 'PR', telefone: '(43) 3333-2001', ativa: true },
  { id: 'u5', redeId: 'r1', nome: 'Visual Premium - Maringa', cidade: 'Maringa', uf: 'PR', telefone: '(44) 3333-3001', ativa: false },
];

export const usuarios: User[] = [
  { id: 'usr1', nome: 'Ricardo Almeida', email: 'ricardo@viops.com', role: 'admin', unidadeId: 'u1', ativo: true },
  { id: 'usr2', nome: 'Carla Mendes', email: 'carla@viops.com', role: 'gestor', unidadeId: 'u1', ativo: true },
  { id: 'usr3', nome: 'Fernando Costa', email: 'fernando@viops.com', role: 'vendedor', unidadeId: 'u1', ativo: true },
  { id: 'usr4', nome: 'Juliana Ribeiro', email: 'juliana@viops.com', role: 'vendedor', unidadeId: 'u2', ativo: true },
  { id: 'usr5', nome: 'Marcos Silva', email: 'marcos@viops.com', role: 'operador', unidadeId: 'u1', ativo: true },
  { id: 'usr6', nome: 'Patricia Nunes', email: 'patricia@viops.com', role: 'financeiro', unidadeId: 'u1', ativo: true },
  { id: 'usr7', nome: 'Andre Souza', email: 'andre@viops.com', role: 'vendedor', unidadeId: 'u3', ativo: true },
  { id: 'usr8', nome: 'Lucia Ferreira', email: 'lucia@viops.com', role: 'gestor', unidadeId: 'u4', ativo: true },
];

export const clientes: Cliente[] = [
  { id: 'c1', nome: 'Maria Helena Souza', cpf: '123.456.789-01', telefone: '(41) 99901-1234', email: 'maria.souza@email.com', cidade: 'Curitiba', uf: 'PR', dataCadastro: '2024-08-15' },
  { id: 'c2', nome: 'Jose Carlos Pereira', cpf: '234.567.890-12', telefone: '(41) 99802-2345', email: 'jose.pereira@email.com', cidade: 'Curitiba', uf: 'PR', dataCadastro: '2024-09-02' },
  { id: 'c3', nome: 'Ana Paula Rodrigues', cpf: '345.678.901-23', telefone: '(41) 99703-3456', email: 'ana.rodrigues@email.com', cidade: 'Curitiba', uf: 'PR', dataCadastro: '2024-10-10' },
  { id: 'c4', nome: 'Roberto Martins', cpf: '456.789.012-34', telefone: '(43) 99604-4567', email: 'roberto.martins@email.com', cidade: 'Londrina', uf: 'PR', dataCadastro: '2024-11-05' },
  { id: 'c5', nome: 'Fernanda Lima Castro', cpf: '567.890.123-45', telefone: '(41) 99505-5678', email: 'fernanda.castro@email.com', cidade: 'Curitiba', uf: 'PR', dataCadastro: '2024-12-01' },
  { id: 'c6', nome: 'Paulo Henrique Dias', cpf: '678.901.234-56', telefone: '(41) 99406-6789', email: 'paulo.dias@email.com', cidade: 'Curitiba', uf: 'PR', dataCadastro: '2025-01-18' },
  { id: 'c7', nome: 'Claudia Beatriz Ferreira', cpf: '789.012.345-67', telefone: '(44) 99307-7890', email: 'claudia.ferreira@email.com', cidade: 'Maringa', uf: 'PR', dataCadastro: '2025-02-10' },
  { id: 'c8', nome: 'Sergio Luiz Oliveira', cpf: '890.123.456-78', telefone: '(41) 99208-8901', email: 'sergio.oliveira@email.com', cidade: 'Curitiba', uf: 'PR', dataCadastro: '2025-03-05' },
];

export const ordensServico: OrdemServico[] = [
  {
    id: 'os1', numero: 'OS-2025-0001', clienteId: 'c1', clienteNome: 'Maria Helena Souza',
    unidadeId: 'u1', unidadeNome: 'Visual Premium - Centro', status: 'entregue',
    dataCriacao: '2025-03-01', dataPrevisao: '2025-03-08', dataEntrega: '2025-03-07',
    valorTotal: 1850.00, observacoes: 'Lentes multifocais com antirreflexo premium',
    vendedorId: 'usr3', vendedorNome: 'Fernando Costa',
    itens: [
      { id: 'i1', descricao: 'Armacao Titanium Classic', tipo: 'Armacao', quantidade: 1, valorUnitario: 650.00 },
      { id: 'i2', descricao: 'Lentes Multifocais Varilux X', tipo: 'Lente', quantidade: 2, valorUnitario: 600.00 },
    ],
    historico: [
      { id: 'h1', data: '2025-03-01 09:30', status: 'recebida', descricao: 'OS criada na loja', usuario: 'Fernando Costa' },
      { id: 'h2', data: '2025-03-02 08:15', status: 'producao', descricao: 'Iniciada producao na central', usuario: 'Marcos Silva' },
      { id: 'h3', data: '2025-03-06 16:00', status: 'pronta', descricao: 'Producao finalizada, controle de qualidade OK', usuario: 'Marcos Silva' },
      { id: 'h4', data: '2025-03-06 17:30', status: 'enviada', descricao: 'Enviada para loja Centro', usuario: 'Marcos Silva' },
      { id: 'h5', data: '2025-03-07 10:00', status: 'entregue', descricao: 'Entregue ao cliente', usuario: 'Fernando Costa' },
    ],
    pagamento: {
      id: 'p1', osId: 'os1', formaPagamento: 'Cartao 3x', valorTotal: 1850.00,
      parcelas: [
        { id: 'pc1', numero: 1, valor: 616.67, vencimento: '2025-03-01', status: 'paga', dataPagamento: '2025-03-01' },
        { id: 'pc2', numero: 2, valor: 616.67, vencimento: '2025-04-01', status: 'paga', dataPagamento: '2025-04-01' },
        { id: 'pc3', numero: 3, valor: 616.66, vencimento: '2025-05-01', status: 'pendente' },
      ],
    },
  },
  {
    id: 'os2', numero: 'OS-2025-0002', clienteId: 'c2', clienteNome: 'Jose Carlos Pereira',
    unidadeId: 'u2', unidadeNome: 'Visual Premium - Batel', status: 'producao',
    dataCriacao: '2025-04-02', dataPrevisao: '2025-04-10',
    valorTotal: 2340.00, observacoes: 'Oculos de sol com grau, lentes transitions',
    vendedorId: 'usr4', vendedorNome: 'Juliana Ribeiro',
    itens: [
      { id: 'i3', descricao: 'Armacao Ray-Ban Aviator', tipo: 'Armacao', quantidade: 1, valorUnitario: 890.00 },
      { id: 'i4', descricao: 'Lentes Transitions Gen 8', tipo: 'Lente', quantidade: 2, valorUnitario: 725.00 },
    ],
    historico: [
      { id: 'h6', data: '2025-04-02 14:20', status: 'recebida', descricao: 'OS criada na loja Batel', usuario: 'Juliana Ribeiro' },
      { id: 'h7', data: '2025-04-03 08:00', status: 'producao', descricao: 'Iniciada producao', usuario: 'Marcos Silva' },
    ],
    pagamento: {
      id: 'p2', osId: 'os2', formaPagamento: 'Boleto 4x', valorTotal: 2340.00,
      parcelas: [
        { id: 'pc4', numero: 1, valor: 585.00, vencimento: '2025-04-10', status: 'pendente' },
        { id: 'pc5', numero: 2, valor: 585.00, vencimento: '2025-05-10', status: 'pendente' },
        { id: 'pc6', numero: 3, valor: 585.00, vencimento: '2025-06-10', status: 'pendente' },
        { id: 'pc7', numero: 4, valor: 585.00, vencimento: '2025-07-10', status: 'pendente' },
      ],
    },
  },
  {
    id: 'os3', numero: 'OS-2025-0003', clienteId: 'c3', clienteNome: 'Ana Paula Rodrigues',
    unidadeId: 'u1', unidadeNome: 'Visual Premium - Centro', status: 'pronta',
    dataCriacao: '2025-04-03', dataPrevisao: '2025-04-11',
    valorTotal: 980.00, observacoes: 'Lentes simples com blue light',
    vendedorId: 'usr3', vendedorNome: 'Fernando Costa',
    itens: [
      { id: 'i5', descricao: 'Armacao Acetato Feminina', tipo: 'Armacao', quantidade: 1, valorUnitario: 380.00 },
      { id: 'i6', descricao: 'Lentes Blue Light Filter', tipo: 'Lente', quantidade: 2, valorUnitario: 300.00 },
    ],
    historico: [
      { id: 'h8', data: '2025-04-03 10:00', status: 'recebida', descricao: 'OS criada', usuario: 'Fernando Costa' },
      { id: 'h9', data: '2025-04-04 08:30', status: 'producao', descricao: 'Em producao', usuario: 'Marcos Silva' },
      { id: 'h10', data: '2025-04-08 15:00', status: 'pronta', descricao: 'Pronta para envio', usuario: 'Marcos Silva' },
    ],
    pagamento: {
      id: 'p3', osId: 'os3', formaPagamento: 'PIX', valorTotal: 980.00,
      parcelas: [
        { id: 'pc8', numero: 1, valor: 980.00, vencimento: '2025-04-03', status: 'paga', dataPagamento: '2025-04-03' },
      ],
    },
  },
  {
    id: 'os4', numero: 'OS-2025-0004', clienteId: 'c4', clienteNome: 'Roberto Martins',
    unidadeId: 'u4', unidadeNome: 'Visual Premium - Londrina', status: 'pendencia',
    dataCriacao: '2025-04-05', dataPrevisao: '2025-04-14',
    valorTotal: 3200.00, observacoes: 'Aguardando confirmacao de receita atualizada',
    vendedorId: 'usr8', vendedorNome: 'Lucia Ferreira',
    itens: [
      { id: 'i7', descricao: 'Armacao Prada SPR 01V', tipo: 'Armacao', quantidade: 1, valorUnitario: 1400.00 },
      { id: 'i8', descricao: 'Lentes Zeiss Individual 2', tipo: 'Lente', quantidade: 2, valorUnitario: 900.00 },
    ],
    historico: [
      { id: 'h11', data: '2025-04-05 11:00', status: 'recebida', descricao: 'OS criada', usuario: 'Lucia Ferreira' },
      { id: 'h12', data: '2025-04-06 09:00', status: 'pendencia', descricao: 'Receita com data vencida, aguardando nova', usuario: 'Marcos Silva' },
    ],
    pagamento: {
      id: 'p4', osId: 'os4', formaPagamento: 'Cartao 6x', valorTotal: 3200.00,
      parcelas: [
        { id: 'pc9', numero: 1, valor: 533.33, vencimento: '2025-04-14', status: 'pendente' },
        { id: 'pc10', numero: 2, valor: 533.33, vencimento: '2025-05-14', status: 'pendente' },
        { id: 'pc11', numero: 3, valor: 533.33, vencimento: '2025-06-14', status: 'pendente' },
        { id: 'pc12', numero: 4, valor: 533.33, vencimento: '2025-07-14', status: 'pendente' },
        { id: 'pc13', numero: 5, valor: 533.34, vencimento: '2025-08-14', status: 'pendente' },
        { id: 'pc14', numero: 6, valor: 533.34, vencimento: '2025-09-14', status: 'pendente' },
      ],
    },
  },
  {
    id: 'os5', numero: 'OS-2025-0005', clienteId: 'c5', clienteNome: 'Fernanda Lima Castro',
    unidadeId: 'u3', unidadeNome: 'Visual Premium - Shopping Barigui', status: 'recebida',
    dataCriacao: '2025-04-09', dataPrevisao: '2025-04-17',
    valorTotal: 1560.00, observacoes: 'Cliente VIP, prioridade na producao',
    vendedorId: 'usr7', vendedorNome: 'Andre Souza',
    itens: [
      { id: 'i9', descricao: 'Armacao Gucci GG0034O', tipo: 'Armacao', quantidade: 1, valorUnitario: 760.00 },
      { id: 'i10', descricao: 'Lentes Antirreflexo Crizal', tipo: 'Lente', quantidade: 2, valorUnitario: 400.00 },
    ],
    historico: [
      { id: 'h13', data: '2025-04-09 16:30', status: 'recebida', descricao: 'OS criada na loja Shopping Barigui', usuario: 'Andre Souza' },
    ],
    pagamento: {
      id: 'p5', osId: 'os5', formaPagamento: 'Cartao 2x', valorTotal: 1560.00,
      parcelas: [
        { id: 'pc15', numero: 1, valor: 780.00, vencimento: '2025-04-17', status: 'pendente' },
        { id: 'pc16', numero: 2, valor: 780.00, vencimento: '2025-05-17', status: 'pendente' },
      ],
    },
  },
  {
    id: 'os6', numero: 'OS-2025-0006', clienteId: 'c6', clienteNome: 'Paulo Henrique Dias',
    unidadeId: 'u1', unidadeNome: 'Visual Premium - Centro', status: 'enviada',
    dataCriacao: '2025-04-01', dataPrevisao: '2025-04-09',
    valorTotal: 1120.00, observacoes: '',
    vendedorId: 'usr3', vendedorNome: 'Fernando Costa',
    itens: [
      { id: 'i11', descricao: 'Armacao Metal Classica', tipo: 'Armacao', quantidade: 1, valorUnitario: 320.00 },
      { id: 'i12', descricao: 'Lentes Progressivas Hoya', tipo: 'Lente', quantidade: 2, valorUnitario: 400.00 },
    ],
    historico: [
      { id: 'h14', data: '2025-04-01 09:00', status: 'recebida', descricao: 'OS criada', usuario: 'Fernando Costa' },
      { id: 'h15', data: '2025-04-02 08:00', status: 'producao', descricao: 'Em producao', usuario: 'Marcos Silva' },
      { id: 'h16', data: '2025-04-07 14:00', status: 'pronta', descricao: 'Pronta', usuario: 'Marcos Silva' },
      { id: 'h17', data: '2025-04-08 09:00', status: 'enviada', descricao: 'Enviada para loja', usuario: 'Marcos Silva' },
    ],
    pagamento: {
      id: 'p6', osId: 'os6', formaPagamento: 'Dinheiro', valorTotal: 1120.00,
      parcelas: [
        { id: 'pc17', numero: 1, valor: 1120.00, vencimento: '2025-04-01', status: 'paga', dataPagamento: '2025-04-01' },
      ],
    },
  },
  {
    id: 'os7', numero: 'OS-2025-0007', clienteId: 'c7', clienteNome: 'Claudia Beatriz Ferreira',
    unidadeId: 'u2', unidadeNome: 'Visual Premium - Batel', status: 'producao',
    dataCriacao: '2025-04-07', dataPrevisao: '2025-04-15',
    valorTotal: 4500.00, observacoes: 'Duas armacoes, lentes premium',
    vendedorId: 'usr4', vendedorNome: 'Juliana Ribeiro',
    itens: [
      { id: 'i13', descricao: 'Armacao Tom Ford FT5401', tipo: 'Armacao', quantidade: 1, valorUnitario: 1800.00 },
      { id: 'i14', descricao: 'Armacao Dior Montaigne', tipo: 'Armacao', quantidade: 1, valorUnitario: 1200.00 },
      { id: 'i15', descricao: 'Lentes Essilor Varilux Comfort', tipo: 'Lente', quantidade: 4, valorUnitario: 375.00 },
    ],
    historico: [
      { id: 'h18', data: '2025-04-07 15:00', status: 'recebida', descricao: 'OS criada', usuario: 'Juliana Ribeiro' },
      { id: 'h19', data: '2025-04-08 08:30', status: 'producao', descricao: 'Iniciada producao', usuario: 'Marcos Silva' },
    ],
    pagamento: {
      id: 'p7', osId: 'os7', formaPagamento: 'Cartao 10x', valorTotal: 4500.00,
      parcelas: Array.from({ length: 10 }, (_, i) => ({
        id: `pc${18 + i}`, numero: i + 1, valor: 450.00,
        vencimento: `2025-0${Math.floor((4 + i) / 10) === 0 ? '' : ''}${4 + i > 12 ? (4 + i - 12) : (4 + i) }-15`.replace(/(\d+)-/, (_, m) => {
          const month = parseInt(m);
          return month > 12 ? `${String(month - 12).padStart(2, '0')}-` : `${String(month).padStart(2, '0')}-`;
        }),
        status: 'pendente' as const,
      })),
    },
  },
  {
    id: 'os8', numero: 'OS-2025-0008', clienteId: 'c8', clienteNome: 'Sergio Luiz Oliveira',
    unidadeId: 'u1', unidadeNome: 'Visual Premium - Centro', status: 'recebida',
    dataCriacao: '2025-04-10', dataPrevisao: '2025-04-18',
    valorTotal: 890.00, observacoes: 'Oculos de leitura simples',
    vendedorId: 'usr3', vendedorNome: 'Fernando Costa',
    itens: [
      { id: 'i16', descricao: 'Armacao Leve Flexivel', tipo: 'Armacao', quantidade: 1, valorUnitario: 290.00 },
      { id: 'i17', descricao: 'Lentes Visao Simples', tipo: 'Lente', quantidade: 2, valorUnitario: 300.00 },
    ],
    historico: [
      { id: 'h20', data: '2025-04-10 08:45', status: 'recebida', descricao: 'OS criada hoje', usuario: 'Fernando Costa' },
    ],
    pagamento: {
      id: 'p8', osId: 'os8', formaPagamento: 'PIX', valorTotal: 890.00,
      parcelas: [
        { id: 'pc28', numero: 1, valor: 890.00, vencimento: '2025-04-10', status: 'paga', dataPagamento: '2025-04-10' },
      ],
    },
  },
];

export const statusLabels: Record<string, string> = {
  recebida: 'Recebida',
  producao: 'Em Producao',
  pendencia: 'Pendencia',
  pronta: 'Pronta',
  enviada: 'Enviada',
  entregue: 'Entregue',
  cancelada: 'Cancelada',
};

export const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  gestor: 'Gestor de Unidade',
  vendedor: 'Vendedor/Atendente',
  operador: 'Operador Central',
  financeiro: 'Financeiro',
};

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(date: string): string {
  if (!date) return '-';
  const d = new Date(date + (date.includes('T') || date.includes(' ') ? '' : 'T00:00:00'));
  return d.toLocaleDateString('pt-BR');
}
