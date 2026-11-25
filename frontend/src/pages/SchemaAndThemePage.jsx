import React from 'react';
import { Database, Palette, CheckCircle2, ShieldCheck } from 'lucide-react';

const PALETTE_SWATCHES = [
  {
    hex: '#588B8B',
    name: 'Teal Slate',
    role: 'Primary Brand / Trust & Sustainability Headers & Badges',
    textColor: '#FFFFFF'
  },
  {
    hex: '#FFFFFF',
    name: 'Pure White',
    role: 'Canvas / Clean Editorial Background',
    textColor: '#000000'
  },
  {
    hex: '#FFD5C2',
    name: 'Warm Peach',
    role: 'Soft Surface / Card Containers / Highlights',
    textColor: '#000000'
  },
  {
    hex: '#F28F3B',
    name: 'Vibrant Tangerine',
    role: 'Primary CTA / Interactive Action Accents',
    textColor: '#000000'
  },
  {
    hex: '#C8553D',
    name: 'Terracotta Red',
    role: 'Alerts / Damage Flags / High-Value Concierge Badges',
    textColor: '#FFFFFF'
  },
  {
    hex: '#000000',
    name: 'Pure Black',
    role: 'Primary Typography / High-Contrast 1px Structural Borders',
    textColor: '#FFFFFF'
  }
];

const SCHEMA_TABLES = [
  {
    number: 1,
    name: 'users',
    columns:
      'id, full_name, email, phone, campus_or_area (default "Dayananda Sagar University"), kyc_status (UNVERIFIED, STUDENT_VERIFIED, AADHAAR_KYC_VERIFIED), kyc_reference_token (no raw Aadhaar), lender_rating, borrower_rating, total_reviews, created_at'
  },
  {
    number: 2,
    name: 'garments',
    columns:
      'id, owner_id (FK users.id), title, description, category, occasion (Wedding, Party, College Event, Ethnic, Formal), size (XS, S, M, L, XL, Free Size), brand, retail_value, daily_rental_price, suggested_price, security_deposit, luxury_tier (STANDARD, HIGH_VALUE_CONCIERGE), care_instructions, location_tag, status (AVAILABLE, RENTED, IN_CLEANING, RETIRED), created_at'
  },
  {
    number: 3,
    name: 'garment_images',
    columns: 'id, garment_id (FK garments.id), image_url, display_order'
  },
  {
    number: 4,
    name: 'bookings',
    columns:
      'id, garment_id (FK), borrower_id (FK), lender_id (FK), start_date, end_date, buffer_end_date, handoff_mode (P2P_MEETUP, CONCIERGE_PICKUP), rental_amount, platform_fee, deposit_amount, payment_status (PENDING, ESCROW_HELD, RELEASED, DISPUTED, REFUNDED), booking_status (REQUESTED, APPROVED, HANDED_OVER, ACTIVE, RETURNED, COMPLETED, CANCELLED), created_at'
  },
  {
    number: 5,
    name: 'condition_logs',
    columns:
      'id, booking_id (FK), garment_id (FK), logged_by_user_id (FK), stage (PRE_HANDOFF, AT_RETURN, DISPUTE_EVIDENCE), photo_urls (JSONB), checklist_json (JSONB: stains, tears, buttons_zippers, odor, missing_items), notes, created_at'
  },
  {
    number: 6,
    name: 'disputes',
    columns:
      'id, booking_id (FK), raised_by_id (FK), reason, evidence_photos (JSONB), deposit_deduction_amount, resolution_status (OPEN, UNDER_REVIEW, RESOLVED), admin_notes'
  },
  {
    number: 7,
    name: 'lifecycle_events',
    columns:
      'id, garment_id (FK), event_type (LISTED, RENTED, CLEANED, REPAIRED, RESOLD, DONATED), description, partner_name, estimated_water_saved_liters, estimated_co2_saved_kg, event_date'
  },
  {
    number: 8,
    name: 'reviews',
    columns:
      'id, booking_id (FK), reviewer_id (FK), reviewee_id (FK), role_reviewed (LENDER, BORROWER), rating (1-5), comment, created_at'
  },
  {
    number: 9,
    name: 'local_partners',
    columns:
      'id, name, service_type (DRY_CLEANING, TAILOR_REPAIR, RESALE, DONATION), area, contact_phone, pricing_note, verified_badge'
  }
];

export default function SchemaAndThemePage() {
  return (
    <div className="space-y-8">
      {/* Color Palette Audit */}
      <section className="editorial-card p-6 bg-[#FFFFFF] space-y-4">
        <div className="flex items-center gap-2 border-b border-[#000000] pb-3">
          <Palette className="w-5 h-5 text-[#588B8B]" />
          <h1 className="font-display font-bold text-2xl">
            Strict UI & Color Palette Specification
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PALETTE_SWATCHES.map((swatch) => (
            <div
              key={swatch.hex}
              className="border border-[#000000] shadow-editorial-sm overflow-hidden"
            >
              <div
                className="h-20 p-3 flex items-end justify-between border-b border-[#000000] font-mono font-bold text-base"
                style={{ backgroundColor: swatch.hex, color: swatch.textColor }}
              >
                <span>{swatch.name}</span>
                <span>{swatch.hex}</span>
              </div>
              <div className="p-3 bg-[#FFFFFF] text-xs font-medium">
                {swatch.role}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PostgreSQL 9-Table Relational Architecture */}
      <section className="editorial-card p-6 bg-[#FFFFFF] space-y-4">
        <div className="flex items-center justify-between border-b border-[#000000] pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#588B8B]" />
            <h2 className="font-display font-bold text-2xl">
              PostgreSQL + Prisma Relational Schema (9 Tables)
            </h2>
          </div>
          <span className="editorial-badge-teal">
            backend/prisma/schema.prisma
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SCHEMA_TABLES.map((t) => (
            <div
              key={t.name}
              className="border border-[#000000] bg-[#FFD5C2] p-4 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm bg-[#FFFFFF] px-2 py-0.5 border border-[#000000]">
                  {t.number}. {t.name}
                </span>
                <CheckCircle2 className="w-4 h-4 text-[#588B8B]" />
              </div>
              <p className="font-mono text-xs leading-relaxed text-[#000000]">
                {t.columns}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
