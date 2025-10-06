import { PrismaClient } from '@prisma/client';
import { BaseService } from './base.service';
import { MembershipRepository } from '@/repositories';
import {
  CreateMembershipInput,
  UpdateMembershipInput,
  MembershipQuery,
  MembershipResponse,
  MembershipWithCustomer,
} from '@/validators';

export class MembershipService extends BaseService {
  private membershipRepository: MembershipRepository;

  constructor(prisma: PrismaClient) {
    super(prisma);
    this.membershipRepository = new MembershipRepository(prisma);
  }

  /**
   * Get all memberships with pagination and filters
   */
  async getAllMemberships(query: MembershipQuery) {
    try {
      const result = await this.membershipRepository.findAll(query);
      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      throw new Error(`Failed to get memberships: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get active memberships only
   */
  async getActiveMemberships(query: Omit<MembershipQuery, 'isActive'>) {
    try {
      const result = await this.membershipRepository.findActive(query);
      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      throw new Error(`Failed to get active memberships: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get membership by ID
   */
  async getMembershipById(id: string): Promise<MembershipWithCustomer> {
    try {
      const membership = await this.membershipRepository.findById(id);
      if (!membership) {
        throw new Error('Membership not found');
      }
      return membership as any;
    } catch (error) {
      throw new Error(`Failed to get membership: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get memberships by customer ID
   */
  async getMembershipsByCustomerId(customerId: string, query: Omit<MembershipQuery, 'customerId'>) {
    try {
      const result = await this.membershipRepository.findByCustomerId(customerId, query);
      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      throw new Error(`Failed to get customer memberships: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get active membership for customer
   */
  async getActiveMembershipByCustomerId(customerId: string): Promise<MembershipResponse | null> {
    try {
      const membership = await this.membershipRepository.findActiveByCustomerId(customerId);
      return membership;
    } catch (error) {
      throw new Error(`Failed to get active membership: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new membership
   */
  async createMembership(data: CreateMembershipInput): Promise<MembershipResponse> {
    try {
      // Validate that customer exists
      await this.validateRecordExists(
        this.prisma.customer,
        data.customerId,
        'Customer not found'
      );

      // Check if customer already has an active membership
      const hasActiveMembership = await this.membershipRepository.hasActiveMembership(data.customerId);
      if (hasActiveMembership) {
        throw new Error('Customer already has an active membership');
      }

      // Validate end date is in the future
      if (data.endDate <= new Date()) {
        throw new Error('End date must be in the future');
      }

      // Create membership
      const membership = await this.membershipRepository.create({
        customer: {
          connect: { id: data.customerId }
        },
        startDate: data.startDate,
        endDate: data.endDate,
        planType: data.planType,
        isActive: true,
      } as any);

      return membership;
    } catch (error) {
      throw new Error(`Failed to create membership: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update membership by ID
   */
  async updateMembership(id: string, data: UpdateMembershipInput): Promise<MembershipResponse> {
    try {
      // Check if membership exists
      const exists = await this.membershipRepository.exists(id);
      if (!exists) {
        throw new Error('Membership not found');
      }

      // Validate customer if provided
      if (data.customerId) {
        await this.validateRecordExists(
          this.prisma.customer,
          data.customerId,
          'Customer not found'
        );
      }

      // Validate end date if provided
      if (data.endDate && data.endDate <= new Date()) {
        throw new Error('End date must be in the future');
      }

      // Update membership
      const membership = await this.membershipRepository.update(id, data);
      return membership;
    } catch (error) {
      throw new Error(`Failed to update membership: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete membership by ID (soft delete)
   */
  async deleteMembership(id: string): Promise<void> {
    try {
      // Check if membership exists
      const exists = await this.membershipRepository.exists(id);
      if (!exists) {
        throw new Error('Membership not found');
      }

      // Soft delete membership (deactivate and set end date)
      await this.membershipRepository.delete(id);
    } catch (error) {
      throw new Error(`Failed to delete membership: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extend membership
   */
  async extendMembership(id: string, additionalDays: number): Promise<MembershipResponse> {
    try {
      const membership = await this.membershipRepository.findById(id);
      if (!membership) {
        throw new Error('Membership not found');
      }

      const newEndDate = new Date(membership.endDate);
      newEndDate.setDate(newEndDate.getDate() + additionalDays);

      const updatedMembership = await this.membershipRepository.update(id, {
        endDate: newEndDate,
      });

      return updatedMembership;
    } catch (error) {
      throw new Error(`Failed to extend membership: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deactivate expired memberships
   */
  async deactivateExpiredMemberships(): Promise<number> {
    try {
      const count = await this.membershipRepository.deactivateExpired();
      return count;
    } catch (error) {
      throw new Error(`Failed to deactivate expired memberships: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get membership statistics
   */
  async getMembershipStats() {
    try {
      const stats = await this.membershipRepository.getStats();
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      throw new Error(`Failed to get membership stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if customer has active membership
   */
  async hasActiveMembership(customerId: string): Promise<boolean> {
    try {
      return await this.membershipRepository.hasActiveMembership(customerId);
    } catch (error) {
      throw new Error(`Failed to check active membership: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
