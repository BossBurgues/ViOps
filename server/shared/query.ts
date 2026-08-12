import { badRequest } from './errors.js';

type QueryValue = unknown;

export function getString(value: QueryValue): string | undefined {
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === 'string' ? first : undefined;
  }

  return typeof value === 'string' ? value : undefined;
}

export function getPagination(query: Record<string, unknown>) {
  const rawLimit = Number(getString(query.limit) ?? 50);
  const rawOffset = Number(getString(query.offset) ?? 0);

  if (!Number.isInteger(rawLimit) || rawLimit < 1) throw badRequest('limit inválido');
  if (!Number.isInteger(rawOffset) || rawOffset < 0) throw badRequest('offset inválido');

  return {
    take: Math.min(rawLimit, 100),
    skip: rawOffset,
  };
}

export function getBoolean(value: QueryValue): boolean | undefined {
  const raw = getString(value);
  if (raw === undefined) return undefined;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  throw badRequest('boolean inválido');
}

export function getEnum<T extends string>(
  value: QueryValue,
  allowed: readonly T[],
  fieldName: string,
): T | undefined {
  const raw = getString(value);
  if (raw === undefined) return undefined;
  if (allowed.includes(raw as T)) return raw as T;
  throw badRequest(`${fieldName} inválido`);
}
