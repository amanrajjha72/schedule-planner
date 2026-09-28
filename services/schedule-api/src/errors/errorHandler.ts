import type { HttpResponseInit } from '@azure/functions';
import { ZodError } from 'zod';
import { logger } from '../logger.js';
import { AppError } from './AppError.js';

export function handleError(error: unknown): HttpResponseInit {
  if (error instanceof AppError) {
    logger.warn({ code: error.code, statusCode: error.statusCode }, error.message);
    return {
      status: error.statusCode,
      jsonBody: {
        error: {
          code: error.code,
          message: error.message,
          details: error.details ?? null,
        },
      },
    };
  }

  if (error instanceof ZodError) {
    return {
      status: 422,
      jsonBody: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: {
            issues: error.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          },
        },
      },
    };
  }

  if (typeof error === 'object' && error !== null && 'code' in error) {
    const databaseCode = (error as { code?: unknown }).code;
    if (databaseCode === '23505') {
      return errorResponse(409, 'CONFLICT', 'A record with this value already exists');
    }
    if (databaseCode === '23503' || databaseCode === '23514') {
      return errorResponse(400, 'BAD_REQUEST', 'The requested data violates a database constraint');
    }
  }

  logger.error({ err: error }, 'Unhandled request error');
  return errorResponse(500, 'INTERNAL_ERROR', 'An internal error occurred');
}

function errorResponse(
  status: number,
  code: 'CONFLICT' | 'BAD_REQUEST' | 'INTERNAL_ERROR',
  message: string,
): HttpResponseInit {
  return { status, jsonBody: { error: { code, message, details: null } } };
}