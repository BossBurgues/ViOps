import { OperationalChannel, SaleOrigin, ServiceOrderStatus } from '@prisma/client';
import { Router } from 'express';
import { asyncHandler } from '../../shared/async-handler.js';
import { badRequest, notFound } from '../../shared/errors.js';
import { getEnum, getPagination, getString } from '../../shared/query.js';
import { serviceOrdersService } from './service-orders.service.js';

export const serviceOrdersRouter = Router();

const serviceOrderStatuses = Object.values(ServiceOrderStatus);
const saleOrigins = Object.values(SaleOrigin);
const operationalChannels = Object.values(OperationalChannel);

serviceOrdersRouter.get('/service-orders', asyncHandler(async (req, res) => {
  const pagination = getPagination(req.query);
  const orders = await serviceOrdersService.list({
    tenantId: getString(req.query.tenantId),
    unitId: getString(req.query.unitId),
    status: getEnum(req.query.status, serviceOrderStatuses, 'status'),
    saleOrigin: getEnum(req.query.saleOrigin, saleOrigins, 'saleOrigin'),
    operationalChannel: getEnum(req.query.operationalChannel, operationalChannels, 'operationalChannel'),
    ...pagination,
  });
  res.json(orders);
}));

serviceOrdersRouter.get('/service-orders/:id', asyncHandler(async (req, res) => {
  const id = getString(req.params.id);
  if (!id) throw badRequest('id inválido');

  const order = await serviceOrdersService.findById(id);
  if (!order) throw notFound('Ordem de serviço não encontrada');
  res.json(order);
}));
