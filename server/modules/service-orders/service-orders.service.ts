import { OperationalChannel, Prisma, SaleOrigin, ServiceOrderStatus } from '@prisma/client';
import { prisma } from '../../infra/prisma.js';

export interface ListServiceOrdersFilters {
  tenantId?: string;
  unitId?: string;
  status?: ServiceOrderStatus;
  saleOrigin?: SaleOrigin;
  operationalChannel?: OperationalChannel;
  take: number;
  skip: number;
}

const serviceOrderDetailInclude = {
  client: true,
  unit: true,
  items: {
    include: {
      stockItem: true,
    },
  },
  externalActionData: true,
  factoryRef: true,
  documents: true,
  charges: {
    include: {
      provider: true,
    },
  },
  payments: {
    include: {
      charge: true,
      installments: true,
    },
  },
  installments: true,
  stockMovements: {
    include: {
      unit: true,
      stockItem: true,
      serviceOrderItem: true,
    },
  },
} satisfies Prisma.ServiceOrderInclude;

export const serviceOrdersService = {
  list(filters: ListServiceOrdersFilters) {
    const where: Prisma.ServiceOrderWhereInput = {
      tenantId: filters.tenantId,
      unitId: filters.unitId,
      status: filters.status,
      saleOrigin: filters.saleOrigin,
      operationalChannel: filters.operationalChannel,
    };

    return prisma.serviceOrder.findMany({
      where,
      include: {
        client: true,
        unit: true,
        externalActionData: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: filters.take,
      skip: filters.skip,
    });
  },

  findById(id: string) {
    return prisma.serviceOrder.findUnique({
      where: { id },
      include: serviceOrderDetailInclude,
    });
  },
};
