import { z } from 'zod';
import { CustomerType, CustomerStatus } from '@prisma/client';

export const createCustomerSchema = z.object({
  customerName: z.string().min(2, 'Customer name must be at least 2 characters').trim(),
  mobile: z.string().regex(/^[0-9+ -]{8,15}$/, 'Please enter a valid phone/mobile number').trim(),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  businessName: z.string().optional().or(z.literal('')),
  gstNumber: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST format (e.g. 27AAAAA0000A1Z5)')
    .optional()
    .or(z.literal('')),
  customerType: z.nativeEnum(CustomerType).default(CustomerType.RETAIL),
  address: z.string().optional().or(z.literal('')),
  status: z.nativeEnum(CustomerStatus).default(CustomerStatus.LEAD),
  followUpDate: z.string().datetime().optional().nullable().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const customerQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10)),
  search: z.string().optional(),
  type: z.nativeEnum(CustomerType).optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  sortBy: z.enum(['customerName', 'createdAt', 'followUpDate', 'businessName']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const createFollowUpSchema = z.object({
  note: z.string().min(3, 'Follow-up note must be at least 3 characters').trim(),
  followUpDate: z.string().min(1, 'Follow-up date is required'),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerQueryParams = z.infer<typeof customerQuerySchema>;
export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;
