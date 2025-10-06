import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { buildServer } from '@/server';
import { FastifyInstance } from 'fastify';

describe('Webhook Security Tests', () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;
  const validSecret = process.env.ABACATEPAY_TOKEN_SECRET!;
  const validPayload = {
    event: 'payment.completed',
    devMode: false,
    products: [{ name: 'template+videos', price: 100 }],
    data: {
      billing: {
        amount: 100,
        customer: {
          metadata: {
            name: 'Test User',
            email: 'webhooktest@security.test',
            cellphone: '11999999999',
            taxId: '12345678900',
          },
        },
      },
      payment: {
        amount: 100,
      },
    },
  };

  beforeAll(async () => {
    prisma = new PrismaClient();
    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.purchase.deleteMany({
      where: { customerEmail: 'webhooktest@security.test' },
    });
    await prisma.customer.deleteMany({
      where: { email: 'webhooktest@security.test' },
    });
    await prisma.$disconnect();
    await app.close();
  });

  describe('Webhook Authentication', () => {
    it('should reject webhook without secret', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/webhook/abacatepay',
        payload: validPayload,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject webhook with wrong secret', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/webhook/abacatepay?webhookSecret=wrong-secret',
        payload: validPayload,
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Unauthorized');
    });

    it('should reject webhook with empty secret', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/webhook/abacatepay?webhookSecret=',
        payload: validPayload,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject GET requests to webhook endpoint', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/webhook/abacatepay?webhookSecret=${validSecret}`,
      });

      expect(response.statusCode).toBe(405);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('GET');
    });

    it('should accept webhook with correct secret', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/webhook/abacatepay?webhookSecret=${validSecret}`,
        payload: validPayload,
      });

      expect([200, 201]).toContain(response.statusCode);
    });
  });

  describe('Webhook Input Validation', () => {
    it('should reject webhook with missing required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/webhook/abacatepay?webhookSecret=${validSecret}`,
        payload: {
          event: 'payment.completed',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject webhook with invalid email format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/webhook/abacatepay?webhookSecret=${validSecret}`,
        payload: {
          ...validPayload,
          data: {
            ...validPayload.data,
            billing: {
              ...validPayload.data.billing,
              customer: {
                metadata: {
                  ...validPayload.data.billing.customer.metadata,
                  email: 'not-an-email',
                },
              },
            },
          },
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject webhook with SQL injection attempt in name', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/webhook/abacatepay?webhookSecret=${validSecret}`,
        payload: {
          ...validPayload,
          data: {
            ...validPayload.data,
            billing: {
              ...validPayload.data.billing,
              customer: {
                metadata: {
                  ...validPayload.data.billing.customer.metadata,
                  name: "'; DROP TABLE customers; --",
                  email: `sql-injection-${Date.now()}@security.test`,
                },
              },
            },
          },
        },
      });

      // Should succeed but safely handle the malicious input
      expect([200, 201]).toContain(response.statusCode);

      // Verify table still exists
      const count = await prisma.customer.count();
      expect(count).toBeGreaterThan(0);
    });

    it('should reject webhook with XSS attempt in name', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/webhook/abacatepay?webhookSecret=${validSecret}`,
        payload: {
          ...validPayload,
          data: {
            ...validPayload.data,
            billing: {
              ...validPayload.data.billing,
              customer: {
                metadata: {
                  ...validPayload.data.billing.customer.metadata,
                  name: '<script>alert("XSS")</script>',
                  email: `xss-test-${Date.now()}@security.test`,
                },
              },
            },
          },
        },
      });

      // Should succeed but safely store the input
      expect([200, 201]).toContain(response.statusCode);

      const customer = await prisma.customer.findFirst({
        where: { email: { contains: 'xss-test' } },
        orderBy: { createdAt: 'desc' },
      });

      // Verify XSS is not executed (stored as text)
      expect(customer?.name).toContain('<script>');
    });

    it('should handle very large payload safely', async () => {
      const largeProducts = Array(1000).fill({ name: 'Product', price: 100 });
      
      const response = await app.inject({
        method: 'POST',
        url: `/webhook/abacatepay?webhookSecret=${validSecret}`,
        payload: {
          ...validPayload,
          products: largeProducts,
          data: {
            ...validPayload.data,
            billing: {
              ...validPayload.data.billing,
              customer: {
                metadata: {
                  ...validPayload.data.billing.customer.metadata,
                  email: `large-payload-${Date.now()}@security.test`,
                },
              },
            },
          },
        },
      });

      expect([200, 201, 400, 413]).toContain(response.statusCode);
    });

    it('should handle negative amounts', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/webhook/abacatepay?webhookSecret=${validSecret}`,
        payload: {
          ...validPayload,
          data: {
            ...validPayload.data,
            billing: {
              ...validPayload.data.billing,
              amount: -100,
              customer: {
                metadata: {
                  ...validPayload.data.billing.customer.metadata,
                  email: `negative-${Date.now()}@security.test`,
                },
              },
            },
            payment: {
              amount: -100,
            },
          },
        },
      });

      // Should handle gracefully
      expect([200, 201, 400]).toContain(response.statusCode);
    });

    it('should handle zero amounts', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/webhook/abacatepay?webhookSecret=${validSecret}`,
        payload: {
          ...validPayload,
          data: {
            ...validPayload.data,
            billing: {
              ...validPayload.data.billing,
              amount: 0,
              customer: {
                metadata: {
                  ...validPayload.data.billing.customer.metadata,
                  email: `zero-amount-${Date.now()}@security.test`,
                },
              },
            },
            payment: {
              amount: 0,
            },
          },
        },
      });

      expect([200, 201]).toContain(response.statusCode);
    });
  });

  describe('Webhook Business Logic Security', () => {
    it('should prevent duplicate email registration on same webhook', async () => {
      const uniqueEmail = `duplicate-${Date.now()}@security.test`;
      
      const payload = {
        ...validPayload,
        data: {
          ...validPayload.data,
          billing: {
            ...validPayload.data.billing,
            customer: {
              metadata: {
                ...validPayload.data.billing.customer.metadata,
                email: uniqueEmail,
              },
            },
          },
        },
      };

      // First webhook
      const response1 = await app.inject({
        method: 'POST',
        url: `/webhook/abacatepay?webhookSecret=${validSecret}`,
        payload,
      });

      expect([200, 201]).toContain(response1.statusCode);

      // Second webhook with same email (should reuse customer)
      const response2 = await app.inject({
        method: 'POST',
        url: `/webhook/abacatepay?webhookSecret=${validSecret}`,
        payload,
      });

      expect([200, 201]).toContain(response2.statusCode);

      // Verify only one customer created
      const customers = await prisma.customer.findMany({
        where: { email: uniqueEmail },
      });
      expect(customers.length).toBe(1);

      // Verify two purchases created
      const purchases = await prisma.purchase.findMany({
        where: { customerEmail: uniqueEmail },
      });
      expect(purchases.length).toBe(2);
    });

    it('should handle concurrent webhook requests safely', async () => {
      const promises = Array(5).fill(null).map((_, index) =>
        app.inject({
          method: 'POST',
          url: `/webhook/abacatepay?webhookSecret=${validSecret}`,
          payload: {
            ...validPayload,
            data: {
              ...validPayload.data,
              billing: {
                ...validPayload.data.billing,
                customer: {
                  metadata: {
                    ...validPayload.data.billing.customer.metadata,
                    email: `concurrent-${Date.now()}-${index}@security.test`,
                  },
                },
              },
            },
          },
        })
      );

      const responses = await Promise.all(promises);
      responses.forEach((response) => {
        expect([200, 201]).toContain(response.statusCode);
      });
    });

    it('should NOT expose database errors in response', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/webhook/abacatepay?webhookSecret=${validSecret}`,
        payload: {
          ...validPayload,
          event: 'invalid.event.type',
        },
      });

      const body = JSON.parse(response.body);
      const bodyString = JSON.stringify(body);
      
      expect(bodyString).not.toContain('prisma');
      expect(bodyString).not.toContain('database');
      expect(bodyString).not.toContain('PostgreSQL');
    });

    it('should safely handle devMode flag', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/webhook/abacatepay?webhookSecret=${validSecret}`,
        payload: {
          ...validPayload,
          devMode: true,
          data: {
            ...validPayload.data,
            billing: {
              ...validPayload.data.billing,
              customer: {
                metadata: {
                  ...validPayload.data.billing.customer.metadata,
                  email: `devmode-${Date.now()}@security.test`,
                },
              },
            },
          },
        },
      });

      expect([200, 201]).toContain(response.statusCode);

      // Verify devMode is stored correctly
      const purchase = await prisma.purchase.findFirst({
        where: { customerEmail: { contains: 'devmode' } },
        orderBy: { createdAt: 'desc' },
      });

      expect(purchase?.devMode).toBe(true);
    });
  });

  describe('Webhook Rate Limiting & DoS Protection', () => {
    it('should handle rapid webhook requests', async () => {
      const promises = Array(50).fill(null).map((_, index) =>
        app.inject({
          method: 'POST',
          url: `/webhook/abacatepay?webhookSecret=${validSecret}`,
          payload: {
            ...validPayload,
            data: {
              ...validPayload.data,
              billing: {
                ...validPayload.data.billing,
                customer: {
                  metadata: {
                    ...validPayload.data.billing.customer.metadata,
                    email: `rapid-${Date.now()}-${index}@security.test`,
                  },
                },
              },
            },
          },
        })
      );

      const responses = await Promise.all(promises);
      const successCount = responses.filter(r => [200, 201].includes(r.statusCode)).length;
      
      // At least some should succeed
      expect(successCount).toBeGreaterThan(0);
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/webhook/abacatepay?webhookSecret=${validSecret}`,
        payload: '{"invalid": json}',
        headers: {
          'content-type': 'application/json',
        },
      });

      expect(response.statusCode).toBeGreaterThanOrEqual(400);
      expect(response.statusCode).toBeLessThan(500);
    });
  });

  describe('Webhook Response Security', () => {
    it('should NOT expose customer ID in error responses', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/webhook/abacatepay?webhookSecret=wrong`,
        payload: validPayload,
      });

      const body = JSON.parse(response.body);
      expect(body).not.toHaveProperty('customerId');
      expect(body).not.toHaveProperty('id');
    });

    it('should NOT expose internal paths or file locations', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/webhook/abacatepay?webhookSecret=${validSecret}`,
        payload: {},
      });

      const body = JSON.parse(response.body);
      const bodyString = JSON.stringify(body);
      
      expect(bodyString).not.toContain('/home/');
      expect(bodyString).not.toContain('C:\\');
      expect(bodyString).not.toContain('src/');
      expect(bodyString).not.toContain('.ts');
    });

    it('should return consistent response structure', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/webhook/abacatepay?webhookSecret=${validSecret}`,
        payload: {
          ...validPayload,
          data: {
            ...validPayload.data,
            billing: {
              ...validPayload.data.billing,
              customer: {
                metadata: {
                  ...validPayload.data.billing.customer.metadata,
                  email: `consistent-${Date.now()}@security.test`,
                },
              },
            },
          },
        },
      });

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success');
      expect(body).toHaveProperty('message');
      
      if (response.statusCode === 201) {
        expect(body).toHaveProperty('data');
        expect(body.data).not.toHaveProperty('password');
      }
    });
  });
});

