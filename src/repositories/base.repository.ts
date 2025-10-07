import { PrismaClient } from '@prisma/client';

export abstract class BaseRepository<T> {
  protected prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

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

  protected async softDelete(model: any, id: string) {
    return model.update({
      where: { id },
      data: { deactivatedAt: new Date() },
    });
  }

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
