import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create sample customers
  const customer1Password = await bcrypt.hash('customer123', 10);
  const customer1 = await prisma.customer.upsert({
    where: { email: 'customer1@example.com' },
    update: {},
    create: {
      email: 'customer1@example.com',
      name: 'John Doe',
      password: customer1Password,
      role: Role.FREE,
    },
  });

  const customer2Password = await bcrypt.hash('customer123', 10);
  const customer2 = await prisma.customer.upsert({
    where: { email: 'customer2@example.com' },
    update: {},
    create: {
      email: 'customer2@example.com',
      name: 'Jane Smith',
      password: customer2Password,
      role: Role.MEMBER,
    },
  });

  console.log('✅ Sample customers created');

  // Create sample videos
  const video1 = await prisma.video.create({
    data: {
      title: 'Introduction to Node.js',
      description: 'Learn the basics of Node.js development',
      url: 'https://example.com/videos/nodejs-intro.mp4',
      thumbnail: 'https://example.com/thumbnails/nodejs-intro.jpg',
      duration: 1800, // 30 minutes
      isPublished: true,
      customerId: customer1.id,
    },
  });

  const video2 = await prisma.video.create({
    data: {
      title: 'Advanced TypeScript',
      description: 'Deep dive into TypeScript advanced features',
      url: 'https://example.com/videos/typescript-advanced.mp4',
      thumbnail: 'https://example.com/thumbnails/typescript-advanced.jpg',
      duration: 2400, // 40 minutes
      isPublished: true,
      customerId: customer2.id,
    },
  });

  console.log('✅ Sample videos created');

  // Create sample membership
  const membership = await prisma.membership.create({
    data: {
      customerId: customer2.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true,
      planType: 'monthly',
    },
  });

  console.log('✅ Sample membership created');

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
