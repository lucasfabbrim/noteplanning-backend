import { PrismaClient, Customer, Purchase } from '@prisma/client';
import { BaseService } from './base.service';
import { CustomerRepository } from '@/repositories/customer.repository';
import { PurchaseService } from './purchase.service';
import { 
  AbacatePayWebhookBody, 
  CustomerFromWebhook 
} from '@/validators/abacatepay.validator';
import { logger } from '@/config';

/**
 * AbacatePay webhook service
 */
export class AbacatePayService extends BaseService {
  protected customerRepository: CustomerRepository;
  protected purchaseService: PurchaseService;

  constructor(prisma: PrismaClient) {
    super(prisma);
    this.customerRepository = new CustomerRepository(prisma);
    this.purchaseService = new PurchaseService(prisma);
  }

  /**
   * Process webhook and create customer + purchase
   */
  async processWebhook(webhookData: AbacatePayWebhookBody): Promise<{ customer: Customer; purchase: Purchase }> {
    try {
      const { data, event, devMode, products } = webhookData;
      const { billing, payment } = data;
      const { customer: customerData } = billing;
      const { metadata } = customerData;

      // Log webhook received
      logger.info({
        event,
        devMode,
        email: metadata.email,
        name: metadata.name,
        products,
      }, devMode ? '[DEV] Webhook received from AbacatePay' : 'Webhook received from AbacatePay');

      let customer: Customer;

      // Check if customer already exists
      const existingCustomer = await this.customerRepository.findByEmail(metadata.email);
      
      if (existingCustomer && !existingCustomer.deactivatedAt) {
        // Customer exists and is active, use existing customer
        logger.info({
          email: metadata.email,
          existingCustomerId: existingCustomer.id,
        }, 'Using existing active customer for purchase');
        
        customer = existingCustomer;
      } else if (existingCustomer && existingCustomer.deactivatedAt) {
        // Customer exists but was deactivated, reactivate them
        logger.info({
          email: metadata.email,
          customerId: existingCustomer.id,
        }, 'Reactivating previously deactivated customer');

        customer = await this.customerRepository.update(existingCustomer.id, {
          name: metadata.name,
          deactivatedAt: null,
          isActive: true,
          updatedAt: new Date(),
        });
      } else {
        // Create new customer
        const customerInput: CustomerFromWebhook = {
          name: metadata.name,
          email: metadata.email,
          cellphone: metadata.cellphone,
          taxId: metadata.taxId,
          role: 'FREE',
        };

        customer = await this.customerRepository.create({
          name: customerInput.name,
          email: customerInput.email,
          password: '', // No password for webhook-created customers
          role: customerInput.role,
          isActive: true,
        });

        logger.info({
          customerId: customer.id,
          email: customer.email,
          name: customer.name,
          event,
          devMode,
        }, 'Customer created successfully from webhook');
      }

      // Create purchase record
      const purchase = await this.purchaseService.createPurchase({
        customerId: customer.id,
        amount: billing.amount,
        paymentAmount: payment.amount,
        event,
        status: this.mapEventToStatus(event),
        customerName: metadata.name,
        customerEmail: metadata.email,
        customerPhone: metadata.cellphone,
        customerTaxId: metadata.taxId,
        products: products || [],
        webhookData: webhookData as any,
        devMode: devMode || false,
      });

      logger.info({
        customerId: customer.id,
        purchaseId: purchase.id,
        amount: purchase.amount,
        products: products,
      }, 'Purchase created successfully from webhook');

      return { customer, purchase };
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      }, 'Failed to process webhook');

      throw new Error(`Failed to process webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Map webhook event to purchase status
   */
  private mapEventToStatus(event: string): string {
    switch (event) {
      case 'payment.completed':
      case 'sale.completed':
      case 'payment.approved':
        return 'completed';
      case 'payment.pending':
        return 'pending';
      case 'payment.failed':
        return 'failed';
      case 'payment.refunded':
        return 'refunded';
      default:
        return 'pending';
    }
  }

  /**
   * Validate webhook secret
   */
  validateWebhookSecret(providedSecret: string, expectedSecret: string): boolean {
    return providedSecret === expectedSecret;
  }

  /**
   * Handle different webhook event types
   */
  async handleWebhookEvent(webhookData: AbacatePayWebhookBody): Promise<{ customer: Customer; purchase: Purchase } | null> {
    const { event } = webhookData;

    logger.info({ event }, 'Processing webhook event');

    switch (event) {
      case 'payment.completed':
      case 'sale.completed':
      case 'payment.approved':
        return await this.processWebhook(webhookData);
      
      case 'payment.pending':
      case 'payment.failed':
        logger.info({ event }, 'Webhook event received but no action taken');
        return null;
      
      default:
        logger.warn({ event }, 'Unknown webhook event type');
        return null;
    }
  }
}

