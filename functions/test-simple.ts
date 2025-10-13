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

async function start() {
  try {
    console.log('🚀 Starting simple test server');

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
            mode: 'simple_test'
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
          mode: 'simple_test',
          message: 'API running without database connection'
        });
      }
    });

    // Register endpoint
    fastify.post('/v1/auth/register', async (request, reply) => {
      try {
        const body = request.body as { email: string; password: string; name: string };
        
        if (!body.email || !body.password || !body.name) {
          return reply.status(400).send({
            success: false,
            message: 'Email, password and name are required'
          });
        }

        // Verificar se email já existe
        const existingUser = await prisma.customer.findUnique({
          where: { email: body.email }
        });

        if (existingUser) {
          return reply.status(409).send({
            success: false,
            message: 'Email already exists'
          });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(body.password, 10);

        // Criar usuário
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
            firebaseUid: `mock_firebase_uid_${newUser.id}`,
            customToken: `mock_custom_token_${newUser.id}_${Date.now()}`
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

    // Login endpoint
    fastify.post('/v1/auth/login', async (request, reply) => {
      try {
        const body = request.body as { email: string; password: string };
        
        if (!body.email || !body.password) {
          return reply.status(400).send({
            success: false,
            message: 'Email and password are required'
          });
        }

        // Buscar usuário
        const user = await prisma.customer.findUnique({
          where: { email: body.email }
        });

        if (!user || !user.isActive) {
          return reply.status(401).send({
            success: false,
            message: 'Invalid credentials'
          });
        }

        // Verificar senha
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

    // Test endpoint
    fastify.get('/v1/essays/test', async (request, reply) => {
      return reply.send({ 
        message: 'Essay routes working!',
        timestamp: new Date().toISOString()
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

    console.log('🚀 Simple test server is running on http://0.0.0.0:3000');
    console.log('🔥 Mock Firebase Auth enabled for testing');

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
