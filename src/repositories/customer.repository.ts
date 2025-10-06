import { PrismaClient, Customer, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { CustomerQuery } from '@/validators';

export interface CustomerWithRelations extends Customer {
  memberships?: any[];
  videos?: any[];
}

export class CustomerRepository extends BaseRepository<Customer> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Find all active customers with pagination and filters
   */
  async findAll(query: CustomerQuery) {
    const { page, limit, search, role, isActive } = query;

    const where: Prisma.CustomerWhereInput = {
      deactivatedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(role && { role }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    return this.getPaginatedResults(this.prisma.customer, {
      page,
      limit,
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find customer by ID
   */
  async findById(id: string): Promise<CustomerWithRelations | null> {
    return this.prisma.customer.findFirst({
      where: {
        id,
        deactivatedAt: null,
      },
      include: {
        memberships: {
          where: { deactivatedAt: null },
          orderBy: { createdAt: 'desc' },
        },
        videos: {
          where: { deactivatedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * Find customer by email
   */
  async findByEmail(email: string): Promise<Customer | null> {
    return this.prisma.customer.findFirst({
      where: {
        email,
        deactivatedAt: null,
      },
    });
  }

  /**
   * Create a new customer
   */
  async create(data: Prisma.CustomerCreateInput): Promise<Customer> {
    return this.prisma.customer.create({
      data,
    });
  }

  /**
   * Update customer by ID
   */
  async update(id: string, data: Prisma.CustomerUpdateInput): Promise<Customer> {
    return this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete customer by ID
   */
  async delete(id: string): Promise<Customer> {
    return this.softDelete(this.prisma.customer, id);
  }

  /**
   * Check if customer exists and is active
   */
  async exists(id: string): Promise<boolean> {
    return this.existsAndActive(this.prisma.customer, id);
  }

  /**
   * Check if email is already taken by an active customer
   */
  async isEmailTaken(email: string, excludeId?: string): Promise<boolean> {
    const customer = await this.prisma.customer.findFirst({
      where: {
        email,
        deactivatedAt: null,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    return !!customer;
  }

  /**
   * Get customer statistics
   */
  async getStats() {
    const [total, active, inactive, byRole] = await Promise.all([
      this.prisma.customer.count({
        where: { deactivatedAt: null },
      }),
      this.prisma.customer.count({
        where: { deactivatedAt: null, isActive: true },
      }),
      this.prisma.customer.count({
        where: { deactivatedAt: null, isActive: false },
      }),
      this.prisma.customer.groupBy({
        by: ['role'],
        where: { deactivatedAt: null },
        _count: { role: true },
      }),
    ]);

    return {
      total,
      active,
      inactive,
      byRole: byRole.reduce((acc, item) => {
        acc[item.role] = item._count.role;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
