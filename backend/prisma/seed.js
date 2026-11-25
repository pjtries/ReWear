import { PrismaClient } from '@prisma/client';
import {
  seedUsers,
  seedGarments,
  seedGarmentImages,
  seedBookings,
  seedConditionLogs,
  seedDisputes,
  seedLifecycleEvents,
  seedReviews,
  seedLocalPartners
} from '../src/data/seedData.js';

const prisma = new PrismaClient();

const OCCASION_ENUM_MAP = {
  'Wedding': 'Wedding',
  'Party': 'Party',
  'College Event': 'College_Event',
  'Ethnic': 'Ethnic',
  'Formal': 'Formal'
};

const SIZE_ENUM_MAP = {
  'XS': 'XS',
  'S': 'S',
  'M': 'M',
  'L': 'L',
  'XL': 'XL',
  'Free Size': 'Free_Size'
};

async function main() {
  console.log('🌱 Seeding ReWear PostgreSQL database (DSU & Bengaluru Circular Wardrobe)...');

  // Clear existing records in reverse dependency order
  await prisma.review.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.conditionLog.deleteMany();
  await prisma.lifecycleEvent.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.garmentImage.deleteMany();
  await prisma.garment.deleteMany();
  await prisma.localPartner.deleteMany();
  await prisma.user.deleteMany();

  // 1. Seed Users
  for (const user of seedUsers) {
    await prisma.user.create({
      data: {
        ...user,
        created_at: new Date(user.created_at)
      }
    });
  }
  console.log(`✅ Seeded ${seedUsers.length} users (with tokenized KYC references only).`);

  // 2. Seed Garments
  for (const garment of seedGarments) {
    await prisma.garment.create({
      data: {
        ...garment,
        occasion: OCCASION_ENUM_MAP[garment.occasion] || garment.occasion,
        size: SIZE_ENUM_MAP[garment.size] || garment.size,
        created_at: new Date(garment.created_at)
      }
    });
  }
  console.log(`✅ Seeded ${seedGarments.length} garments across DSU & Bengaluru.`);

  // 3. Seed Garment Images
  for (const img of seedGarmentImages) {
    await prisma.garmentImage.create({ data: img });
  }
  console.log(`✅ Seeded ${seedGarmentImages.length} garment images.`);

  // 4. Seed Bookings
  for (const booking of seedBookings) {
    await prisma.booking.create({
      data: {
        ...booking,
        start_date: new Date(booking.start_date),
        end_date: new Date(booking.end_date),
        buffer_end_date: new Date(booking.buffer_end_date),
        created_at: new Date(booking.created_at)
      }
    });
  }
  console.log(`✅ Seeded ${seedBookings.length} bookings with escrow & cleaning buffer dates.`);

  // 5. Seed Condition Logs
  for (const log of seedConditionLogs) {
    await prisma.conditionLog.create({
      data: {
        ...log,
        created_at: new Date(log.created_at)
      }
    });
  }
  console.log(`✅ Seeded ${seedConditionLogs.length} 5-point condition logs.`);

  // 6. Seed Disputes
  for (const dispute of seedDisputes) {
    await prisma.dispute.create({ data: dispute });
  }
  console.log(`✅ Seeded ${seedDisputes.length} escrow dispute records.`);

  // 7. Seed Lifecycle Events
  for (const event of seedLifecycleEvents) {
    await prisma.lifecycleEvent.create({
      data: {
        ...event,
        event_date: new Date(event.event_date)
      }
    });
  }
  console.log(`✅ Seeded ${seedLifecycleEvents.length} circular lifecycle & sustainability events.`);

  // 8. Seed Reviews
  for (const review of seedReviews) {
    await prisma.review.create({
      data: {
        ...review,
        created_at: new Date(review.created_at)
      }
    });
  }
  console.log(`✅ Seeded ${seedReviews.length} peer reviews.`);

  // 9. Seed Local Partners
  for (const partner of seedLocalPartners) {
    await prisma.localPartner.create({ data: partner });
  }
  console.log(`✅ Seeded ${seedLocalPartners.length} Bengaluru circular care partners.`);

  console.log('🎉 ReWear database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding ReWear database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
