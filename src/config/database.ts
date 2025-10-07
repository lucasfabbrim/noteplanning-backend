import { PrismaClient } from '@prisma/client';

class DatabaseConfig {
  private static instance: PrismaClient;

  public static getInstance(): PrismaClient {
    if (!DatabaseConfig.instance) {
      DatabaseConfig.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
        errorFormat: process.env.NODE_ENV === 'development' ? 'pretty' : 'minimal',
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });
    }
    return DatabaseConfig.instance;
  }

  public static async connect(): Promise<void> {
    try {
      const prisma = DatabaseConfig.getInstance();
      await prisma.$connect();
    } catch (error) {
      console.error('Database connection failed');
      process.exit(1);
    }
  }

  public static async disconnect(): Promise<void> {
    try {
      const prisma = DatabaseConfig.getInstance();
      await prisma.$disconnect();
    } catch (error) {
    }
  }

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

export const prisma = DatabaseConfig.getInstance();

export { DatabaseConfig };
