import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

export function notFound(message = 'Registro não encontrado') {
  return new ApiError(404, message);
}

export function badRequest(message = 'Requisição inválida') {
  return new ApiError(400, message);
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error(error);
  return res.status(500).json({
    error: 'Erro inesperado',
    ...(env.nodeEnv === 'production' ? {} : { detail: error instanceof Error ? error.message : String(error) }),
  });
}
