import { PrismaClient } from '@prisma/client';

/**
 * Base repository class that provides common database operations
 * Implements the Repository pattern for data access layer
 */
export abstract class BaseRepository<T> {
  protected prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get paginated results with common filters
   */
  protected async getPaginatedResults(
    model: any,
    options: {
      page: number;
      limit: number;
      where?: any;
      include?: any;
      orderBy?: any;
    }
  ) {
    const { page, limit, where, include, orderBy } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      model.findMany({
        where,
        include,
        orderBy,
        skip,
        take: limit,
      }),
      model.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Apply soft delete by setting deactivatedAt
   */
  protected async softDelete(model: any, id: string) {
    return model.update({
      where: { id },
      data: { deactivatedAt: new Date() },
    });
  }

  /**
   * Check if record exists and is active
   */
  protected async existsAndActive(model: any, id: string): Promise<boolean> {
    const record = await model.findFirst({
      where: {
        id,
        deactivatedAt: null,
      },
    });
    return !!record;
  }
}
