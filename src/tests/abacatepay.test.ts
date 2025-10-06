import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { AbacatePayService } from '@/services/abacatepay.service';
import { AbacatePayWebhookBody } from '@/validators/abacatepay.validator';

const prisma = new PrismaClient();
const abacatePayService = new AbacatePayService(prisma);

describe('AbacatePay Webhook Integration', () => {
  beforeAll(async () => {
    // Connect to database
    await prisma.$connect();
  });

  afterAll(async () => {
    // Clean up and disconnect
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.customer.deleteMany({
      where: {
        email: {
          contains: 'test-webhook',
        },
      },
    });
  });

  describe('processWebhook', () => {
    it('should create a new customer from webhook data', async () => {
      const webhookData: AbacatePayWebhookBody = {
        data: {
          billing: {
            customer: {
              metadata: {
                name: 'Test Customer Webhook',
                email: 'test-webhook-create@example.com',
                cellphone: '11999999999',
                taxId: '12345678900',
              },
            },
            amount: 99.90,
          },
          payment: {
            amount: 99.90,
          },
        },
        products: [],
        event: 'payment.completed',
        devMode: true,
      };

      const customer = await abacatePayService.processWebhook(webhookData);

      expect(customer).toBeDefined();
      expect(customer.name).toBe('Test Customer Webhook');
      expect(customer.email).toBe('test-webhook-create@example.com');
      expect(customer.role).toBe('FREE');
      expect(customer.isActive).toBe(true);
      expect(customer.deactivatedAt).toBeNull();
    });

    it('should throw error if customer with email already exists', async () => {
      const webhookData: AbacatePayWebhookBody = {
        data: {
          billing: {
            customer: {
              metadata: {
                name: 'Test Customer Duplicate',
                email: 'test-webhook-duplicate@example.com',
                cellphone: '11999999999',
              },
            },
            amount: 99.90,
          },
          payment: {
            amount: 99.90,
          },
        },
        products: [],
        event: 'payment.completed',
        devMode: false,
      };

      // Create customer first time
      await abacatePayService.processWebhook(webhookData);

      // Try to create again with same email
      await expect(
        abacatePayService.processWebhook(webhookData)
      ).rejects.toThrow('CUSTOMER_ALREADY_EXISTS');
    });

    it('should reactivate a deactivated customer', async () => {
      // Create and deactivate a customer
      const customer = await prisma.customer.create({
        data: {
          name: 'Deactivated Customer',
          email: 'test-webhook-reactivate@example.com',
          password: '',
          role: 'FREE',
          isActive: false,
          deactivatedAt: new Date(),
        },
      });

      expect(customer.deactivatedAt).not.toBeNull();

      const webhookData: AbacatePayWebhookBody = {
        data: {
          billing: {
            customer: {
              metadata: {
                name: 'Reactivated Customer',
                email: 'test-webhook-reactivate@example.com',
                cellphone: '11999999999',
              },
            },
            amount: 99.90,
          },
          payment: {
            amount: 99.90,
          },
        },
        products: [],
        event: 'payment.completed',
        devMode: false,
      };

      const reactivatedCustomer = await abacatePayService.processWebhook(webhookData);

      expect(reactivatedCustomer).toBeDefined();
      expect(reactivatedCustomer.id).toBe(customer.id);
      expect(reactivatedCustomer.name).toBe('Reactivated Customer');
      expect(reactivatedCustomer.deactivatedAt).toBeNull();
      expect(reactivatedCustomer.isActive).toBe(true);
    });
  });

  describe('validateWebhookSecret', () => {
    it('should return true for valid secret', () => {
      const result = abacatePayService.validateWebhookSecret('secret123', 'secret123');
      expect(result).toBe(true);
    });

    it('should return false for invalid secret', () => {
      const result = abacatePayService.validateWebhookSecret('wrong-secret', 'correct-secret');
      expect(result).toBe(false);
    });

    it('should return false for empty secret', () => {
      const result = abacatePayService.validateWebhookSecret('', 'correct-secret');
      expect(result).toBe(false);
    });
  });

  describe('handleWebhookEvent', () => {
    it('should process payment.completed event', async () => {
      const webhookData: AbacatePayWebhookBody = {
        data: {
          billing: {
            customer: {
              metadata: {
                name: 'Event Test Customer',
                email: 'test-webhook-event@example.com',
                cellphone: '11999999999',
              },
            },
            amount: 149.90,
          },
          payment: {
            amount: 149.90,
          },
        },
        products: [],
        event: 'payment.completed',
        devMode: false,
      };

      const customer = await abacatePayService.handleWebhookEvent(webhookData);

      expect(customer).toBeDefined();
      expect(customer?.email).toBe('test-webhook-event@example.com');
    });

    it('should return null for unhandled events', async () => {
      const webhookData: AbacatePayWebhookBody = {
        data: {
          billing: {
            customer: {
              metadata: {
                name: 'Unhandled Event Customer',
                email: 'test-webhook-unhandled@example.com',
                cellphone: '11999999999',
              },
            },
            amount: 99.90,
          },
          payment: {
            amount: 99.90,
          },
        },
        products: [],
        event: 'payment.pending',
        devMode: false,
      };

      const customer = await abacatePayService.handleWebhookEvent(webhookData);

      expect(customer).toBeNull();
    });
  });
});

