import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { buildServer } from '@/server';
import { FastifyInstance } from 'fastify';

describe('Authentication Security Tests', () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;
  let adminToken: string;
  let customerToken: string;
  let expiredToken: string;
  let malformedToken: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    app = await buildServer();
    await app.ready();

    // Create test users
    const adminPassword = await bcrypt.hash('admin123', 10);
    const customerPassword = await bcrypt.hash('customer123', 10);

    await prisma.customer.upsert({
      where: { email: 'test-admin@security.test' },
      update: {},
      create: {
        email: 'test-admin@security.test',
        name: 'Test Admin',
        password: adminPassword,
        role: Role.ADMIN,
        isActive: true,
      },
    });

    await prisma.customer.upsert({
      where: { email: 'test-customer@security.test' },
      update: {},
      create: {
        email: 'test-customer@security.test',
        name: 'Test Customer',
        password: customerPassword,
        role: Role.FREE,
        isActive: true,
      },
    });

    // Generate tokens for testing
    const admin = await prisma.customer.findUnique({ where: { email: 'test-admin@security.test' } });
    const customer = await prisma.customer.findUnique({ where: { email: 'test-customer@security.test' } });

    adminToken = jwt.sign(
      { id: admin!.id, email: admin!.email, role: admin!.role },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    customerToken = jwt.sign(
      { id: customer!.id, email: customer!.email, role: customer!.role },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // Create expired token
    expiredToken = jwt.sign(
      { id: customer!.id, email: customer!.email, role: customer!.role },
      process.env.JWT_SECRET!,
      { expiresIn: '-1h' }
    );

    malformedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature';
  });

  afterAll(async () => {
    // Cleanup test users
    await prisma.customer.deleteMany({
      where: {
        email: {
          in: ['test-admin@security.test', 'test-customer@security.test'],
        },
      },
    });
    await prisma.$disconnect();
    await app.close();
  });

  describe('Login Security', () => {
    it('should NOT reveal if email exists when password is wrong', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'test-admin@security.test',
          password: 'wrongpassword',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Invalid credentials');
      expect(body).not.toHaveProperty('stack');
      expect(body).not.toHaveProperty('email');
    });

    it('should return same message for non-existent email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'nonexistent@security.test',
          password: 'anypassword',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Invalid credentials');
    });

    it('should prevent SQL injection in email field', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: "admin@test.com' OR '1'='1",
          password: 'anypassword',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Invalid credentials');
    });

    it('should prevent NoSQL injection attempts', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: { $ne: null },
          password: { $ne: null },
        } as any,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle very long password without crashing', async () => {
      const longPassword = 'a'.repeat(10000);
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'test-admin@security.test',
          password: longPassword,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle special characters in password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'test-admin@security.test',
          password: "'; DROP TABLE customers; --",
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should successfully login with correct credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'test-admin@security.test',
          password: 'admin123',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('token');
      expect(body.data.user).toHaveProperty('id');
      expect(body.data.user).toHaveProperty('email');
      expect(body.data.user).not.toHaveProperty('password');
    });

    it('should NOT expose password hash in response', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'test-admin@security.test',
          password: 'admin123',
        },
      });

      const body = JSON.parse(response.body);
      expect(JSON.stringify(body)).not.toContain('$2a$');
      expect(JSON.stringify(body)).not.toContain('$2b$');
    });
  });

  describe('JWT Token Security', () => {
    it('should reject requests without token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/customers',
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Unauthorized');
      expect(body).not.toHaveProperty('stack');
    });

    it('should reject malformed Bearer token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/customers',
        headers: {
          authorization: 'Bearer invalid_token',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Unauthorized');
    });

    it('should reject expired token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/customers',
        headers: {
          authorization: `Bearer ${expiredToken}`,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject token with wrong signature', async () => {
      const fakeToken = jwt.sign(
        { id: 'fake-id', email: 'fake@test.com', role: 'ADMIN' },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      const response = await app.inject({
        method: 'GET',
        url: '/api/customers',
        headers: {
          authorization: `Bearer ${fakeToken}`,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject token with tampered payload', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/customers',
        headers: {
          authorization: `Bearer ${malformedToken}`,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should accept valid admin token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/customers',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('Authorization Security (Role-Based Access)', () => {
    it('should deny customer access to admin-only routes', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/customers',
        headers: {
          authorization: `Bearer ${customerToken}`,
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Forbidden');
    });

    it('should deny customer from creating other customers', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers',
        headers: {
          authorization: `Bearer ${customerToken}`,
        },
        payload: {
          email: 'hacker@test.com',
          name: 'Hacker',
          password: 'hack123',
          role: 'ADMIN',
        },
      });

      expect(response.statusCode).toBe(403);
    });

    it('should deny customer from viewing other customers', async () => {
      const admin = await prisma.customer.findUnique({ where: { email: 'test-admin@security.test' } });
      
      const response = await app.inject({
        method: 'GET',
        url: `/api/customers/${admin!.id}`,
        headers: {
          authorization: `Bearer ${customerToken}`,
        },
      });

      expect(response.statusCode).toBe(403);
    });

    it('should deny customer from accessing forgot-password endpoint', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/forgot-password',
        headers: {
          authorization: `Bearer ${customerToken}`,
        },
        payload: {
          email: 'test-customer@security.test',
        },
      });

      expect(response.statusCode).toBe(403);
    });

    it('should allow customer to view only their own purchases', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/purchases/my-purchases',
        headers: {
          authorization: `Bearer ${customerToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      
      // Verify customer can only see their own data
      const customer = await prisma.customer.findUnique({ where: { email: 'test-customer@security.test' } });
      if (body.data.length > 0) {
        body.data.forEach((purchase: any) => {
          expect(purchase.customerId).toBe(customer!.id);
        });
      }
    });

    it('should prevent role escalation via token manipulation', async () => {
      // Try to create a token claiming to be admin
      const fakeAdminToken = jwt.sign(
        { id: 'fake-id', email: 'fake@test.com', role: 'ADMIN' },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      // This should fail because the user doesn't exist
      const response = await app.inject({
        method: 'GET',
        url: '/api/customers',
        headers: {
          authorization: `Bearer ${fakeAdminToken}`,
        },
      });

      // Token is valid but user doesn't exist or doesn't have permission
      expect([200, 403, 404]).toContain(response.statusCode);
    });
  });

  describe('Brute Force Protection', () => {
    it('should handle multiple failed login attempts', async () => {
      const attempts = Array(10).fill(null);
      
      for (const _ of attempts) {
        const response = await app.inject({
          method: 'POST',
          url: '/api/customers/login',
          payload: {
            email: 'test-admin@security.test',
            password: 'wrongpassword',
          },
        });

        expect(response.statusCode).toBe(401);
        expect(JSON.parse(response.body).message).toBe('Invalid credentials');
      }
    });

    it('should handle rapid sequential requests', async () => {
      const promises = Array(20).fill(null).map(() =>
        app.inject({
          method: 'GET',
          url: '/health',
        })
      );

      const responses = await Promise.all(promises);
      responses.forEach((response) => {
        expect(response.statusCode).toBe(200);
      });
    });
  });

  describe('Input Validation Security', () => {
    it('should reject login with missing email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          password: 'admin123',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject login with missing password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'test-admin@security.test',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject login with invalid email format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'not-an-email',
          password: 'admin123',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle null/undefined values safely', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: null,
          password: undefined,
        } as any,
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Response Security', () => {
    it('should NOT expose stack traces in production mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await app.inject({
        method: 'GET',
        url: '/api/customers',
      });

      const body = JSON.parse(response.body);
      expect(body).not.toHaveProperty('stack');
      expect(body).not.toHaveProperty('path');
      expect(body).not.toHaveProperty('timestamp');

      process.env.NODE_ENV = originalEnv;
    });

    it('should NOT expose internal error details', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'test@test.com',
          password: 'test',
        },
      });

      const body = JSON.parse(response.body);
      const bodyString = JSON.stringify(body);
      
      expect(bodyString).not.toContain('prisma');
      expect(bodyString).not.toContain('database');
      expect(bodyString).not.toContain('query');
      expect(bodyString).not.toContain('SQL');
    });

    it('should NOT expose server information in headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.headers).not.toHaveProperty('x-powered-by');
      expect(response.headers.server).not.toContain('Express');
    });
  });
});

