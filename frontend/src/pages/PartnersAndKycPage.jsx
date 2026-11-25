import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Sparkles,
  Phone,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Lock,
  Recycle
} from 'lucide-react';

export default function PartnersAndKycPage({
  partners,
  garments = [],
  users,
  onVerifyKyc,
  onLogLifecycleEvent
}) {
  const [searchParams] = useSearchParams();
  const initialService = searchParams.get('service') || 'ALL';
  const initialGarmentId =
    searchParams.get('garmentId') || garments[0]?.id || '';

  const [selectedService, setSelectedService] = useState(initialService);
  const [selectedGarmentId, setSelectedGarmentId] = useState(initialGarmentId);
  const [bookedPartnerInfo, setBookedPartnerInfo] = useState(null);

  // KYC form state
  const [selectedUserId, setSelectedUserId] = useState(
    users[1]?.id || users[0]?.id
  );
  const [kycType, setKycType] = useState('AADHAAR_KYC_VERIFIED');
  const [tokenInput, setTokenInput] = useState('DIGILOCKER_HASH_DSU_9921AB');
  const [kycFeedback, setKycFeedback] = useState(null);

  useEffect(() => {
    const svc = searchParams.get('service');
    const gId = searchParams.get('garmentId');
    if (svc) setSelectedService(svc);
    if (gId) setSelectedGarmentId(gId);
  }, [searchParams]);

  const filteredPartners =
    selectedService === 'ALL'
      ? partners
      : partners.filter((p) => p.service_type === selectedService);

  const handleOneClickPartnerBook = async (partner) => {
    const serviceToLifecycleMap = {
      DRY_CLEANING: 'CLEANED',
      TAILOR_REPAIR: 'REPAIRED',
      RESALE: 'RESOLD',
      DONATION: 'DONATED'
    };
    const eventType = serviceToLifecycleMap[partner.service_type] || 'CLEANED';
    const targetGarment =
      garments.find((g) => g.id === selectedGarmentId) || garments[0];

    if (onLogLifecycleEvent && targetGarment) {
      await onLogLifecycleEvent({
        garment_id: targetGarment.id,
        event_type: eventType,
        partner_name: partner.name,
        description: `1-Click Local Partner Booking: ${partner.service_type.replace(
          '_',
          ' '
        )} at ${partner.name} (${partner.area}).`,
        estimated_water_saved_liters:
          eventType === 'CLEANED' ? 210 : 2200,
        estimated_co2_saved_kg: eventType === 'CLEANED' ? 1.6 : 12.8
      });
    }

    setBookedPartnerInfo({
      partner,
      eventType,
      garmentTitle: targetGarment?.title || 'Selected Garment',
      garmentId: targetGarment?.id
    });
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    if (/^\d{12}$/.test(tokenInput.trim())) {
      setKycFeedback({
        type: 'error',
        text: 'SECURITY BLOCK: Raw 12-digit Aadhaar numbers are strictly prohibited. Only submit a tokenized DigiLocker or DSU Student ID reference token.'
      });
      return;
    }

    await onVerifyKyc(selectedUserId, {
      kyc_status: kycType,
      verification_reference: tokenInput
    });
    setKycFeedback({
      type: 'success',
      text: `Tokenized KYC reference (${tokenInput}) saved without storing any raw Aadhaar digits.`
    });
  };

  return (
    <div className="space-y-8">
      {/* Bengaluru Local Circular Partners Directory (Table 9: local_partners) */}
      <section className="space-y-4">
        <div className="editorial-card-peach p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="editorial-badge-teal mb-2">
                Table 9: local_partners • Bengaluru Circular Care Network
              </span>
              <h1 className="font-display font-bold text-3xl">
                Verified Dry Cleaners, Master Tailors, Resale & NGO Hubs
              </h1>
              <p className="text-xs sm:text-sm mt-1">
                Connected directly to the **AI Garment End-of-Life Advisor**. Select a garment below and trigger one-click Dry Cleaning, Tailor Repair, Consignment Resale, or NGO Donation across DSU Harohalli, Kanakapura Road, Kumaraswamy Layout, Jayanagar, and Koramangala.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {['ALL', 'DRY_CLEANING', 'TAILOR_REPAIR', 'RESALE', 'DONATION'].map(
                (type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedService(type)}
                    className={`px-3 py-1.5 text-xs font-bold border border-[#000000] ${
                      selectedService === type
                        ? 'bg-[#F28F3B] text-[#000000] shadow-editorial-sm'
                        : 'bg-[#FFFFFF] text-[#000000]'
                    }`}
                  >
                    {type.replace('_', ' ')}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Target Garment Selector for 1-Click Partner Booking */}
          <div className="bg-[#FFFFFF] border border-[#000000] p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold">
              <Recycle className="w-4 h-4 text-[#588B8B]" />
              <span>
                Target Garment for 1-Click Care / End-of-Life Service Booking:
              </span>
            </div>
            <select
              value={selectedGarmentId}
              onChange={(e) => setSelectedGarmentId(e.target.value)}
              className="editorial-input w-auto text-xs font-bold bg-[#FFD5C2]"
            >
              {garments.map((g) => (
                <option key={g.id} value={g.id}>
                  #{g.id.slice(-6)} — {g.title} ({g.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 1-Click Booking Confirmation Banner */}
        {bookedPartnerInfo && (
          <div className="editorial-card bg-[#588B8B] text-[#FFFFFF] p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#FFD5C2] shrink-0" />
              <div>
                <div className="font-display font-bold text-sm">
                  ✓ 1-Click Service Confirmed with {bookedPartnerInfo.partner.name}!
                </div>
                <p>
                  Logged <strong>{bookedPartnerInfo.eventType}</strong> event on{' '}
                  <strong>{bookedPartnerInfo.garmentTitle}</strong>’s Circular Lifecycle Timeline.
                  Partner Contact: {bookedPartnerInfo.partner.contact_phone}
                </p>
              </div>
            </div>
            {bookedPartnerInfo.garmentId && (
              <Link
                to={`/garments/${bookedPartnerInfo.garmentId}`}
                className="editorial-btn-primary text-xs"
              >
                View Updated Lifecycle Timeline →
              </Link>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPartners.map((partner) => (
            <div
              key={partner.id}
              className="editorial-card p-5 bg-[#FFFFFF] flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="editorial-badge-teal">
                    {partner.service_type.replace('_', ' ')}
                  </span>
                  {partner.verified_badge && (
                    <span className="editorial-badge-peach">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#588B8B]" />
                      Verified Partner
                    </span>
                  )}
                </div>

                <h3 className="font-display font-bold text-lg">
                  {partner.name}
                </h3>

                <div className="flex items-center gap-1.5 text-xs font-bold text-[#588B8B]">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>{partner.area}</span>
                </div>

                <div className="bg-[#FFD5C2] border border-[#000000] p-3 text-xs font-medium">
                  {partner.pricing_note}
                </div>
              </div>

              <div className="pt-3 border-t border-[#000000] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#F28F3B]" />
                    {partner.contact_phone}
                  </span>
                  <span className="text-[11px] text-[#588B8B]">
                    DSU Student Priority
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOneClickPartnerBook(partner)}
                  className="editorial-btn-primary w-full text-xs"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    1-Click Book {partner.service_type.replace('_', ' ')} & Log Timeline
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tokenized KYC Verification Lab (Table 1: users) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 editorial-card p-6 bg-[#FFFFFF] space-y-4">
          <div className="border-b border-[#000000] pb-3">
            <span className="editorial-badge-teal">
              Table 1: users • Privacy-First Identity
            </span>
            <h2 className="font-display font-bold text-2xl mt-1">
              DSU Student ID & Tokenized KYC Verification
            </h2>
            <p className="text-xs mt-1">
              In compliance with strict privacy rules, `users.kyc_reference_token` stores only tokenized cryptographic references—never raw 12-digit Aadhaar numbers.
            </p>
          </div>

          <form onSubmit={handleKycSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">
                Select Campus Member
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="editorial-input"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.kyc_status}) — {u.campus_or_area}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1">
                Verification Level (`KycStatus`)
              </label>
              <select
                value={kycType}
                onChange={(e) => setKycType(e.target.value)}
                className="editorial-input"
              >
                <option value="STUDENT_VERIFIED">
                  STUDENT_VERIFIED (@dsu.edu.in Smart Card)
                </option>
                <option value="AADHAAR_KYC_VERIFIED">
                  AADHAAR_KYC_VERIFIED (DigiLocker OAuth Reference Token)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1">
                Tokenized Reference (`kyc_reference_token`)
              </label>
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter token (Try typing 12 digits to test security block)"
                className="editorial-input font-mono"
                required
              />
            </div>

            {kycFeedback && (
              <div
                className={`p-3 border border-[#000000] text-xs font-bold ${
                  kycFeedback.type === 'error'
                    ? 'bg-[#C8553D] text-[#FFFFFF]'
                    : 'bg-[#FFD5C2] text-[#000000]'
                }`}
              >
                {kycFeedback.text}
              </div>
            )}

            <button type="submit" className="editorial-btn-primary">
              <Lock className="w-4 h-4" />
              <span>Verify Tokenized Identity</span>
            </button>
          </form>
        </div>

        {/* Directory of Verified Campus Users */}
        <div className="lg:col-span-6 editorial-card p-6 bg-[#FFFFFF] space-y-4">
          <h2 className="font-display font-bold text-xl border-b border-[#000000] pb-3">
            Verified DSU & Bengaluru Community Directory (`users`)
          </h2>
          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-3 border border-[#000000] bg-[#FFD5C2] flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="font-bold text-sm">{u.full_name}</div>
                  <div className="text-[11px]">{u.campus_or_area}</div>
                  <div className="font-mono text-[11px] mt-0.5">
                    Token: {u.kyc_reference_token || 'UNVERIFIED'}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <span
                    className={
                      u.kyc_status === 'UNVERIFIED'
                        ? 'editorial-badge-terracotta'
                        : 'editorial-badge-teal'
                    }
                  >
                    {u.kyc_status}
                  </span>
                  <div className="font-mono font-bold">
                    Lender ★ {u.lender_rating} | Borrower ★ {u.borrower_rating}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
