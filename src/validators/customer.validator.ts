import { z } from 'zod';

// Base customer schema
export const customerBaseSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password must be less than 100 characters'),
});

// Create customer schema
export const createCustomerSchema = customerBaseSchema;

// Update customer schema (all fields optional)
export const updateCustomerSchema = customerBaseSchema.partial();

// Customer response schema (without password)
export const customerResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['FREE', 'MEMBER', 'ADMIN']),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deactivatedAt: z.date().nullable(),
});

// Customer with relations schema
export const customerWithRelationsSchema = customerResponseSchema.extend({
  memberships: z.array(z.object({
    id: z.string(),
    startDate: z.date(),
    endDate: z.date(),
    isActive: z.boolean(),
    planType: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })).optional(),
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

// Query parameters schema
export const customerQuerySchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : 10),
  search: z.string().optional(),
  role: z.enum(['FREE', 'MEMBER', 'ADMIN']).optional(),
  isActive: z.string().optional().transform((val) => val === 'true'),
});

// Params schema for routes with ID
export const customerParamsSchema = z.object({
  id: z.string().cuid('Invalid customer ID format'),
});

// Params schema for email route
export const customerEmailParamsSchema = z.object({
  email: z.string().email('Invalid email format'),
});

// Login schema
export const customerLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Type exports
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerResponse = z.infer<typeof customerResponseSchema>;
export type CustomerWithRelations = z.infer<typeof customerWithRelationsSchema>;
export type CustomerQuery = z.infer<typeof customerQuerySchema>;
export type CustomerParams = z.infer<typeof customerParamsSchema>;
export type CustomerEmailParams = z.infer<typeof customerEmailParamsSchema>;
export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;
