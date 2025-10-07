import { PrismaClient, Video } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class VideoRepository extends BaseRepository<Video> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findByCategoryId(categoryId: string): Promise<Video[]> {
    return this.prisma.video.findMany({
      where: {
        categoryId,
        deactivatedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByCategoryIdWithPagination(
    categoryId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ videos: Video[]; total: number }> {
    const skip = (page - 1) * limit;

    const [videos, total] = await Promise.all([
      this.prisma.video.findMany({
        where: {
          categoryId,
          deactivatedAt: null,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.video.count({
        where: {
          categoryId,
          deactivatedAt: null,
        },
      }),
    ]);

    return { videos, total };
  }

  async findPublishedByCategoryId(categoryId: string): Promise<Video[]> {
    return this.prisma.video.findMany({
      where: {
        categoryId,
        isPublished: true,
        deactivatedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
