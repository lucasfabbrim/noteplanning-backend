import { z } from 'zod';

// Base admin schema
export const adminBaseSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password must be less than 100 characters'),
});

// Create admin schema
export const createAdminSchema = adminBaseSchema;

// Update admin schema (all fields optional)
export const updateAdminSchema = adminBaseSchema.partial();

// Admin response schema (without password)
export const adminResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['FREE', 'MEMBER', 'ADMIN']),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deactivatedAt: z.date().nullable(),
});

// Query parameters schema
export const adminQuerySchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : 10),
  search: z.string().optional(),
  isActive: z.string().optional().transform((val) => val === 'true'),
});

// Params schema for routes with ID
export const adminParamsSchema = z.object({
  id: z.string().cuid('Invalid admin ID format'),
});

// Login schema
export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Type exports
export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;
export type AdminResponse = z.infer<typeof adminResponseSchema>;
export type AdminQuery = z.infer<typeof adminQuerySchema>;
export type AdminParams = z.infer<typeof adminParamsSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
