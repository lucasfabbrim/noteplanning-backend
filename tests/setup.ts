// Set test environment variables BEFORE any imports
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-32chars-minimum-length';
process.env.JWT_EXPIRES_IN = '1h';
process.env.ABACATEPAY_TOKEN_SECRET = 'test-abacatepay-secret-token-for-tests';
process.env.PORT = '3333';
process.env.HOST = 'localhost';
process.env.LOG_LEVEL = 'error'; // Minimize log noise during tests
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.UPLOAD_PATH = './uploads';
process.env.MAX_FILE_SIZE = '10485760';
process.env.DEFAULT_PAGE_SIZE = '10';
process.env.MAX_PAGE_SIZE = '100';

// Now load dotenv and other modules
import 'dotenv/config';
import { beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Setup test environment
beforeAll(async () => {
  // Ensure we're using test database
  if (!process.env.DATABASE_URL?.includes('test') && process.env.NODE_ENV === 'test') {
    console.warn('⚠️  Warning: Not using test database!');
  }
});

// Cleanup after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };

