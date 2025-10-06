import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting categories and videos seed...');

  // Create admin user if not exists
  const adminEmail = 'admin@noteplanning.com';
  let adminUser = await prisma.customer.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    adminUser = await prisma.customer.create({
      data: {
        email: adminEmail,
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log('✅ Admin user created');
  }

  // Create categories
  const categories = [
    {
      name: 'Planejamento Pessoal',
      description: 'Vídeos sobre organização pessoal, produtividade e gestão de tempo',
      slug: 'planejamento-pessoal',
      sortOrder: 1,
    },
    {
      name: 'Metodologias de Estudo',
      description: 'Técnicas e estratégias para estudar de forma mais eficiente',
      slug: 'metodologias-estudo',
      sortOrder: 2,
    },
    {
      name: 'Ferramentas Digitais',
      description: 'Tutoriais de aplicativos e ferramentas para produtividade',
      slug: 'ferramentas-digitais',
      sortOrder: 3,
    },
    {
      name: 'Mindset e Motivação',
      description: 'Conteúdo sobre desenvolvimento pessoal e mentalidade',
      slug: 'mindset-motivacao',
      sortOrder: 4,
    },
    {
      name: 'Templates e Exemplos',
      description: 'Modelos práticos e exemplos de planejamento',
      slug: 'templates-exemplos',
      sortOrder: 5,
    },
  ];

  const createdCategories = [];
  for (const categoryData of categories) {
    const existingCategory = await prisma.category.findUnique({
      where: { slug: categoryData.slug },
    });

    if (!existingCategory) {
      const category = await prisma.category.create({
        data: categoryData,
      });
      createdCategories.push(category);
      console.log(`✅ Category created: ${category.name}`);
    } else {
      createdCategories.push(existingCategory);
      console.log(`ℹ️ Category already exists: ${existingCategory.name}`);
    }
  }

  // Create sample videos
  const videos = [
    {
      title: 'Como Criar um Plano de Estudos Eficaz',
      description: 'Aprenda a criar um plano de estudos que realmente funciona, com dicas práticas e exemplos reais.',
      videoURL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      cardImageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
      duration: 1200, // 20 minutes
      likes: 45,
      isPublished: true,
      categoryId: createdCategories[1].id, // Metodologias de Estudo
      customerId: adminUser.id,
      requiredProducts: ['template-basico', 'template-avancado'],
    },
    {
      title: 'Organizando sua Rotina Matinal',
      description: 'Descubra como criar uma rotina matinal que aumenta sua produtividade durante todo o dia.',
      videoURL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      cardImageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      duration: 900, // 15 minutes
      likes: 32,
      isPublished: true,
      categoryId: createdCategories[0].id, // Planejamento Pessoal
      customerId: adminUser.id,
      requiredProducts: ['template-basico'],
    },
    {
      title: 'Notion para Iniciantes - Configuração Básica',
      description: 'Tutorial completo de como configurar o Notion para organização pessoal e estudos.',
      videoURL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      cardImageUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400',
      duration: 1800, // 30 minutes
      likes: 67,
      isPublished: true,
      categoryId: createdCategories[2].id, // Ferramentas Digitais
      customerId: adminUser.id,
      requiredProducts: ['template-avancado'],
    },
    {
      title: 'Técnica Pomodoro - Guia Completo',
      description: 'Aprenda a usar a técnica Pomodoro para maximizar sua concentração e produtividade.',
      videoURL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      cardImageUrl: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400',
      duration: 600, // 10 minutes
      likes: 28,
      isPublished: true,
      categoryId: createdCategories[1].id, // Metodologias de Estudo
      customerId: adminUser.id,
      requiredProducts: ['template-basico'],
    },
    {
      title: 'Mindset de Sucesso nos Estudos',
      description: 'Como desenvolver uma mentalidade positiva e eficaz para seus estudos e objetivos.',
      videoURL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      cardImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      duration: 1500, // 25 minutes
      likes: 41,
      isPublished: true,
      categoryId: createdCategories[3].id, // Mindset e Motivação
      customerId: adminUser.id,
      requiredProducts: ['template-basico', 'template-avancado'],
    },
    {
      title: 'Template de Planejamento Semanal',
      description: 'Veja como usar nosso template de planejamento semanal para organizar sua vida.',
      videoURL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      cardImageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
      duration: 720, // 12 minutes
      likes: 19,
      isPublished: true,
      categoryId: createdCategories[4].id, // Templates e Exemplos
      customerId: adminUser.id,
      requiredProducts: ['template-basico'],
    },
    {
      title: 'Google Calendar - Organização Avançada',
      description: 'Aprenda recursos avançados do Google Calendar para otimizar sua agenda.',
      videoURL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      cardImageUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400',
      duration: 1350, // 22.5 minutes
      likes: 35,
      isPublished: true,
      categoryId: createdCategories[2].id, // Ferramentas Digitais
      customerId: adminUser.id,
      requiredProducts: ['template-avancado'],
    },
    {
      title: 'Como Manter a Motivação nos Estudos',
      description: 'Estratégias práticas para manter-se motivado durante longos períodos de estudo.',
      videoURL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      cardImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      duration: 1080, // 18 minutes
      likes: 52,
      isPublished: true,
      categoryId: createdCategories[3].id, // Mindset e Motivação
      customerId: adminUser.id,
      requiredProducts: ['template-basico', 'template-avancado'],
    },
  ];

  for (const videoData of videos) {
    const existingVideo = await prisma.video.findFirst({
      where: { title: videoData.title },
    });

    if (!existingVideo) {
      const video = await prisma.video.create({
        data: videoData,
      });
      console.log(`✅ Video created: ${video.title}`);
    } else {
      console.log(`ℹ️ Video already exists: ${existingVideo.title}`);
    }
  }

  console.log('🎉 Categories and videos seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
