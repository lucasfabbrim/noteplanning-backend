import { PrismaClient, Customer, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { CustomerQuery } from '@/validators';

export interface CustomerWithRelations extends Customer {
  memberships?: any[];
  purchases?: any[];
}

export class CustomerRepository extends BaseRepository<Customer> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

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

  async findById(id: string): Promise<CustomerWithRelations | null> {
    return this.prisma.customer.findFirst({
      where: {
        id,
        deactivatedAt: null,
      },
      include: {
        purchases: {
          where: { deactivatedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return this.prisma.customer.findFirst({
      where: {
        email,
        deactivatedAt: null,
      },
    });
  }

  async update(id: string, data: Prisma.CustomerUpdateInput): Promise<Customer> {
    return this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Customer> {
    return this.softDelete(this.prisma.customer, id);
  }

  async exists(id: string): Promise<boolean> {
    return this.existsAndActive(this.prisma.customer, id);
  }

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

  async create(data: Prisma.CustomerCreateInput): Promise<Customer> {
    return this.prisma.customer.create({
      data,
    });
  }
}
