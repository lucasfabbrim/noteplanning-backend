import { PrismaClient } from '@prisma/client';

/**
 * Database configuration and Prisma client instance
 */
class DatabaseConfig {
  private static instance: PrismaClient;

  /**
   * Get singleton instance of Prisma client
   */
  public static getInstance(): PrismaClient {
    if (!DatabaseConfig.instance) {
      DatabaseConfig.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
        errorFormat: 'pretty',
      });
    }
    return DatabaseConfig.instance;
  }

  /**
   * Connect to database
   */
  public static async connect(): Promise<void> {
    try {
      const prisma = DatabaseConfig.getInstance();
      await prisma.$connect();
    } catch (error) {
      console.error('Database connection failed');
      process.exit(1);
    }
  }

  /**
   * Disconnect from database
   */
  public static async disconnect(): Promise<void> {
    try {
      const prisma = DatabaseConfig.getInstance();
      await prisma.$disconnect();
    } catch (error) {
      // Silent disconnect error
    }
  }

  /**
   * Health check for database connection
   */
  public static async healthCheck(): Promise<boolean> {
    try {
      const prisma = DatabaseConfig.getInstance();
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Export singleton Prisma instance
 */
export const prisma = DatabaseConfig.getInstance();

export { DatabaseConfig };
