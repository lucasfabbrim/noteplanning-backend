import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { BaseController } from './base.controller';
import { MembershipService } from '@/services';
import {
  CreateMembershipInput,
  UpdateMembershipInput,
  MembershipQuery,
  MembershipParams,
} from '@/validators';

export class MembershipController extends BaseController {
  private membershipService: MembershipService;

  constructor(prisma: PrismaClient) {
    super();
    this.membershipService = new MembershipService(prisma);
  }

  /**
   * GET /memberships - Get all memberships with pagination and filters
   */
  async getAllMemberships(request: FastifyRequest<{ Querystring: MembershipQuery }>, reply: FastifyReply) {
    try {
      const result = await this.membershipService.getAllMemberships(request.query);
      return this.sendPaginated(reply, result.data, result.pagination, 'Memberships retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * GET /memberships/active - Get active memberships only
   */
  async getActiveMemberships(request: FastifyRequest<{ Querystring: Omit<MembershipQuery, 'isActive'> }>, reply: FastifyReply) {
    try {
      const result = await this.membershipService.getActiveMemberships(request.query);
      return this.sendPaginated(reply, result.data, result.pagination, 'Active memberships retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * GET /memberships/:id - Get membership by ID
   */
  async getMembershipById(request: FastifyRequest<{ Params: MembershipParams }>, reply: FastifyReply) {
    try {
      const membership = await this.membershipService.getMembershipById(request.params.id);
      return this.sendSuccess(reply, membership, 'Membership retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * GET /memberships/customer/:customerId - Get memberships by customer ID
   */
  async getMembershipsByCustomerId(
    request: FastifyRequest<{ Params: { customerId: string }; Querystring: Omit<MembershipQuery, 'customerId'> }>,
    reply: FastifyReply
  ) {
    try {
      const result = await this.membershipService.getMembershipsByCustomerId(request.params.customerId, request.query);
      return this.sendPaginated(reply, result.data, result.pagination, 'Customer memberships retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * GET /memberships/customer/:customerId/active - Get active membership for customer
   */
  async getActiveMembershipByCustomerId(
    request: FastifyRequest<{ Params: { customerId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const membership = await this.membershipService.getActiveMembershipByCustomerId(request.params.customerId);
      if (!membership) {
        return this.sendSuccess(reply, null, 'No active membership found for customer');
      }
      return this.sendSuccess(reply, membership, 'Active membership retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * POST /memberships - Create a new membership
   */
  async createMembership(request: FastifyRequest<{ Body: CreateMembershipInput }>, reply: FastifyReply) {
    try {
      const membership = await this.membershipService.createMembership(request.body);
      return this.sendCreated(reply, membership, 'Membership created successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * PUT /memberships/:id - Update membership by ID
   */
  async updateMembership(
    request: FastifyRequest<{ Params: MembershipParams; Body: UpdateMembershipInput }>,
    reply: FastifyReply
  ) {
    try {
      const membership = await this.membershipService.updateMembership(request.params.id, request.body);
      return this.sendSuccess(reply, membership, 'Membership updated successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * DELETE /memberships/:id - Delete membership by ID (soft delete)
   */
  async deleteMembership(request: FastifyRequest<{ Params: MembershipParams }>, reply: FastifyReply) {
    try {
      await this.membershipService.deleteMembership(request.params.id);
      return this.sendNoContent(reply, 'Membership deleted successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * PATCH /memberships/:id/extend - Extend membership
   */
  async extendMembership(
    request: FastifyRequest<{ Params: MembershipParams; Body: { additionalDays: number } }>,
    reply: FastifyReply
  ) {
    try {
      const membership = await this.membershipService.extendMembership(request.params.id, request.body.additionalDays);
      return this.sendSuccess(reply, membership, 'Membership extended successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * GET /memberships/stats - Get membership statistics
   */
  async getMembershipStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await this.membershipService.getMembershipStats();
      return this.sendSuccess(reply, stats.data, 'Membership statistics retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * POST /memberships/deactivate-expired - Deactivate expired memberships
   */
  async deactivateExpiredMemberships(request: FastifyRequest, reply: FastifyReply) {
    try {
      const count = await this.membershipService.deactivateExpiredMemberships();
      return this.sendSuccess(reply, { deactivatedCount: count }, 'Expired memberships deactivated successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }
}
