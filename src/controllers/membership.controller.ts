import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { BaseController } from './base.controller';

export class MembershipController extends BaseController {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
  }

  /**
   * GET /memberships - Get all memberships
   */
  async getAllMemberships(request: FastifyRequest, reply: FastifyReply) {
    try {
      const memberships = await this.prisma.membership.findMany({
        where: { deactivatedAt: null },
        orderBy: { createdAt: 'desc' },
      });

      return this.sendSuccess(reply, memberships, 'Memberships retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * GET /memberships/:id - Get membership by ID
   */
  async getMembershipById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.params as { id: string };
      
      const membership = await this.prisma.membership.findFirst({
        where: {
          id: params.id,
          deactivatedAt: null,
        },
      });

      if (!membership) {
        return this.sendError(reply, 'Membership not found', 404);
      }

      return this.sendSuccess(reply, membership, 'Membership retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * POST /memberships - Create a new membership
   */
  async createMembership(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      
      const membership = await this.prisma.membership.create({
        data: {
          customerId: body.customerId,
          endDate: new Date(body.endDate),
          isActive: body.isActive !== undefined ? body.isActive : true,
          planType: body.planType || 'monthly',
        },
      });

      return this.sendCreated(reply, membership, 'Membership created successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * PUT /memberships/:id - Update membership
   */
  async updateMembership(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.params as { id: string };
      const body = request.body as any;

      const membership = await this.prisma.membership.update({
        where: { id: params.id },
        data: {
          endDate: body.endDate ? new Date(body.endDate) : undefined,
          isActive: body.isActive,
          planType: body.planType,
        },
      });

      return this.sendSuccess(reply, membership, 'Membership updated successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * DELETE /memberships/:id - Delete membership
   */
  async deleteMembership(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.params as { id: string };

      await this.prisma.membership.update({
        where: { id: params.id },
        data: { deactivatedAt: new Date() },
      });

      reply.code(204);
      return {};
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }
}