import { PrismaClient } from '@prisma/client';
import { BaseService } from './base.service';
import { CustomerService } from './customer.service';
import { PurchaseService } from './purchase.service';
import { EmailService } from './email.service';
import bcrypt from 'bcryptjs';

export class AbacatePayService extends BaseService {
  private customerService: CustomerService;
  private purchaseService: PurchaseService;
  private emailService: EmailService;

  constructor(prisma: PrismaClient) {
    super(prisma);
    this.customerService = new CustomerService(prisma);
    this.purchaseService = new PurchaseService(prisma);
    this.emailService = new EmailService();
  }

  async processWebhook(request: any) {
    const body = request.body;
    const headers = request.headers;

    if (!body || !body.data) {
      throw new Error('Invalid webhook payload');
    }

    const { data } = body;
    
    // Log para debug
    console.log('Webhook payload received:', JSON.stringify(body, null, 2));
    console.log('Event type:', body.event);
    
    // Verificar se é o evento correto
    if (body.event === 'billing.paid' && data.billing?.customer?.metadata) {
      const customerData = data.billing.customer.metadata;
      console.log('Customer data from webhook:', customerData);
      
      // Verificar se customer já existe
      const existingCustomer = await this.prisma.customer.findUnique({
        where: { email: customerData.email }
      });
      
      console.log('Existing customer found:', existingCustomer ? 'Yes' : 'No');

      let customer;
      let isNewCustomer = false;
      let generatedPassword = '';

      if (existingCustomer) {
        // Customer já existe
        customer = existingCustomer;
        
        // Enviar email informando que a conta já existe
        await this.emailService.sendExistingAccountEmail(
          customer.email,
          customer.name
        );
      } else {
        // Customer novo - gerar senha aleatória
        generatedPassword = this.generateRandomPassword();
        
        customer = await this.customerService.createCustomer({
          email: customerData.email,
          name: customerData.name,
          phone: customerData.cellphone,
          password: generatedPassword, // Senha em texto plano - o CustomerService fará o hash
        });
        
        isNewCustomer = true;
        
        const emailSent = await this.emailService.sendWelcomeEmailWithPassword(
          customer.email,
          customer.name,
          generatedPassword
        );
      }

      // Produtos removidos - não mais suportados no novo schema

      // Criar purchase
      const purchaseData = {
        customerId: customer.id,
        externalId: data.billing.purchase?.id || data.billing.id || `abacate_${Date.now()}`,
        amount: data.billing.purchase?.amount || data.billing.amount || 0,
        status: data.billing.purchase?.status || data.billing.status || 'completed',
        products: data.billing.products || [],
      };

      await this.purchaseService.createPurchase(purchaseData);
    } else {
      console.log('Event not handled:', body.event);
    }

    return { success: true, message: 'Webhook processed successfully' };
  }

  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
