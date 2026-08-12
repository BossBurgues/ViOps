import { Prisma } from '@prisma/client';
import { prisma } from '../../infra/prisma.js';

export interface ListClientsFilters {
  tenantId?: string;
  search?: string;
  take: number;
  skip: number;
}

export const clientsService = {
  list(filters: ListClientsFilters) {
    const where: Prisma.ClientWhereInput = {
      tenantId: filters.tenantId,
      ...(filters.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: 'insensitive' } },
              { document: { contains: filters.search, mode: 'insensitive' } },
              { email: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return prisma.client.findMany({
      where,
      orderBy: { name: 'asc' },
      take: filters.take,
      skip: filters.skip,
    });
  },

  findById(id: string) {
    return prisma.client.findUnique({
      where: { id },
      include: {
        tenant: true,
      },
    });
  },
};
