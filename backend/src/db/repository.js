import crypto from 'node:crypto';
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
} from '../data/seedData.js';
import {
  signInspectionQrToken,
  calculateEscrowSettlement,
  calculateCheckoutCategoryImpact
} from '../services/inspectionAndEscrowService.js';

let prismaClient = null;
let dbConnected = false;

const memoryStore = {
  users: structuredClone(seedUsers),
  garments: structuredClone(seedGarments),
  garment_images: structuredClone(seedGarmentImages),
  bookings: structuredClone(seedBookings),
  condition_logs: structuredClone(seedConditionLogs),
  disputes: structuredClone(seedDisputes),
  lifecycle_events: structuredClone(seedLifecycleEvents),
  reviews: structuredClone(seedReviews),
  local_partners: structuredClone(seedLocalPartners)
};

export async function initDatabase() {
  try {
    const { PrismaClient } = await import('@prisma/client');
    prismaClient = new PrismaClient();
    await prismaClient.$connect();
    await prismaClient.user.count();
    dbConnected = true;
    console.log('✅ Connected to PostgreSQL via Prisma ORM');
  } catch {
    dbConnected = false;
    console.log(
      'ℹ️ PostgreSQL instance not reachable at DATABASE_URL; serving live stateful ReWear Seed Repository (all 9 relational tables active).'
    );
  }
}

export function isPostgresConnected() {
  return dbConnected;
}

export function getStore() {
  return memoryStore;
}

export function generateId() {
  return crypto.randomUUID();
}

export function enrichGarment(garment) {
  const owner = memoryStore.users.find((u) => u.id === garment.owner_id) || null;
  const images = memoryStore.garment_images
    .filter((img) => img.garment_id === garment.id)
    .sort((a, b) => a.display_order - b.display_order);
  const lifecycle_events = memoryStore.lifecycle_events
    .filter((ev) => ev.garment_id === garment.id)
    .sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
  const bookings = memoryStore.bookings.filter((b) => b.garment_id === garment.id);

  return {
    ...garment,
    retail_value: Number(garment.retail_value),
    daily_rental_price: Number(garment.daily_rental_price),
    suggested_price: Number(garment.suggested_price),
    security_deposit: Number(garment.security_deposit),
    owner,
    images,
    lifecycle_events,
    bookings
  };
}

export function enrichBooking(booking) {
  const garment = memoryStore.garments.find((g) => g.id === booking.garment_id);
  const garmentImages = memoryStore.garment_images.filter(
    (i) => i.garment_id === booking.garment_id
  );
  const borrower = memoryStore.users.find((u) => u.id === booking.borrower_id);
  const lender = memoryStore.users.find((u) => u.id === booking.lender_id);
  const condition_logs = memoryStore.condition_logs
    .filter((c) => c.booking_id === booking.id)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const disputes = memoryStore.disputes.filter((d) => d.booking_id === booking.id);
  const reviews = memoryStore.reviews.filter((r) => r.booking_id === booking.id);

  const inspection_qr_token =
    booking.inspection_qr_token || signInspectionQrToken(booking.id, booking.garment_id);

  const activeDisputeDeduction =
    disputes.length > 0 ? Number(disputes[0].deposit_deduction_amount || 0) : 0;

  const escrow_settlement = calculateEscrowSettlement(booking, activeDisputeDeduction);
  const checkout_impact = calculateCheckoutCategoryImpact(
    garment?.category || 'Lehenga',
    2
  );

  return {
    ...booking,
    inspection_qr_token,
    rental_amount: Number(booking.rental_amount),
    platform_fee: Number(booking.platform_fee),
    pickup_fee:
      booking.pickup_fee !== undefined
        ? Number(booking.pickup_fee)
        : booking.handoff_mode === 'CONCIERGE_PICKUP'
        ? 180
        : 0,
    deposit_amount: Number(booking.deposit_amount),
    escrow_settlement,
    checkout_impact,
    garment: garment ? { ...garment, images: garmentImages } : null,
    borrower,
    lender,
    condition_logs,
    disputes,
    reviews
  };
}
