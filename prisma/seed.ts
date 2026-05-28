import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const d = (value: string) => new Date(value);

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.inventoryCountItem.deleteMany();
  await prisma.inventoryCount.deleteMany();
  await prisma.stockTransferItem.deleteMany();
  await prisma.stockTransfer.deleteMany();
  await prisma.stockReservation.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.installment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.charge.deleteMany();
  await prisma.serviceOrderHistory.deleteMany();
  await prisma.factoryRef.deleteMany();
  await prisma.externalActionData.deleteMany();
  await prisma.serviceOrderDocument.deleteMany();
  await prisma.serviceOrderItem.deleteMany();
  await prisma.serviceOrder.deleteMany();
  await prisma.stockItem.deleteMany();
  await prisma.financialProvider.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.tenant.deleteMany();

  const tenant = await prisma.tenant.create({
    data: {
      name: 'Grupo Visual Premium',
      legalName: 'Visual Premium Otica Ltda',
      document: '12.345.678/0001-90',
      stockEnabled: true,
    },
  });

  const central = await prisma.unit.create({
    data: {
      tenantId: tenant.id,
      name: 'Visual Premium - Central / Fabrica',
      type: 'CENTRAL_FABRICA',
      city: 'Curitiba',
      state: 'PR',
      phone: '(41) 3333-1000',
    },
  });

  const centro = await prisma.unit.create({
    data: { tenantId: tenant.id, name: 'Visual Premium - Centro', type: 'OTICA', city: 'Curitiba', state: 'PR', phone: '(41) 3333-1001' },
  });
  const batel = await prisma.unit.create({
    data: { tenantId: tenant.id, name: 'Visual Premium - Batel', type: 'OTICA', city: 'Curitiba', state: 'PR', phone: '(41) 3333-1002' },
  });
  const barigui = await prisma.unit.create({
    data: { tenantId: tenant.id, name: 'Visual Premium - Shopping Barigui', type: 'OTICA', city: 'Curitiba', state: 'PR', phone: '(41) 3333-1003' },
  });
  const londrina = await prisma.unit.create({
    data: { tenantId: tenant.id, name: 'Visual Premium - Londrina', type: 'OTICA', city: 'Londrina', state: 'PR', phone: '(43) 3333-2001' },
  });
  const maringa = await prisma.unit.create({
    data: { tenantId: tenant.id, name: 'Visual Premium - Maringa', type: 'OTICA', city: 'Maringa', state: 'PR', phone: '(44) 3333-3001', active: false },
  });

  const admin = await prisma.user.create({
    data: { tenantId: tenant.id, unitId: centro.id, name: 'Ricardo Almeida', email: 'ricardo@viops.com', role: 'ADMIN' },
  });
  const gestor = await prisma.user.create({
    data: { tenantId: tenant.id, unitId: centro.id, name: 'Carla Mendes', email: 'carla@viops.com', role: 'GESTOR' },
  });
  const vendedor = await prisma.user.create({
    data: { tenantId: tenant.id, unitId: centro.id, name: 'Fernando Costa', email: 'fernando@viops.com', role: 'VENDEDOR' },
  });
  const operador = await prisma.user.create({
    data: { tenantId: tenant.id, unitId: central.id, name: 'Marcos Silva', email: 'marcos@viops.com', role: 'OPERADOR' },
  });
  const financeiro = await prisma.user.create({
    data: { tenantId: tenant.id, unitId: central.id, name: 'Patricia Nunes', email: 'patricia@viops.com', role: 'FINANCEIRO' },
  });
  const vendedorExterno = await prisma.user.create({
    data: { tenantId: tenant.id, unitId: central.id, name: 'Roberto Prado', email: 'roberto.prado@viops.com', role: 'VENDEDOR' },
  });

  const maria = await prisma.client.create({
    data: { tenantId: tenant.id, name: 'Maria Helena Souza', document: '123.456.789-01', phone: '(41) 99901-1234', email: 'maria.souza@email.com', city: 'Curitiba', state: 'PR' },
  });
  const roberto = await prisma.client.create({
    data: { tenantId: tenant.id, name: 'Roberto Martins', document: '456.789.012-34', phone: '(43) 99604-4567', email: 'roberto.martins@email.com', city: 'Londrina', state: 'PR' },
  });
  const claudia = await prisma.client.create({
    data: { tenantId: tenant.id, name: 'Claudia Beatriz Ferreira', document: '789.012.345-67', phone: '(44) 99307-7890', email: 'claudia.ferreira@email.com', city: 'Maringa', state: 'PR' },
  });
  const ana = await prisma.client.create({
    data: { tenantId: tenant.id, name: 'Ana Paula Rodrigues', document: '345.678.901-23', phone: '(41) 99703-3456', email: 'ana.rodrigues@email.com', city: 'Curitiba', state: 'PR' },
  });

  const providers = await Promise.all([
    prisma.financialProvider.create({ data: { tenantId: tenant.id, name: 'Sicoob', type: 'BANK' } }),
    prisma.financialProvider.create({ data: { tenantId: tenant.id, name: 'Itau', type: 'BANK' } }),
    prisma.financialProvider.create({ data: { tenantId: tenant.id, name: 'Banco do Brasil', type: 'BANK' } }),
    prisma.financialProvider.create({ data: { tenantId: tenant.id, name: 'Stone', type: 'ACQUIRER' } }),
    prisma.financialProvider.create({ data: { tenantId: tenant.id, name: 'Cielo', type: 'ACQUIRER' } }),
    prisma.financialProvider.create({ data: { tenantId: tenant.id, name: 'Manual', type: 'MANUAL' } }),
    prisma.financialProvider.create({ data: { tenantId: tenant.id, name: 'Outro', type: 'OTHER' } }),
  ]);
  const providerByName = Object.fromEntries(providers.map(provider => [provider.name, provider]));

  const sku01 = await prisma.stockItem.create({
    data: {
      tenantId: tenant.id,
      unitId: centro.id,
      name: 'Armacao Ray-Ban RB5228',
      category: 'ARMACAO',
      brand: 'Ray-Ban',
      reference: 'RB5228-BLK',
      currentQty: '3',
      minimumQty: '5',
      costPrice: '420.00',
      salePrice: '900.00',
    },
  });
  const sku03 = await prisma.stockItem.create({
    data: {
      tenantId: tenant.id,
      unitId: centro.id,
      name: 'Lente Essilor Varilux Comfort',
      category: 'LENTE',
      brand: 'Essilor',
      reference: 'VARILUX-CMF',
      currentQty: '12',
      minimumQty: '8',
      costPrice: '190.00',
      salePrice: '375.00',
    },
  });
  const sku04 = await prisma.stockItem.create({
    data: {
      tenantId: tenant.id,
      unitId: centro.id,
      name: 'Lente Zeiss Individual 2',
      category: 'LENTE',
      brand: 'Zeiss',
      reference: 'ZEISS-IND2',
      currentQty: '0',
      minimumQty: '4',
      costPrice: '440.00',
      salePrice: '900.00',
    },
  });
  await prisma.stockItem.create({
    data: {
      tenantId: tenant.id,
      unitId: batel.id,
      name: 'Armacao Tom Ford FT5401',
      category: 'ARMACAO',
      brand: 'Tom Ford',
      reference: 'TF5401-BRN',
      currentQty: '2',
      minimumQty: '3',
      costPrice: '890.00',
      salePrice: '1800.00',
    },
  });
  const sku10 = await prisma.stockItem.create({
    data: {
      tenantId: tenant.id,
      unitId: central.id,
      name: 'Lente Zeiss Individual 2 (Central)',
      category: 'LENTE',
      brand: 'Zeiss',
      reference: 'ZEISS-IND2-CTR',
      currentQty: '6',
      minimumQty: '4',
      costPrice: '440.00',
      salePrice: '900.00',
    },
  });
  const sku11 = await prisma.stockItem.create({
    data: {
      tenantId: tenant.id,
      unitId: central.id,
      name: 'Armacao Tom Ford FT5401 (Central)',
      category: 'ARMACAO',
      brand: 'Tom Ford',
      reference: 'TF5401-CTR',
      currentQty: '4',
      minimumQty: '2',
      costPrice: '890.00',
      salePrice: '1800.00',
    },
  });
  const sku12 = await prisma.stockItem.create({
    data: {
      tenantId: tenant.id,
      unitId: central.id,
      name: 'Lente Transitions Signature Gen 8 (Central)',
      category: 'LENTE',
      brand: 'Transitions',
      reference: 'TRANS-G8-CTR',
      currentQty: '8',
      minimumQty: '3',
      costPrice: '370.00',
      salePrice: '750.00',
    },
  });

  const osLoja = await prisma.serviceOrder.create({
    data: {
      tenantId: tenant.id,
      clientId: maria.id,
      unitId: centro.id,
      number: 'OS-2025-0001',
      status: 'ENTREGUE',
      saleOrigin: 'OTICA',
      operationalChannel: 'LOJA',
      sellerId: vendedor.id,
      sellerName: vendedor.name,
      totalAmount: '1850.00',
      notes: 'Lentes multifocais com antirreflexo premium',
      createdAt: d('2025-03-01T09:30:00'),
      expectedAt: d('2025-03-08T00:00:00'),
      deliveredAt: d('2025-03-07T10:00:00'),
      items: {
        create: [
          { description: 'Armacao Ray-Ban RB5228', type: 'Armacao', quantity: 1, unitPrice: '900.00', stockItemId: sku01.id },
          { description: 'Lentes Essilor Varilux Comfort', type: 'Lente', quantity: 2, unitPrice: '375.00', stockItemId: sku03.id },
        ],
      },
      documents: {
        create: [
          { name: 'receita-maria-helena.pdf', mimeType: 'application/pdf', sizeBytes: 245000, category: 'RECEITA', uploadedByName: vendedor.name },
        ],
      },
      histories: {
        create: [
          { status: 'RECEBIDA', description: 'OS criada na loja', userName: vendedor.name, userId: vendedor.id, createdAt: d('2025-03-01T09:30:00') },
          { status: 'ENTREGUE', description: 'Entregue ao cliente', userName: vendedor.name, userId: vendedor.id, createdAt: d('2025-03-07T10:00:00') },
        ],
      },
    },
    include: { items: true },
  });

  const osExternaPendente = await prisma.serviceOrder.create({
    data: {
      tenantId: tenant.id,
      clientId: roberto.id,
      unitId: central.id,
      number: 'OS-2025-0004',
      status: 'PENDENCIA',
      saleOrigin: 'EXTERNA',
      operationalChannel: 'EXTERNA',
      sellerId: vendedorExterno.id,
      sellerName: vendedorExterno.name,
      externalSellerName: vendedorExterno.name,
      totalAmount: '3200.00',
      notes: 'Aguardando confirmacao de receita atualizada - venda externa',
      priority: 'alta',
      createdAt: d('2025-04-05T11:00:00'),
      expectedAt: d('2025-04-14T00:00:00'),
      externalActionData: {
        create: {
          locationName: 'Empresa Metron Industrial',
          district: 'Setor Administrativo',
          city: 'Londrina',
          state: 'PR',
          externalSellerTeam: 'Equipe Externa Central',
          actionDate: d('2025-04-05T00:00:00'),
        },
      },
      factoryRef: {
        create: {
          batch: 'LOT-2025-04-A',
          externalId: 'FAB-04A-0031',
          calctoolRxId: 'RX-2025-04-0031',
          calctoolRxRegisteredAt: d('2025-04-06T08:15:00'),
          externalSystemName: 'Zeiss Visustore',
          externalSystemId: 'ZVS-9921-A',
          productionStatus: 'aguardando',
          factoryPriority: 'alta',
          sentToFactoryAt: d('2025-04-06T08:00:00'),
          notes: 'Pendente receita - aguardar confirmacao antes de cortar',
        },
      },
      items: {
        create: [
          { description: 'Armacao Prada SPR 01V', type: 'Armacao', quantity: 1, unitPrice: '1400.00' },
          { description: 'Lentes Zeiss Individual 2', type: 'Lente', quantity: 2, unitPrice: '900.00', stockItemId: sku10.id },
        ],
      },
      histories: {
        create: [
          { status: 'RECEBIDA', description: 'OS criada via venda externa', userName: vendedorExterno.name, userId: vendedorExterno.id, createdAt: d('2025-04-05T11:00:00') },
          { status: 'PENDENCIA', description: 'Receita com data vencida, aguardando nova', userName: operador.name, userId: operador.id, createdAt: d('2025-04-06T09:00:00') },
        ],
      },
    },
    include: { items: true },
  });

  const osExternaProducao = await prisma.serviceOrder.create({
    data: {
      tenantId: tenant.id,
      clientId: claudia.id,
      unitId: central.id,
      number: 'OS-2025-0007',
      status: 'PRODUCAO',
      saleOrigin: 'EXTERNA',
      operationalChannel: 'EXTERNA',
      sellerId: vendedorExterno.id,
      sellerName: vendedorExterno.name,
      externalSellerName: vendedorExterno.name,
      totalAmount: '4500.00',
      notes: 'Duas armacoes, lentes premium - cliente externo',
      createdAt: d('2025-04-07T15:00:00'),
      expectedAt: d('2025-04-15T00:00:00'),
      externalActionData: {
        create: {
          locationName: 'Clinica Bem Estar',
          city: 'Maringa',
          state: 'PR',
          externalSellerTeam: 'Equipe Externa Central',
          actionDate: d('2025-04-07T00:00:00'),
        },
      },
      factoryRef: {
        create: {
          batch: 'LOT-2025-04-B',
          externalId: 'FAB-04B-0047',
          calctoolRxId: 'RX-2025-04-0047',
          calctoolRxRegisteredAt: d('2025-04-08T07:45:00'),
          externalSystemName: 'Essilor Consultant',
          externalSystemId: 'ESS-CLN-7742',
          productionStatus: 'em_corte',
          sentToFactoryAt: d('2025-04-08T07:30:00'),
        },
      },
      items: {
        create: [
          { description: 'Armacao Tom Ford FT5401', type: 'Armacao', quantity: 1, unitPrice: '1800.00', stockItemId: sku11.id },
          { description: 'Lentes Essilor Varilux Comfort', type: 'Lente', quantity: 4, unitPrice: '375.00' },
        ],
      },
    },
    include: { items: true },
  });

  const osExternaPronta = await prisma.serviceOrder.create({
    data: {
      tenantId: tenant.id,
      clientId: ana.id,
      unitId: central.id,
      number: 'OS-2025-0009',
      status: 'PRONTA',
      saleOrigin: 'EXTERNA',
      operationalChannel: 'EXTERNA',
      sellerId: vendedorExterno.id,
      sellerName: vendedorExterno.name,
      externalSellerName: vendedorExterno.name,
      totalAmount: '2400.00',
      notes: 'Venda externa - entrada em dinheiro na visita. Saldo em boleto a vencer.',
      createdAt: d('2025-04-08T10:00:00'),
      expectedAt: d('2025-04-16T00:00:00'),
      externalActionData: {
        create: {
          locationName: 'Empresa Tec & Cia',
          district: 'Setor RH',
          city: 'Curitiba',
          state: 'PR',
          externalSellerTeam: 'Equipe Externa Central',
          actionDate: d('2025-04-08T00:00:00'),
        },
      },
      items: {
        create: [
          { description: 'Armacao Ray-Ban RB5228', type: 'Armacao', quantity: 1, unitPrice: '900.00' },
          { description: 'Lentes Transitions Signature Gen 8', type: 'Lente', quantity: 2, unitPrice: '750.00', stockItemId: sku12.id },
        ],
      },
    },
    include: { items: true },
  });

  const osLojaLens = osLoja.items.find(item => item.stockItemId === sku03.id);
  const osExtLens = osExternaPendente.items.find(item => item.stockItemId === sku10.id);
  const osExtFrame = osExternaProducao.items.find(item => item.stockItemId === sku11.id);
  const osExtTransitions = osExternaPronta.items.find(item => item.stockItemId === sku12.id);

  await prisma.stockMovement.createMany({
    data: [
      { tenantId: tenant.id, unitId: centro.id, stockItemId: sku01.id, type: 'ENTRADA', quantity: '5', userId: admin.id, note: 'Reposicao mensal - NF 4521', occurredAt: d('2025-04-01T10:00:00') },
      { tenantId: tenant.id, unitId: centro.id, stockItemId: sku03.id, type: 'ENTRADA', quantity: '20', userId: admin.id, note: 'Pedido trimestral Essilor', occurredAt: d('2025-04-01T10:15:00') },
      { tenantId: tenant.id, unitId: centro.id, stockItemId: sku03.id, serviceOrderId: osLoja.id, serviceOrderItemId: osLojaLens?.id, type: 'BAIXA_OS', quantity: '2', userId: vendedor.id, note: 'Baixa OS loja - Centro', occurredAt: d('2025-03-01T11:00:00') },
      { tenantId: tenant.id, unitId: central.id, stockItemId: sku10.id, type: 'ENTRADA', quantity: '10', userId: operador.id, note: 'Estoque inicial Central - Zeiss', occurredAt: d('2025-03-15T09:00:00') },
      { tenantId: tenant.id, unitId: central.id, stockItemId: sku11.id, type: 'ENTRADA', quantity: '6', userId: operador.id, note: 'Estoque inicial Central - Tom Ford', occurredAt: d('2025-03-15T09:15:00') },
      { tenantId: tenant.id, unitId: central.id, stockItemId: sku12.id, type: 'ENTRADA', quantity: '10', userId: operador.id, note: 'Estoque inicial Central - Transitions', occurredAt: d('2025-03-15T09:30:00') },
      { tenantId: tenant.id, unitId: central.id, stockItemId: sku10.id, serviceOrderId: osExternaPendente.id, serviceOrderItemId: osExtLens?.id, type: 'BAIXA_OS', quantity: '2', userId: operador.id, note: 'Baixa OS externa - estoque Central/Fabrica', occurredAt: d('2025-04-06T09:00:00') },
      { tenantId: tenant.id, unitId: central.id, stockItemId: sku11.id, serviceOrderId: osExternaProducao.id, serviceOrderItemId: osExtFrame?.id, type: 'BAIXA_OS', quantity: '1', userId: operador.id, note: 'Baixa OS externa - Tom Ford Central', occurredAt: d('2025-04-07T15:00:00') },
      { tenantId: tenant.id, unitId: central.id, stockItemId: sku12.id, serviceOrderId: osExternaPronta.id, serviceOrderItemId: osExtTransitions?.id, type: 'BAIXA_OS', quantity: '2', userId: operador.id, note: 'Baixa OS externa - Transitions Central', occurredAt: d('2025-04-09T08:30:00') },
      { tenantId: tenant.id, unitId: centro.id, stockItemId: sku04.id, type: 'AJUSTE_POSITIVO', quantity: '3', userId: gestor.id, note: 'Ajuste apos contagem fisica', occurredAt: d('2025-04-05T16:00:00') },
    ],
  });

  if (osExtTransitions) {
    await prisma.stockReservation.create({
      data: {
        tenantId: tenant.id,
        unitId: central.id,
        stockItemId: sku12.id,
        serviceOrderId: osExternaPronta.id,
        serviceOrderItemId: osExtTransitions.id,
        quantity: '2',
        status: 'CONSUMED',
        reservedAt: d('2025-04-08T10:10:00'),
        consumedAt: d('2025-04-09T08:30:00'),
      },
    });
  }

  const boletoCharge = await prisma.charge.create({
    data: {
      tenantId: tenant.id,
      serviceOrderId: osExternaPronta.id,
      clientId: ana.id,
      providerId: providerByName.Sicoob.id,
      type: 'BOLETO',
      status: 'SENT',
      amount: '1500.00',
      dueDate: d('2025-05-16T00:00:00'),
      reference: 'BOL-OS-2025-0009',
    },
  });
  await prisma.charge.createMany({
    data: [
      { tenantId: tenant.id, serviceOrderId: osLoja.id, clientId: maria.id, providerId: providerByName.Cielo.id, type: 'CARTAO_CREDITO', status: 'PAID', amount: '1850.00', reference: 'CARD-OS-2025-0001' },
      { tenantId: tenant.id, serviceOrderId: osExternaPendente.id, clientId: roberto.id, providerId: providerByName.Stone.id, type: 'PIX', status: 'PENDING', amount: '3200.00', reference: 'PIX-OS-2025-0004' },
      { tenantId: tenant.id, serviceOrderId: osExternaProducao.id, clientId: claudia.id, providerId: providerByName.Manual.id, type: 'DINHEIRO', status: 'PAID', amount: '450.00', reference: 'CASH-OS-2025-0007' },
      { tenantId: tenant.id, serviceOrderId: osExternaProducao.id, clientId: claudia.id, providerId: providerByName.Stone.id, type: 'LINK_PAGAMENTO', status: 'SENT', amount: '4050.00', reference: 'LINK-OS-2025-0007' },
    ],
  });

  const payment = await prisma.payment.create({
    data: {
      serviceOrderId: osExternaPronta.id,
      chargeId: boletoCharge.id,
      method: 'DINHEIRO',
      amount: '900.00',
      paidAt: d('2025-04-08T10:00:00'),
      reference: 'Entrada em dinheiro',
    },
  });
  await prisma.installment.createMany({
    data: [
      { serviceOrderId: osExternaPronta.id, paymentId: payment.id, number: 1, amount: '900.00', dueDate: d('2025-04-08T00:00:00'), status: 'PAGA', method: 'DINHEIRO', paidAt: d('2025-04-08T10:00:00') },
      { serviceOrderId: osExternaPronta.id, number: 2, amount: '1500.00', dueDate: d('2025-05-16T00:00:00'), status: 'PENDENTE', method: 'BOLETO' },
      { serviceOrderId: osLoja.id, number: 1, amount: '616.67', dueDate: d('2025-03-01T00:00:00'), status: 'PAGA', method: 'CARTAO_CREDITO', paidAt: d('2025-03-01T09:35:00') },
      { serviceOrderId: osLoja.id, number: 2, amount: '616.67', dueDate: d('2025-04-01T00:00:00'), status: 'PAGA', method: 'CARTAO_CREDITO', paidAt: d('2025-04-01T09:35:00') },
      { serviceOrderId: osLoja.id, number: 3, amount: '616.66', dueDate: d('2025-05-01T00:00:00'), status: 'PENDENTE', method: 'CARTAO_CREDITO' },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      { tenantId: tenant.id, userId: admin.id, action: 'CREATE', resource: 'Tenant', resourceId: tenant.id, description: 'Tenant demo criado pelo seed.' },
      { tenantId: tenant.id, userId: vendedor.id, serviceOrderId: osLoja.id, action: 'CREATE', resource: 'ServiceOrder', resourceId: osLoja.id, description: 'OS de otica criada.' },
      { tenantId: tenant.id, userId: vendedorExterno.id, serviceOrderId: osExternaPendente.id, action: 'CREATE', resource: 'ServiceOrder', resourceId: osExternaPendente.id, description: 'OS externa criada na Central/Fabrica.' },
      { tenantId: tenant.id, userId: operador.id, serviceOrderId: osExternaPendente.id, action: 'STOCK_MOVEMENT', resource: 'StockMovement', description: 'Baixa por OS externa usando estoque da Central/Fabrica.' },
      { tenantId: tenant.id, userId: financeiro.id, serviceOrderId: osExternaPronta.id, action: 'PAYMENT_EVENT', resource: 'Charge', resourceId: boletoCharge.id, description: 'Cobranca boleto demo registrada.' },
    ],
  });

  console.log(`Seed concluido: tenant ${tenant.name}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
