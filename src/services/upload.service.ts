import { createClient } from '@supabase/supabase-js';
import { env } from '@/config';
import { LoggerHelper } from '@/utils/logger.helper';

export class UploadService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  async uploadThumbnail(file: Buffer, fileName: string, contentType: string): Promise<string> {
    try {
      const timestamp = Date.now();
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const finalFileName = `${timestamp}_${sanitizedFileName}`;
      
      const { data, error } = await this.supabase.storage
        .from('thumbnails')
        .upload(finalFileName, file, {
          contentType,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        LoggerHelper.error('UploadService', 'uploadThumbnail', 'Failed to upload thumbnail', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      const { data: publicUrl } = this.supabase.storage
        .from('thumbnails')
        .getPublicUrl(finalFileName);

      LoggerHelper.info('UploadService', 'uploadThumbnail', 'Thumbnail uploaded successfully', { fileName: finalFileName });
      
      return publicUrl.publicUrl;
    } catch (error) {
      LoggerHelper.error('UploadService', 'uploadThumbnail', 'Upload service error', error);
      throw new Error(`Upload service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteThumbnail(fileName: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from('thumbnails')
        .remove([fileName]);

      if (error) {
        LoggerHelper.error('UploadService', 'deleteThumbnail', 'Failed to delete thumbnail', error);
        return false;
      }

      LoggerHelper.info('UploadService', 'deleteThumbnail', 'Thumbnail deleted successfully', { fileName });
      return true;
    } catch (error) {
      LoggerHelper.error('UploadService', 'deleteThumbnail', 'Delete service error', error);
      return false;
    }
  }

  async getThumbnailUrl(fileName: string): Promise<string> {
    try {
      const { data } = this.supabase.storage
        .from('thumbnails')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      LoggerHelper.error('UploadService', 'getThumbnailUrl', 'Failed to get thumbnail URL', error);
      throw new Error(`Failed to get thumbnail URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  validateImageFile(file: any): { isValid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.mimetype)) {
      return {
        isValid: false,
        error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File too large. Maximum size is 5MB.'
      };
    }

    return { isValid: true };
  }
}
