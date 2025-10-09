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
      
      
      console.log('✅ Database connection established successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      process.exit(1);
    }
  }

  public static async disconnect(): Promise<void> {
    try {
      const prisma = DatabaseConfig.getInstance();
      await prisma.$disconnect();
      console.log('✅ Database connection closed');
    } catch (error) {
      console.error('Error disconnecting from database:', error);
    }
  }

  public static async healthCheck(): Promise<{ prisma: boolean }> {
    const results = {
      prisma: false,
    };

    try {
      const prisma = DatabaseConfig.getInstance();
      await prisma.$queryRaw`SELECT 1`;
      results.prisma = true;
    } catch (error) {
      console.error('Prisma health check failed:', error);
    }

    return results;
  }
}

export const prisma = DatabaseConfig.getInstance();

export { DatabaseConfig };
