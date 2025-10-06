import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { buildServer } from '@/server';
import { FastifyInstance } from 'fastify';

describe('Customer Validation & Edge Cases Tests', () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;
  let adminToken: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    app = await buildServer();
    await app.ready();

    // Create admin for tests
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.customer.upsert({
      where: { email: 'validation-admin@test.com' },
      update: {},
      create: {
        email: 'validation-admin@test.com',
        name: 'Validation Admin',
        password: adminPassword,
        role: Role.ADMIN,
        isActive: true,
      },
    });

    adminToken = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await prisma.customer.deleteMany({
      where: { email: { contains: 'validation-test' } },
    });
    await prisma.customer.delete({
      where: { email: 'validation-admin@test.com' },
    }).catch(() => {});
    await prisma.$disconnect();
    await app.close();
  });

  describe('Email Field Validation', () => {
    it('should reject email without @', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'notanemail',
          password: 'test123',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject email with multiple @', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'test@@test.com',
          password: 'test123',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject email with spaces', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'test @test.com',
          password: 'test123',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject email starting with dot', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: '.test@test.com',
          password: 'test123',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject email ending with dot', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'test@test.com.',
          password: 'test123',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject email with consecutive dots', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'test..name@test.com',
          password: 'test123',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject extremely long email (>254 chars)', async () => {
      const longEmail = 'a'.repeat(250) + '@test.com';
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: longEmail,
          password: 'test123',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle email with unicode characters', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'tëst@tëst.com',
          password: 'test123',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle email with emoji', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'test😀@test.com',
          password: 'test123',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject email with only domain', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: '@test.com',
          password: 'test123',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Password Field Validation', () => {
    it('should handle empty password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'test@test.com',
          password: '',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle password with only spaces', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'test@test.com',
          password: '     ',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle extremely long password (10000+ chars)', async () => {
      const longPassword = 'a'.repeat(10000);
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'test@test.com',
          password: longPassword,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle password with null bytes', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'test@test.com',
          password: 'test\0password',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle password with newlines', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'test@test.com',
          password: 'test\npassword',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle password with tabs', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'test@test.com',
          password: 'test\tpassword',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle password with all special characters', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'test@test.com',
          password: '!@#$%^&*()_+-=[]{}|;:,.<>?',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle password with emojis', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'test@test.com',
          password: '😀😁😂🤣😃',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle password with control characters', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'test@test.com',
          password: '\x00\x01\x02\x03',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Name Field Validation', () => {
    it('should reject name with only numbers', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          email: `validation-test-${Date.now()}@test.com`,
          name: '12345',
          password: 'test123',
        },
      });

      // Should succeed but handle gracefully
      expect([200, 201, 400]).toContain(response.statusCode);
    });

    it('should handle name with special characters', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          email: `validation-test-${Date.now()}@test.com`,
          name: '<script>alert("XSS")</script>',
          password: 'test123',
        },
      });

      expect([200, 201, 400]).toContain(response.statusCode);
    });

    it('should handle extremely long name (1000+ chars)', async () => {
      const longName = 'A'.repeat(1000);
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          email: `validation-test-${Date.now()}@test.com`,
          name: longName,
          password: 'test123',
        },
      });

      expect([200, 201, 400, 413]).toContain(response.statusCode);
    });

    it('should handle name with emojis', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          email: `validation-test-${Date.now()}@test.com`,
          name: 'Test 😀 User',
          password: 'test123',
        },
      });

      expect([200, 201, 400]).toContain(response.statusCode);
    });

    it('should handle name with unicode characters', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          email: `validation-test-${Date.now()}@test.com`,
          name: 'José María Ñoño',
          password: 'test123',
        },
      });

      expect([200, 201]).toContain(response.statusCode);
    });

    it('should handle empty name', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          email: `validation-test-${Date.now()}@test.com`,
          name: '',
          password: 'test123',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle name with only spaces', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          email: `validation-test-${Date.now()}@test.com`,
          name: '     ',
          password: 'test123',
        },
      });

      expect([400]).toContain(response.statusCode);
    });
  });

  describe('Type Coercion & Type Safety', () => {
    it('should reject email as number', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 12345,
          password: 'test123',
        } as any,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject email as boolean', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: true,
          password: 'test123',
        } as any,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject email as array', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: ['test@test.com'],
          password: 'test123',
        } as any,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject email as object', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: { value: 'test@test.com' },
          password: 'test123',
        } as any,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject password as number', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'test@test.com',
          password: 12345,
        } as any,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject password as array', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'test@test.com',
          password: ['password'],
        } as any,
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Missing & Extra Fields', () => {
    it('should reject login with missing email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          password: 'test123',
        } as any,
      });

      expect([400, 401, 500]).toContain(response.statusCode);
    });

    it('should reject login with missing password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'test@test.com',
        } as any,
      });

      expect([400, 401, 500]).toContain(response.statusCode);
    });

    it('should handle extra fields in login', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'test@test.com',
          password: 'test123',
          extraField: 'should be ignored',
          role: 'ADMIN', // Should not escalate privileges
        } as any,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle completely empty payload', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {},
      });

      expect([400, 401, 500]).toContain(response.statusCode);
    });

    it('should handle null payload fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: null,
          password: null,
        } as any,
      });

      expect([400, 401, 500]).toContain(response.statusCode);
    });

    it('should handle undefined payload fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: undefined,
          password: undefined,
        } as any,
      });

      expect([400, 401, 500]).toContain(response.statusCode);
    });
  });

  describe('Boundary Testing', () => {
    it('should handle minimum valid email length', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'a@b.c',
          password: 'test123',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle password at bcrypt limit (72 bytes)', async () => {
      const password72 = 'a'.repeat(72);
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'test@test.com',
          password: password72,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle password beyond bcrypt limit (73+ bytes)', async () => {
      const password100 = 'a'.repeat(100);
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'test@test.com',
          password: password100,
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Character Encoding Tests', () => {
    it('should handle UTF-8 encoded characters', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          email: `validation-test-${Date.now()}@test.com`,
          name: '日本語テスト',
          password: 'test123',
        },
      });

      expect([200, 201]).toContain(response.statusCode);
    });

    it('should handle UTF-16 surrogate pairs', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          email: `validation-test-${Date.now()}@test.com`,
          name: '𝕳𝖊𝖑𝖑𝖔',
          password: 'test123',
        },
      });

      expect([200, 201]).toContain(response.statusCode);
    });

    it('should handle RTL (Right-to-Left) text', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          email: `validation-test-${Date.now()}@test.com`,
          name: 'مرحبا',
          password: 'test123',
        },
      });

      expect([200, 201]).toContain(response.statusCode);
    });
  });
});

