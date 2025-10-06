import 'module-alias/register';
import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from 'jsonwebtoken';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env, DatabaseConfig, logger } from '@/config';
import { errorHandler } from '@/middleware';
import { authRoutes } from '@/routes/auth.routes';
import { customersRoutes } from '@/routes/customers.routes';
import { videosRoutes } from '@/routes/videos.routes';
import { membershipsRoutes } from '@/routes/memberships.routes';
import { abacatePayRoutes } from '@/routes/abacatepay.routes';
import { purchasesRoutes } from '@/routes/purchases.routes';
import { categoriesRoutes } from '@/routes/categories.routes';

/**
 * Create Fastify server instance
 */
const fastify = Fastify({
  logger: {
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
});

/**
 * Register plugins and routes
 */
async function buildServer() {
  try {
    // Register CORS
    await fastify.register(cors, {
      origin: true, // Permite todas as origens para desenvolvimento
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
    });

    // JWT is now handled directly with jsonwebtoken package

    // Register Swagger documentation
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
          { name: 'customers', description: 'Customer management endpoints' },
          { name: 'videos', description: 'Video management endpoints' },
          { name: 'memberships', description: 'Membership management endpoints' },
          { name: 'auth', description: 'Authentication endpoints' },
          { name: 'webhooks', description: 'Webhook endpoints' },
          { name: 'purchases', description: 'Purchase history endpoints' },
        ],
      },
    });

    // Register Swagger UI
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

    // Register error handler
    fastify.setErrorHandler(errorHandler);

    // Health check endpoint
    fastify.get('/health', {
      schema: {
        description: 'Health check endpoint',
        tags: ['health'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              uptime: { type: 'number' },
              environment: { type: 'string' },
            },
          },
        },
      },
    }, async (request, reply) => {
      const dbHealthy = await DatabaseConfig.healthCheck();
      return {
        status: dbHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: env.NODE_ENV,
      };
    });

    // Register routes
    await fastify.register(authRoutes, { prefix: '/api/auth' });
    await fastify.register(customersRoutes, { prefix: '/api/customers' });
    await fastify.register(videosRoutes, { prefix: '/api/videos' });
    await fastify.register(membershipsRoutes, { prefix: '/api/memberships' });
    await fastify.register(purchasesRoutes, { prefix: '/api/purchases' });
    await fastify.register(categoriesRoutes, { prefix: '/api/categories' });
    await fastify.register(abacatePayRoutes, { prefix: '/webhook' });

    // Root endpoint
    fastify.get('/', {
      schema: {
        description: 'Root endpoint',
        tags: ['root'],
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              version: { type: 'string' },
              documentation: { type: 'string' },
            },
          },
        },
      },
    }, async (request, reply) => {
      return {
        message: 'NotePlanning Backend API',
        version: '1.0.0',
        documentation: '/docs',
      };
    });

    return fastify;
  } catch (error) {
    logger.error(error, 'Failed to build server');
    throw error;
  }
}

/**
 * Start server
 */
async function start() {
  try {
    // Connect to database
    await DatabaseConfig.connect();

    // Build server
    const server = await buildServer();

    // Start server
    await server.listen({
      port: env.PORT,
      host: env.HOST,
    });

    logger.info(`🚀 Server is running on http://${env.HOST}:${env.PORT}`);
    logger.info(`📚 API Documentation available at http://${env.HOST}:${env.PORT}/docs`);
    logger.info(`🏥 Health check available at http://${env.HOST}:${env.PORT}/health`);

  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
async function shutdown() {
  try {
    logger.info('🛑 Shutting down server...');
    await DatabaseConfig.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error(error, 'Error during shutdown');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Export buildServer for testing
export { buildServer };

// Start the server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  start();
}