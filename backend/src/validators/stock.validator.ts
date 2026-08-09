import { z } from 'zod';
import { MovementType } from '@prisma/client';

export const createStockMovementSchema = z.object({
  productId: z.string().uuid('Invalid Product ID'),
  quantity: z.number().int().min(1, 'Quantity must be greater than 0'),
  movementType: z.nativeEnum(MovementType),
  reason: z.string().min(3, 'Reason must be at least 3 characters').trim(),
});

export const stockMovementQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10)),
  productId: z.string().optional(),
  movementType: z.nativeEnum(MovementType).optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;
export type StockMovementQueryParams = z.infer<typeof stockMovementQuerySchema>;
