import { z } from 'zod';

export const customerBaseSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password must be less than 100 characters'),
});

export const createCustomerSchema = customerBaseSchema;

export const updateCustomerSchema = customerBaseSchema.partial();

export const customerResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().nullable(),
  role: z.enum(['FREE', 'MEMBER', 'ADMIN']),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deactivatedAt: z.date().nullable(),
});

export const customerWithRelationsSchema = customerResponseSchema.extend({
  videos: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    url: z.string(),
    thumbnail: z.string().nullable(),
    duration: z.number().nullable(),
    isPublished: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })).optional(),
});

export const customerQuerySchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : 10),
  search: z.string().optional(),
  role: z.enum(['FREE', 'MEMBER', 'ADMIN']).optional(),
  isActive: z.string().optional().transform((val) => val === 'true'),
});

export const customerParamsSchema = z.object({
  id: z.string().cuid('Invalid customer ID format'),
});

export const customerEmailParamsSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const customerLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const customerLoginResponseSchema = customerResponseSchema.extend({
  token: z.string(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerResponse = z.infer<typeof customerResponseSchema>;
export type CustomerLoginResponse = z.infer<typeof customerLoginResponseSchema>;
export type CustomerWithRelations = z.infer<typeof customerWithRelationsSchema>;
export type CustomerQuery = z.infer<typeof customerQuerySchema>;
export type CustomerParams = z.infer<typeof customerParamsSchema>;
export type CustomerEmailParams = z.infer<typeof customerEmailParamsSchema>;
export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;
