import { PrismaClient, Video, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { VideoQuery } from '@/validators';

export interface VideoWithCustomer extends Video {
  customer: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export class VideoRepository extends BaseRepository<Video> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Find all videos with pagination and filters
   */
  async findAll(query: VideoQuery) {
    const { page, limit, search, isPublished, categoryId, minDuration, maxDuration } = query;

    const where: Prisma.VideoWhereInput = {
      deactivatedAt: null,
      ...(isPublished !== undefined && { isPublished }),
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(minDuration && { duration: { gte: minDuration } }),
      ...(maxDuration && { duration: { lte: maxDuration } }),
    };

    return this.getPaginatedResults(this.prisma.video, {
      page,
      limit,
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find published videos only
   */
  async findPublished(query: Omit<VideoQuery, 'isPublished'>) {
    return this.findAll({ ...query, isPublished: true });
  }

  /**
   * Find video by ID
   */
  async findById(id: string): Promise<any | null> {
    return this.prisma.video.findFirst({
      where: {
        id,
        deactivatedAt: null,
      },
      include: {
        Category: true,
      },
    });
  }

  /**
   * Find videos by category ID
   */
  async findByCategoryId(categoryId: string, query: Omit<VideoQuery, 'categoryId'>) {
    return this.findAll({ ...query, categoryId });
  }

  /**
   * Create a new video
   */
  async create(data: Prisma.VideoCreateInput): Promise<Video> {
    return this.prisma.video.create({
      data,
    });
  }

  /**
   * Update video by ID
   */
  async update(id: string, data: Prisma.VideoUpdateInput): Promise<Video> {
    return this.prisma.video.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete video by ID
   */
  async delete(id: string): Promise<Video> {
    return this.softDelete(this.prisma.video, id);
  }

  /**
   * Check if video exists and is active
   */
  async exists(id: string): Promise<boolean> {
    return this.existsAndActive(this.prisma.video, id);
  }

  /**
   * Publish/unpublish video
   */
  async togglePublish(id: string, isPublished: boolean): Promise<Video> {
    return this.prisma.video.update({
      where: { id },
      data: { isPublished },
    });
  }

  /**
   * Get video statistics
   */
  async getStats() {
    const [total, published, unpublished, byCustomer] = await Promise.all([
      this.prisma.video.count({
        where: { deactivatedAt: null },
      }),
      this.prisma.video.count({
        where: { deactivatedAt: null, isPublished: true },
      }),
      this.prisma.video.count({
        where: { deactivatedAt: null, isPublished: false },
      }),
      this.prisma.video.groupBy({
        by: ['categoryId'],
        where: { deactivatedAt: null },
        _count: { categoryId: true },
      }),
    ]);

    const totalDuration = await this.prisma.video.aggregate({
      where: { deactivatedAt: null },
      _sum: { duration: true },
    });

    return {
      total,
      published,
      unpublished,
      totalDuration: totalDuration._sum.duration || 0,
      byCustomer: byCustomer.length,
    };
  }
}
