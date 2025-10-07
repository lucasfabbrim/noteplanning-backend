import { PrismaClient } from '@prisma/client';
import { BaseController } from './base.controller';

export class ProductController extends BaseController {
  constructor(private prisma: PrismaClient) {
    super();
  }

  async getAllProducts(request: any, reply: any) {
    try {
      const query = request.query as any;
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 10;
      const skip = (page - 1) * limit;

      const where: any = {
        deactivatedAt: null,
      };

      if (query.isActive !== undefined) {
        where.isActive = query.isActive === 'true';
      }

      if (query.categoryId) {
        where.categoryId = query.categoryId;
      }

      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        }),
        this.prisma.product.count({ where }),
      ]);

      return reply.status(200).send({
        success: true,
        message: 'Products retrieved successfully',
        data: products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to get products',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getProductById(request: any, reply: any) {
    try {
      const { id } = request.params as { id: string };

      const product = await this.prisma.product.findFirst({
        where: {
          id,
          deactivatedAt: null,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      if (!product) {
        return reply.status(404).send({
          success: false,
          message: 'Product not found',
        });
      }

      return reply.status(200).send({
        success: true,
        message: 'Product retrieved successfully',
        data: product,
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to get product',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getProductByExternalId(request: any, reply: any) {
    try {
      const { externalId } = request.params as { externalId: string };

      const product = await this.prisma.product.findFirst({
        where: {
          externalId,
          deactivatedAt: null,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      if (!product) {
        return reply.status(404).send({
          success: false,
          message: 'Product not found',
        });
      }

      return reply.status(200).send({
        success: true,
        message: 'Product retrieved successfully',
        data: product,
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to get product',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async createProduct(request: any, reply: any) {
    try {
      const body = request.body as {
        externalId: string;
        name: string;
        description?: string;
        price: number;
        categoryId?: string;
        isActive?: boolean;
      };

      const existingProduct = await this.prisma.product.findFirst({
        where: {
          externalId: body.externalId,
        },
      });

      if (existingProduct) {
        return reply.status(409).send({
          success: false,
          message: 'Product with this external ID already exists',
        });
      }

      const product = await this.prisma.product.create({
        data: {
          externalId: body.externalId,
          name: body.name,
          description: body.description,
          price: body.price,
          categoryId: body.categoryId,
          isActive: body.isActive ?? true,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      return reply.status(201).send({
        success: true,
        message: 'Product created successfully',
        data: product,
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to create product',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updateProduct(request: any, reply: any) {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as {
        name?: string;
        description?: string;
        price?: number;
        categoryId?: string;
        isActive?: boolean;
      };

      const existingProduct = await this.prisma.product.findFirst({
        where: {
          id,
          deactivatedAt: null,
        },
      });

      if (!existingProduct) {
        return reply.status(404).send({
          success: false,
          message: 'Product not found',
        });
      }

      const product = await this.prisma.product.update({
        where: { id },
        data: {
          ...(body.name && { name: body.name }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.price !== undefined && { price: body.price }),
          ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
          ...(body.isActive !== undefined && { isActive: body.isActive }),
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      return reply.status(200).send({
        success: true,
        message: 'Product updated successfully',
        data: product,
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to update product',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async deleteProduct(request: any, reply: any) {
    try {
      const { id } = request.params as { id: string };

      const existingProduct = await this.prisma.product.findFirst({
        where: {
          id,
          deactivatedAt: null,
        },
      });

      if (!existingProduct) {
        return reply.status(404).send({
          success: false,
          message: 'Product not found',
        });
      }

      await this.prisma.product.update({
        where: { id },
        data: {
          deactivatedAt: new Date(),
        },
      });

      return reply.status(200).send({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to delete product',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
