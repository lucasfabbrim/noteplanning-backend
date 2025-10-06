import { z } from 'zod';

// Base video schema
export const videoBaseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  url: z.string().url('Invalid URL format'),
  thumbnail: z.string().url('Invalid thumbnail URL format').optional(),
  duration: z.number().int().positive('Duration must be a positive integer').optional(),
  isPublished: z.boolean().default(false),
  customerId: z.string().cuid('Invalid customer ID format'),
});

// Create video schema
export const createVideoSchema = videoBaseSchema;

// Update video schema (all fields optional except customerId)
export const updateVideoSchema = videoBaseSchema.partial().extend({
  customerId: z.string().cuid('Invalid customer ID format').optional(),
});

// Video response schema
export const videoResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  url: z.string(),
  thumbnail: z.string().nullable(),
  duration: z.number().nullable(),
  isPublished: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deactivatedAt: z.date().nullable(),
  customerId: z.string(),
});

// Video with customer relation schema
export const videoWithCustomerSchema = videoResponseSchema.extend({
  customer: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.enum(['FREE', 'MEMBER', 'ADMIN']),
  }),
});

// Query parameters schema
export const videoQuerySchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : 10),
  search: z.string().optional(),
  isPublished: z.string().optional().transform((val) => val === 'true'),
  customerId: z.string().cuid().optional(),
  minDuration: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
  maxDuration: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
});

// Params schema for routes with ID
export const videoParamsSchema = z.object({
  id: z.string().cuid('Invalid video ID format'),
});

// Type exports
export type CreateVideoInput = z.infer<typeof createVideoSchema>;
export type UpdateVideoInput = z.infer<typeof updateVideoSchema>;
export type VideoResponse = z.infer<typeof videoResponseSchema>;
export type VideoWithCustomer = z.infer<typeof videoWithCustomerSchema>;
export type VideoQuery = z.infer<typeof videoQuerySchema>;
export type VideoParams = z.infer<typeof videoParamsSchema>;
