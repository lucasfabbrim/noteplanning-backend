import { z } from 'zod';

const envSchema = z.object({
  // Database - Supabase PostgreSQL
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SUPABASE_URL: z.string().min(1, 'SUPABASE_URL is required'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

  // Server Configuration
  PORT: z.string().default('3000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  HOST: z.string().default('0.0.0.0'),

  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // File Upload
  UPLOAD_PATH: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().default('10485760').transform(Number), // 10MB

  // Pagination
  DEFAULT_PAGE_SIZE: z.string().default('10').transform(Number),
  MAX_PAGE_SIZE: z.string().default('100').transform(Number),

  // External Services
  ABACATEPAY_TOKEN_SECRET: z.string().min(1, 'ABACATEPAY_TOKEN_SECRET is required'),
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
