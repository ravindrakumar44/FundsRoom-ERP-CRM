import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { sendError } from '../utils/response';
import { env } from '../config/env';

export class AppError extends Error {
  statusCode: number;
  errors?: unknown[];

  constructor(message: string, statusCode = 400, errors?: unknown[]) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Custom application error
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.errors);
    return;
  }

  // Prisma unique constraint violation (P2002)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[])?.join(', ') || 'field';
      sendError(res, `A record with this ${target} already exists.`, 409);
      return;
    }

    if (err.code === 'P2025') {
      sendError(res, 'Record not found.', 404);
      return;
    }

    if (err.code === 'P2003') {
      sendError(res, 'Foreign key constraint failed. Related record does not exist or cannot be deleted.', 400);
      return;
    }

    sendError(res, `Database error: ${err.message}`, 400);
    return;
  }

  // Generic unhandled error
  console.error('💥 Unhandled Internal Server Error:', err);

  const message =
    env.NODE_ENV === 'production'
      ? 'An unexpected internal server error occurred.'
      : err.message || 'Internal Server Error';

  sendError(res, message, 500);
};
