-- =============================================================================
-- ReWear PostgreSQL Complete Relational Schema & DDL Migration
-- "Wear More. Waste Less. Give Every Garment Another Life."
-- Launching at Dayananda Sagar University (DSU), Bengaluru
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. ENUM TYPES
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "KycStatus" AS ENUM ('UNVERIFIED', 'STUDENT_VERIFIED', 'AADHAAR_KYC_VERIFIED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "GarmentOccasion" AS ENUM ('Wedding', 'Party', 'College Event', 'Ethnic', 'Formal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "GarmentSize" AS ENUM ('XS', 'S', 'M', 'L', 'XL', 'Free Size');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "LuxuryTier" AS ENUM ('STANDARD', 'HIGH_VALUE_CONCIERGE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "GarmentStatus" AS ENUM ('AVAILABLE', 'RENTED', 'IN_CLEANING', 'RETIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "HandoffMode" AS ENUM ('P2P_MEETUP', 'CONCIERGE_PICKUP');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'ESCROW_HELD', 'RELEASED', 'DISPUTED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "BookingStatus" AS ENUM ('REQUESTED', 'APPROVED', 'HANDED_OVER', 'ACTIVE', 'RETURNED', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ConditionStage" AS ENUM ('PRE_HANDOFF', 'AT_RETURN', 'DISPUTE_EVIDENCE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DisputeResolutionStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "LifecycleEventType" AS ENUM ('LISTED', 'RENTED', 'CLEANED', 'REPAIRED', 'RESOLD', 'DONATED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "RoleReviewed" AS ENUM ('LENDER', 'BORROWER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PartnerServiceType" AS ENUM ('DRY_CLEANING', 'TAILOR_REPAIR', 'RESALE', 'DONATION');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- -----------------------------------------------------------------------------
-- 2. TABLES
-- -----------------------------------------------------------------------------

-- Table 1: users
-- SECURITY CONSTRAINT: kyc_reference_token stores tokenized hash/reference only;
-- raw 12-digit Aadhaar numbers are strictly rejected via CHECK constraint.
CREATE TABLE IF NOT EXISTS "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "full_name" VARCHAR(120) NOT NULL,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "phone" VARCHAR(20) NOT NULL UNIQUE,
  "campus_or_area" VARCHAR(150) NOT NULL DEFAULT 'Dayananda Sagar University',
  "kyc_status" "KycStatus" NOT NULL DEFAULT 'UNVERIFIED',
  "kyc_reference_token" VARCHAR(128),
  "lender_rating" NUMERIC(3, 2) NOT NULL DEFAULT 5.00 CHECK ("lender_rating" >= 0 AND "lender_rating" <= 5.00),
  "borrower_rating" NUMERIC(3, 2) NOT NULL DEFAULT 5.00 CHECK ("borrower_rating" >= 0 AND "borrower_rating" <= 5.00),
  "total_reviews" INTEGER NOT NULL DEFAULT 0 CHECK ("total_reviews" >= 0),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chk_no_raw_aadhaar" CHECK (
    "kyc_reference_token" IS NULL OR "kyc_reference_token" !~ '^[0-9]{12}$'
  )
);

-- Table 2: garments
CREATE TABLE IF NOT EXISTS "garments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "title" VARCHAR(180) NOT NULL,
  "description" TEXT NOT NULL,
  "category" VARCHAR(80) NOT NULL,
  "occasion" "GarmentOccasion" NOT NULL,
  "size" "GarmentSize" NOT NULL,
  "brand" VARCHAR(120) NOT NULL,
  "retail_value" NUMERIC(10, 2) NOT NULL CHECK ("retail_value" >= 0),
  "daily_rental_price" NUMERIC(10, 2) NOT NULL CHECK ("daily_rental_price" > 0),
  "suggested_price" NUMERIC(10, 2) NOT NULL CHECK ("suggested_price" > 0),
  "security_deposit" NUMERIC(10, 2) NOT NULL CHECK ("security_deposit" >= 0),
  "luxury_tier" "LuxuryTier" NOT NULL DEFAULT 'STANDARD',
  "care_instructions" TEXT NOT NULL,
  "location_tag" VARCHAR(150) NOT NULL,
  "status" "GarmentStatus" NOT NULL DEFAULT 'AVAILABLE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table 3: garment_images
CREATE TABLE IF NOT EXISTS "garment_images" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "garment_id" UUID NOT NULL REFERENCES "garments"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "image_url" TEXT NOT NULL,
  "display_order" INTEGER NOT NULL DEFAULT 0
);

-- Table 4: bookings
CREATE TABLE IF NOT EXISTS "bookings" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "garment_id" UUID NOT NULL REFERENCES "garments"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "borrower_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "lender_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "start_date" DATE NOT NULL,
  "end_date" DATE NOT NULL,
  "buffer_end_date" DATE NOT NULL,
  "handoff_mode" "HandoffMode" NOT NULL DEFAULT 'P2P_MEETUP',
  "rental_amount" NUMERIC(10, 2) NOT NULL CHECK ("rental_amount" >= 0),
  "platform_fee" NUMERIC(10, 2) NOT NULL CHECK ("platform_fee" >= 0),
  "deposit_amount" NUMERIC(10, 2) NOT NULL CHECK ("deposit_amount" >= 0),
  "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "booking_status" "BookingStatus" NOT NULL DEFAULT 'REQUESTED',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chk_booking_dates" CHECK ("end_date" >= "start_date" AND "buffer_end_date" >= "end_date"),
  CONSTRAINT "chk_distinct_borrower_lender" CHECK ("borrower_id" <> "lender_id")
);

