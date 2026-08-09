import { z } from 'zod';
import { ChallanStatus } from '@prisma/client';

export const challanItemInputSchema = z.object({
  productId: z.string().uuid('Invalid Product ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const createChallanSchema = z.object({
  customerId: z.string().uuid('Invalid Customer ID'),
  status: z.enum([ChallanStatus.DRAFT, ChallanStatus.CONFIRMED]).default(ChallanStatus.DRAFT),
  notes: z.string().optional().or(z.literal('')),
  items: z.array(challanItemInputSchema).min(1, 'A challan must contain at least one product item'),
});

export const updateChallanSchema = z.object({
  customerId: z.string().uuid('Invalid Customer ID').optional(),
  notes: z.string().optional().or(z.literal('')),
  items: z.array(challanItemInputSchema).min(1, 'A challan must contain at least one product item').optional(),
});

export const challanQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10)),
  search: z.string().optional(),
  status: z.nativeEnum(ChallanStatus).optional(),
  customerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(['challanNumber', 'createdAt', 'totalAmount', 'totalQuantity']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateChallanInput = z.infer<typeof createChallanSchema>;
export type UpdateChallanInput = z.infer<typeof updateChallanSchema>;
export type ChallanQueryParams = z.infer<typeof challanQuerySchema>;
export type ChallanItemInput = z.infer<typeof challanItemInputSchema>;
