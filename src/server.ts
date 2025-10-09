import 'module-alias/register';
import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env, DatabaseConfig, logger } from '@/config';
import { errorHandler } from '@/middleware';
import { authRoutes } from '@/routes/auth.routes';
import { customersRoutes } from '@/routes/customers.routes';
import { categoriesRoutes } from '@/routes/categories.routes';
import { productsRoutes } from '@/routes/products.routes';
import { abacatePayRoutes } from '@/routes/abacatepay.routes';

const fastify = Fastify({
  logger: env.NODE_ENV === 'production' ? false : {
    level: env.LOG_LEVEL,
    transport: env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    } : undefined,
  },
  trustProxy: true,
  bodyLimit: env.MAX_FILE_SIZE,
  disableRequestLogging: env.NODE_ENV === 'production',
});

async function buildServer() {
  try {
    await fastify.register(cors, {
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://noteplanning.com',
        'https://www.noteplanning.com',
        'https://membros.noteplanning.com'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'Accept',
        'Origin',
        'X-Requested-With',
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Headers',
        'Access-Control-Allow-Methods'
      ],
      exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
      maxAge: 86400
    });

    await fastify.register(swagger, {
      openapi: {
        info: {
          title: 'NotePlanning Backend API',
          description: 'A Node.js backend application with Fastify, Prisma, and Clean Architecture',
          version: '1.0.0',
        },
        servers: [
          {
            url: 'http://localhost:3000',
            description: 'Development server',
          },
          {
            url: 'https://noteplanning-backend.fly.dev',
            description: 'Production server',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
        tags: [
          { name: 'Customers', description: 'Customer management endpoints' },
          { name: 'Customers by ID', description: 'Customer management by ID' },
          { name: 'Customers by E-mail', description: 'Customer lookup by email' },
          { name: 'Purchases by Customer', description: 'Purchase management endpoints' },
          { name: 'Authentication', description: 'Authentication endpoints' },
          { name: 'Categories', description: 'Category management endpoints' },
          { name: 'Videos by Category', description: 'Video management within categories' },
          { name: 'Products', description: 'Product management endpoints' },
        ],
      },
    });

    await fastify.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
      },
      uiHooks: {
        onRequest: function (request, reply, next) {
          next();
        },
        preHandler: function (request, reply, next) {
          next();
        },
      },
      staticCSP: true,
      transformStaticCSP: (header) => header,
      transformSpecification: (swaggerObject, request, reply) => {
        return swaggerObject;
      },
      transformSpecificationClone: true,
    });

    fastify.setErrorHandler(errorHandler);

    fastify.get('/health', async (request, reply) => {
      const isHealthy = await DatabaseConfig.healthCheck();
      if (isHealthy) {
        return reply.status(200).send({ status: 'ok', timestamp: new Date().toISOString() });
      } else {
        return reply.status(503).send({ status: 'error', message: 'Database connection failed' });
      }
    });

    await fastify.register(authRoutes, { prefix: '/v1/auth' });
    await fastify.register(customersRoutes, { prefix: '/v1/customers' });
    await fastify.register(categoriesRoutes, { prefix: '/v1/categories' });
    await fastify.register(productsRoutes, { prefix: '/v1/products' });
    await fastify.register(abacatePayRoutes, { prefix: '/webhook' });


    return fastify;
  } catch (error) {
    logger.error(error, 'Failed to build server');
    throw error;
  }
}

async function start() {
  try {
    await DatabaseConfig.connect();

    const server = await buildServer();

    await server.listen({
      port: env.PORT,
      host: env.HOST,
    });

    if (env.NODE_ENV === 'development') {
      logger.info(`🚀 Server is running on http://${env.HOST}:${env.PORT}`);
      logger.info(`📚 API Documentation available at http://${env.HOST}:${env.PORT}/docs`);
    }

  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

async function shutdown() {
  try {
    if (env.NODE_ENV === 'development') {
      logger.info('🛑 Shutting down server...');
    }
    await DatabaseConfig.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error(error, 'Error during shutdown');
    process.exit(1);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export { buildServer };

if (process.env.NODE_ENV !== 'test') {
  start();
}