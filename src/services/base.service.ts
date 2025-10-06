import { PrismaClient } from '@prisma/client';

/**
 * Base service class that provides common business logic operations
 * Implements the Service layer pattern for business logic
 */
export abstract class BaseService {
  protected prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Validate that a record exists and is active
   */
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

  /**
   * Validate that a record doesn't exist (for unique constraints)
   */
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

  /**
   * Handle database transactions
   */
  protected async withTransaction<T>(operation: (prisma: any) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(operation) as Promise<T>;
  }

  /**
   * Format error messages
   */
  protected formatError(message: string, details?: any): { message: string; details?: any } {
    return {
      message,
      ...(details && { details }),
    };
  }
}
