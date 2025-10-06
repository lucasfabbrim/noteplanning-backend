import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { buildApp } from '../src/server';
import bcrypt from 'bcryptjs';

describe('Video System Integration Tests', () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;
  let adminToken: string;
  let customerToken: string;
  let customerWithoutAccessToken: string;
  let adminId: string;
  let customerId: string;
  let customerWithoutAccessId: string;
  let categoryId: string;
  let videoId: string;

  beforeAll(async () => {
    app = await buildApp();
    prisma = new PrismaClient();
    
    // Create test data
    const adminPassword = await bcrypt.hash('admin123', 10);
    const customerPassword = await bcrypt.hash('customer123', 10);
    
    // Create admin
    const admin = await prisma.customer.create({
      data: {
        email: 'test-admin@example.com',
        password: adminPassword,
        name: 'Test Admin',
        role: 'ADMIN',
        isActive: true,
      },
    });
    adminId = admin.id;

    // Create customer with video access
    const customer = await prisma.customer.create({
      data: {
        email: 'test-customer@example.com',
        password: customerPassword,
        name: 'Test Customer',
        role: 'CUSTOMER',
        isActive: true,
      },
    });
    customerId = customer.id;

    // Create customer without video access
    const customerWithoutAccess = await prisma.customer.create({
      data: {
        email: 'test-no-access@example.com',
        password: customerPassword,
        name: 'Test No Access',
        role: 'CUSTOMER',
        isActive: true,
      },
    });
    customerWithoutAccessId = customerWithoutAccess.id;

    // Create purchase for customer with access
    await prisma.purchase.create({
      data: {
        customerId: customer.id,
        amount: 47.00,
        status: 'completed',
        products: [
          { id: 'template-basico', name: 'Template Básico', price: 47.00 },
        ],
        paymentMethod: 'credit_card',
        transactionId: 'TEST_TXN_001',
      },
    });

    // Create category
    const category = await prisma.category.create({
      data: {
        name: 'Test Category',
        description: 'Test category for videos',
        slug: 'test-category',
        sortOrder: 1,
      },
    });
    categoryId = category.id;

    // Create video
    const video = await prisma.video.create({
      data: {
        title: 'Test Video',
        description: 'Test video description',
        videoURL: 'https://www.youtube.com/watch?v=test',
        cardImageUrl: 'https://example.com/image.jpg',
        duration: 600,
        likes: 0,
        views: 0,
        isPublished: true,
        requiredProducts: ['template-basico'],
        difficulty: 'beginner',
        tags: ['test', 'video'],
        categoryId: category.id,
        customerId: admin.id,
      },
    });
    videoId = video.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.videoProgress.deleteMany({
      where: {
        customerId: {
          in: [adminId, customerId, customerWithoutAccessId],
        },
      },
    });
    await prisma.video.deleteMany({
      where: {
        customerId: adminId,
      },
    });
    await prisma.category.deleteMany({
      where: {
        slug: 'test-category',
      },
    });
    await prisma.purchase.deleteMany({
      where: {
        customerId: customerId,
      },
    });
    await prisma.customer.deleteMany({
      where: {
        id: {
          in: [adminId, customerId, customerWithoutAccessId],
        },
      },
    });
    
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Login and get tokens
    const adminLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'test-admin@example.com',
        password: 'admin123',
      },
    });
    adminToken = JSON.parse(adminLogin.body).data.token;

    const customerLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'test-customer@example.com',
        password: 'customer123',
      },
    });
    customerToken = JSON.parse(customerLogin.body).data.token;

    const customerWithoutAccessLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'test-no-access@example.com',
        password: 'customer123',
      },
    });
    customerWithoutAccessToken = JSON.parse(customerWithoutAccessLogin.body).data.token;
  });

  describe('Authentication and Access Control', () => {
    it('should allow admin to access all videos', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/videos/${videoId}/access`,
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.hasAccess).toBe(true);
      expect(data.data.accessReason).toBe('Admin access');
    });

    it('should allow customer with video access to view videos', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/videos/${videoId}/access`,
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.hasAccess).toBe(true);
      expect(data.data.accessReason).toBe('Required products purchased');
    });

    it('should deny access to customer without video access', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/videos/${videoId}/access`,
        headers: {
          Authorization: `Bearer ${customerWithoutAccessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.hasAccess).toBe(false);
      expect(data.data.accessReason).toBe('Required products: template-basico');
    });

    it('should require authentication for video access', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/videos/${videoId}/access`,
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Video Progress Tracking', () => {
    it('should allow customer to update video progress', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/videos/${videoId}/progress`,
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
        payload: {
          progress: 50,
          timeWatched: 300,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.progress).toBe(50);
      expect(data.data.timeWatched).toBe(300);
      expect(data.data.isCompleted).toBe(false);
    });

    it('should mark video as completed when progress >= 90%', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/videos/${videoId}/progress`,
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
        payload: {
          progress: 95,
          timeWatched: 570,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.progress).toBe(95);
      expect(data.data.isCompleted).toBe(true);
    });

    it('should validate progress range', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/videos/${videoId}/progress`,
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
        payload: {
          progress: 150,
          timeWatched: 300,
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should get customer video progress', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/videos/progress',
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
    });
  });

  describe('Learning Statistics', () => {
    it('should get customer learning statistics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/videos/stats',
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('totalVideosWatched');
      expect(data.data).toHaveProperty('totalTimeWatched');
      expect(data.data).toHaveProperty('completedVideos');
      expect(data.data).toHaveProperty('inProgressVideos');
      expect(data.data).toHaveProperty('categoryProgress');
    });

    it('should get last watched video', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/videos/last-watched',
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      if (data.data) {
        expect(data.data).toHaveProperty('video');
        expect(data.data).toHaveProperty('progress');
        expect(data.data).toHaveProperty('lastWatchedAt');
      }
    });

    it('should get category progress', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/videos/category/${categoryId}/progress`,
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('category');
      expect(data.data).toHaveProperty('videos');
      expect(data.data).toHaveProperty('totalVideos');
      expect(data.data).toHaveProperty('completedVideos');
      expect(data.data).toHaveProperty('completionRate');
    });
  });

  describe('Video Management', () => {
    it('should allow admin to create videos', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/videos',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        payload: {
          title: 'Admin Created Video',
          description: 'Video created by admin',
          videoURL: 'https://www.youtube.com/watch?v=admin',
          cardImageUrl: 'https://example.com/admin.jpg',
          duration: 1200,
          categoryId: categoryId,
          requiredProducts: ['template-avancado'],
          difficulty: 'intermediate',
          tags: ['admin', 'test'],
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe('Admin Created Video');
    });

    it('should deny customer from creating videos', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/videos',
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
        payload: {
          title: 'Customer Created Video',
          description: 'Video created by customer',
          videoURL: 'https://www.youtube.com/watch?v=customer',
          cardImageUrl: 'https://example.com/customer.jpg',
          duration: 1200,
          categoryId: categoryId,
        },
      });

      expect(response.statusCode).toBe(403);
    });

    it('should allow customer to like videos', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/videos/${videoId}/like`,
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
        payload: {
          liked: true,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.likes).toBeGreaterThan(0);
    });
  });

  describe('Category Management', () => {
    it('should get all categories', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/categories',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should get category by ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/categories/${categoryId}`,
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(categoryId);
    });

    it('should allow admin to create categories', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/categories',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        payload: {
          name: 'Admin Category',
          description: 'Category created by admin',
          slug: 'admin-category',
          sortOrder: 10,
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Admin Category');
    });

    it('should deny customer from creating categories', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/categories',
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
        payload: {
          name: 'Customer Category',
          description: 'Category created by customer',
          slug: 'customer-category',
          sortOrder: 10,
        },
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('Video Search and Filtering', () => {
    it('should search videos by title', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/videos/search?q=test',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should get videos by category', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/videos/category/${categoryId}`,
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should get trending videos', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/videos/trending',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should get videos with access control', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/videos/with-access',
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      
      // Check if videos have access information
      if (data.data.length > 0) {
        expect(data.data[0]).toHaveProperty('hasAccess');
        expect(data.data[0]).toHaveProperty('accessReason');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid video ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/videos/invalid-id/access',
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should handle invalid category ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/categories/invalid-id',
      });

      expect(response.statusCode).toBe(404);
    });

    it('should handle invalid progress update', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/videos/${videoId}/progress`,
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
        payload: {
          progress: -10,
          timeWatched: 300,
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
