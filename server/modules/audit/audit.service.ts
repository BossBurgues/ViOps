import { Prisma } from '@prisma/client';
import { prisma } from '../../infra/prisma.js';

export interface ListAuditLogsFilters {
  tenantId?: string;
  entityType?: string;
  entityId?: string;
  take: number;
  skip: number;
}

export const auditService = {
  list(filters: ListAuditLogsFilters) {
    const where: Prisma.AuditLogWhereInput = {
      tenantId: filters.tenantId,
      resource: filters.entityType,
      resourceId: filters.entityId,
    };

    return prisma.auditLog.findMany({
      where,
      include: {
        user: true,
        serviceOrder: true,
      },
      orderBy: { createdAt: 'desc' },
      take: filters.take,
      skip: filters.skip,
    });
  },
};
