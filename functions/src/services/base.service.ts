import { PrismaClient } from '@prisma/client';

export abstract class BaseService {
  protected prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  protected async validateRecordExists(model: any, id: string, errorMessage: string): Promise<void> {
    const record = await model.findFirst({
      where: {
        id,
        deactivatedAt: null,
      },
    });

    if (!record) {
      throw new Error(errorMessage);
    }
  }

  protected async validateRecordNotExists(model: any, where: any, errorMessage: string): Promise<void> {
    const record = await model.findFirst({
      where: {
        ...where,
        deactivatedAt: null,
      },
    });

    if (record) {
      throw new Error(errorMessage);
    }
  }

  protected async withTransaction<T>(operation: (prisma: any) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(operation) as Promise<T>;
  }

  protected formatError(message: string, details?: any): { message: string; details?: any } {
    return {
      message,
      ...(details && { details }),
    };
  }
}
