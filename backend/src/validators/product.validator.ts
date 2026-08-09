import { z } from 'zod';

export const createProductSchema = z.object({
  productName: z.string().min(2, 'Product name must be at least 2 characters').trim(),
  sku: z.string().min(2, 'SKU must be at least 2 characters').toUpperCase().trim(),
  category: z.string().min(2, 'Category is required').trim(),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  currentStock: z.number().int().min(0, 'Current stock cannot be negative').default(0),
  minimumStock: z.number().int().min(0, 'Minimum stock cannot be negative').default(10),
  warehouseLocation: z.string().optional().or(z.literal('')),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10)),
  search: z.string().optional(),
  category: z.string().optional(),
  stockStatus: z.enum(['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']).optional(),
  sortBy: z.enum(['productName', 'sku', 'unitPrice', 'currentStock', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryParams = z.infer<typeof productQuerySchema>;
