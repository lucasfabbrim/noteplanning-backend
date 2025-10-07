import { PrismaClient, Purchase } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class PurchaseRepository extends BaseRepository<Purchase> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

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

  async findByCustomerIdWithCustomer(customerId: string): Promise<(Purchase & { customer: any })[]> {
    return this.prisma.purchase.findMany({
      where: {
        customerId,
        deactivatedAt: null,
      },
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
      orderBy: {
        createdAt: 'desc',
      },
    }) as any;
  }

  async findByTransactionId(transactionId: string): Promise<Purchase | null> {
    return this.prisma.purchase.findFirst({
      where: {
        transactionId,
        deactivatedAt: null,
      },
    });
  }
}
