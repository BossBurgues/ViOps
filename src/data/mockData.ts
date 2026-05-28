import { Cliente, OrdemServico, Unidade, User, Rede, OSStatus, OS_STATUS_LABELS } from './types';

// Re-export formatters from lib/utils for backward compatibility.
// All new code should import directly from '@/lib/utils'.
export { formatCurrency, formatDate, formatDatetime, TODAY_ISO } from '@/lib/utils';

export const rede: Rede = {
  id: 'r1',
  nome: 'Grupo Visual Premium',
  cnpj: '12.345.678/0001-90',
};

export const unidades: Unidade[] = [
  {
    id: 'u0', redeId: 'r1',
    nome: 'Visual Premium - Central / Fábrica',
    cidade: 'Curitiba', uf: 'PR', telefone: '(41) 3333-1000',
    ativa: true, tipo: 'central_fabrica',
  },
  { id: 'u1', redeId: 'r1', nome: 'Visual Premium - Centro',            cidade: 'Curitiba',  uf: 'PR', telefone: '(41) 3333-1001', ativa: true,  tipo: 'otica' },
  { id: 'u2', redeId: 'r1', nome: 'Visual Premium - Batel',             cidade: 'Curitiba',  uf: 'PR', telefone: '(41) 3333-1002', ativa: true,  tipo: 'otica' },
  { id: 'u3', redeId: 'r1', nome: 'Visual Premium - Shopping Barigui',  cidade: 'Curitiba',  uf: 'PR', telefone: '(41) 3333-1003', ativa: true,  tipo: 'otica' },
  { id: 'u4', redeId: 'r1', nome: 'Visual Premium - Londrina',          cidade: 'Londrina',  uf: 'PR', telefone: '(43) 3333-2001', ativa: true,  tipo: 'otica' },
  { id: 'u5', redeId: 'r1', nome: 'Visual Premium - Maringa',           cidade: 'Maringa',   uf: 'PR', telefone: '(44) 3333-3001', ativa: false, tipo: 'otica' },
];

