import { PrismaClient, Membership, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { MembershipQuery } from '@/validators';

export interface MembershipWithCustomer extends Membership {
  customer: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export class MembershipRepository extends BaseRepository<Membership> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Find all memberships with pagination and filters
   */
  async findAll(query: MembershipQuery) {
    const { page, limit, isActive, customerId, planType, expiresSoon } = query;

    const where: Prisma.MembershipWhereInput = {
      deactivatedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(customerId && { customerId }),
      ...(planType && { planType }),
      ...(expiresSoon && {
        endDate: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
      }),
    };

    return this.getPaginatedResults(this.prisma.membership, {
      page,
      limit,
      where,
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
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find active memberships only
   */
  async findActive(query: Omit<MembershipQuery, 'isActive'>) {
    return this.findAll({ ...query, isActive: true });
  }

  /**
   * Find membership by ID
   */
  async findById(id: string): Promise<MembershipWithCustomer | null> {
    return this.prisma.membership.findFirst({
      where: {
        id,
        deactivatedAt: null,
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
    });
  }

  /**
   * Find memberships by customer ID
   */
  async findByCustomerId(customerId: string, query: Omit<MembershipQuery, 'customerId'>) {
    return this.findAll({ ...query, customerId });
  }

  /**
   * Find active membership for customer
   */
  async findActiveByCustomerId(customerId: string): Promise<Membership | null> {
    return this.prisma.membership.findFirst({
      where: {
        customerId,
        isActive: true,
        endDate: { gte: new Date() },
        deactivatedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create a new membership
   */
  async create(data: Prisma.MembershipCreateInput): Promise<Membership> {
    return this.prisma.membership.create({
      data,
    });
  }

  /**
   * Update membership by ID
   */
  async update(id: string, data: Prisma.MembershipUpdateInput): Promise<Membership> {
    return this.prisma.membership.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete membership by ID (deactivate and set end date)
   */
  async delete(id: string): Promise<Membership> {
    return this.prisma.membership.update({
      where: { id },
      data: {
        isActive: false,
        endDate: new Date(),
        deactivatedAt: new Date(),
      },
    });
  }

  /**
   * Check if membership exists and is active
   */
  async exists(id: string): Promise<boolean> {
    return this.existsAndActive(this.prisma.membership, id);
  }

  /**
   * Check if customer has active membership
   */
  async hasActiveMembership(customerId: string): Promise<boolean> {
    const membership = await this.findActiveByCustomerId(customerId);
    return !!membership;
  }

  /**
   * Deactivate expired memberships
   */
  async deactivateExpired(): Promise<number> {
    const result = await this.prisma.membership.updateMany({
      where: {
        isActive: true,
        endDate: { lt: new Date() },
        deactivatedAt: null,
      },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Get membership statistics
   */
  async getStats() {
    const [total, active, expired, byPlanType] = await Promise.all([
      this.prisma.membership.count({
        where: { deactivatedAt: null },
      }),
      this.prisma.membership.count({
        where: {
          deactivatedAt: null,
          isActive: true,
          endDate: { gte: new Date() },
        },
      }),
      this.prisma.membership.count({
        where: {
          deactivatedAt: null,
          isActive: false,
        },
      }),
      this.prisma.membership.groupBy({
        by: ['planType'],
        where: { deactivatedAt: null },
        _count: { planType: true },
      }),
    ]);

    return {
      total,
      active,
      expired,
      byPlanType: byPlanType.reduce((acc, item) => {
        acc[item.planType] = item._count.planType;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
