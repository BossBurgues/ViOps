import { Router } from 'express';
import { asyncHandler } from '../../shared/async-handler.js';
import { badRequest, notFound } from '../../shared/errors.js';
import { getPagination, getString } from '../../shared/query.js';
import { unitsService } from './units.service.js';

export const unitsRouter = Router();

unitsRouter.get('/units', asyncHandler(async (req, res) => {
  const pagination = getPagination(req.query);
  const units = await unitsService.list({
    tenantId: getString(req.query.tenantId),
    ...pagination,
  });
  res.json(units);
}));

unitsRouter.get('/units/:id', asyncHandler(async (req, res) => {
  const id = getString(req.params.id);
  if (!id) throw badRequest('id inválido');

  const unit = await unitsService.findById(id);
  if (!unit) throw notFound('Unidade não encontrada');
  res.json(unit);
}));
