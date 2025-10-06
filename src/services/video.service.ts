import { PrismaClient } from '@prisma/client';
import { BaseService } from './base.service';
import { VideoRepository } from '@/repositories';
import {
  CreateVideoInput,
  UpdateVideoInput,
  VideoQuery,
  VideoResponse,
  VideoWithCategory,
} from '@/validators';

export class VideoService extends BaseService {
  private videoRepository: VideoRepository;

  constructor(prisma: PrismaClient) {
    super(prisma);
    this.videoRepository = new VideoRepository(prisma);
  }

  /**
   * Get all videos with pagination and filters
   */
  async getAllVideos(query: VideoQuery) {
    try {
      const result = await this.videoRepository.findAll(query);
      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      throw new Error(`Failed to get videos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get published videos only
   */
  async getPublishedVideos(query: Omit<VideoQuery, 'isPublished'>) {
    try {
      const result = await this.videoRepository.findPublished(query);
      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      throw new Error(`Failed to get published videos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get video by ID
   */
  async getVideoById(id: string): Promise<VideoWithCategory> {
    try {
      const video = await this.videoRepository.findById(id);
      if (!video) {
        throw new Error('Video not found');
      }
      return video as any;
    } catch (error) {
      throw new Error(`Failed to get video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get videos by category ID
   */
  async getVideosByCategoryId(categoryId: string, query: Omit<VideoQuery, 'categoryId'>) {
    try {
      const result = await this.videoRepository.findByCategoryId(categoryId, query);
      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      throw new Error(`Failed to get category videos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new video
   */
  async createVideo(data: CreateVideoInput): Promise<VideoResponse> {
    try {
      console.log('VideoService.createVideo - Input data:', data);
      
      // Create video directly
      const video = await this.prisma.video.create({
        data: {
          title: data.title,
          description: data.description,
          url: data.url,
          thumbnail: data.thumbnail,
          duration: data.duration,
          isPublished: data.isPublished,
          categoryId: data.categoryId,
        },
      });

      console.log('VideoService.createVideo - Video created:', video);
      return video as any;
    } catch (error) {
      console.error('VideoService.createVideo - Error:', error);
      throw new Error(`Failed to create video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update video by ID
   */
  async updateVideo(id: string, data: UpdateVideoInput): Promise<VideoResponse> {
    try {
      // Check if video exists
      const exists = await this.videoRepository.exists(id);
      if (!exists) {
        throw new Error('Video not found');
      }

      // Validate category if provided
      if (data.categoryId) {
        await this.validateRecordExists(
          this.prisma.category,
          data.categoryId,
          'Category not found'
        );
      }

      // Prepare update data
      const updateData: any = { ...data };
      if (data.categoryId) {
        updateData.category = { connect: { id: data.categoryId } };
        delete updateData.categoryId;
      }

      // Update video
      const video = await this.videoRepository.update(id, updateData);
      return video;
    } catch (error) {
      throw new Error(`Failed to update video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete video by ID (soft delete)
   */
  async deleteVideo(id: string): Promise<void> {
    try {
      // Check if video exists
      const exists = await this.videoRepository.exists(id);
      if (!exists) {
        throw new Error('Video not found');
      }

      // Soft delete video
      await this.videoRepository.delete(id);
    } catch (error) {
      throw new Error(`Failed to delete video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Publish/unpublish video
   */
  async toggleVideoPublish(id: string, isPublished: boolean): Promise<VideoResponse> {
    try {
      // Check if video exists
      const exists = await this.videoRepository.exists(id);
      if (!exists) {
        throw new Error('Video not found');
      }

      // Toggle publish status
      const video = await this.videoRepository.togglePublish(id, isPublished);
      return video;
    } catch (error) {
      throw new Error(`Failed to toggle video publish: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get video statistics
   */
  async getVideoStats() {
    try {
      const stats = await this.videoRepository.getStats();
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      throw new Error(`Failed to get video stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate video URL format
   */
  private validateVideoUrl(url: string): boolean {
    const videoUrlPattern = /\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i;
    return videoUrlPattern.test(url) || url.startsWith('http');
  }

  /**
   * Validate thumbnail URL format
   */
  private validateThumbnailUrl(url: string): boolean {
    const imageUrlPattern = /\.(jpg|jpeg|png|gif|webp)$/i;
    return imageUrlPattern.test(url) || url.startsWith('http');
  }

}
