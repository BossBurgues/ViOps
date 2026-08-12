import { Prisma } from '@prisma/client';
import { prisma } from '../../infra/prisma.js';

export interface ListUnitsFilters {
  tenantId?: string;
  take: number;
  skip: number;
}

export const unitsService = {
  list(filters: ListUnitsFilters) {
    const where: Prisma.UnitWhereInput = {
      tenantId: filters.tenantId,
    };

    return prisma.unit.findMany({
      where,
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
      take: filters.take,
      skip: filters.skip,
    });
  },

  findById(id: string) {
    return prisma.unit.findUnique({
      where: { id },
      include: {
        tenant: true,
      },
    });
  },
};
