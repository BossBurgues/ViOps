import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { auditRouter } from './modules/audit/audit.routes.js';
import { clientsRouter } from './modules/clients/clients.routes.js';
import { financialRouter } from './modules/financial/financial.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { serviceOrdersRouter } from './modules/service-orders/service-orders.routes.js';
import { stockRouter } from './modules/stock/stock.routes.js';
import { unitsRouter } from './modules/units/units.routes.js';
import { ApiError, errorHandler } from './shared/errors.js';

export const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());

app.use(healthRouter);
app.use(unitsRouter);
app.use(clientsRouter);
app.use(serviceOrdersRouter);
app.use(financialRouter);
app.use(stockRouter);
app.use(auditRouter);

app.use((_req, _res, next) => {
  next(new ApiError(404, 'Rota não encontrada'));
});

app.use(errorHandler);
