import { ChargeStatus, ChargeType } from '@prisma/client';
import { Router } from 'express';
import { asyncHandler } from '../../shared/async-handler.js';
import { getEnum, getPagination, getString } from '../../shared/query.js';
import { financialService } from './financial.service.js';

const chargeStatuses = Object.values(ChargeStatus);
const chargeTypes = Object.values(ChargeType);

export const financialRouter = Router();

financialRouter.get(
  '/financial/providers',
  asyncHandler(async (req, res) => {
    const pagination = getPagination(req.query);

    const providers = await financialService.listProviders({
      tenantId: getString(req.query.tenantId),
      ...pagination,
    });

    res.json(providers);
  }),
);

financialRouter.get(
  '/financial/charges',
  asyncHandler(async (req, res) => {
    const pagination = getPagination(req.query);

    const charges = await financialService.listCharges({
      tenantId: getString(req.query.tenantId),
      status: getEnum(req.query.status, chargeStatuses, 'status'),
      type: getEnum(req.query.type, chargeTypes, 'type'),
      providerId: getString(req.query.providerId),
      ...pagination,
    });

    res.json(charges);
  }),
);
