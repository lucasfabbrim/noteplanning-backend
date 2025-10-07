import { PrismaClient } from '@prisma/client';
import { BaseService } from './base.service';
import { CustomerService } from './customer.service';
import { ProductService } from './product.service';
import { PurchaseService } from './purchase.service';

export class AbacatePayService extends BaseService {
  private customerService: CustomerService;
  private productService: ProductService;
  private purchaseService: PurchaseService;

  constructor(prisma: PrismaClient) {
    super(prisma);
    this.customerService = new CustomerService(prisma);
    this.productService = new ProductService(prisma);
    this.purchaseService = new PurchaseService(prisma);
  }

  async processWebhook(request: any) {
    const body = request.body;
    const headers = request.headers;

    if (!body || !body.data) {
      throw new Error('Invalid webhook payload');
    }

    const { data } = body;
    
    // Verificar se é um evento de billing
    if (data.billing?.customer?.metadata) {
      const customerData = data.billing.customer.metadata;
      
      // Criar ou encontrar customer
      let customer;
      try {
        customer = await this.customerService.createCustomer({
          email: customerData.email,
          name: customerData.name,
          password: 'temp_password',
        });
      } catch (error) {
        // Se customer já existe, buscar pelo email
        const existingCustomer = await this.prisma.customer.findUnique({
          where: { email: customerData.email }
        });
        if (existingCustomer) {
          customer = existingCustomer;
        } else {
          throw error;
        }
      }

      // Criar/atualizar produtos se existirem
      if (data.billing?.products) {
        for (const productData of data.billing.products) {
          await this.productService.createOrUpdateProduct(productData);
        }
      }

      // Criar purchase - sempre criar se há dados de billing
      const purchaseData = {
        customerId: customer.id,
        externalId: data.billing.purchase?.id || data.billing.id || `abacate_${Date.now()}`,
        amount: data.billing.purchase?.amount || data.billing.amount || 0,
        status: data.billing.purchase?.status || data.billing.status || 'completed',
        products: data.billing.products || [],
      };

      await this.purchaseService.createPurchase(purchaseData);
    }

    return { success: true, message: 'Webhook processed successfully' };
  }
}
