import { Router } from 'express';
import { asyncHandler } from '../../shared/async-handler.js';
import { badRequest, notFound } from '../../shared/errors.js';
import { getPagination, getString } from '../../shared/query.js';
import { clientsService } from './clients.service.js';

export const clientsRouter = Router();

clientsRouter.get('/clients', asyncHandler(async (req, res) => {
  const pagination = getPagination(req.query);
  const clients = await clientsService.list({
    tenantId: getString(req.query.tenantId),
    search: getString(req.query.search),
    ...pagination,
  });
  res.json(clients);
}));

clientsRouter.get('/clients/:id', asyncHandler(async (req, res) => {
  const id = getString(req.params.id);
  if (!id) throw badRequest('id inválido');

  const client = await clientsService.findById(id);
  if (!client) throw notFound('Cliente não encontrado');
  res.json(client);
}));
