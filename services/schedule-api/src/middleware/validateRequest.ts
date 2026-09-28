import type { HttpRequest } from '@azure/functions';
import type { ZodType } from 'zod';
import { AppError } from '../errors/AppError.js';

export async function validateBody<T>(request: HttpRequest, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new AppError(422, 'VALIDATION_ERROR', 'Request body must be valid JSON');
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw parsed.error;
  return parsed.data;
}

export function validateParams<T>(params: Record<string, string>, schema: ZodType<T>): T {
  const parsed = schema.safeParse(params);
  if (!parsed.success) throw parsed.error;
  return parsed.data;
}