import { PrismaClient, Product } from '@prisma/client';
import { BaseService } from './base.service';
import { LoggerHelper } from '@/utils/logger.helper';

/**
 * Product service
 */
export class ProductService extends BaseService {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Create or update product from webhook data
   */
  async createOrUpdateProduct(productData: {
    externalId: string;
    name?: string;
    description?: string;
    price?: number;
    categoryId?: string;
  }): Promise<Product> {
    try {
      // Check if product already exists
      const existingProduct = await this.prisma.product.findUnique({
        where: { externalId: productData.externalId },
      });

      if (existingProduct) {
        // Update existing product
        const updatedProduct = await this.prisma.product.update({
          where: { externalId: productData.externalId },
          data: {
            name: productData.name || existingProduct.name,
            description: productData.description || existingProduct.description,
            price: productData.price || existingProduct.price,
            categoryId: productData.categoryId || existingProduct.categoryId,
            updatedAt: new Date(),
          },
        });

        LoggerHelper.info('ProductService', 'createOrUpdateProduct', 'Product updated', {
          productId: updatedProduct.id,
          externalId: productData.externalId,
        });

        return updatedProduct;
      } else {
        // Create new product
        const newProduct = await this.prisma.product.create({
          data: {
            externalId: productData.externalId,
            name: productData.name || `Product ${productData.externalId}`,
            description: productData.description,
            price: productData.price || 0,
            categoryId: productData.categoryId,
            isActive: true,
          },
        });

        LoggerHelper.info('ProductService', 'createOrUpdateProduct', 'Product created', {
          productId: newProduct.id,
          externalId: productData.externalId,
        });

        return newProduct;
      }
    } catch (error) {
      LoggerHelper.error('ProductService', 'createOrUpdateProduct', 'Failed to create or update product', error);
      throw new Error('Failed to create or update product');
    }
  }

  /**
   * Get all products
   */
  async getAllProducts(): Promise<Product[]> {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          isActive: true,
          deactivatedAt: null,
        },
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return products;
    } catch (error) {
      LoggerHelper.error('ProductService', 'getAllProducts', 'Failed to get products', error);
      throw new Error('Failed to get products');
    }
  }

  /**
   * Get product by external ID
   */
  async getProductByExternalId(externalId: string): Promise<Product | null> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { externalId },
        include: {
          category: true,
        },
      });

      return product;
    } catch (error) {
      LoggerHelper.error('ProductService', 'getProductByExternalId', 'Failed to get product', error);
      throw new Error('Failed to get product');
    }
  }

  /**
   * Update product category
   */
  async updateProductCategory(externalId: string, categoryId: string): Promise<Product> {
    try {
      const product = await this.prisma.product.update({
        where: { externalId },
        data: {
          categoryId,
          updatedAt: new Date(),
        },
        include: {
          category: true,
        },
      });

      LoggerHelper.info('ProductService', 'updateProductCategory', 'Product category updated', {
        productId: product.id,
        externalId,
        categoryId,
      });

      return product;
    } catch (error) {
      LoggerHelper.error('ProductService', 'updateProductCategory', 'Failed to update product category', error);
      throw new Error('Failed to update product category');
    }
  }
}
