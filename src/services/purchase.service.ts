import { PrismaClient, Purchase } from '@prisma/client';
import { BaseService } from './base.service';
import { PurchaseRepository } from '@/repositories/purchase.repository';
import { LoggerHelper } from '@/utils/logger.helper';

/**
 * Purchase service
 */
export class PurchaseService extends BaseService {
  protected purchaseRepository: PurchaseRepository;

  constructor(prisma: PrismaClient) {
    super(prisma);
    this.purchaseRepository = new PurchaseRepository(prisma);
  }

  /**
   * Get all purchases with pagination and filters
   */
  async getAllPurchases(params: {
    page?: number;
    limit?: number;
    status?: string;
    customerId?: string;
    customerEmail?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    data: Purchase[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const filters: any = {
        page: params.page ? parseInt(String(params.page)) : 1,
        limit: params.limit ? parseInt(String(params.limit)) : 10,
      };

      if (params.status) {
        filters.status = params.status;
      }

      if (params.customerId) {
        filters.customerId = params.customerId;
      }

      if (params.customerEmail) {
        filters.customerEmail = params.customerEmail;
      }

      if (params.startDate) {
        filters.startDate = new Date(params.startDate);
      }

      if (params.endDate) {
        filters.endDate = new Date(params.endDate);
      }

      const result = await this.purchaseRepository.findAllWithFilters(filters);

      return {
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
      };
    } catch (error) {
      LoggerHelper.error('PurchaseService', 'getAllPurchases', 'Failed to retrieve purchases', error);
      throw new Error(`Failed to get purchases`);
    }
  }

  /**
   * Get purchase by ID
   */
  async getPurchaseById(id: string): Promise<Purchase | null> {
    try {
      return await this.purchaseRepository.findByIdWithCustomer(id);
    } catch (error) {
      LoggerHelper.error('PurchaseService', 'getPurchaseById', 'Failed to retrieve purchase', error);
      throw new Error(`Failed to get purchase`);
    }
  }

  /**
   * Get purchases by customer ID
   */
  async getPurchasesByCustomerId(customerId: string): Promise<Purchase[]> {
    try {
      return await this.purchaseRepository.findByCustomerId(customerId);
    } catch (error) {
      LoggerHelper.error('PurchaseService', 'getPurchasesByCustomerId', 'Failed to retrieve purchases', error);
      throw new Error(`Failed to get customer purchases`);
    }
  }

  /**
   * Get purchases by customer email
   */
  async getPurchasesByCustomerEmail(email: string): Promise<Purchase[]> {
    try {
      return await this.purchaseRepository.findByCustomerEmail(email);
    } catch (error) {
      LoggerHelper.error('PurchaseService', 'getPurchasesByCustomerEmail', 'Failed to retrieve purchases', error);
      throw new Error(`Failed to get customer purchases`);
    }
  }

  /**
   * Get customer purchase statistics
   */
  async getCustomerStats(customerId: string): Promise<any> {
    try {
      return await this.purchaseRepository.getCustomerStats(customerId);
    } catch (error) {
      LoggerHelper.error('PurchaseService', 'getCustomerStats', 'Failed to retrieve stats', error);
      throw new Error(`Failed to get customer stats`);
    }
  }

  /**
   * Check if customer has access to videos (purchased template+videos)
   */
  async hasVideoAccess(customerId: string): Promise<boolean> {
    try {
      // Check if customer has purchased product containing "template" or "video"
      const hasTemplateVideos = await this.purchaseRepository.hasProductPurchase(
        customerId,
        'template'
      );
      
      const hasVideos = await this.purchaseRepository.hasProductPurchase(
        customerId,
        'video'
      );

      return hasTemplateVideos || hasVideos;
    } catch (error) {
      LoggerHelper.error('PurchaseService', 'hasVideoAccess', 'Failed to check access', error);
      return false;
    }
  }

  /**
   * Create a new purchase (used by webhook)
   */
  async createPurchase(data: {
    customerId: string;
    amount: number;
    paymentAmount: number;
    event: string;
    status: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    customerTaxId?: string;
    products?: any[];
    webhookData?: any;
    devMode?: boolean;
  }): Promise<Purchase> {
    try {
      const purchase = await this.purchaseRepository.create({
        customerId: data.customerId,
        amount: data.amount,
        paymentAmount: data.paymentAmount,
        event: data.event,
        status: data.status,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        customerTaxId: data.customerTaxId,
        products: data.products || [],
        webhookData: data.webhookData,
        devMode: data.devMode || false,
      } as any);

      LoggerHelper.info('PurchaseService', 'createPurchase', 'Purchase created', {
        purchaseId: purchase.id,
        amount: purchase.amount,
      });

      return purchase;
    } catch (error) {
      LoggerHelper.error('PurchaseService', 'createPurchase', 'Failed to create purchase', error);
      throw new Error(`Failed to create purchase`);
    }
  }
}

