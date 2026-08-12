import { Prisma, StockCategory } from '@prisma/client';
import { prisma } from '../../infra/prisma.js';

export interface ListStockItemsFilters {
  tenantId?: string;
  unitId?: string;
  category?: StockCategory;
  active?: boolean;
  take: number;
  skip: number;
}

export interface ListStockMovementsFilters {
  tenantId?: string;
  unitId?: string;
  stockItemId?: string;
  serviceOrderId?: string;
  take: number;
  skip: number;
}

export const stockService = {
  listItems(filters: ListStockItemsFilters) {
    const where: Prisma.StockItemWhereInput = {
      tenantId: filters.tenantId,
      unitId: filters.unitId,
      category: filters.category,
      active: filters.active,
    };

    return prisma.stockItem.findMany({
      where,
      include: {
        unit: true,
      },
      orderBy: { name: 'asc' },
      take: filters.take,
      skip: filters.skip,
    });
  },

  listMovements(filters: ListStockMovementsFilters) {
    const where: Prisma.StockMovementWhereInput = {
      tenantId: filters.tenantId,
      unitId: filters.unitId,
      stockItemId: filters.stockItemId,
      serviceOrderId: filters.serviceOrderId,
    };

    return prisma.stockMovement.findMany({
      where,
      include: {
        unit: true,
        stockItem: true,
        serviceOrder: true,
        serviceOrderItem: true,
        user: true,
      },
      orderBy: { occurredAt: 'desc' },
      take: filters.take,
      skip: filters.skip,
    });
  },
};
