import { StockCategory } from '@prisma/client';
import { Router } from 'express';
import { asyncHandler } from '../../shared/async-handler.js';
import { getBoolean, getEnum, getPagination, getString } from '../../shared/query.js';
import { stockService } from './stock.service.js';

const stockCategories = Object.values(StockCategory);

export const stockRouter = Router();

stockRouter.get(
  '/stock/items',
  asyncHandler(async (req, res) => {
    const pagination = getPagination(req.query);

    const items = await stockService.listItems({
      tenantId: getString(req.query.tenantId),
      unitId: getString(req.query.unitId),
      category: getEnum(req.query.category, stockCategories, 'category'),
      active: getBoolean(req.query.active),
      ...pagination,
    });

    res.json(items);
  }),
);

stockRouter.get(
  '/stock/movements',
  asyncHandler(async (req, res) => {
    const pagination = getPagination(req.query);

    const movements = await stockService.listMovements({
      tenantId: getString(req.query.tenantId),
      unitId: getString(req.query.unitId),
      stockItemId: getString(req.query.stockItemId),
      serviceOrderId: getString(req.query.serviceOrderId),
      ...pagination,
    });

    res.json(movements);
  }),
);
