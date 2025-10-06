import { PrismaClient, Purchase, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

/**
 * Purchase repository
 */
export class PurchaseRepository extends BaseRepository<Purchase> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Create a new purchase
   */
  async create(data: Prisma.PurchaseCreateInput): Promise<Purchase> {
    return this.prisma.purchase.create({
      data,
    });
  }

  /**
   * Find purchase by ID
   */
  async findById(id: string): Promise<Purchase | null> {
    return this.prisma.purchase.findUnique({
      where: { id },
    });
  }

  /**
   * Update purchase
   */
  async update(id: string, data: Prisma.PurchaseUpdateInput): Promise<Purchase> {
    return this.prisma.purchase.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete purchase (soft delete)
   */
  async delete(id: string): Promise<Purchase> {
    return this.prisma.purchase.update({
      where: { id },
      data: { deactivatedAt: new Date() },
    });
  }

  /**
   * Find purchases by customer ID
   */
  async findByCustomerId(customerId: string): Promise<Purchase[]> {
    return this.prisma.purchase.findMany({
      where: {
        customerId,
        deactivatedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Find purchases by customer email
   */
  async findByCustomerEmail(email: string): Promise<Purchase[]> {
    return this.prisma.purchase.findMany({
      where: {
        customerEmail: email,
        deactivatedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Find purchases by status
   */
  async findByStatus(status: string): Promise<Purchase[]> {
    return this.prisma.purchase.findMany({
      where: {
        status,
        deactivatedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Check if customer has purchased a specific product
   */
  async hasProductPurchase(customerId: string, productIdentifier: string): Promise<boolean> {
    const purchases = await this.prisma.purchase.findMany({
      where: {
        customerId,
        status: 'completed',
        deactivatedAt: null,
      },
    });

    // Check if any purchase contains the product
    for (const purchase of purchases) {
      if (purchase.products) {
        const products = purchase.products as any[];
        const hasProduct = products.some((product: any) => {
          const productName = product.name?.toLowerCase() || '';
          const productId = product.id?.toLowerCase() || '';
          const identifier = productIdentifier.toLowerCase();
          
          return productName.includes(identifier) || productId.includes(identifier);
        });
        
        if (hasProduct) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get purchase statistics by customer
   */
  async getCustomerStats(customerId: string): Promise<{
    totalPurchases: number;
    totalAmount: number;
    completedPurchases: number;
    pendingPurchases: number;
    failedPurchases: number;
  }> {
    const purchases = await this.findByCustomerId(customerId);

    return {
      totalPurchases: purchases.length,
      totalAmount: purchases.reduce((sum, p) => sum + p.amount, 0),
      completedPurchases: purchases.filter(p => p.status === 'completed').length,
      pendingPurchases: purchases.filter(p => p.status === 'pending').length,
      failedPurchases: purchases.filter(p => p.status === 'failed').length,
    };
  }

  /**
   * Find purchase with customer relation
   */
  async findByIdWithCustomer(id: string): Promise<Purchase & { customer: any } | null> {
    return this.prisma.purchase.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    }) as any;
  }

  /**
   * Find all purchases with pagination and filters
   */
  async findAllWithFilters(params: {
    page?: number;
    limit?: number;
    status?: string;
    customerId?: string;
    customerEmail?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ data: Purchase[]; total: number; page: number; limit: number }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.PurchaseWhereInput = {
      deactivatedAt: null,
    };

    if (params.status) {
      where.status = params.status;
    }

    if (params.customerId) {
      where.customerId = params.customerId;
    }

    if (params.customerEmail) {
      where.customerEmail = {
        contains: params.customerEmail,
        mode: 'insensitive',
      };
    }

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = params.startDate;
      }
      if (params.endDate) {
        where.createdAt.lte = params.endDate;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.purchase.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.purchase.count({ where }),
    ]);

    return {
      data: data as any,
      total,
      page,
      limit,
    };
  }
}

