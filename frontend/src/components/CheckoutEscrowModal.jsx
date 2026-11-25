import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Sparkles,
  Droplets,
  Leaf,
  Zap,
  Lock,
  CheckCircle2,
  CreditCard,
  Smartphone,
  QrCode,
  Truck,
  X
} from 'lucide-react';
import QrCodeBadge from './QrCodeBadge.jsx';

export function getCategoryEnvironmentalSavings(category = 'Lehenga', days = 2) {
  const norm = String(category || '').toLowerCase();
  const table = {
    lehenga: { water: 3400, co2: 18.5, energy: 40.3, label: 'Bridal / Embroidered Lehenga' },
    sherwani: { water: 2950, co2: 16.4, energy: 35.8, label: 'Raw Silk Sherwani / Bandhgala' },
    blazer: { water: 2650, co2: 14.8, energy: 32.3, label: 'Tailored Tuxedo / Formal Blazer' },
    gown: { water: 2300, co2: 13.1, energy: 28.6, label: 'Structured Evening Gown' },
    'kurta set': { water: 2550, co2: 14.2, energy: 31.0, label: 'Handwoven Silk Saree / Kurta Set' },
    streetwear: { water: 1850, co2: 9.8, energy: 21.4, label: 'Organic Cotton Streetwear Co-ord' }
  };
  const key = Object.keys(table).find((k) => norm.includes(k)) || 'lehenga';
  const item = table[key];
  const factor = days >= 3 ? 1.1 : 1.0;

  return {
    label: item.label,
    water_saved_liters: Math.round(item.water * factor),
    carbon_avoided_kg_co2e: Number((item.co2 * factor).toFixed(1)),
    energy_saved_kwh: Number((item.energy * factor).toFixed(1))
  };
}

