import { Router } from 'express';
import { asyncHandler } from '../../shared/async-handler.js';
import { getPagination, getString } from '../../shared/query.js';
import { auditService } from './audit.service.js';

export const auditRouter = Router();

auditRouter.get(
  '/audit-logs',
  asyncHandler(async (req, res) => {
    const pagination = getPagination(req.query);

    const logs = await auditService.list({
      tenantId: getString(req.query.tenantId),
      entityType: getString(req.query.entityType),
      entityId: getString(req.query.entityId),
      ...pagination,
    });

    res.json(logs);
  }),
);