export const usuarios: User[] = [
  { id: 'usr1', nome: 'Ricardo Almeida',   email: 'ricardo@viops.com',   role: 'admin',      unidadeId: 'u1', ativo: true },
  { id: 'usr2', nome: 'Carla Mendes',      email: 'carla@viops.com',     role: 'gestor',     unidadeId: 'u1', ativo: true },
  { id: 'usr3', nome: 'Fernando Costa',   email: 'fernando@viops.com',  role: 'vendedor',   unidadeId: 'u1', ativo: true },
  { id: 'usr4', nome: 'Juliana Ribeiro',  email: 'juliana@viops.com',   role: 'vendedor',   unidadeId: 'u2', ativo: true },
  { id: 'usr5', nome: 'Marcos Silva',     email: 'marcos@viops.com',    role: 'operador',   unidadeId: 'u0', ativo: true },
  { id: 'usr6', nome: 'Patricia Nunes',   email: 'patricia@viops.com',  role: 'financeiro', unidadeId: 'u0', ativo: true },
  { id: 'usr7', nome: 'Andre Souza',      email: 'andre@viops.com',     role: 'vendedor',   unidadeId: 'u3', ativo: true },
  { id: 'usr8', nome: 'Lucia Ferreira',   email: 'lucia@viops.com',     role: 'gestor',     unidadeId: 'u4', ativo: true },
  // Vendedor externo — vinculado à Central/Fábrica, responsável por vendas de campo
  { id: 'usr9', nome: 'Roberto Prado',    email: 'roberto.prado@viops.com', role: 'vendedor', unidadeId: 'u0', ativo: true },
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
    origemVenda: 'otica', canalOperacional: 'loja',
    dataCriacao: '2025-03-01', dataPrevisao: '2025-03-08', dataEntrega: '2025-03-07',
    valorTotal: 1850.00, observacoes: 'Lentes multifocais com antirreflexo premium',
    vendedorId: 'usr3', vendedorNome: 'Fernando Costa', prioridade: 'normal',
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
    origemVenda: 'otica', canalOperacional: 'loja',
    dataCriacao: '2025-04-02', dataPrevisao: '2025-04-10',
    valorTotal: 2340.00, observacoes: 'Oculos de sol com grau, lentes transitions',
    vendedorId: 'usr4', vendedorNome: 'Juliana Ribeiro', prioridade: 'normal',
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
    origemVenda: 'otica', canalOperacional: 'loja',
    dataCriacao: '2025-04-03', dataPrevisao: '2025-04-11',
    valorTotal: 980.00, observacoes: 'Lentes simples com blue light',
    vendedorId: 'usr3', vendedorNome: 'Fernando Costa', prioridade: 'normal',
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
    // OS4 — Venda externa executada pela Central/Fábrica
    id: 'os4', numero: 'OS-2025-0004', clienteId: 'c4', clienteNome: 'Roberto Martins',
    unidadeId: 'u0', unidadeNome: 'Visual Premium - Central / Fábrica', status: 'pendencia',
    origemVenda: 'externa', canalOperacional: 'externa',
    localAcaoExterna: 'Empresa Metron Industrial — Setor Administrativo',
    vendedorExternoNome: 'Roberto Prado',
    dataCriacao: '2025-04-05', dataPrevisao: '2025-04-14',
    valorTotal: 3200.00, observacoes: 'Aguardando confirmacao de receita atualizada — venda externa',
    vendedorId: 'usr8', vendedorNome: 'Lucia Ferreira', prioridade: 'alta',
    factoryRef: {
      lote: 'LOT-2025-04-A',
      externalId: 'FAB-04A-0031',
      calctoolRxId: 'RX-2025-04-0031',
      calctoolRxRegistradoEm: '2025-04-06T08:15:00',
      sistemaExternoNome: 'Zeiss Visustore',
      sistemaExternoId: 'ZVS-9921-A',
      baixaExternaRealizada: false,
      producaoStatus: 'aguardando',
      prioridadeFabrica: 'alta',
      dataEnvioFabrica: '2025-04-06T08:00:00',
      observacoes: 'Pendente receita — aguardar confirmação antes de cortar',
      historico: [
        { id: 'fh1', timestamp: '2025-04-06T08:00:00', tipo: 'entrada', descricao: 'OS recebida na fábrica', usuario: 'Marcos Silva' },
        { id: 'fh2', timestamp: '2025-04-06T08:15:00', tipo: 'calctool', descricao: 'Registrado no Calctool RX 2.0 — RX-2025-04-0031', usuario: 'Marcos Silva', producaoStatus: 'aguardando' },
        { id: 'fh3', timestamp: '2025-04-06T09:30:00', tipo: 'observacao', descricao: 'Receita com data vencida — produção suspensa aguardando nova receita', usuario: 'Marcos Silva' },
      ],
    },
    itens: [
      { id: 'i7', descricao: 'Armacao Prada SPR 01V', tipo: 'Armacao', quantidade: 1, valorUnitario: 1400.00 },
      { id: 'i8', descricao: 'Lentes Zeiss Individual 2', tipo: 'Lente', quantidade: 2, valorUnitario: 900.00, estoqueItemId: 'sku10' },
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
    origemVenda: 'otica', canalOperacional: 'loja',
    dataCriacao: '2025-04-09', dataPrevisao: '2025-04-17',
    valorTotal: 1560.00, observacoes: 'Cliente VIP, prioridade na producao',
    vendedorId: 'usr7', vendedorNome: 'Andre Souza', prioridade: 'urgente',
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
    origemVenda: 'otica', canalOperacional: 'loja',
    dataCriacao: '2025-04-01', dataPrevisao: '2025-04-09',
    valorTotal: 1120.00, observacoes: '',
    vendedorId: 'usr3', vendedorNome: 'Fernando Costa', prioridade: 'normal',
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
    // OS7 — Venda externa executada pela Central/Fábrica
    id: 'os7', numero: 'OS-2025-0007', clienteId: 'c7', clienteNome: 'Claudia Beatriz Ferreira',
    unidadeId: 'u0', unidadeNome: 'Visual Premium - Central / Fábrica', status: 'producao',
    origemVenda: 'externa', canalOperacional: 'externa',
    localAcaoExterna: 'Clínica Bem Estar — Campanha de Saude Ocular',
    vendedorExternoNome: 'Roberto Prado',
    dataCriacao: '2025-04-07', dataPrevisao: '2025-04-15',
    valorTotal: 4500.00, observacoes: 'Duas armacoes, lentes premium — cliente externo',
    vendedorId: 'usr4', vendedorNome: 'Juliana Ribeiro', prioridade: 'normal',
    factoryRef: {
      lote: 'LOT-2025-04-B',
      externalId: 'FAB-04B-0047',
      calctoolRxId: 'RX-2025-04-0047',
      calctoolRxRegistradoEm: '2025-04-08T07:45:00',
      sistemaExternoNome: 'Essilor Consultant',
      sistemaExternoId: 'ESS-CLN-7742',
      baixaExternaRealizada: false,
      producaoStatus: 'em_corte',
      prioridadeFabrica: 'normal',
      dataEnvioFabrica: '2025-04-08T07:30:00',
      historico: [
        { id: 'fh4', timestamp: '2025-04-08T07:30:00', tipo: 'entrada', descricao: 'OS recebida na fábrica', usuario: 'Marcos Silva' },
        { id: 'fh5', timestamp: '2025-04-08T07:45:00', tipo: 'calctool', descricao: 'Registrado no Calctool RX 2.0 — RX-2025-04-0047', usuario: 'Marcos Silva', producaoStatus: 'aguardando' },
        { id: 'fh6', timestamp: '2025-04-08T10:00:00', tipo: 'status_change', descricao: 'Iniciado processo de corte das lentes', usuario: 'Carlos Laboratorio', producaoStatus: 'em_corte' },
      ],
    },
    itens: [
      { id: 'i13', descricao: 'Armacao Tom Ford FT5401', tipo: 'Armacao', quantidade: 1, valorUnitario: 1800.00, estoqueItemId: 'sku11' },
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
    origemVenda: 'otica', canalOperacional: 'loja',
    dataCriacao: '2025-04-10', dataPrevisao: '2025-04-18',
    valorTotal: 890.00, observacoes: 'Oculos de leitura simples',
    vendedorId: 'usr3', vendedorNome: 'Fernando Costa', prioridade: 'normal',
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
  // -----------------------------------------------------------------
  // OS9 — Venda externa (Central/Fábrica) — entrada em dinheiro + saldo por boleto Sicoob
  // -----------------------------------------------------------------
  {
    id: 'os9', numero: 'OS-2025-0009', clienteId: 'c3', clienteNome: 'Ana Paula Rodrigues',
    unidadeId: 'u0', unidadeNome: 'Visual Premium - Central / Fábrica', status: 'pronta',
    origemVenda: 'externa', canalOperacional: 'externa',
    localAcaoExterna: 'Empresa Tec & Cia — Setor RH',
    vendedorExternoNome: 'Roberto Prado',
    dataCriacao: '2025-04-08', dataPrevisao: '2025-04-16',
    valorTotal: 2400.00,
    observacoes: 'Venda externa — entrada em dinheiro na visita. Saldo em boleto Sicoob a vencer em 30 dias.',
    vendedorId: 'usr4', vendedorNome: 'Juliana Ribeiro', prioridade: 'alta',
    itens: [
      { id: 'i18', descricao: 'Armação Ray-Ban RB5228', tipo: 'Armacao' as const, quantidade: 1, valorUnitario: 900.00 },
      { id: 'i19', descricao: 'Lentes Transitions Signature Gen 8', tipo: 'Lente' as const, quantidade: 2, valorUnitario: 750.00, estoqueItemId: 'sku12' },
    ],
    historico: [
      { id: 'h21', data: '2025-04-08 10:00', status: 'recebida' as const, descricao: 'OS criada via venda externa', usuario: 'Juliana Ribeiro' },
      { id: 'h22', data: '2025-04-09 08:30', status: 'producao' as const, descricao: 'Em produção', usuario: 'Marcos Silva' },
      { id: 'h23', data: '2025-04-14 15:00', status: 'pronta' as const, descricao: 'Pronta para entrega', usuario: 'Marcos Silva' },
    ],
    pagamento: {
      id: 'p9', osId: 'os9',
      formaPagamento: 'Entrada Dinheiro + Boleto Bancário',
      metodo: 'dinheiro' as const,
      valorTotal: 2400.00,
      valorEntrada: 900.00,
      metodoPagamentoComplementar: 'boleto' as const,
      metodoPagamentoComplementarLabel: 'Boleto Bancário',
      valorComplementar: 1500.00,
      observacoes: 'Entrada R$ 900,00 paga na visita. Saldo R$ 1.500,00 em boleto bancário a vencer em 30 dias da entrega.',
      parcelas: [
        {
          id: 'pc29', numero: 1, valor: 900.00, vencimento: '2025-04-08',
          status: 'paga' as const, dataPagamento: '2025-04-08', metodo: 'dinheiro' as const,
        },
        {
          id: 'pc30', numero: 2, valor: 1500.00, vencimento: '2025-05-16',
          status: 'pendente' as const, metodo: 'boleto' as const,
          boleto: {
            id: 'bol01', banco: 'Sicoob',
            nossoNumero: '0000099-1',
            agencia: '0001',
            contaCedente: '12345-6',
            nomeCedente: 'Visual Premium Otica Ltda',
            nomeSacado: 'Ana Paula Rodrigues',
            cpfCnpjSacado: '345.678.901-23',
            codigoBarras: '75691.23450 00001.234567 00000.990001 1 99920000150000',
            linhaDigitavel: '75691.23450 00001.234567 00000.990001 1 99920000150000',
            status: 'emitido' as const,
            valorNominal: 1500.00,
            vencimento: '2025-05-16',
            emitidoEm: '2025-04-14T16:00:00',
            url: '/boletos/bol01.pdf',
            instrucoes: 'Não receber após vencimento. Após vencimento cobrar multa de 2% + 0,033% ao dia.',
          },
        },
      ],
    },
  },
  // -----------------------------------------------------------------
  // OS10 — Venda em ótica (loja) — entrada Pix + saldo por link Mercado Pago
  // -----------------------------------------------------------------
  {
    id: 'os10', numero: 'OS-2025-0010', clienteId: 'c6', clienteNome: 'Paulo Henrique Dias',
    unidadeId: 'u1', unidadeNome: 'Visual Premium - Centro', status: 'recebida',
    origemVenda: 'otica', canalOperacional: 'loja',
    dataCriacao: '2025-04-11', dataPrevisao: '2025-04-19',
    valorTotal: 1750.00,
    observacoes: 'Cliente pagou entrada no Pix. Saldo enviado via link Mercado Pago. Aguardando confirmação.',
    vendedorId: 'usr3', vendedorNome: 'Fernando Costa', prioridade: 'normal',
    itens: [
      { id: 'i20', descricao: 'Armação Grazi Collection GZ3090', tipo: 'Armacao' as const, quantidade: 1, valorUnitario: 550.00 },
      { id: 'i21', descricao: 'Lentes Essilor Anti-Reflexo Crizal', tipo: 'Lente' as const, quantidade: 2, valorUnitario: 600.00 },
    ],
    historico: [
      { id: 'h24', data: '2025-04-11 14:20', status: 'recebida' as const, descricao: 'OS criada — entrada Pix confirmada', usuario: 'Fernando Costa' },
    ],
    pagamento: {
      id: 'p10', osId: 'os10',
      formaPagamento: 'Entrada Pix + Link de Pagamento',
      metodo: 'pix' as const,
      valorTotal: 1750.00,
      valorEntrada: 550.00,
      metodoPagamentoComplementar: 'link_pagamento' as const,
      metodoPagamentoComplementarLabel: 'Link de Pagamento',
      valorComplementar: 1200.00,
      observacoes: 'Entrada R$ 550,00 via Pix confirmada. Link de pagamento de R$ 1.200,00 enviado pelo WhatsApp. Aguardando pagamento.',
      parcelas: [
        {
          id: 'pc31', numero: 1, valor: 550.00, vencimento: '2025-04-11',
          status: 'paga' as const, dataPagamento: '2025-04-11', metodo: 'pix' as const,
        },
        {
          id: 'pc32', numero: 2, valor: 1200.00, vencimento: '2025-04-18',
          status: 'pendente' as const, metodo: 'link_pagamento' as const,
          paymentIntent: {
            id: 'pi01',
            provider: 'prov_stone',
            externalId: 'STN-CHR-001023',
            status: 'enviado' as const,
            url: '/simulado/link-pagamento/pi01',
            geradoEm: '2025-04-11T14:35:00',
            enviadoEm: '2025-04-11T14:40:00',
            valor: 1200.00,
            expiresAt: '2025-04-18T23:59:59',
          },
        },
      ],
    },
  },
];

// statusLabels now typed against OSStatus — compiler enforces exhaustiveness.
export const statusLabels: Record<OSStatus, string> = OS_STATUS_LABELS;

export const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  gestor: 'Gestor de Unidade',
  vendedor: 'Vendedor/Atendente',
  operador: 'Operador Central',
  financeiro: 'Financeiro',
};

// formatCurrency and formatDate are now canonical in src/lib/utils.ts
// They are re-exported above for backward compatibility.
