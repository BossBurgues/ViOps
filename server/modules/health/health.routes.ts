import { Router } from 'express';
import { asyncHandler } from '../../shared/async-handler.js';
import { healthService } from './health.service.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json(healthService.getHealth());
});

healthRouter.get('/health/db', asyncHandler(async (_req, res) => {
  res.json(await healthService.getDbHealth());
}));
