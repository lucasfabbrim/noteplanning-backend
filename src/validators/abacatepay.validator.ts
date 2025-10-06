import { z } from 'zod';

/**
 * AbacatePay webhook validation schemas
 */

// Customer metadata schema
export const abacatePayCustomerMetadataSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  cellphone: z.string().min(1, 'Cellphone is required'),
  taxId: z.string().optional(),
});

// Billing schema
export const abacatePayBillingSchema = z.object({
  customer: z.object({
    metadata: abacatePayCustomerMetadataSchema,
  }),
  amount: z.number().positive('Amount must be positive'),
});

// Payment schema
export const abacatePayPaymentSchema = z.object({
  amount: z.number().positive('Payment amount must be positive'),
});

// Product schema
export const abacatePayProductSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  quantity: z.number().optional(),
  price: z.number().optional(),
});

// Main webhook data schema
export const abacatePayWebhookDataSchema = z.object({
  billing: abacatePayBillingSchema,
  payment: abacatePayPaymentSchema,
});

// Complete webhook body schema
export const abacatePayWebhookBodySchema = z.object({
  data: abacatePayWebhookDataSchema,
  products: z.array(abacatePayProductSchema).optional(),
  event: z.string().min(1, 'Event is required'),
  devMode: z.boolean().optional().default(false),
});

// Webhook query params schema
export const abacatePayWebhookQuerySchema = z.object({
  webhookSecret: z.string().min(1, 'webhookSecret is required'),
});

/**
 * Type definitions
 */
export type AbacatePayCustomerMetadata = z.infer<typeof abacatePayCustomerMetadataSchema>;
export type AbacatePayBilling = z.infer<typeof abacatePayBillingSchema>;
export type AbacatePayPayment = z.infer<typeof abacatePayPaymentSchema>;
export type AbacatePayProduct = z.infer<typeof abacatePayProductSchema>;
export type AbacatePayWebhookData = z.infer<typeof abacatePayWebhookDataSchema>;
export type AbacatePayWebhookBody = z.infer<typeof abacatePayWebhookBodySchema>;
export type AbacatePayWebhookQuery = z.infer<typeof abacatePayWebhookQuerySchema>;

/**
 * Customer creation input schema (derived from webhook data)
 */
export const customerFromWebhookSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  cellphone: z.string().optional(),
  taxId: z.string().optional(),
  role: z.enum(['FREE', 'MEMBER', 'ADMIN']).default('FREE'),
});

export type CustomerFromWebhook = z.infer<typeof customerFromWebhookSchema>;

