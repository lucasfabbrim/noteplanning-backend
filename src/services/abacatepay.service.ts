import { PrismaClient, Customer, Purchase } from '@prisma/client';
import { BaseService } from './base.service';
import { CustomerRepository } from '@/repositories/customer.repository';
import { PurchaseService } from './purchase.service';
import { 
  AbacatePayWebhookBody, 
  CustomerFromWebhook 
} from '@/validators/abacatepay.validator';
import { LoggerHelper } from '@/utils/logger.helper';

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
      LoggerHelper.webhook('AbacatePay', event, {
        email: metadata.email,
        amount: billing.amount,
        devMode,
      });

      let customer: Customer;

      // Check if customer already exists
      const existingCustomer = await this.customerRepository.findByEmail(metadata.email);
      
      if (existingCustomer && !existingCustomer.deactivatedAt) {
        // Customer exists and is active, use existing customer
        LoggerHelper.info('AbacatePayService', 'processWebhook', 'Using existing customer', {
          customerId: existingCustomer.id,
        });
        
        customer = existingCustomer;
      } else if (existingCustomer && existingCustomer.deactivatedAt) {
        // Customer exists but was deactivated, reactivate them
        LoggerHelper.info('AbacatePayService', 'processWebhook', 'Reactivating customer', {
          customerId: existingCustomer.id,
        });

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

        LoggerHelper.info('AbacatePayService', 'processWebhook', 'Customer created', {
          customerId: customer.id,
        });
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

      LoggerHelper.info('AbacatePayService', 'processWebhook', 'Purchase created', {
        purchaseId: purchase.id,
        amount: purchase.amount,
      });

      return { customer, purchase };
    } catch (error) {
      LoggerHelper.error('AbacatePayService', 'processWebhook', 'Failed to process webhook', error);
      throw new Error(`Failed to process webhook`);
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

    switch (event) {
      case 'payment.completed':
      case 'sale.completed':
      case 'payment.approved':
        return await this.processWebhook(webhookData);
      
      case 'payment.pending':
      case 'payment.failed':
        LoggerHelper.info('AbacatePayService', 'handleWebhookEvent', 'Event ignored', { event });
        return null;
      
      default:
        LoggerHelper.warn('AbacatePayService', 'handleWebhookEvent', 'Unknown event type', { event });
        return null;
    }
  }
}

