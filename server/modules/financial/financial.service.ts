import { ChargeStatus, ChargeType, Prisma } from '@prisma/client';
import { prisma } from '../../infra/prisma.js';

export interface ListProvidersFilters {
  tenantId?: string;
  take: number;
  skip: number;
}

export interface ListChargesFilters {
  tenantId?: string;
  status?: ChargeStatus;
  type?: ChargeType;
  providerId?: string;
  take: number;
  skip: number;
}

export const financialService = {
  listProviders(filters: ListProvidersFilters) {
    const where: Prisma.FinancialProviderWhereInput = {
      tenantId: filters.tenantId,
    };

    return prisma.financialProvider.findMany({
      where,
      orderBy: { name: 'asc' },
      take: filters.take,
      skip: filters.skip,
    });
  },

  listCharges(filters: ListChargesFilters) {
    const where: Prisma.ChargeWhereInput = {
      tenantId: filters.tenantId,
      status: filters.status,
      type: filters.type,
      providerId: filters.providerId,
    };

    return prisma.charge.findMany({
      where,
      include: {
        provider: true,
        serviceOrder: {
          include: {
            client: true,
            unit: true,
          },
        },
        client: true,
        payments: true,
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      take: filters.take,
      skip: filters.skip,
    });
  },
};
