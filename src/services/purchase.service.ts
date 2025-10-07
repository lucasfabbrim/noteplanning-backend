import { PrismaClient } from '@prisma/client';
import { BaseService } from './base.service';
import { PurchaseRepository } from '@/repositories';

export class PurchaseService extends BaseService {
  private purchaseRepository: PurchaseRepository;

  constructor(prisma: PrismaClient) {
    super(prisma);
    this.purchaseRepository = new PurchaseRepository(prisma);
  }

  async getAllPurchases(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;
      
      const [purchases, total] = await Promise.all([
        this.prisma.purchase.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        this.prisma.purchase.count(),
      ]);

      return {
        purchases,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to get purchases: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPurchaseById(id: string) {
    try {
      const purchase = await this.prisma.purchase.findFirst({
        where: { id, deactivatedAt: null },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!purchase) {
        throw new Error('Purchase not found');
      }

      return purchase;
    } catch (error) {
      throw new Error(`Failed to get purchase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPurchasesByCustomerId(customerId: string) {
    try {
      return await this.purchaseRepository.findByCustomerIdWithCustomer(customerId);
    } catch (error) {
      throw new Error(`Failed to get customer purchases: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createPurchase(data: {
    customerId: string;
    externalId?: string;
    amount: number;
    status: string;
    products?: any[];
  }) {
    try {
      // Buscar dados do customer para preencher corretamente
      const customer = await this.prisma.customer.findUnique({
        where: { id: data.customerId },
        select: { name: true, email: true }
      });

      const purchase = await this.prisma.purchase.create({
        data: {
          customerId: data.customerId,
          amount: data.amount,
          paymentAmount: data.amount,
          event: 'purchase_created',
          status: data.status,
          customerName: customer?.name || 'Customer',
          customerEmail: customer?.email || 'customer@example.com',
          transactionId: data.externalId,
          products: data.products ? data.products : undefined,
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return purchase;
    } catch (error) {
      throw new Error(`Failed to create purchase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async hasVideoAccess(customerId: string, videoId: string): Promise<boolean> {
    try {
      const purchase = await this.prisma.purchase.findFirst({
        where: {
          customerId,
          deactivatedAt: null,
          status: 'completed',
        },
        include: {
          customer: true,
        },
      });

      return !!purchase;
    } catch (error) {
      return false;
    }
  }

  async hasSpecificProducts(customerId: string, productIds: string[]): Promise<boolean> {
    try {
      const purchases = await this.prisma.purchase.findMany({
        where: {
          customerId,
          deactivatedAt: null,
          status: 'completed',
        },
      });

      return purchases.length > 0;
    } catch (error) {
      return false;
    }
  }

  async getCustomerProducts(customerId: string) {
    try {
      const purchases = await this.prisma.purchase.findMany({
        where: {
          customerId,
          deactivatedAt: null,
          status: 'completed',
        },
      });

      return purchases;
    } catch (error) {
      throw new Error(`Failed to get customer products: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async hasVideoAccessInPurchase(customerId: string, videoId: string): Promise<boolean> {
    try {
      const purchase = await this.prisma.purchase.findFirst({
        where: {
          customerId,
          deactivatedAt: null,
          status: 'completed',
        },
      });

      return !!purchase;
    } catch (error) {
      return false;
    }
  }
}
