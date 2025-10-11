import { z } from 'zod';

const envSchema = z.object({
  // Database - Supabase PostgreSQL
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SUPABASE_URL: z.string().min(1, 'SUPABASE_URL is required'),
  SUPABASE_KEY: z.string().min(1, 'SUPABASE_KEY is required'),
  SUPABASE_JWT_SECRET: z.string().min(1, 'SUPABASE_JWT_SECRET is required'),

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

  // Firebase Configuration
  FIREBASE_API_KEY: z.string().min(1, 'FIREBASE_API_KEY is required'),
  FIREBASE_AUTH_DOMAIN: z.string().min(1, 'FIREBASE_AUTH_DOMAIN is required'),
  FIREBASE_PROJECT_ID: z.string().min(1, 'FIREBASE_PROJECT_ID is required'),
  FIREBASE_STORAGE_BUCKET: z.string().min(1, 'FIREBASE_STORAGE_BUCKET is required'),
  FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, 'FIREBASE_MESSAGING_SENDER_ID is required'),
  FIREBASE_APP_ID: z.string().min(1, 'FIREBASE_APP_ID is required'),
  FIREBASE_MEASUREMENT_ID: z.string().optional(),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
