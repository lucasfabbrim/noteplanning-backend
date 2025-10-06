import { z } from 'zod';

/**
 * Environment variables validation schema
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Server
  PORT: z.string().default('3333').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  HOST: z.string().default('localhost'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // File Storage
  UPLOAD_PATH: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().default('10485760').transform(Number), // 10MB

  // Pagination
  DEFAULT_PAGE_SIZE: z.string().default('10').transform(Number),
  MAX_PAGE_SIZE: z.string().default('100').transform(Number),

  // AbacatePay Webhook
  ABACATEPAY_TOKEN_SECRET: z.string().min(1, 'ABACATEPAY_TOKEN_SECRET is required'),

  // Email (Resend)
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
});

/**
 * Validated environment variables
 */
export const env = envSchema.parse(process.env);

/**
 * Environment type
 */
export type Env = z.infer<typeof envSchema>;
