import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { BaseController } from './base.controller';
import { AdminService } from '@/services';
import {
  CreateAdminInput,
  UpdateAdminInput,
  AdminQuery,
  AdminParams,
  AdminLoginInput,
} from '@/validators';

export class AdminController extends BaseController {
  private adminService: AdminService;

  constructor(prisma: PrismaClient) {
    super();
    this.adminService = new AdminService(prisma);
  }

  /**
   * GET /admins - Get all admins with pagination and filters
   */
  async getAllAdmins(request: FastifyRequest<{ Querystring: AdminQuery }>, reply: FastifyReply) {
    try {
      const result = await this.adminService.getAllAdmins(request.query);
      return this.sendPaginated(reply, result.data, result.pagination, 'Admins retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * GET /admins/:id - Get admin by ID
   */
  async getAdminById(request: FastifyRequest<{ Params: AdminParams }>, reply: FastifyReply) {
    try {
      const admin = await this.adminService.getAdminById(request.params.id);
      return this.sendSuccess(reply, admin, 'Admin retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * POST /admins - Create a new admin
   */
  async createAdmin(request: FastifyRequest<{ Body: CreateAdminInput }>, reply: FastifyReply) {
    try {
      const admin = await this.adminService.createAdmin(request.body);
      return this.sendCreated(reply, admin, 'Admin created successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * PUT /admins/:id - Update admin by ID
   */
  async updateAdmin(
    request: FastifyRequest<{ Params: AdminParams; Body: UpdateAdminInput }>,
    reply: FastifyReply
  ) {
    try {
      const admin = await this.adminService.updateAdmin(request.params.id, request.body);
      return this.sendSuccess(reply, admin, 'Admin updated successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * DELETE /admins/:id - Delete admin by ID (soft delete)
   */
  async deleteAdmin(request: FastifyRequest<{ Params: AdminParams }>, reply: FastifyReply) {
    try {
      await this.adminService.deleteAdmin(request.params.id);
      return this.sendNoContent(reply, 'Admin deleted successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * POST /admins/login - Authenticate admin
   */
  async loginAdmin(request: FastifyRequest<{ Body: AdminLoginInput }>, reply: FastifyReply) {
    try {
      const admin = await this.adminService.authenticateAdmin(
        request.body.email,
        request.body.password
      );
      return this.sendSuccess(reply, admin, 'Login successful');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * GET /admins/stats - Get admin statistics
   */
  async getAdminStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await this.adminService.getAdminStats();
      return this.sendSuccess(reply, stats.data, 'Admin statistics retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * PATCH /admins/:id/toggle-status - Toggle admin active status
   */
  async toggleAdminStatus(
    request: FastifyRequest<{ Params: AdminParams; Body: { isActive: boolean } }>,
    reply: FastifyReply
  ) {
    try {
      const admin = await this.adminService.toggleAdminStatus(request.params.id, request.body.isActive);
      return this.sendSuccess(reply, admin, 'Admin status updated successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }
}
