import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '@/config';
import { requireAdmin, requireMemberOrAdmin } from '@/middleware';

export async function adminsRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();

  // GET /admins - List all admins (Admin only)
  fastify.get('/', {
    preHandler: [requireMemberOrAdmin],
    schema: {
      description: 'Get all admins (Admin only)',
      tags: ['admins'],
      security: [{ bearerAuth: [] }]
    }
  }, async (request, reply) => {
    try {
      const admins = await prisma.admin.findMany({
        where: { deactivatedAt: null },
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
      
      return reply.status(200).send({
        success: true,
        message: 'Admins retrieved successfully',
        data: admins,
        total: admins.length
      });
    } catch (error) {
      return reply.status(500).send({ 
        success: false, 
        message: 'Failed to get admins',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /admins/:id - Get admin by ID (Admin only)
  fastify.get('/:id', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Get admin by ID (Admin only)',
      tags: ['admins'],
      security: [{ bearerAuth: [] }]
    }
  }, async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const admin = await prisma.admin.findFirst({
        where: { 
          id: params.id,
          deactivatedAt: null 
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
      
      if (!admin) {
        return reply.status(404).send({ 
          success: false, 
          message: 'Admin not found' 
        });
      }
      
      return reply.status(200).send({
        success: true,
        message: 'Admin found',
        data: admin
      });
    } catch (error) {
      return reply.status(500).send({ 
        success: false, 
        message: 'Failed to get admin',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST /admins - Create new admin
  fastify.post('/', {
    schema: {
      description: 'Create a new admin',
      tags: ['admins']
    }
  }, async (request, reply) => {
    try {
      const body = request.body as {
        email: string;
        name: string;
        password: string;
      };
      
      // Check if email is already taken
      const existingAdmin = await prisma.admin.findFirst({
        where: { 
          email: body.email,
          deactivatedAt: null 
        }
      });
      
      if (existingAdmin) {
        return reply.status(400).send({ 
          success: false, 
          message: 'Email is already taken' 
        });
      }
      
      // Hash password
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(body.password, 10);
      
      const admin = await prisma.admin.create({
        data: {
          email: body.email,
          name: body.name,
          password: hashedPassword,
          role: 'ADMIN',
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
        message: 'Admin created successfully',
        data: admin
      });
    } catch (error) {
      return reply.status(400).send({ 
        success: false, 
        message: 'Failed to create admin',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST /admins/login - Admin login
  fastify.post('/login', {
    schema: {
      description: 'Authenticate admin',
      tags: ['admins', 'auth']
    }
  }, async (request, reply) => {
    try {
      const body = request.body as { email: string; password: string };
      const bcrypt = require('bcryptjs');
      
      // Find admin
      const admin = await prisma.admin.findFirst({
        where: { 
          email: body.email,
          deactivatedAt: null 
        }
      });
      
      if (!admin) {
        return reply.status(401).send({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }
      
      // Check password
      const isPasswordValid = await bcrypt.compare(body.password, admin.password);
      if (!isPasswordValid) {
        return reply.status(401).send({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }
      
      if (!admin.isActive) {
        return reply.status(401).send({ 
          success: false, 
          message: 'Account is deactivated' 
        });
      }
      
      // Generate JWT token
      const token = jwt.sign({
        id: admin.id,
        email: admin.email,
        role: admin.role
      }, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN
      } as jwt.SignOptions);
      
      // Return admin data without password
      const { password, ...adminData } = admin;
      
      return reply.status(200).send({
        success: true,
        message: 'Login successful',
        data: {
          admin: adminData,
          token
        }
      });
    } catch (error) {
      return reply.status(500).send({ 
        success: false, 
        message: 'Login failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // DELETE /admins/:id - Delete admin (soft delete) (Admin only)
  fastify.delete('/:id', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Delete admin by ID (soft delete) (Admin only)',
      tags: ['admins'],
      security: [{ bearerAuth: [] }]
    }
  }, async (request, reply) => {
    try {
      const params = request.params as { id: string };
      
      const admin = await prisma.admin.findFirst({
        where: { 
          id: params.id,
          deactivatedAt: null 
        }
      });
      
      if (!admin) {
        return reply.status(404).send({ 
          success: false, 
          message: 'Admin not found' 
        });
      }
      
      await prisma.admin.update({
        where: { id: params.id },
        data: { deactivatedAt: new Date() }
      });
      
      return reply.status(204).send();
    } catch (error) {
      return reply.status(400).send({ 
        success: false, 
        message: 'Failed to delete admin',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}
