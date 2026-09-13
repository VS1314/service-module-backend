import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  await prisma.serviceCategory.createMany({
    data: [
      { name: 'Electrician', slug: 'electrician', displayOrder: 1 },
      { name: 'Painter', slug: 'painter', displayOrder: 2 },
      { name: 'Carpenter', slug: 'carpenter', displayOrder: 3 },
      { name: 'Plumber', slug: 'plumber', displayOrder: 4 },
      { name: 'Cleaning', slug: 'cleaning', displayOrder: 5 },
      { name: 'Repair', slug: 'repair', displayOrder: 6 },
      { name: 'Car Repair', slug: 'car-repair', displayOrder: 7 },
      { name: 'Bike Repair', slug: 'bike-repair', displayOrder: 8 },
      { name: 'Physiyo', slug: 'physiyo', displayOrder: 9 },
      { name: 'Massage', slug: 'massage', displayOrder: 10 },
      { name: 'AC Repair', slug: 'ac-repair', displayOrder: 11 },
    ],
    skipDuplicates: true,
  });

  const providers = [
    {
      fullName: 'Chetan Balwinder',
      categorySlug: 'cleaning',
      displayTitle: 'Home Cleaner',
      rating: 4.2,
      discountPercent: 30,
    },
    {
      fullName: 'Viraj Prabhat',
      categorySlug: 'carpenter',
      displayTitle: 'Carpenter',
      rating: 4.5,
      discountPercent: 30,
    },
    {
      fullName: 'Karthik Nandita',
      categorySlug: 'plumber',
      displayTitle: 'Plumber',
      rating: 4.1,
      discountPercent: 30,
    },
    {
      fullName: 'Shashi Prabhat',
      categorySlug: 'painter',
      displayTitle: 'Painter',
      rating: 4.3,
      discountPercent: 30,
    },
    {
      fullName: 'Pranav Kalidas',
      categorySlug: 'electrician',
      displayTitle: 'Electrician',
      rating: 4.6,
      discountPercent: 30,
    },
    {
      fullName: 'Dushyant Rajni',
      categorySlug: 'bike-repair',
      displayTitle: 'Bike Mechanic',
      rating: 4.7,
      discountPercent: 30,
    },
  ];

  for (const item of providers) {
    const category = await prisma.serviceCategory.findUnique({
      where: {
        slug: item.categorySlug,
      },
    });

    if (!category) {
      throw new Error(`Category not found: ${item.categorySlug}`);
    }

    let provider = await prisma.serviceProvider.findFirst({
      where: {
        fullName: item.fullName,
      },
    });

    if (!provider) {
      provider = await prisma.serviceProvider.create({
        data: {
          fullName: item.fullName,
          averageRating: item.rating,
        },
      });
    }

    await prisma.providerService.upsert({
      where: {
        providerId_categoryId: {
          providerId: provider.id,
          categoryId: category.id,
        },
      },
      update: {
        displayTitle: item.displayTitle,
        discountPercent: item.discountPercent,
      },
      create: {
        providerId: provider.id,
        categoryId: category.id,
        displayTitle: item.displayTitle,
        discountPercent: item.discountPercent,
      },
    });
  }

  const acRepairCategory = await prisma.serviceCategory.findUnique({
    where: {
      slug: 'ac-repair',
    },
  });

  if (!acRepairCategory) {
    throw new Error('AC Repair category not found');
  }

  await prisma.servicePromotion.deleteMany({
    where: {
      title: 'Get 25% Off',
    },
  });

  await prisma.servicePromotion.create({
    data: {
      categoryId: acRepairCategory.id,
      title: 'Get 25% Off',
      subtitle: 'On AC repair',
      discountPercent: 25,
      ctaLabel: 'Book Now',
      displayOrder: 1,
      isActive: true,
    },
  });

  const provider = await prisma.serviceProvider.findFirst({
    where: {
      fullName: 'Chetan Balwinder',
    },
  });

  if (!provider) {
    throw new Error('Seed provider not found');
  }

  const slotDate = new Date('2026-09-14T00:00:00.000Z');

  const slots = [
    ['08:00', '09:00'],
    ['09:00', '10:00'],
    ['10:00', '11:00'],
    ['14:00', '15:00'],
    ['15:00', '16:00'],
  ];

  for (const [startTime, endTime] of slots) {
    await prisma.providerAvailability.upsert({
      where: {
        providerId_date_startTime_endTime: {
          providerId: provider.id,
          date: slotDate,
          startTime,
          endTime,
        },
      },
      update: {},
      create: {
        providerId: provider.id,
        date: slotDate,
        startTime,
        endTime,
      },
    });
  }

  console.log('Seed completed');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