export default function CheckoutEscrowModal({
  garment,
  activeUser,
  onClose,
  onCreateBooking,
  onOpenVerificationModal
}) {
  const [startDate, setStartDate] = useState('2026-12-10');
  const [endDate, setEndDate] = useState('2026-12-12');
  const [handoffMode, setHandoffMode] = useState(
    garment?.luxury_tier === 'HIGH_VALUE_CONCIERGE'
      ? 'CONCIERGE_PICKUP'
      : 'P2P_MEETUP'
  );
  const [paymentMethod, setPaymentMethod] = useState('UPI_ESCROW_AUTOPAY');
  const [upiId, setUpiId] = useState('ananya.dsu@okaxis');
  const [createdBooking, setCreatedBooking] = useState(null);
  const [checkoutError, setCheckoutError] = useState(null);

  if (!garment) return null;

  const isKycBlocked =
    garment.luxury_tier === 'HIGH_VALUE_CONCIERGE' &&
    activeUser?.kyc_status !== 'AADHAAR_KYC_VERIFIED';

  const startObj = new Date(startDate);
  const endObj = new Date(endDate);
  const rentalDays =
    !isNaN(startObj) && !isNaN(endObj) && endObj >= startObj
      ? Math.max(1, Math.round((endObj - startObj) / (1000 * 60 * 60 * 24)) + 1)
      : 2;

  // REQUIREMENT: Auto-block a 1-day post-return buffer (`buffer_end_date`)
  const bufferObj = new Date(endObj);
  if (!isNaN(bufferObj)) bufferObj.setDate(bufferObj.getDate() + 1);
  const bufferEndIso = !isNaN(bufferObj)
    ? bufferObj.toISOString().split('T')[0]
    : '2026-12-13';

  const effectiveHandoff =
    garment.luxury_tier === 'HIGH_VALUE_CONCIERGE'
      ? 'CONCIERGE_PICKUP'
      : handoffMode;

  const rentalAmount = rentalDays * Number(garment.daily_rental_price);
  const pickupFee = effectiveHandoff === 'CONCIERGE_PICKUP' ? 180 : 0;
  const refundableDeposit = Number(garment.security_deposit);
  const totalEscrowHold = rentalAmount + pickupFee + refundableDeposit;
  const platformCommission = Math.round(rentalAmount * 0.1);
  const lenderNetRelease = rentalAmount - platformCommission;

  const envSavings = getCategoryEnvironmentalSavings(garment.category, rentalDays);

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setCheckoutError(null);

    const res = await onCreateBooking({
      garment_id: garment.id,
      borrower_id: activeUser?.id,
      start_date: startDate,
      end_date: endDate,
      handoff_mode: effectiveHandoff,
      payment_method: paymentMethod
    });

    if (res?.error) {
      setCheckoutError(res.error);
    } else {
      setCreatedBooking(res);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#000000]/75 flex items-center justify-center p-4 overflow-y-auto">
      <div className="editorial-card max-w-2xl w-full bg-[#FFFFFF] p-6 space-y-5 my-8 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#000000] pb-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="editorial-badge-teal">
                Razorpay Route Escrow Checkout
              </span>
              {garment.luxury_tier === 'HIGH_VALUE_CONCIERGE' && (
                <span className="editorial-badge-terracotta">
                  HIGH_VALUE_CONCIERGE
                </span>
              )}
            </div>
            <h2 className="font-display font-bold text-xl text-[#000000]">
              {garment.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 border border-[#000000] bg-[#FFD5C2]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* LIVE ENVIRONMENTAL SAVINGS CARD (#588B8B Teal Slate & #FFD5C2 Warm Peach) */}
        <div className="border border-[#000000] overflow-hidden shadow-editorial-sm">
          <div className="bg-[#588B8B] text-[#FFFFFF] px-4 py-2.5 border-b border-[#000000] flex flex-wrap items-center justify-between gap-2">
            <span className="font-display font-bold text-xs uppercase tracking-wider">
              Live Checkout Environmental Savings ({envSavings.label})
            </span>
            <span className="bg-[#FFD5C2] text-[#000000] text-[10px] font-mono font-bold px-2 py-0.5 border border-[#000000]">
              Renting vs. Buying Virgin Outfit
            </span>
          </div>
          <div className="bg-[#FFD5C2] p-3.5 grid grid-cols-3 gap-3 text-center">
            <div className="bg-[#FFFFFF] border border-[#000000] p-2.5">
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#588B8B]">
                <Droplets className="w-3.5 h-3.5" />
                <span>Water Saved</span>
              </div>
              <div className="font-display font-bold text-lg text-[#000000]">
                {envSavings.water_saved_liters.toLocaleString('en-IN')} L
              </div>
            </div>
            <div className="bg-[#FFFFFF] border border-[#000000] p-2.5">
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#588B8B]">
                <Leaf className="w-3.5 h-3.5" />
                <span>Carbon Avoided</span>
              </div>
              <div className="font-display font-bold text-lg text-[#000000]">
                {envSavings.carbon_avoided_kg_co2e} kg CO₂e
              </div>
            </div>
            <div className="bg-[#FFFFFF] border border-[#000000] p-2.5">
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#588B8B]">
                <Zap className="w-3.5 h-3.5" />
                <span>Energy Saved</span>
              </div>
              <div className="font-display font-bold text-lg text-[#000000]">
                {envSavings.energy_saved_kwh} kWh
              </div>
            </div>
          </div>
        </div>

        {/* High-Value Concierge KYC Gate */}
        {isKycBlocked && (
          <div className="bg-[#C8553D] text-[#FFFFFF] border border-[#000000] p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <Lock className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="font-bold text-sm uppercase">
                  Aadhaar KYC Required for High-Value Concierge Outfits
                </div>
                <p>
                  <strong>{activeUser?.full_name}</strong> currently has{' '}
                  <span className="font-mono underline">{activeUser?.kyc_status}</span>{' '}
                  status. Complete tokenized Aadhaar KYC in the Verification Center to unlock this outfit.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenVerificationModal();
              }}
              className="editorial-btn-primary w-full text-xs"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Open 3-Tier Verification Center</span>
            </button>
          </div>
        )}

        {checkoutError && (
          <div className="bg-[#C8553D] text-[#FFFFFF] border border-[#000000] p-3 text-xs font-bold">
            {checkoutError}
          </div>
        )}

        {createdBooking ? (
          <div className="bg-[#FFD5C2] border border-[#000000] p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2 max-w-md">
                <div className="flex items-center gap-2 text-[#000000] font-display font-bold text-lg">
                  <CheckCircle2 className="w-5 h-5 text-[#588B8B]" />
                  <span>Escrow Locked & Signed Inspection QR Generated!</span>
                </div>
                <p className="text-xs leading-relaxed">
                  <strong>₹{totalEscrowHold.toLocaleString('en-IN')}</strong> is now held in{' '}
                  <span className="font-mono font-bold">ESCROW_HELD</span> via Razorpay Route.
                  A 1-day post-return buffer is locked on the calendar until{' '}
                  <span className="font-mono font-bold">{createdBooking.buffer_end_date}</span>.
                </p>
                <div className="text-xs font-mono bg-[#FFFFFF] border border-[#000000] p-2.5 space-y-1">
                  <div>
                    <strong>State Machine:</strong> {createdBooking.booking_status} → APPROVED → HANDED_OVER → ACTIVE → RETURNED → COMPLETED
                  </div>
                  <div>
                    <strong>Signed QR Token:</strong> {createdBooking.inspection_qr_token}
                  </div>
                </div>
              </div>

              <QrCodeBadge token={createdBooking.inspection_qr_token} size={96} />
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-[#000000]">
              <Link
                to="/bookings"
                onClick={onClose}
                className="editorial-btn-primary text-xs"
              >
                <QrCode className="w-4 h-4" />
                <span>Open ESP32-CAM & AI Inspection Station</span>
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="editorial-btn-teal text-xs"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCheckoutSubmit} className="space-y-4">
            {/* Dates & +1 Day Post-Return Buffer */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="editorial-input font-mono text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">
                  Return Date ({rentalDays} days)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="editorial-input font-mono text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1 text-[#C8553D]">
                  +1d Post-Return Buffer
                </label>
                <input
                  type="text"
                  value={`${bufferEndIso} (Auto-Blocked)`}
                  readOnly
                  className="editorial-input font-mono text-xs bg-[#FFD5C2]"
                />
              </div>
            </div>

            {/* Handoff Mode & Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">
                  Handoff Mode
                </label>
                {garment.luxury_tier === 'HIGH_VALUE_CONCIERGE' ? (
                  <div className="bg-[#C8553D] text-[#FFFFFF] border border-[#000000] p-2.5 text-xs font-bold flex items-center gap-1.5">
                    <Truck className="w-4 h-4 shrink-0" />
                    <span>CONCIERGE_PICKUP Mandatory (+₹180)</span>
                  </div>
                ) : (
                  <select
                    value={handoffMode}
                    onChange={(e) => setHandoffMode(e.target.value)}
                    className="editorial-input text-xs"
                  >
                    <option value="P2P_MEETUP">
                      P2P_MEETUP (DSU Campus Gate / Metro — ₹0)
                    </option>
                    <option value="CONCIERGE_PICKUP">
                      CONCIERGE_PICKUP (Doorstep Sealed Courier — +₹180)
                    </option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1">
                  Razorpay Route Escrow Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="editorial-input text-xs"
                >
                  <option value="UPI_ESCROW_AUTOPAY">
                    UPI Escrow Mandate (GPay / PhonePe / BHIM)
                  </option>
                  <option value="RAZORPAY_CARD_ESCROW">
                    Credit / Debit Card Escrow Hold
                  </option>
                </select>
              </div>
            </div>

            {paymentMethod === 'UPI_ESCROW_AUTOPAY' && (
              <div>
                <label className="block text-xs font-bold uppercase mb-1">
                  Verified UPI VPA for Instant Deposit Refund
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="editorial-input font-mono text-xs"
                  required
                />
              </div>
            )}

            {/* Razorpay Route Escrow Split Ledger */}
            <div className="bg-[#FFD5C2] border border-[#000000] p-4 text-xs space-y-1.5">
              <div className="font-display font-bold text-sm uppercase border-b border-[#000000] pb-1.5 mb-1 flex items-center justify-between">
                <span>Razorpay Route Escrow Hold & Split Breakdown</span>
                <span className="font-mono text-[11px]">Status: ESCROW_HELD</span>
              </div>
              <div className="flex justify-between">
                <span>
                  1. Rental Amount (₹{garment.daily_rental_price}/day × {rentalDays} days):
                </span>
                <span className="font-mono font-bold">₹{rentalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>2. Logistics / Handoff Fee ({effectiveHandoff}):</span>
                <span className="font-mono font-bold">₹{pickupFee}</span>
              </div>
              <div className="flex justify-between text-[#588B8B] font-bold">
                <span>3. Refundable Security Deposit (100% returned on clean scan):</span>
                <span className="font-mono">₹{refundableDeposit}</span>
              </div>
              <div className="flex justify-between font-display font-bold text-base pt-1.5 border-t border-[#000000]">
                <span>Total Locked in Escrow (`rental + pickup + deposit`):</span>
                <span>₹{totalEscrowHold.toLocaleString('en-IN')}</span>
              </div>
              <div className="pt-1 text-[11px] font-mono flex flex-wrap justify-between opacity-90">
                <span>
                  On Clean Return → Lender receives ₹{lenderNetRelease} (Rent - 10% fee)
                </span>
                <span>• Borrower refunded ₹{refundableDeposit}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold border border-[#000000] bg-[#FFFFFF]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isKycBlocked}
                className={
                  isKycBlocked
                    ? 'px-4 py-2.5 text-xs font-bold border border-[#000000] bg-[#C8553D] text-[#FFFFFF] opacity-60 cursor-not-allowed'
                    : 'editorial-btn-primary text-xs'
                }
              >
                {isKycBlocked
                  ? 'Locked (Requires Aadhaar KYC)'
                  : `Authorize ₹${totalEscrowHold.toLocaleString('en-IN')} Escrow & Mint QR`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
