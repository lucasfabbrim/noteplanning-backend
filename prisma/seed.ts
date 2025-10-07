import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin customer (customer with ADMIN role)
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.customer.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  console.log('✅ Admin customer created:', admin.email);

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

  // Create sample categories
  const category1 = await prisma.category.upsert({
    where: { slug: 'programming-basics' },
    update: {},
    create: {
      name: 'Programming Basics',
      description: 'Learn the fundamentals of programming',
      slug: 'programming-basics',
      sortOrder: 1,
    },
  });

  const category2 = await prisma.category.upsert({
    where: { slug: 'advanced-topics' },
    update: {},
    create: {
      name: 'Advanced Topics',
      description: 'Advanced programming concepts and techniques',
      slug: 'advanced-topics',
      sortOrder: 2,
    },
  });

  console.log('✅ Sample categories created');

  // Create sample products
  const product1 = await prisma.product.upsert({
    where: { externalId: 'prod_basic' },
    update: {},
    create: {
      externalId: 'prod_basic',
      name: 'Basic Programming Course',
      description: 'Access to basic programming videos',
      price: 29.99,
      categoryId: category1.id,
    },
  });

  const product2 = await prisma.product.upsert({
    where: { externalId: 'prod_advanced' },
    update: {},
    create: {
      externalId: 'prod_advanced',
      name: 'Advanced Programming Course',
      description: 'Access to advanced programming videos',
      price: 59.99,
      categoryId: category2.id,
    },
  });

  console.log('✅ Sample products created');

  // Create sample videos
  const video1 = await prisma.video.create({
    data: {
      title: 'Introduction to Node.js',
      description: 'Learn the basics of Node.js development',
      url: 'https://example.com/videos/nodejs-intro.mp4',
      thumbnail: 'https://example.com/thumbnails/nodejs-intro.jpg',
      duration: 1800, // 30 minutes
      isPublished: true,
      categoryId: category1.id,
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
      categoryId: category2.id,
    },
  });

  console.log('✅ Sample videos created');


  // Create sample purchase
  const purchase = await prisma.purchase.create({
    data: {
      customerId: customer2.id,
      amount: 29.99,
      paymentAmount: 29.99,
      event: 'billing.paid',
      status: 'pending',
      customerName: customer2.name,
      customerEmail: customer2.email,
      customerPhone: '11999999999',
      customerTaxId: '12345678901',
      products: [
        {
          id: product1.id,
          externalId: product1.externalId,
          name: product1.name,
          price: product1.price,
          quantity: 1,
        },
      ],
    },
  });

  console.log('✅ Sample purchase created');

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
