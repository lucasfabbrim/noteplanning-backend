import { PrismaClient, Admin, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { AdminQuery } from '@/validators';

export class AdminRepository extends BaseRepository<Admin> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Find all admins with pagination and filters
   */
  async findAll(query: AdminQuery) {
    const { page, limit, search, isActive } = query;

    const where: Prisma.AdminWhereInput = {
      deactivatedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    return this.getPaginatedResults(this.prisma.admin, {
      page,
      limit,
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find admin by ID
   */
  async findById(id: string): Promise<Admin | null> {
    return this.prisma.admin.findFirst({
      where: {
        id,
        deactivatedAt: null,
      },
    });
  }

  /**
   * Find admin by email
   */
  async findByEmail(email: string): Promise<Admin | null> {
    return this.prisma.admin.findFirst({
      where: {
        email,
        deactivatedAt: null,
      },
    });
  }

  /**
   * Create a new admin
   */
  async create(data: Prisma.AdminCreateInput): Promise<Admin> {
    return this.prisma.admin.create({
      data,
    });
  }

  /**
   * Update admin by ID
   */
  async update(id: string, data: Prisma.AdminUpdateInput): Promise<Admin> {
    return this.prisma.admin.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete admin by ID
   */
  async delete(id: string): Promise<Admin> {
    return this.softDelete(this.prisma.admin, id);
  }

  /**
   * Check if admin exists and is active
   */
  async exists(id: string): Promise<boolean> {
    return this.existsAndActive(this.prisma.admin, id);
  }

  /**
   * Check if email is already taken by an active admin
   */
  async isEmailTaken(email: string, excludeId?: string): Promise<boolean> {
    const admin = await this.prisma.admin.findFirst({
      where: {
        email,
        deactivatedAt: null,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    return !!admin;
  }

  /**
   * Get admin statistics
   */
  async getStats() {
    const [total, active, inactive] = await Promise.all([
      this.prisma.admin.count({
        where: { deactivatedAt: null },
      }),
      this.prisma.admin.count({
        where: { deactivatedAt: null, isActive: true },
      }),
      this.prisma.admin.count({
        where: { deactivatedAt: null, isActive: false },
      }),
    ]);

    return {
      total,
      active,
      inactive,
    };
  }
}
