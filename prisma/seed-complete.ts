import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting complete database seeding...');

  // Create admin customer
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.customer.upsert({
    where: { email: 'admin@noteplanning.com' },
    update: {},
    create: {
      email: 'admin@noteplanning.com',
      password: adminPassword,
      name: 'Administrador',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Admin customer created:', admin.email);

  // Create regular customers
  const customerPassword = await bcrypt.hash('customer123', 10);
  const customer1 = await prisma.customer.upsert({
    where: { email: 'joao@example.com' },
    update: {},
    create: {
      email: 'joao@example.com',
      password: customerPassword,
      name: 'João Silva',
      role: 'FREE',
      isActive: true,
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { email: 'maria@example.com' },
    update: {},
    create: {
      email: 'maria@example.com',
      password: customerPassword,
      name: 'Maria Santos',
      role: 'FREE',
      isActive: true,
    },
  });

  const customer3 = await prisma.customer.upsert({
    where: { email: 'pedro@example.com' },
    update: {},
    create: {
      email: 'pedro@example.com',
      password: customerPassword,
      name: 'Pedro Oliveira',
      role: 'FREE',
      isActive: true,
    },
  });

  console.log('✅ Regular customers created');

  // Create categories
  const categories = [
    {
      name: 'Planejamento Pessoal',
      description: 'Vídeos sobre organização pessoal, produtividade e gestão de tempo',
      slug: 'planejamento-pessoal',
      sortOrder: 1,
    },
    {
      name: 'Desenvolvimento Profissional',
      description: 'Vídeos para alavancar sua carreira e habilidades profissionais',
      slug: 'desenvolvimento-profissional',
      sortOrder: 2,
    },
    {
      name: 'Empreendedorismo',
      description: 'Vídeos sobre como iniciar e gerenciar seu próprio negócio',
      slug: 'empreendedorismo',
      sortOrder: 3,
    },
    {
      name: 'Marketing Digital',
      description: 'Estratégias de marketing digital e crescimento online',
      slug: 'marketing-digital',
      sortOrder: 4,
    },
    {
      name: 'Finanças Pessoais',
      description: 'Educação financeira e gestão de dinheiro',
      slug: 'financas-pessoais',
      sortOrder: 5,
    },
  ];

  const createdCategories = [];
  for (const categoryData of categories) {
    const category = await prisma.category.upsert({
      where: { slug: categoryData.slug },
      update: {},
      create: categoryData,
    });
    createdCategories.push(category);
    console.log(`✅ Category created: ${category.name}`);
  }

  // Create videos with realistic data
  const videos = [
    // Planejamento Pessoal
    {
      title: 'Como Organizar sua Rotina Matinal',
      description: 'Aprenda a criar uma rotina matinal eficaz que vai transformar seu dia. Dicas práticas para acordar com energia e produtividade.',
      videoURL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      cardImageUrl: 'https://picsum.photos/seed/morning-routine/600/400',
      duration: 900, // 15 minutes
      likes: 25,
      views: 150,
      difficulty: 'beginner',
      tags: ['rotina', 'produtividade', 'manhã'],
      requiredProducts: ['template-basico'],
      categoryId: createdCategories[0].id,
      customerId: admin.id,
    },
    {
      title: 'Sistema de Produtividade GTD',
      description: 'Implemente o método Getting Things Done para organizar suas tarefas e projetos de forma eficiente.',
      videoURL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      cardImageUrl: 'https://picsum.photos/seed/gtd-system/600/400',
      duration: 1200, // 20 minutes
      likes: 40,
      views: 200,
      difficulty: 'intermediate',
      tags: ['gtd', 'produtividade', 'organização'],
      requiredProducts: ['template-avancado'],
      categoryId: createdCategories[0].id,
      customerId: admin.id,
    },
    {
      title: 'Gestão de Tempo com Técnica Pomodoro',
      description: 'Domine a técnica Pomodoro para maximizar sua concentração e produtividade ao longo do dia.',
      videoURL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      cardImageUrl: 'https://picsum.photos/seed/pomodoro/600/400',
      duration: 600, // 10 minutes
      likes: 35,
      views: 180,
      difficulty: 'beginner',
      tags: ['pomodoro', 'tempo', 'concentração'],
      requiredProducts: ['template-basico'],
      categoryId: createdCategories[0].id,
      customerId: admin.id,
    },

    // Desenvolvimento Profissional
    {
      title: 'Como Fazer Networking Eficaz',
      description: 'Estratégias práticas para construir uma rede de contatos profissional sólida e duradoura.',
      videoURL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      cardImageUrl: 'https://picsum.photos/seed/networking/600/400',
      duration: 1500, // 25 minutes
      likes: 30,
      views: 120,
      difficulty: 'intermediate',
      tags: ['networking', 'carreira', 'relacionamentos'],
      requiredProducts: ['template-avancado'],
      categoryId: createdCategories[1].id,
      customerId: admin.id,
    },
    {
      title: 'Preparação para Entrevistas de Emprego',
      description: 'Guia completo para se preparar e se destacar em entrevistas de emprego.',
      videoURL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      cardImageUrl: 'https://picsum.photos/seed/interview/600/400',
      duration: 1800, // 30 minutes
      likes: 50,
      views: 250,
      difficulty: 'beginner',
      tags: ['entrevista', 'emprego', 'preparação'],
      requiredProducts: ['template-basico'],
      categoryId: createdCategories[1].id,
      customerId: admin.id,
    },

    // Empreendedorismo
    {
      title: 'Validação de Ideias de Negócio',
      description: 'Aprenda a validar suas ideias de negócio antes de investir tempo e dinheiro.',
      videoURL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      cardImageUrl: 'https://picsum.photos/seed/validation/600/400',
      duration: 2100, // 35 minutes
      likes: 45,
      views: 300,
      difficulty: 'advanced',
      tags: ['validação', 'negócio', 'startup'],
      requiredProducts: ['template-avancado'],
      categoryId: createdCategories[2].id,
      customerId: admin.id,
    },
    {
      title: 'Modelo de Negócio Canvas',
      description: 'Como usar o Business Model Canvas para estruturar seu negócio de forma clara e objetiva.',
      videoURL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      cardImageUrl: 'https://picsum.photos/seed/canvas/600/400',
      duration: 2400, // 40 minutes
      likes: 60,
      views: 400,
      difficulty: 'intermediate',
      tags: ['canvas', 'modelo', 'negócio'],
      requiredProducts: ['template-avancado'],
      categoryId: createdCategories[2].id,
      customerId: admin.id,
    },

    // Marketing Digital
    {
      title: 'Estratégias de Conteúdo para Redes Sociais',
      description: 'Crie conteúdo envolvente e estratégico para suas redes sociais.',
      videoURL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      cardImageUrl: 'https://picsum.photos/seed/social-media/600/400',
      duration: 1800, // 30 minutes
      likes: 55,
      views: 350,
      difficulty: 'intermediate',
      tags: ['redes sociais', 'conteúdo', 'marketing'],
      requiredProducts: ['template-avancado'],
      categoryId: createdCategories[3].id,
      customerId: admin.id,
    },
    {
      title: 'SEO para Iniciantes',
      description: 'Fundamentos do SEO para melhorar o posicionamento do seu site nos mecanismos de busca.',
      videoURL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      cardImageUrl: 'https://picsum.photos/seed/seo/600/400',
      duration: 2700, // 45 minutes
      likes: 70,
      views: 500,
      difficulty: 'beginner',
      tags: ['seo', 'google', 'posicionamento'],
      requiredProducts: ['template-basico'],
      categoryId: createdCategories[3].id,
      customerId: admin.id,
    },

    // Finanças Pessoais
    {
      title: 'Orçamento Pessoal: Primeiros Passos',
      description: 'Como criar e manter um orçamento pessoal eficaz para controlar suas finanças.',
      videoURL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      cardImageUrl: 'https://picsum.photos/seed/budget/600/400',
      duration: 1200, // 20 minutes
      likes: 40,
      views: 200,
      difficulty: 'beginner',
      tags: ['orçamento', 'finanças', 'controle'],
      requiredProducts: ['template-basico'],
      categoryId: createdCategories[4].id,
      customerId: admin.id,
    },
    {
      title: 'Investimentos para Iniciantes',
      description: 'Conceitos básicos de investimentos e como começar a investir com segurança.',
      videoURL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      cardImageUrl: 'https://picsum.photos/seed/investments/600/400',
      duration: 3000, // 50 minutes
      likes: 80,
      views: 600,
      difficulty: 'intermediate',
      tags: ['investimentos', 'renda fixa', 'renda variável'],
      requiredProducts: ['template-avancado'],
      categoryId: createdCategories[4].id,
      customerId: admin.id,
    },
  ];

  const createdVideos = [];
  for (const videoData of videos) {
    const video = await prisma.video.upsert({
      where: { id: `video-${videoData.title.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `video-${videoData.title.toLowerCase().replace(/\s+/g, '-')}`,
        title: videoData.title,
        description: videoData.description,
        url: videoData.videoURL,
        thumbnail: videoData.cardImageUrl,
        duration: videoData.duration,
        isPublished: true,
        customerId: videoData.customerId,
        categoryId: videoData.categoryId,
      },
    });
    createdVideos.push(video);
    console.log(`✅ Video created: ${video.title}`);
  }

  // Create purchases for customers
  const purchases = [
    {
      customerId: customer1.id,
      amount: 97.00,
      status: 'completed',
      products: [
        { id: 'template-basico', name: 'Template Básico', price: 47.00 },
        { id: 'template-avancado', name: 'Template Avançado', price: 50.00 },
      ],
      paymentMethod: 'credit_card',
      transactionId: 'TXN_001',
    },
    {
      customerId: customer2.id,
      amount: 47.00,
      status: 'completed',
      products: [
        { id: 'template-basico', name: 'Template Básico', price: 47.00 },
      ],
      paymentMethod: 'pix',
      transactionId: 'TXN_002',
    },
    {
      customerId: customer3.id,
      amount: 50.00,
      status: 'completed',
      products: [
        { id: 'template-avancado', name: 'Template Avançado', price: 50.00 },
      ],
      paymentMethod: 'credit_card',
      transactionId: 'TXN_003',
    },
  ];

  for (const purchaseData of purchases) {
    const purchase = await prisma.purchase.create({
      data: {
        customerId: purchaseData.customerId,
        amount: purchaseData.amount,
        paymentAmount: purchaseData.amount,
        event: 'purchase',
        status: purchaseData.status,
        customerName: 'Customer Name',
        customerEmail: 'customer@example.com',
        customerPhone: '+5511999999999',
        customerTaxId: '12345678901',
        products: purchaseData.products,
        webhookData: {
          paymentMethod: purchaseData.paymentMethod,
          transactionId: purchaseData.transactionId,
        },
        devMode: true,
      },
    });
    console.log(`✅ Purchase created for customer: ${purchase.customerId}`);
  }

  // Create video progress for customers
  const videoProgress = [
    // Customer 1 progress
    {
      customerId: customer1.id,
      videoId: createdVideos[0].id,
      progress: 100,
      timeWatched: 900,
      isCompleted: true,
    },
    {
      customerId: customer1.id,
      videoId: createdVideos[1].id,
      progress: 75,
      timeWatched: 900,
      isCompleted: false,
    },
    {
      customerId: customer1.id,
      videoId: createdVideos[3].id,
      progress: 50,
      timeWatched: 750,
      isCompleted: false,
    },

    // Customer 2 progress
    {
      customerId: customer2.id,
      videoId: createdVideos[0].id,
      progress: 100,
      timeWatched: 900,
      isCompleted: true,
    },
    {
      customerId: customer2.id,
      videoId: createdVideos[2].id,
      progress: 100,
      timeWatched: 600,
      isCompleted: true,
    },
    {
      customerId: customer2.id,
      videoId: createdVideos[10].id,
      progress: 30,
      timeWatched: 360,
      isCompleted: false,
    },

    // Customer 3 progress
    {
      customerId: customer3.id,
      videoId: createdVideos[1].id,
      progress: 100,
      timeWatched: 1200,
      isCompleted: true,
    },
    {
      customerId: customer3.id,
      videoId: createdVideos[6].id,
      progress: 80,
      timeWatched: 1680,
      isCompleted: false,
    },
    {
      customerId: customer3.id,
      videoId: createdVideos[11].id,
      progress: 25,
      timeWatched: 750,
      isCompleted: false,
    },
  ];

  for (const progressData of videoProgress) {
    const progress = await prisma.videoProgress.upsert({
      where: {
        customerId_videoId: {
          customerId: progressData.customerId,
          videoId: progressData.videoId,
        },
      },
      update: progressData,
      create: progressData,
    });
    console.log(`✅ Video progress created for customer: ${progress.customerId}`);
  }

  console.log('🎉 Complete database seeding finished!');
  console.log('\n📊 Summary:');
  console.log(`- 1 Admin customer`);
  console.log(`- 3 Regular customers`);
  console.log(`- ${createdCategories.length} Categories`);
  console.log(`- ${createdVideos.length} Videos`);
  console.log(`- ${purchases.length} Purchases`);
  console.log(`- ${videoProgress.length} Video progress records`);
  
  console.log('\n🔑 Test credentials:');
  console.log('Admin: admin@noteplanning.com / admin123');
  console.log('Customer 1: joao@example.com / customer123 (has both templates)');
  console.log('Customer 2: maria@example.com / customer123 (has basic template)');
  console.log('Customer 3: pedro@example.com / customer123 (has advanced template)');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
