import 'module-alias/register';
import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env, DatabaseConfig, logger } from './src/config';
import { errorHandler } from './src/middleware';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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

const prisma = new PrismaClient();

// Mock Firebase Admin para testes
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

// Middleware de autenticação mock
async function authenticate(request: any, reply: any) {
  const token = request.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
  
  // Mock: sempre retorna usuário válido
  request.user = {
    id: 'mock_user_id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'FREE',
    isActive: true,
    firebaseUid: 'mock_uid_123'
  };
}

async function requireAdmin(request: any, reply: any) {
  await authenticate(request, reply);
  if (request.user?.role !== 'ADMIN') {
    return reply.status(403).send({ error: 'Forbidden' });
  }
}

async function requireMemberOrAdmin(request: any, reply: any) {
  await authenticate(request, reply);
  if (!['MEMBER', 'ADMIN'].includes(request.user?.role)) {
    return reply.status(403).send({ error: 'Forbidden' });
  }
}

async function start() {
  try {
    console.log('🚀 Starting complete test server with all endpoints');

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

    // =============================================================================
    // HEALTH & DOCS
    // =============================================================================
    
    fastify.get('/health', async (request, reply) => {
      try {
        const isHealthy = await DatabaseConfig.healthCheck();
        if (isHealthy) {
          return reply.status(200).send({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            database: 'connected',
            mode: 'complete_test'
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
          mode: 'complete_test',
          message: 'API running without database connection'
        });
      }
    });

    fastify.get('/docs', async (request, reply) => {
      return reply.send({
        title: 'NotePlanning API Documentation',
        version: '1.0.0',
        endpoints: {
          auth: ['/v1/auth/register', '/v1/auth/login', '/v1/auth/logout'],
          customers: ['/v1/customers', '/v1/customers/:id', '/v1/customers/email/:email'],
          essays: ['/v1/essays', '/v1/essays/my', '/v1/essays/:id'],
          credits: ['/v1/customers/credits', '/v1/customers/my-credits'],
          webhooks: ['/webhook/abacatepay']
        }
      });
    });

    // =============================================================================
    // AUTH ROUTES
    // =============================================================================

    fastify.post('/v1/auth/register', async (request, reply) => {
      try {
        const body = request.body as { email: string; password: string; name: string };
        
        if (!body.email || !body.password || !body.name) {
          return reply.status(400).send({
            success: false,
            message: 'Email, password and name are required'
          });
        }

        const existingUser = await prisma.customer.findUnique({
          where: { email: body.email }
        });

        if (existingUser) {
          return reply.status(409).send({
            success: false,
            message: 'Email already exists'
          });
        }

        const hashedPassword = await bcrypt.hash(body.password, 10);
        const firebaseUid = `mock_firebase_uid_${Date.now()}`;
        const customToken = `mock_custom_token_${Date.now()}`;

        const newUser = await prisma.customer.create({
          data: {
            email: body.email,
            name: body.name,
            password: hashedPassword,
            role: 'FREE',
            isActive: true
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
          }
        });

        return reply.status(201).send({
          success: true,
          message: 'User created successfully',
          data: {
            ...newUser,
            firebaseUid,
            customToken
          }
        });

      } catch (error) {
        console.error('Register error:', error);
        return reply.status(500).send({
          success: false,
          message: 'Internal server error'
        });
      }
    });

    fastify.post('/v1/auth/login', async (request, reply) => {
      try {
        const body = request.body as { email: string; password: string };
        
        if (!body.email || !body.password) {
          return reply.status(400).send({
            success: false,
            message: 'Email and password are required'
          });
        }

        const user = await prisma.customer.findUnique({
          where: { email: body.email }
        });

        if (!user || !user.isActive) {
          return reply.status(401).send({
            success: false,
            message: 'Invalid credentials'
          });
        }

        const isPasswordValid = await bcrypt.compare(body.password, user.password);
        if (!isPasswordValid) {
          return reply.status(401).send({
            success: false,
            message: 'Invalid credentials'
          });
        }

        const firebaseUid = `mock_firebase_uid_${user.id}`;
        const customToken = `mock_custom_token_${user.id}_${Date.now()}`;

        return reply.status(200).send({
          success: true,
          message: 'Login successful',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive
          },
          customToken: customToken,
          firebaseUid: firebaseUid
        });

      } catch (error) {
        console.error('Login error:', error);
        return reply.status(500).send({
          success: false,
          message: 'Internal server error'
        });
      }
    });

    fastify.post('/v1/auth/logout', async (request, reply) => {
      return reply.send({
        success: true,
        message: 'Logout successful'
      });
    });

    // =============================================================================
    // CUSTOMER ROUTES
    // =============================================================================

    fastify.get('/v1/customers', { preHandler: requireAdmin }, async (request, reply) => {
      return reply.send({
        success: true,
        data: []
      });
    });

    fastify.get('/v1/customers/:id', { preHandler: requireAdmin }, async (request, reply) => {
      return reply.send({
        success: true,
        data: { id: (request.params as any).id }
      });
    });

    fastify.get('/v1/customers/email/:email', { preHandler: requireAdmin }, async (request, reply) => {
      return reply.send({
        success: true,
        data: { email: (request.params as any).email }
      });
    });

    fastify.put('/v1/customers/:id', { preHandler: requireAdmin }, async (request, reply) => {
      return reply.send({
        success: true,
        data: { id: (request.params as any).id }
      });
    });

    fastify.delete('/v1/customers/:id', { preHandler: requireAdmin }, async (request, reply) => {
      return reply.send({
        success: true,
        message: 'Customer deleted'
      });
    });

    fastify.post('/v1/customers/forgot-password', async (request, reply) => {
      return reply.send({
        success: true,
        message: 'Password reset email sent'
      });
    });

    fastify.post('/v1/customers/reset-password', async (request, reply) => {
      return reply.send({
        success: true,
        message: 'Password reset successful'
      });
    });

    // =============================================================================
    // ESSAY ROUTES
    // =============================================================================

    fastify.get('/v1/essays/test', async (request, reply) => {
      return reply.send({ 
        message: 'Essay routes working!',
        timestamp: new Date().toISOString()
      });
    });

    fastify.get('/v1/essays/my', { preHandler: authenticate }, async (request, reply) => {
      return reply.send({
        success: true,
        data: []
      });
    });

    fastify.post('/v1/essays', { preHandler: authenticate }, async (request, reply) => {
      return reply.send({
        success: true,
        data: { id: 'new_essay_id' }
      });
    });

    fastify.get('/v1/essays/:id', { preHandler: authenticate }, async (request, reply) => {
      return reply.send({
        success: true,
        data: { id: (request.params as any).id }
      });
    });

    fastify.get('/v1/essays/customer/:customerId', { preHandler: requireAdmin }, async (request, reply) => {
      return reply.send({
        success: true,
        data: []
      });
    });

    fastify.get('/v1/essays/status/:status', { preHandler: requireAdmin }, async (request, reply) => {
      return reply.send({
        success: true,
        data: []
      });
    });

    fastify.patch('/v1/essays/:id/status', { preHandler: requireAdmin }, async (request, reply) => {
      return reply.send({
        success: true,
        data: { id: (request.params as any).id }
      });
    });

    fastify.patch('/v1/essays/:id/scores', { preHandler: requireAdmin }, async (request, reply) => {
      return reply.send({
        success: true,
        data: { id: (request.params as any).id }
      });
    });

    fastify.patch('/v1/essays/:id/analysis', { preHandler: requireAdmin }, async (request, reply) => {
      return reply.send({
        success: true,
        data: { id: (request.params as any).id }
      });
    });

    fastify.delete('/v1/essays/:id', { preHandler: requireAdmin }, async (request, reply) => {
      return reply.send({
        success: true,
        message: 'Essay deleted'
      });
    });

    fastify.get('/v1/essays/stats', { preHandler: requireAdmin }, async (request, reply) => {
      return reply.send({
        success: true,
        data: { total: 0, pending: 0, completed: 0 }
      });
    });

    // =============================================================================
    // CREDITS ROUTES
    // =============================================================================

    fastify.get('/v1/customers/credits', { preHandler: requireAdmin }, async (request, reply) => {
      return reply.send({
        success: true,
        data: []
      });
    });

    fastify.get('/v1/customers/credits-history', { preHandler: requireAdmin }, async (request, reply) => {
      return reply.send({
        success: true,
        data: []
      });
    });

    fastify.get('/v1/customers/my-credits', { preHandler: authenticate }, async (request, reply) => {
      return reply.send({
        success: true,
        data: { credits: 0 }
      });
    });

    fastify.post('/v1/customers/:id/credits', { preHandler: requireAdmin }, async (request, reply) => {
      return reply.send({
        success: true,
        data: { id: (request.params as any).id }
      });
    });

    // =============================================================================
    // PURCHASES ROUTES
    // =============================================================================

    fastify.get('/v1/customers/purchases', { preHandler: authenticate }, async (request, reply) => {
      return reply.send({
        success: true,
        data: []
      });
    });

    fastify.get('/v1/customers/:id/purchases', { preHandler: requireAdmin }, async (request, reply) => {
      return reply.send({
        success: true,
        data: []
      });
    });

    fastify.post('/v1/customers/:id/purchases', { preHandler: requireAdmin }, async (request, reply) => {
      return reply.send({
        success: true,
        data: { id: (request.params as any).id }
      });
    });

    fastify.delete('/v1/customers/:id/purchases/:purchaseId', { preHandler: requireAdmin }, async (request, reply) => {
      return reply.send({
        success: true,
        message: 'Purchase deleted'
      });
    });

    // =============================================================================
    // WEBHOOK ROUTES
    // =============================================================================

    fastify.get('/webhook/abacatepay', async (request, reply) => {
      return reply.send({
        success: true,
        message: 'AbacatePay webhook endpoint'
      });
    });

    fastify.post('/webhook/abacatepay', async (request, reply) => {
      return reply.send({
        success: true,
        message: 'Webhook received'
      });
    });

    // =============================================================================
    // ROOT ENDPOINT
    // =============================================================================

    fastify.get('/', async (request, reply) => {
      return reply.send({
        message: 'NotePlanning API',
        version: '1.0.0',
        status: 'running'
      });
    });

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

    console.log('🚀 Complete test server is running on http://0.0.0.0:3000');
    console.log('📚 API Documentation available at http://0.0.0.0:3000/docs');
    console.log('🔥 Mock Firebase Auth enabled for testing');
    console.log('✅ All 33+ endpoints implemented!');

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
