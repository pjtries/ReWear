import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Sparkles,
  ShieldCheck,
  Calendar,
  Truck,
  Recycle,
  CheckCircle2,
  Lock,
  X,
  RotateCcw,
  Wand2
} from 'lucide-react';
import GarmentCard from '../components/GarmentCard.jsx';
import CheckoutEscrowModal from '../components/CheckoutEscrowModal.jsx';
import { REWEAR_THEME } from '../theme/rewearTheme.js';

export default function MarketplacePage({
  garments,
  activeUser,
  onCreateBooking,
  onOpenVerificationModal
}) {
  const [selectedOccasion, setSelectedOccasion] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSize, setSelectedSize] = useState('ALL');
  const [selectedColor, setSelectedColor] = useState('ALL');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [selectedTier, setSelectedTier] = useState('ALL');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableTo, setAvailableTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Instant Booking Modal State
  const [bookingModalGarment, setBookingModalGarment] = useState(null);
  const [startDate, setStartDate] = useState('2026-12-10');
  const [endDate, setEndDate] = useState('2026-12-12');
  const [handoffMode, setHandoffMode] = useState('P2P_MEETUP');
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState(null);

  const resetAllFilters = () => {
    setSelectedOccasion('ALL');
    setSelectedCategory('ALL');
    setSelectedSize('ALL');
    setSelectedColor('ALL');
    setSelectedLocation('ALL');
    setSelectedTier('ALL');
    setMinPrice('');
    setMaxPrice('');
    setAvailableFrom('');
    setAvailableTo('');
    setSearchQuery('');
  };

  // Smart Discovery Filter Engine (matches GET /api/garments parameters)
  const filteredGarments = garments.filter((g) => {
    if (selectedOccasion !== 'ALL' && g.occasion !== selectedOccasion) return false;
    if (
      selectedCategory !== 'ALL' &&
      !g.category.toLowerCase().includes(selectedCategory.toLowerCase())
    ) {
      return false;
    }
    if (selectedSize !== 'ALL' && g.size !== selectedSize) return false;
    if (selectedColor !== 'ALL') {
      const c = selectedColor.toLowerCase();
      const colorMatch =
        (g.primary_color && g.primary_color.toLowerCase().includes(c)) ||
        (g.secondary_color && g.secondary_color.toLowerCase().includes(c)) ||
        g.title.toLowerCase().includes(c);
      if (!colorMatch) return false;
    }
    if (selectedLocation !== 'ALL') {
      const locKey = selectedLocation.split('(')[0].trim().toLowerCase();
      if (!g.location_tag.toLowerCase().includes(locKey)) return false;
    }
    if (selectedTier !== 'ALL' && g.luxury_tier !== selectedTier) return false;
    if (minPrice !== '' && Number(g.daily_rental_price) < Number(minPrice)) {
      return false;
    }
    if (maxPrice !== '' && Number(g.daily_rental_price) > Number(maxPrice)) {
      return false;
    }

    // Date-range availability filter (excluding garments blocked by active bookings + buffer_end_date)
    if (availableFrom || availableTo) {
      const reqStart = new Date(availableFrom || availableTo);
      const reqEnd = new Date(availableTo || availableFrom);
      if (!isNaN(reqStart) && !isNaN(reqEnd)) {
        const activeBookings = (g.bookings || []).filter(
          (b) => !['CANCELLED', 'COMPLETED'].includes(b.booking_status)
        );
        const isBlocked = activeBookings.some((b) => {
          const bStart = new Date(b.start_date);
          const bBufferEnd = new Date(b.buffer_end_date || b.end_date);
          return reqStart <= bBufferEnd && reqEnd >= bStart;
        });
        if (isBlocked) return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        g.title.toLowerCase().includes(q) ||
        g.brand.toLowerCase().includes(q) ||
        g.location_tag.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        (g.primary_color && g.primary_color.toLowerCase().includes(q)) ||
        (g.pattern && g.pattern.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const isKycBlockedForModalGarment =
    bookingModalGarment?.luxury_tier === 'HIGH_VALUE_CONCIERGE' &&
    activeUser?.kyc_status !== 'AADHAAR_KYC_VERIFIED';

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!bookingModalGarment) return;

    setBookingError(null);
    const result = await onCreateBooking({
      garment_id: bookingModalGarment.id,
      borrower_id: activeUser?.id,
      start_date: startDate,
      end_date: endDate,
      handoff_mode:
        bookingModalGarment.luxury_tier === 'HIGH_VALUE_CONCIERGE'
          ? 'CONCIERGE_PICKUP'
          : handoffMode
    });

    if (result?.error) {
      setBookingError(result.error);
    } else {
      setBookingSuccess(result);
    }
  };

  return (
    <div className="space-y-8">
      {/* Editorial Hero Banner */}
      <section className="editorial-card-peach p-6 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="editorial-badge-teal">
                Dayananda Sagar University (DSU) • Bengaluru
              </span>
              <span className="editorial-badge-terracotta">
                AI Vision Tagged + Escrow & +2d Cleaning Buffer
              </span>
            </div>

            <h1 className="font-display font-bold text-3xl sm:text-5xl text-[#000000] leading-tight">
              Wear More. Waste Less. Give Every Garment Another Life.
            </h1>

            <p className="text-sm sm:text-base font-medium text-[#000000] max-w-2xl">
              Discover AI-verified designer lehengas, convocation tuxedos, sherwanis, and evening gowns from fellow DSU students & Bengaluru neighborhoods. Filter by rental dates to automatically exclude outfits in active bookings or 48-hour cleaning buffers.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link to="/list" className="editorial-btn-primary">
                <Wand2 className="w-4 h-4" />
                <span>List an Outfit with ReWear AI Studio</span>
              </Link>
              <Link to="/profile" className="editorial-btn-teal">
                <span>My Impact Wallet & Dual Ratings</span>
              </Link>
              <button
                type="button"
                onClick={onOpenVerificationModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold bg-[#FFFFFF] text-[#000000] border border-[#000000] shadow-editorial-sm hover:bg-[#FFD5C2]"
              >
                <ShieldCheck className="w-4 h-4 text-[#588B8B]" />
                <span>3-Tier Verification ({activeUser?.kyc_status})</span>
              </button>
            </div>
          </div>

          {/* Right Column Trust & Circularity Pillar Box */}
          <div className="lg:col-span-4 bg-[#FFFFFF] border border-[#000000] p-4 shadow-editorial-sm space-y-3">
            <div className="bg-[#588B8B] text-[#FFFFFF] border border-[#000000] px-3 py-2 font-display font-bold text-sm uppercase tracking-wider">
              Smart Circular Discovery Pillars
            </div>
            <ul className="space-y-2.5 text-xs font-medium">
              <li className="flex items-start gap-2">
                <Wand2 className="w-4 h-4 text-[#588B8B] shrink-0 mt-0.5" />
                <span>
                  <strong>AI Vision Auto-Tagging:</strong> Every listing is indexed by category, primary color, pattern, and occasion.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-[#F28F3B] shrink-0 mt-0.5" />
                <span>
                  <strong>Buffer-Aware Calendar:</strong> Date filtering hides outfits locked in active rentals + 2-day cleaning buffers.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Truck className="w-4 h-4 text-[#C8553D] shrink-0 mt-0.5" />
                <span>
                  <strong>Concierge Tier (≥₹5,000):</strong> Protected by tokenized `AADHAAR_KYC_VERIFIED` gate.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Recycle className="w-4 h-4 text-[#588B8B] shrink-0 mt-0.5" />
                <span>
                  <strong>Impact Wallet:</strong> Tracks cumulative Water (L), Carbon (kg CO₂e), & Energy (kWh) saved.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* SMART DISCOVERY FILTER CONSOLE */}
      <section className="editorial-card p-5 bg-[#FFFFFF] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#000000] pb-3">
          <div className="flex items-center gap-2">
            <span className="editorial-badge-teal">
              GET /api/garments • Smart Discovery Engine
            </span>
            <span className="text-xs font-bold">
              Filter by Occasion, Category, Size, Color, Price, DSU Hub & Rental Dates
            </span>
          </div>
          <button
            type="button"
            onClick={resetAllFilters}
            className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 border border-[#000000] bg-[#FFD5C2] hover:bg-[#F28F3B]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>

        {/* Row 1: Search, Category, Size, Color */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#000000]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lehenga, tuxedo, emerald, embroidered, DSU..."
              className="editorial-input pl-10"
            />
          </div>

          <div className="lg:col-span-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="editorial-input"
            >
              <option value="ALL">All Categories</option>
              {REWEAR_THEME.categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="editorial-input"
            >
              <option value="ALL">All Sizes</option>
              {REWEAR_THEME.sizes.map((sz) => (
                <option key={sz} value={sz}>
                  Size: {sz}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="editorial-input"
            >
              <option value="ALL">All Colors</option>
              {REWEAR_THEME.colorsList.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="editorial-input"
            >
              <option value="ALL">All Tiers</option>
              <option value="STANDARD">STANDARD (&lt;₹5k)</option>
              <option value="HIGH_VALUE_CONCIERGE">CONCIERGE (≥₹5k)</option>
            </select>
          </div>
        </div>

        {/* Row 2: DSU Campus/Bengaluru Area, Price Range (Min/Max), and Date-Range Picker */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 bg-[#FFD5C2] border border-[#000000] p-3">
          <div className="lg:col-span-4">
            <label className="block text-[10px] font-bold uppercase mb-1">
              DSU Campus or Bengaluru Neighborhood (`location_tag`)
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="editorial-input text-xs"
            >
              <option value="ALL">All DSU Campuses & Bengaluru Hubs</option>
              <option value="Harohalli">DSU Harohalli Main Campus</option>
              <option value="Kudlu Gate">DSU Kudlu Gate Innovation Campus</option>
              <option value="Kumaraswamy Layout">Kumaraswamy Layout (DSCE / DSU Hub)</option>
              <option value="Jayanagar">Jayanagar 4th Block</option>
              <option value="Koramangala">Koramangala & HSR Layout</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold uppercase mb-1">
              Min Daily Rent (₹)
            </label>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="₹200"
              className="editorial-input font-mono text-xs"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold uppercase mb-1">
              Max Daily Rent (₹)
            </label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="₹2500"
              className="editorial-input font-mono text-xs"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold uppercase mb-1">
              Available From (`available_from`)
            </label>
            <input
              type="date"
              value={availableFrom}
              onChange={(e) => setAvailableFrom(e.target.value)}
              className="editorial-input font-mono text-xs"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold uppercase mb-1">
              Available To (`available_to`)
            </label>
            <input
              type="date"
              value={availableTo}
              onChange={(e) => setAvailableTo(e.target.value)}
              className="editorial-input font-mono text-xs"
            />
          </div>
        </div>

        {/* Row 3: Occasion Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-bold uppercase mr-1">Occasion Pills:</span>
          {['ALL', ...REWEAR_THEME.occasions].map((occ) => (
            <button
              key={occ}
              type="button"
              onClick={() => setSelectedOccasion(occ)}
              className={`px-3 py-1.5 text-xs font-bold border border-[#000000] transition-colors ${
                selectedOccasion === occ
                  ? 'bg-[#588B8B] text-[#FFFFFF] shadow-editorial-sm'
                  : 'bg-[#FFD5C2] text-[#000000] hover:bg-[#F28F3B]'
              }`}
            >
              {occ === 'ALL' ? 'All Campus Fits' : occ}
            </button>
          ))}
        </div>
      </section>

      {/* Garments Grid */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="font-display font-bold text-2xl">
            Curated Campus & Bengaluru Wardrobe ({filteredGarments.length})
          </h2>
          <span className="text-xs font-mono font-bold bg-[#FFD5C2] px-2.5 py-1 border border-[#000000]">
            Active Borrower: {activeUser?.full_name} ({activeUser?.kyc_status})
          </span>
        </div>

        {filteredGarments.length === 0 ? (
          <div className="editorial-card-peach p-8 text-center space-y-3">
            <div className="font-display font-bold text-xl">
              No outfits match your current filter or date window
            </div>
            <p className="text-xs max-w-md mx-auto">
              Some garments may be reserved in active bookings or their mandatory 2-day eco-cleaning buffer on those dates.
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="editorial-btn-primary text-xs"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGarments.map((garment) => (
              <GarmentCard
                key={garment.id}
                garment={garment}
                onBookClick={(g) => {
                  setBookingModalGarment(g);
                  setBookingSuccess(null);
                  setBookingError(null);
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Instant Escrow Checkout Modal (With Live Environmental Savings Card & Razorpay Route Escrow) */}
      {bookingModalGarment && (
        <CheckoutEscrowModal
          garment={bookingModalGarment}
          activeUser={activeUser}
          onClose={() => setBookingModalGarment(null)}
          onCreateBooking={onCreateBooking}
          onOpenVerificationModal={onOpenVerificationModal}
        />
      )}
    </div>
  );
}
