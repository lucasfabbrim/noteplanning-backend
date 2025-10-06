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

      const result = await this.purchaseRepository.findAllWithFilters({
        page: filters.page,
        limit: filters.limit,
        status: filters.status,
        customerId: filters.customerId,
        customerEmail: filters.customerEmail,
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
      
      LoggerHelper.info('PurchaseService', 'getAllPurchases', 'Purchases retrieved', {
        count: result.data.length,
        page: filters.page,
        limit: filters.limit,
      });

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
      LoggerHelper.error('PurchaseService', 'getAllPurchases', 'Failed to get purchases', error);
      throw new Error(`Failed to get purchases`);
    }
  }

  /**
   * Get purchase by ID
   */
  async getPurchaseById(id: string): Promise<Purchase> {
    try {
      const purchase = await this.purchaseRepository.findById(id);
      
      if (!purchase) {
        throw new Error('Purchase not found');
      }

      LoggerHelper.info('PurchaseService', 'getPurchaseById', 'Purchase retrieved', {
        purchaseId: id,
      });

      return purchase;
    } catch (error) {
      LoggerHelper.error('PurchaseService', 'getPurchaseById', 'Failed to get purchase', {
        error: error instanceof Error ? error.message : 'Unknown error',
        purchaseId: id,
      });
      throw error;
    }
  }

  /**
   * Get purchases by customer ID
   */
  async getPurchasesByCustomerId(customerId: string): Promise<Purchase[]> {
    try {
      const purchases = await this.purchaseRepository.findByCustomerId(customerId);
      
      LoggerHelper.info('PurchaseService', 'getPurchasesByCustomerId', 'Customer purchases retrieved', {
        customerId,
        count: purchases.length,
      });

      return purchases;
    } catch (error) {
      LoggerHelper.error('PurchaseService', 'getPurchasesByCustomerId', 'Failed to get customer purchases', {
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId,
      });
      throw error;
    }
  }

  /**
   * Create a new purchase
   */
  async createPurchase(data: {
    customerId: string;
    amount: number;
    status: string;
    products: any[];
    paymentMethod: string;
    transactionId: string;
    webhookData?: any;
    devMode?: boolean;
  }): Promise<Purchase> {
    try {
      const purchase = await this.purchaseRepository.create({
        customerId: data.customerId,
        amount: data.amount,
        status: data.status,
        products: data.products,
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId,
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

  /**
   * Check if customer has video access based on purchase history
   */
  async hasVideoAccess(customerId: string): Promise<boolean> {
    try {
      const purchases = await this.purchaseRepository.findByCustomerId(customerId);
      
      // Check if customer has any completed purchase with video access
      return purchases.some(purchase => 
        purchase.status === 'completed' && 
        this.hasVideoAccessInPurchase(purchase)
      );
    } catch (error) {
      LoggerHelper.error('PurchaseService', 'hasVideoAccess', 'Error checking video access', {
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId,
      });
      return false;
    }
  }

  /**
   * Check if customer has specific products
   */
  async hasSpecificProducts(customerId: string, requiredProducts: string[]): Promise<boolean> {
    try {
      const purchases = await this.purchaseRepository.findByCustomerId(customerId);
      
      // Check if customer has any completed purchase with the required products
      return purchases.some(purchase => {
        if (purchase.status !== 'completed') return false;
        
        const products = purchase.products as any;
        if (!products || !Array.isArray(products)) return false;
        
        // Check if all required products are in the purchase
        return requiredProducts.every(requiredProduct => 
          products.some((product: any) => 
            product.id === requiredProduct || product.name === requiredProduct
          )
        );
      });
    } catch (error) {
      LoggerHelper.error('PurchaseService', 'hasSpecificProducts', 'Error checking specific products', {
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId,
        requiredProducts,
      });
      return false;
    }
  }

  /**
   * Get customer's purchased products
   */
  async getCustomerProducts(customerId: string): Promise<string[]> {
    try {
      const purchases = await this.purchaseRepository.findByCustomerId(customerId);
      const products: string[] = [];
      
      purchases.forEach(purchase => {
        if (purchase.status === 'completed' && purchase.products) {
          const purchaseProducts = purchase.products as any;
          if (Array.isArray(purchaseProducts)) {
            purchaseProducts.forEach((product: any) => {
              const productId = product.id || product.name;
              if (productId && !products.includes(productId)) {
                products.push(productId);
              }
            });
          }
        }
      });
      
      return products;
    } catch (error) {
      LoggerHelper.error('PurchaseService', 'getCustomerProducts', 'Error getting customer products', {
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId,
      });
      return [];
    }
  }

  /**
   * Check if purchase has video access
   */
  private hasVideoAccessInPurchase(purchase: Purchase): boolean {
    try {
      const products = purchase.products as any;
      if (!products || !Array.isArray(products)) return false;
      
      // Check if any product in the purchase gives video access
      return products.some((product: any) => {
        const productName = (product.name || '').toLowerCase();
        const productId = (product.id || '').toLowerCase();
        
        return productName.includes('video') || 
               productId.includes('video') ||
               productName.includes('template') ||
               productId.includes('template');
      });
    } catch (error) {
      LoggerHelper.error('PurchaseService', 'hasVideoAccessInPurchase', 'Error checking video access in purchase', {
        error: error instanceof Error ? error.message : 'Unknown error',
        purchaseId: purchase.id,
      });
      return false;
    }
  }
}
