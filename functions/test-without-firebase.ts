import 'module-alias/register';
import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env, DatabaseConfig, logger } from './src/config';
import { errorHandler } from './src/middleware';
import { authRoutes } from './src/routes/auth.routes';
import { customersRoutes } from './src/routes/customers.routes';
import { essayRoutes } from './src/routes/essay.routes';
import { abacatePayRoutes } from './src/routes/abacatepay.routes';

// Mock Firebase Admin para testes locais
const mockFirebaseAdmin = {
  auth: () => ({
    createUser: async (userData: any) => {
      console.log('🔥 Mock Firebase: Creating user', userData.email);
      return {
        uid: `mock_uid_${Date.now()}`,
        email: userData.email,
        displayName: userData.displayName
      };
    },
    getUserByEmail: async (email: string) => {
      console.log('🔥 Mock Firebase: Getting user by email', email);
      return {
        uid: `mock_uid_${Date.now()}`,
        email: email,
        displayName: 'Mock User'
      };
    },
    createCustomToken: async (uid: string, claims: any) => {
      console.log('🔥 Mock Firebase: Creating custom token for', uid);
      return `mock_custom_token_${uid}_${Date.now()}`;
    },
    verifyIdToken: async (token: string) => {
      console.log('🔥 Mock Firebase: Verifying ID token');
      // Simular token válido
      return {
        uid: 'mock_uid_123',
        email: 'test@example.com',
        name: 'Test User'
      };
    }
  })
};

// Substituir o Firebase Admin pelo mock
const admin = mockFirebaseAdmin as any;

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  },
  trustProxy: true,
  bodyLimit: env.MAX_FILE_SIZE,
});

async function start() {
  try {
    console.log('🔥 Mock Firebase Admin initialized for testing');

    // Configurar CORS
    await fastify.register(cors, {
      origin: true,
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
    });

    fastify.setErrorHandler(errorHandler);

    // Health check
    fastify.get('/health', async (request, reply) => {
      try {
        const isHealthy = await DatabaseConfig.healthCheck();
        if (isHealthy) {
          return reply.status(200).send({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            database: 'connected',
            firebase: 'mock'
          });
        } else {
          return reply.status(503).send({ 
            status: 'error', 
            message: 'Database connection failed',
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        return reply.status(200).send({ 
          status: 'ok', 
          timestamp: new Date().toISOString(),
          database: 'not_configured',
          firebase: 'mock',
          message: 'API running without database connection'
        });
      }
    });

    // Registrar rotas
    await fastify.register(authRoutes, { prefix: '/v1/auth' });
    await fastify.register(customersRoutes, { prefix: '/v1/customers' });
    await fastify.register(essayRoutes, { prefix: '/v1/essays' });
    await fastify.register(abacatePayRoutes, { prefix: '/webhook' });

    // Tentar conectar ao banco
    try {
      await DatabaseConfig.connect();
      console.log('✅ Database connected successfully');
    } catch (dbError) {
      console.warn('⚠️ Database connection failed, continuing without database:', dbError);
    }

    // Iniciar servidor
    await fastify.listen({
      port: 3000,
      host: '0.0.0.0',
    });

    console.log('🚀 Test server is running on http://0.0.0.0:3000');
    console.log('📚 API Documentation available at http://0.0.0.0:3000/docs');
    console.log('🔥 Mock Firebase Auth enabled for testing');

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