-- Table 5: condition_logs
CREATE TABLE IF NOT EXISTS "condition_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "booking_id" UUID NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "garment_id" UUID NOT NULL REFERENCES "garments"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "logged_by_user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "stage" "ConditionStage" NOT NULL,
  "photo_urls" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "checklist_json" JSONB NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chk_checklist_keys" CHECK (
    ("checklist_json" ? 'stains') AND
    ("checklist_json" ? 'tears') AND
    ("checklist_json" ? 'buttons_zippers') AND
    ("checklist_json" ? 'odor') AND
    ("checklist_json" ? 'missing_items')
  )
);

-- Table 6: disputes
CREATE TABLE IF NOT EXISTS "disputes" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "booking_id" UUID NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "raised_by_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "reason" TEXT NOT NULL,
  "evidence_photos" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "deposit_deduction_amount" NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK ("deposit_deduction_amount" >= 0),
  "resolution_status" "DisputeResolutionStatus" NOT NULL DEFAULT 'OPEN',
  "admin_notes" TEXT
);

-- Table 7: lifecycle_events
CREATE TABLE IF NOT EXISTS "lifecycle_events" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "garment_id" UUID NOT NULL REFERENCES "garments"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "event_type" "LifecycleEventType" NOT NULL,
  "description" TEXT NOT NULL,
  "partner_name" VARCHAR(150),
  "estimated_water_saved_liters" NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK ("estimated_water_saved_liters" >= 0),
  "estimated_co2_saved_kg" NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK ("estimated_co2_saved_kg" >= 0),
  "event_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table 8: reviews
CREATE TABLE IF NOT EXISTS "reviews" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "booking_id" UUID NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "reviewer_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "reviewee_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "role_reviewed" "RoleReviewed" NOT NULL,
  "rating" SMALLINT NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
  "comment" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uq_booking_reviewer_role" UNIQUE ("booking_id", "reviewer_id", "role_reviewed")
);

-- Table 9: local_partners
CREATE TABLE IF NOT EXISTS "local_partners" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(150) NOT NULL,
  "service_type" "PartnerServiceType" NOT NULL,
  "area" VARCHAR(120) NOT NULL,
  "contact_phone" VARCHAR(20) NOT NULL,
  "pricing_note" TEXT NOT NULL,
  "verified_badge" BOOLEAN NOT NULL DEFAULT TRUE
);

-- -----------------------------------------------------------------------------
-- 3. INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "idx_users_campus_or_area" ON "users"("campus_or_area");
CREATE INDEX IF NOT EXISTS "idx_users_kyc_status" ON "users"("kyc_status");

CREATE INDEX IF NOT EXISTS "idx_garments_owner_id" ON "garments"("owner_id");
CREATE INDEX IF NOT EXISTS "idx_garments_status_occasion_size" ON "garments"("status", "occasion", "size");
CREATE INDEX IF NOT EXISTS "idx_garments_location_tag" ON "garments"("location_tag");
CREATE INDEX IF NOT EXISTS "idx_garments_luxury_tier" ON "garments"("luxury_tier");

CREATE INDEX IF NOT EXISTS "idx_garment_images_garment_order" ON "garment_images"("garment_id", "display_order");

CREATE INDEX IF NOT EXISTS "idx_bookings_garment_dates" ON "bookings"("garment_id", "start_date", "buffer_end_date");
CREATE INDEX IF NOT EXISTS "idx_bookings_borrower_status" ON "bookings"("borrower_id", "booking_status");
CREATE INDEX IF NOT EXISTS "idx_bookings_lender_status" ON "bookings"("lender_id", "booking_status");
CREATE INDEX IF NOT EXISTS "idx_bookings_payment_status" ON "bookings"("payment_status");

CREATE INDEX IF NOT EXISTS "idx_condition_logs_booking_stage" ON "condition_logs"("booking_id", "stage");
CREATE INDEX IF NOT EXISTS "idx_condition_logs_garment_id" ON "condition_logs"("garment_id");

CREATE INDEX IF NOT EXISTS "idx_disputes_booking_id" ON "disputes"("booking_id");
CREATE INDEX IF NOT EXISTS "idx_disputes_resolution_status" ON "disputes"("resolution_status");

CREATE INDEX IF NOT EXISTS "idx_lifecycle_events_garment_date" ON "lifecycle_events"("garment_id", "event_date");
CREATE INDEX IF NOT EXISTS "idx_lifecycle_events_type" ON "lifecycle_events"("event_type");

CREATE INDEX IF NOT EXISTS "idx_reviews_reviewee_role" ON "reviews"("reviewee_id", "role_reviewed");

CREATE INDEX IF NOT EXISTS "idx_local_partners_area_service" ON "local_partners"("area", "service_type");
