import { PrismaClient } from '@prisma/client';
import { BaseService } from './base.service';
import { LoggerHelper } from '@/utils/logger.helper';

/**
 * Service to manage video access based on purchased products
 */
export class VideoAccessService extends BaseService {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Get all videos that a customer has access to based on their purchases
   */
  async getCustomerAccessibleVideos(customerId: string): Promise<{
    videos: any[];
    categories: any[];
  }> {
    try {
      // Get all purchases for the customer
      const purchases = await this.prisma.purchase.findMany({
        where: {
          customerId,
          status: 'completed',
          deactivatedAt: null,
        },
        include: {
          // products: true, // Products are stored as JSON in purchase
        },
      });

      // Extract product external IDs from purchases
      const productExternalIds: string[] = [];
      purchases.forEach(purchase => {
        if (purchase.products) {
          const products = purchase.products as any[];
          products.forEach((product: any) => {
            if (product.externalId) {
              productExternalIds.push(product.externalId);
            }
          });
        }
      });

      if (productExternalIds.length === 0) {
        return { videos: [], categories: [] };
      }

      // Get products and their categories
      const products = await this.prisma.product.findMany({
        where: {
          externalId: { in: productExternalIds },
          isActive: true,
          deactivatedAt: null,
        },
        include: {
          category: {
            include: {
              videos: {
                where: {
                  isPublished: true,
                  deactivatedAt: null,
                },
                orderBy: {
                  createdAt: 'asc',
                },
              },
            },
          },
        },
      });

      // Extract unique categories and videos
      const categoriesMap = new Map();
      const videosMap = new Map();

      products.forEach(product => {
        if (product.category) {
          const category = product.category;
          categoriesMap.set(category.id, category);
          
          category.videos.forEach(video => {
            videosMap.set(video.id, video);
          });
        }
      });

      const categories = Array.from(categoriesMap.values());
      const videos = Array.from(videosMap.values());

      LoggerHelper.info('VideoAccessService', 'getCustomerAccessibleVideos', 'Videos retrieved', {
        customerId,
        videoCount: videos.length,
        categoryCount: categories.length,
      });

      return { videos, categories };
    } catch (error) {
      LoggerHelper.error('VideoAccessService', 'getCustomerAccessibleVideos', 'Failed to get accessible videos', error);
      throw new Error('Failed to get accessible videos');
    }
  }

  /**
   * Check if customer has access to a specific video
   */
  async hasVideoAccess(customerId: string, videoId: string): Promise<boolean> {
    try {
      const { videos } = await this.getCustomerAccessibleVideos(customerId);
      return videos.some(video => video.id === videoId);
    } catch (error) {
      LoggerHelper.error('VideoAccessService', 'hasVideoAccess', 'Failed to check video access', error);
      return false;
    }
  }

  /**
   * Check if customer has access to a specific category
   */
  async hasCategoryAccess(customerId: string, categoryId: string): Promise<boolean> {
    try {
      const { categories } = await this.getCustomerAccessibleVideos(customerId);
      return categories.some(category => category.id === categoryId);
    } catch (error) {
      LoggerHelper.error('VideoAccessService', 'hasCategoryAccess', 'Failed to check category access', error);
      return false;
    }
  }

  /**
   * Get all products that give access to a specific category
   */
  async getProductsForCategory(categoryId: string): Promise<any[]> {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          categoryId,
          isActive: true,
          deactivatedAt: null,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return products;
    } catch (error) {
      LoggerHelper.error('VideoAccessService', 'getProductsForCategory', 'Failed to get products for category', error);
      throw new Error('Failed to get products for category');
    }
  }
}
