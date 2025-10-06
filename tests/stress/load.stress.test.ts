import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { buildServer } from '@/server';
import { FastifyInstance } from 'fastify';

describe('Load & Stress Tests', () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;
  let adminToken: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    app = await buildServer();
    await app.ready();

    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.customer.upsert({
      where: { email: 'stress-admin@test.com' },
      update: {},
      create: {
        email: 'stress-admin@test.com',
        name: 'Stress Admin',
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
      where: { email: { contains: 'stress-test' } },
    });
    await prisma.customer.delete({
      where: { email: 'stress-admin@test.com' },
    }).catch(() => {});
    await prisma.$disconnect();
    await app.close();
  });

  describe('Rate Limiting & DoS Protection', () => {
    it('should handle 100 rapid sequential login attempts', async () => {
      const promises = Array(100).fill(null).map(() =>
        app.inject({
          method: 'POST',
          url: '/api/customers/login',
          payload: {
            email: 'test@test.com',
            password: 'test123',
          },
        })
      );

      const responses = await Promise.all(promises);
      
      // All should return 401 (invalid credentials)
      responses.forEach((response) => {
        expect(response.statusCode).toBe(401);
      });

      // Check server didn't crash
      const healthCheck = await app.inject({
        method: 'GET',
        url: '/health',
      });
      expect(healthCheck.statusCode).toBe(200);
    });

    it('should handle 200 concurrent requests to health endpoint', async () => {
      const promises = Array(200).fill(null).map(() =>
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

    it('should handle 50 concurrent authenticated requests', async () => {
      const promises = Array(50).fill(null).map(() =>
        app.inject({
          method: 'GET',
          url: '/api/customers',
          headers: {
            authorization: `Bearer ${adminToken}`,
          },
        })
      );

      const responses = await Promise.all(promises);
      
      responses.forEach((response) => {
        expect(response.statusCode).toBe(200);
      });
    });

    it('should handle very rapid fire requests (stress test)', async () => {
      const startTime = Date.now();
      const promises = Array(500).fill(null).map(() =>
        app.inject({
          method: 'GET',
          url: '/health',
        })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Handled 500 requests in ${duration}ms`);
      
      // Should complete within reasonable time (30 seconds)
      expect(duration).toBeLessThan(30000);
      
      // Most should succeed
      const successCount = responses.filter(r => r.statusCode === 200).length;
      expect(successCount).toBeGreaterThan(400);
    });
  });

  describe('Race Conditions & Concurrency', () => {
    it('should handle concurrent customer creation with same email', async () => {
      const uniqueEmail = `stress-test-concurrent-${Date.now()}@test.com`;
      
      const promises = Array(10).fill(null).map(() =>
        app.inject({
          method: 'POST',
          url: '/api/customers',
          headers: {
            authorization: `Bearer ${adminToken}`,
          },
          payload: {
            email: uniqueEmail,
            name: 'Concurrent Test',
            password: 'test123',
          },
        })
      );

      const responses = await Promise.all(promises);
      
      // Only one should succeed (201), others should fail (409 or 400)
      const successCount = responses.filter(r => r.statusCode === 201).length;
      const conflictCount = responses.filter(r => [400, 409, 500].includes(r.statusCode)).length;
      
      expect(successCount).toBeLessThanOrEqual(1);
      expect(successCount + conflictCount).toBe(10);

      // Verify only one customer created
      const customers = await prisma.customer.findMany({
        where: { email: uniqueEmail },
      });
      expect(customers.length).toBeLessThanOrEqual(1);
    });

    it('should handle concurrent webhook requests with same customer', async () => {
      const uniqueEmail = `stress-test-webhook-${Date.now()}@test.com`;
      const validSecret = process.env.ABACATEPAY_TOKEN_SECRET!;

      const promises = Array(10).fill(null).map((_, index) =>
        app.inject({
          method: 'POST',
          url: `/webhook/abacatepay?webhookSecret=${validSecret}`,
          payload: {
            event: 'payment.completed',
            devMode: false,
            products: [{ name: 'product', price: 100 }],
            data: {
              billing: {
                amount: 100,
                customer: {
                  metadata: {
                    name: 'Concurrent Webhook Test',
                    email: uniqueEmail,
                    cellphone: '11999999999',
                    taxId: '12345678900',
                  },
                },
              },
              payment: {
                amount: 100,
              },
            },
          },
        })
      );

      const responses = await Promise.all(promises);
      
      // All should succeed or gracefully handle
      responses.forEach((response) => {
        expect([200, 201, 409, 500]).toContain(response.statusCode);
      });

      // Verify customer created correctly
      const customers = await prisma.customer.findMany({
        where: { email: uniqueEmail },
      });
      expect(customers.length).toBeLessThanOrEqual(1);

      // Verify multiple purchases created
      const purchases = await prisma.purchase.findMany({
        where: { customerEmail: uniqueEmail },
      });
      expect(purchases.length).toBeGreaterThan(0);
      expect(purchases.length).toBeLessThanOrEqual(10);
    });

    it('should handle concurrent updates to same customer', async () => {
      // Create test customer
      const testEmail = `stress-test-update-${Date.now()}@test.com`;
      const customer = await prisma.customer.create({
        data: {
          email: testEmail,
          name: 'Original Name',
          password: await bcrypt.hash('test123', 10),
          role: Role.FREE,
        },
      });

      // Try to update concurrently
      const promises = Array(20).fill(null).map((_, index) =>
        app.inject({
          method: 'PUT',
          url: `/api/customers/${customer.id}`,
          headers: {
            authorization: `Bearer ${adminToken}`,
          },
          payload: {
            name: `Updated Name ${index}`,
          },
        })
      );

      const responses = await Promise.all(promises);
      
      // All should complete (success or error)
      responses.forEach((response) => {
        expect([200, 400, 404, 500]).toContain(response.statusCode);
      });

      // Verify customer still exists and is valid
      const updatedCustomer = await prisma.customer.findUnique({
        where: { id: customer.id },
      });
      expect(updatedCustomer).toBeTruthy();
      expect(updatedCustomer?.name).toContain('Updated Name');
    });

    it('should handle concurrent soft-deletes', async () => {
      const testEmail = `stress-test-delete-${Date.now()}@test.com`;
      const customer = await prisma.customer.create({
        data: {
          email: testEmail,
          name: 'To Be Deleted',
          password: await bcrypt.hash('test123', 10),
          role: Role.FREE,
        },
      });

      const promises = Array(10).fill(null).map(() =>
        app.inject({
          method: 'DELETE',
          url: `/api/customers/${customer.id}`,
          headers: {
            authorization: `Bearer ${adminToken}`,
          },
        })
      );

      const responses = await Promise.all(promises);
      
      responses.forEach((response) => {
        expect([200, 404]).toContain(response.statusCode);
      });

      // Verify customer is soft-deleted
      const deletedCustomer = await prisma.customer.findUnique({
        where: { id: customer.id },
      });
      expect(deletedCustomer?.deactivatedAt).toBeTruthy();
    });
  });

  describe('Memory & Resource Tests', () => {
    it('should handle large payload (near limit)', async () => {
      const largePayload = {
        email: `stress-test-large-${Date.now()}@test.com`,
        name: 'A'.repeat(5000), // 5KB name
        password: 'test123',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/customers',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: largePayload,
      });

      expect([200, 201, 400, 413]).toContain(response.statusCode);
    });

    it('should handle deeply nested JSON', async () => {
      let nested: any = { value: 'deep' };
      for (let i = 0; i < 100; i++) {
        nested = { nested };
      }

      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: nested,
      });

      expect([400, 401, 500]).toContain(response.statusCode);
    });

    it('should handle array with many elements', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: Array(1000).fill('test@test.com'),
          password: 'test123',
        } as any,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle string with many repeated characters', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: {
          email: 'test@test.com',
          password: 'a'.repeat(50000),
        },
      });

      expect([401, 413]).toContain(response.statusCode);
    });
  });

  describe('Error Recovery & Stability', () => {
    it('should recover from malformed JSON', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: '{"email": "test@test.com", "password": "test123"',
        headers: {
          'content-type': 'application/json',
        },
      });

      expect([400, 401]).toContain(response.statusCode);

      // Verify server still works
      const healthCheck = await app.inject({
        method: 'GET',
        url: '/health',
      });
      expect(healthCheck.statusCode).toBe(200);
    });

    it('should recover from invalid content-type', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers/login',
        payload: 'email=test@test.com&password=test123',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
      });

      expect([400, 401, 415]).toContain(response.statusCode);
    });

    it('should handle rapid connection open/close', async () => {
      const promises = Array(100).fill(null).map(async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/health',
        });
        return response;
      });

      const responses = await Promise.all(promises);
      
      responses.forEach((response) => {
        expect(response.statusCode).toBe(200);
      });
    });

    it('should maintain stability after multiple error scenarios', async () => {
      // Mix of various error-inducing requests
      const errorRequests = [
        app.inject({ method: 'POST', url: '/api/customers/login', payload: {} }),
        app.inject({ method: 'POST', url: '/api/customers/login', payload: null as any }),
        app.inject({ method: 'POST', url: '/api/customers/login', payload: 'invalid' as any }),
        app.inject({ method: 'GET', url: '/api/customers' }), // No auth
        app.inject({ method: 'GET', url: '/nonexistent' }),
        app.inject({ method: 'POST', url: '/api/customers/login', payload: { email: 12345, password: true } as any }),
      ];

      await Promise.all(errorRequests);

      // Server should still be healthy
      const healthCheck = await app.inject({
        method: 'GET',
        url: '/health',
      });
      expect(healthCheck.statusCode).toBe(200);

      // Should still handle valid requests
      const validRequest = await app.inject({
        method: 'GET',
        url: '/api/customers',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });
      expect(validRequest.statusCode).toBe(200);
    });
  });

  describe('Database Connection Stress', () => {
    it('should handle many concurrent database queries', async () => {
      const promises = Array(100).fill(null).map(() =>
        app.inject({
          method: 'GET',
          url: '/api/customers',
          headers: {
            authorization: `Bearer ${adminToken}`,
          },
        })
      );

      const responses = await Promise.all(promises);
      
      const successCount = responses.filter(r => r.statusCode === 200).length;
      expect(successCount).toBe(100);
    });

    it('should handle mixed read/write operations', async () => {
      const operations = [];

      // Mix of reads and writes
      for (let i = 0; i < 30; i++) {
        // Read operation
        operations.push(
          app.inject({
            method: 'GET',
            url: '/api/customers',
            headers: {
              authorization: `Bearer ${adminToken}`,
            },
          })
        );

        // Write operation (if i is even)
        if (i % 2 === 0) {
          operations.push(
            app.inject({
              method: 'POST',
              url: '/api/customers',
              headers: {
                authorization: `Bearer ${adminToken}`,
              },
              payload: {
                email: `stress-test-mixed-${Date.now()}-${i}@test.com`,
                name: `Test User ${i}`,
                password: 'test123',
              },
            })
          );
        }
      }

      const responses = await Promise.all(operations);
      
      // Most should succeed
      const successCount = responses.filter(r => [200, 201].includes(r.statusCode)).length;
      expect(successCount).toBeGreaterThan(operations.length * 0.8); // At least 80% success
    });
  });
});

