import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Droplets,
  ArrowUpRight,
  Palette
} from 'lucide-react';

export default function GarmentCard({ garment, onBookClick }) {
  const primaryImage =
    garment.images?.[0]?.image_url ||
    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=900&q=80';

  const isConcierge = garment.luxury_tier === 'HIGH_VALUE_CONCIERGE';
  const isAvailable = garment.status === 'AVAILABLE';

  const totalWaterSaved = (garment.lifecycle_events || []).reduce(
    (sum, ev) => sum + Number(ev.estimated_water_saved_liters || 0),
    0
  );

  return (
    <article className="editorial-card flex flex-col justify-between overflow-hidden bg-[#FFFFFF]">
      {/* Top Image Header with Strict Color Badges */}
      <div>
        <div className="relative h-64 w-full border-b border-[#000000] overflow-hidden bg-[#FFD5C2]">
          <img
            src={primaryImage}
            alt={garment.title}
            className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />

          {/* Top Left Status & Occasion Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <span className="editorial-badge-teal">
              {garment.occasion}
            </span>
            <span className="editorial-badge-peach">
              {garment.category} • {garment.size}
            </span>
          </div>

          {/* Top Right Luxury / Status Flag */}
          <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
            {isConcierge && (
              <span
                className="editorial-badge-terracotta"
                title="Concierge Pickup & Sealed Packaging (Retail ≥ ₹5,000)"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Concierge
              </span>
            )}
            {!isAvailable && (
              <span className="editorial-badge-terracotta">
                {garment.status.replace('_', ' ')}
              </span>
            )}
          </div>

          {/* Bottom Sustainability Ribbon */}
          <div className="absolute bottom-0 inset-x-0 bg-[#588B8B] text-[#FFFFFF] border-t border-[#000000] px-3 py-1 flex items-center justify-between text-xs font-semibold">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#FFD5C2]" />
              <span className="truncate max-w-[190px]">{garment.location_tag}</span>
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px]">
              <Droplets className="w-3 h-3 text-[#FFD5C2]" />
              {totalWaterSaved > 0 ? `${totalWaterSaved}L saved` : '2,700L est/rent'}
            </span>
          </div>
        </div>

        {/* Garment Editorial Details */}
        <div className="p-4">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-1">
            <span className="text-[#588B8B]">{garment.brand}</span>
            <span className="font-mono">
              MRP ₹{Number(garment.retail_value).toLocaleString('en-IN')}
            </span>
          </div>

          <Link
            to={`/garments/${garment.id}`}
            className="block font-display font-bold text-lg leading-snug text-[#000000] hover:underline mb-2"
          >
            {garment.title}
          </Link>

          {/* AI Vision Detected Color & Pattern Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
            {garment.primary_color && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#FFFFFF] border border-[#000000] px-2 py-0.5">
                <Palette className="w-3 h-3 text-[#588B8B]" />
                {garment.primary_color}
              </span>
            )}
            {garment.pattern && (
              <span className="text-[11px] font-mono font-bold bg-[#FFD5C2] border border-[#000000] px-2 py-0.5">
                {garment.pattern}
              </span>
            )}
            {(garment.style_tags || []).slice(0, 1).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-semibold bg-[#FFFFFF] border border-[#000000] px-1.5 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>

          <p className="text-xs leading-relaxed text-[#000000] line-clamp-2 mb-3">
            {garment.description}
          </p>

          {/* Pricing Box in Warm Peach #FFD5C2 */}
          <div className="bg-[#FFD5C2] border border-[#000000] p-3 mb-3 flex items-center justify-between">
            <div>
              <span className="block text-[11px] font-bold uppercase">
                Daily Rental
              </span>
              <span className="font-display font-bold text-xl text-[#000000]">
                ₹{Number(garment.daily_rental_price).toLocaleString('en-IN')}
                <span className="text-xs font-normal">/day</span>
              </span>
            </div>
            <div className="text-right border-l border-[#000000] pl-3">
              <span className="block text-[11px] font-bold uppercase">
                Escrow Deposit
              </span>
              <span className="font-mono font-bold text-sm text-[#000000]">
                ₹{Number(garment.security_deposit).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Owner Trust Footer */}
          {garment.owner && (
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#588B8B]" />
                <span className="font-bold">{garment.owner.full_name}</span>
                <span className="text-[11px] px-1.5 py-0.5 bg-[#FFD5C2] border border-[#000000] font-mono">
                  {garment.owner.kyc_status === 'AADHAAR_KYC_VERIFIED'
                    ? 'KYC'
                    : 'DSU ID'}
                </span>
              </div>
              <div className="inline-flex items-center gap-1 font-bold">
                <Star className="w-3.5 h-3.5 fill-[#F28F3B] text-[#000000]" />
                <span>{Number(garment.owner.lender_rating).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-4 pt-2 flex items-center gap-2">
        <Link
          to={`/garments/${garment.id}`}
          className="flex-1 inline-flex items-center justify-center gap-1 bg-[#FFFFFF] text-[#000000] font-bold text-xs py-2.5 px-3 border border-[#000000] hover:bg-[#FFD5C2] transition-colors"
        >
          <span>Calendar & Details</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
        <button
          type="button"
          onClick={() => onBookClick && onBookClick(garment)}
          disabled={!isAvailable}
          className={`flex-1 text-xs py-2.5 px-3 font-bold border border-[#000000] transition-all ${
            isAvailable
              ? 'bg-[#F28F3B] text-[#000000] shadow-editorial-sm hover:translate-x-[1px] hover:translate-y-[1px]'
              : 'bg-[#C8553D] text-[#FFFFFF] opacity-90 cursor-not-allowed'
          }`}
        >
          {isAvailable ? 'Rent w/ Escrow' : garment.status.replace('_', ' ')}
        </button>
      </div>
    </article>
  );
}
