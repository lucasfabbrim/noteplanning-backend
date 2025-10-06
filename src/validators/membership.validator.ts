import { z } from 'zod';

// Base membership schema
export const membershipBaseSchema = z.object({
  customerId: z.string().cuid('Invalid customer ID format'),
  startDate: z.date().optional().default(() => new Date()),
  endDate: z.date(),
  planType: z.string().min(1, 'Plan type is required').max(50, 'Plan type must be less than 50 characters').default('monthly'),
});

// Create membership schema
export const createMembershipSchema = membershipBaseSchema;

// Update membership schema (all fields optional)
export const updateMembershipSchema = membershipBaseSchema.partial();

// Membership response schema
export const membershipResponseSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  isActive: z.boolean(),
  planType: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deactivatedAt: z.date().nullable(),
});

// Membership with customer relation schema
export const membershipWithCustomerSchema = membershipResponseSchema.extend({
  customer: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.enum(['FREE', 'MEMBER', 'ADMIN']),
  }),
});

// Query parameters schema
export const membershipQuerySchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : 10),
  isActive: z.string().optional().transform((val) => val === 'true'),
  customerId: z.string().cuid().optional(),
  planType: z.string().optional(),
  expiresSoon: z.string().optional().transform((val) => val === 'true'),
});

// Params schema for routes with ID
export const membershipParamsSchema = z.object({
  id: z.string().cuid('Invalid membership ID format'),
});

// Type exports
export type CreateMembershipInput = z.infer<typeof createMembershipSchema>;
export type UpdateMembershipInput = z.infer<typeof updateMembershipSchema>;
export type MembershipResponse = z.infer<typeof membershipResponseSchema>;
export type MembershipWithCustomer = z.infer<typeof membershipWithCustomerSchema>;
export type MembershipQuery = z.infer<typeof membershipQuerySchema>;
export type MembershipParams = z.infer<typeof membershipParamsSchema>;
