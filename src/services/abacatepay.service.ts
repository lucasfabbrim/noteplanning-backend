import { PrismaClient, Customer, Purchase } from '@prisma/client';
import { BaseService } from './base.service';
import { CustomerRepository } from '@/repositories/customer.repository';
import { PurchaseService } from './purchase.service';
import { EmailService } from './email.service';
import { 
  AbacatePayWebhookBody, 
  CustomerFromWebhook 
} from '@/validators/abacatepay.validator';
import { LoggerHelper } from '@/utils/logger.helper';
import { PasswordHelper } from '@/utils/password.helper';
import crypto from 'crypto';

/**
 * AbacatePay webhook service
 */
export class AbacatePayService extends BaseService {
  protected customerRepository: CustomerRepository;
  protected purchaseService: PurchaseService;
  protected emailService: EmailService;

  constructor(prisma: PrismaClient) {
    super(prisma);
    this.customerRepository = new CustomerRepository(prisma);
    this.purchaseService = new PurchaseService(prisma);
    this.emailService = new EmailService();
  }

  /**
   * Process webhook and create customer + purchase
   */
  async processWebhook(webhookData: AbacatePayWebhookBody): Promise<{ customer: Customer; purchase: Purchase }> {
    try {
      const { data, event, devMode } = webhookData;
      const { billing, payment } = data;
      const { customer: customerData, products } = billing;
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
        // Create new customer with unique password
        const randomPassword = PasswordHelper.generateUniquePassword();
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
          password: randomPassword,
          role: customerInput.role,
          isActive: true,
        });

        LoggerHelper.info('AbacatePayService', 'processWebhook', 'Customer created', {
          customerId: customer.id,
        });

        // Send welcome email with credentials
        try {
          await this.emailService.sendWelcomeEmail(
            metadata.email,
            metadata.name,
            metadata.email,
            randomPassword
          );
          
          LoggerHelper.info('AbacatePayService', 'processWebhook', 'Welcome email sent', {
            customerId: customer.id,
            email: metadata.email,
          });
        } catch (emailError) {
          LoggerHelper.error('AbacatePayService', 'processWebhook', 'Failed to send welcome email', emailError);
          // Don't fail the webhook if email fails
        }
      }

      // Create purchase record
      const purchase = await this.purchaseService.createPurchase({
        customerId: customer.id,
        amount: billing.amount,
        paymentAmount: payment?.amount || billing.amount,
        event: event,
        status: this.mapEventToStatus(event),
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: billing.customer?.metadata?.cellphone,
        customerTaxId: billing.customer?.metadata?.taxId,
        products: products || [],
        paymentMethod: 'abacatepay',
        transactionId: `abacatepay_${Date.now()}`,
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
   * Public HMAC key for AbacatePay
   */
  private readonly ABACATEPAY_PUBLIC_KEY = "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";

  /**
   * Verifies if the webhook signature matches the expected HMAC.
   * @param rawBody Raw request body string.
   * @param signatureFromHeader The signature received from `X-Webhook-Signature`.
   * @returns true if the signature is valid, false otherwise.
   */
  verifyAbacateSignature(rawBody: string, signatureFromHeader: string): boolean {
    const bodyBuffer = Buffer.from(rawBody, "utf8");

    const expectedSig = crypto
      .createHmac("sha256", this.ABACATEPAY_PUBLIC_KEY)
      .update(bodyBuffer)
      .digest("base64");

    const A = Buffer.from(expectedSig);
    const B = Buffer.from(signatureFromHeader);

    return A.length === B.length && crypto.timingSafeEqual(A, B);
  }

  /**
   * Validate webhook secret (legacy method - kept for compatibility)
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
      case 'billing.paid':
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

