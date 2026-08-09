import { Response } from 'express';
import { ApiResponse, PaginatedResult } from '../types';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  res.status(statusCode).json(response);
};

export const sendPaginated = <T>(
  res: Response,
  result: PaginatedResult<T>,
  message?: string,
  statusCode = 200
): void => {
  res.status(statusCode).json({
    success: true,
    message,
    data: result.data,
    pagination: result.pagination,
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  errors?: unknown[]
): void => {
  const response: ApiResponse = {
    success: false,
    message,
    errors,
  };
  res.status(statusCode).json(response);
};
