import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import VerificationCenterModal from './components/VerificationCenterModal.jsx';
import MarketplacePage from './pages/MarketplacePage.jsx';
import GarmentDetailPage from './pages/GarmentDetailPage.jsx';
import ListGarmentPage from './pages/ListGarmentPage.jsx';
import BookingsAndConditionPage from './pages/BookingsAndConditionPage.jsx';
import PartnersAndKycPage from './pages/PartnersAndKycPage.jsx';
import SchemaAndThemePage from './pages/SchemaAndThemePage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import ProfileDashboardPage from './pages/ProfileDashboardPage.jsx';
import {
  INITIAL_USERS,
  INITIAL_GARMENTS,
  INITIAL_BOOKINGS,
  INITIAL_DISPUTES,
  INITIAL_PARTNERS
} from './data/fallbackData.js';

const INITIAL_REVIEWS = [
  {
    id: '88888888-8888-4888-8888-888888888801',
    booking_id: '44444444-4444-4444-8444-444444444401',
    reviewer_id: '11111111-1111-4111-8111-111111111103',
    reviewee_id: '11111111-1111-4111-8111-111111111101',
    role_reviewed: 'LENDER',
    rating: 5,
    comment:
      'Ananya kept the emerald lehenga in showroom condition! The concierge garment box even had matching safety pins and styling drape notes.',
    reviewer: INITIAL_USERS[2]
  },
  {
    id: '88888888-8888-4888-8888-888888888802',
    booking_id: '44444444-4444-4444-8444-444444444401',
    reviewer_id: '11111111-1111-4111-8111-111111111101',
    reviewee_id: '11111111-1111-4111-8111-111111111103',
    role_reviewed: 'BORROWER',
    rating: 5,
    comment:
      'Meghana was super punctual with the return handoff and uploaded clear 5-point condition photos right on time. Would happily lend to her again!',
    reviewer: INITIAL_USERS[0]
  }
];

export default function App() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [activeUserId, setActiveUserId] = useState(INITIAL_USERS[0].id);
  const [jwtToken, setJwtToken] = useState('rewear_initial_jwt_session');
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);

  const [garments, setGarments] = useState(INITIAL_GARMENTS);
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [disputes, setDisputes] = useState(INITIAL_DISPUTES);
  const [partners, setPartners] = useState(INITIAL_PARTNERS);
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [sustainability, setSustainability] = useState({
    total_water_saved_liters: 12930,
    total_co2_saved_kg: 72.3,
    total_energy_saved_kwh: 157.6
  });

  const activeUser =
    users.find((u) => u.id === activeUserId) || users[0];

  // Hydrate from Express backend API if running
  useEffect(() => {
    async function fetchAll() {
      try {
        const [gRes, uRes, bRes, dRes, pRes, rRes, sRes] = await Promise.all([
          fetch('/api/garments'),
          fetch('/api/users'),
          fetch('/api/bookings'),
          fetch('/api/disputes'),
          fetch('/api/local-partners'),
          fetch('/api/reviews'),
          fetch('/api/metrics/sustainability')
        ]);
        if (gRes.ok) setGarments(await gRes.json());
        if (uRes.ok) setUsers(await uRes.json());
        if (bRes.ok) setBookings(await bRes.json());
        if (dRes.ok) setDisputes(await dRes.json());
        if (pRes.ok) setPartners(await pRes.json());
        if (rRes.ok) setReviews(await rRes.json());
        if (sRes.ok) setSustainability(await sRes.json());
      } catch {
        // Fallback seed store already pre-populated
      }
    }
    fetchAll();
  }, []);

  // 1. Unified JWT Login
  const handleLoginSuccess = async ({ email, user_id }) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, user_id })
      });
      if (res.ok) {
        const data = await res.json();
        setJwtToken(data.token);
        setActiveUserId(data.user.id);
        return data;
      }
      const errData = await res.json();
      return { error: errData.error };
    } catch {
      const found =
        users.find((u) => u.id === user_id) ||
        users.find((u) => u.email.toLowerCase() === String(email || '').toLowerCase());
      if (!found) return { error: 'User not found in DSU seed directory.' };
      setActiveUserId(found.id);
      return { token: `jwt_${found.id}`, user: found };
    }
  };

  // 2. Unified JWT Registration (Instant STUDENT_VERIFIED for @dsu.edu.in)
  const handleRegisterSuccess = async (payload) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error };
      setUsers((prev) => [data.user, ...prev]);
      setActiveUserId(data.user.id);
      setJwtToken(data.token);
      return data;
    } catch {
      const isDsu =
        String(payload.email).toLowerCase().endsWith('@dsu.edu.in') ||
        Boolean(payload.student_srn?.trim());
      const newUser = {
        id: `usr-${Date.now()}`,
        full_name: payload.full_name,
        email: payload.email.toLowerCase(),
        phone: payload.phone,
        campus_or_area: payload.campus_or_area,
        kyc_status: isDsu ? 'STUDENT_VERIFIED' : 'UNVERIFIED',
        kyc_reference_token: isDsu
          ? `DSU_STU_ID_${Date.now().toString(36).toUpperCase()}`
          : null,
        lender_rating: 5.0,
        borrower_rating: 5.0,
        total_reviews: 0
      };
      setUsers((prev) => [newUser, ...prev]);
      setActiveUserId(newUser.id);
      return {
        token: `jwt_${newUser.id}`,
        user: newUser,
        message: isDsu
          ? 'Unified account created with instant DSU STUDENT_VERIFIED status!'
          : 'Unified account created!'
      };
    }
  };

  // 3. Student Verification (@dsu.edu.in or SRN)
  const handleVerifyStudent = async (userId, payload) => {
    try {
      const res = await fetch(`/api/users/${userId}/verify-student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtToken}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error };
      setUsers((prev) => prev.map((u) => (u.id === userId ? data.user : u)));
      return data;
    } catch {
      const token = `DSU_STU_ID_${Date.now().toString(36).toUpperCase()}`;
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                kyc_status:
                  u.kyc_status === 'AADHAAR_KYC_VERIFIED'
                    ? 'AADHAAR_KYC_VERIFIED'
                    : 'STUDENT_VERIFIED',
                kyc_reference_token: token
              }
            : u
        )
      );
      return {
        message: `Instant STUDENT_VERIFIED badge unlocked! Token: ${token}`
      };
    }
  };

  // 4. Simulated 3rd-Party Aadhaar KYC Provider (DigiLocker / Cashfree)
  const handleVerifyAadhaarKyc = async (userId, payload) => {
    if (
      payload.raw_aadhaar_input &&
      /^\d{12}$/.test(String(payload.raw_aadhaar_input).replace(/\s|-/g, ''))
    ) {
      return {
        error:
          'PRIVACY & SECURITY BLOCK: ReWear never collects or stores raw 12-digit Aadhaar numbers. Only tokenized DigiLocker / Cashfree OAuth tokens are accepted.'
      };
    }

    try {
      const res = await fetch(`/api/users/${userId}/verify-aadhaar-kyc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtToken}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error };
      setUsers((prev) => prev.map((u) => (u.id === userId ? data.user : u)));
      return data;
    } catch {
      const anonymizedToken = `DIGILOCKER_TKN_${Date.now().toString(36).toUpperCase()}_BLR26`;
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                kyc_status: 'AADHAAR_KYC_VERIFIED',
                kyc_reference_token: anonymizedToken
              }
            : u
        )
      );
      return {
        kyc_reference_token: anonymizedToken,
        message: `Verified via ${payload.provider}. Stored anonymized token ${anonymizedToken} (Zero raw Aadhaar data stored). HIGH_VALUE_CONCIERGE tier unlocked!`
      };
    }
  };

  const handleAddGarment = async (payload) => {
    const resolvedTier =
      payload.retail_value >= 5000 ? 'HIGH_VALUE_CONCIERGE' : 'STANDARD';
    if (
      resolvedTier === 'HIGH_VALUE_CONCIERGE' &&
      activeUser?.kyc_status !== 'AADHAAR_KYC_VERIFIED'
    ) {
      return {
        error: `Listing HIGH_VALUE_CONCIERGE outfits requires AADHAAR_KYC_VERIFIED status. Current status is ${activeUser?.kyc_status}.`
      };
    }

    try {
      const res = await fetch('/api/garments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtToken}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error };
      setGarments((prev) => [data, ...prev]);
      return data;
    } catch {
      const fallbackGarment = {
        id: `rw-${Date.now()}`,
        ...payload,
        owner_id: activeUser.id,
        suggested_price: Math.round(payload.retail_value * 0.055),
        luxury_tier: resolvedTier,
        status: 'AVAILABLE',
        owner: activeUser,
        images: [
          {
            id: `img-${Date.now()}`,
            image_url: payload.image_urls?.[0],
            display_order: 1
          }
        ],
        lifecycle_events: [
          {
            id: `ev-${Date.now()}`,
            event_type: 'LISTED',
            description: `Listed at ${payload.location_tag}`,
            partner_name: 'ReWear DSU Hub',
            estimated_water_saved_liters: 0,
            estimated_co2_saved_kg: 0,
            event_date: new Date().toISOString()
          }
        ]
      };
      setGarments((prev) => [fallbackGarment, ...prev]);
      return fallbackGarment;
    }
  };

  const handleCreateBooking = async (payload) => {
    const targetGarment =
      garments.find((g) => g.id === payload.garment_id) || garments[0];

    if (
      targetGarment.luxury_tier === 'HIGH_VALUE_CONCIERGE' &&
      activeUser?.kyc_status !== 'AADHAAR_KYC_VERIFIED'
    ) {
      return {
        error: `Renting HIGH_VALUE_CONCIERGE garments requires AADHAAR_KYC_VERIFIED status. Your current status is ${activeUser?.kyc_status}.`
      };
    }

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtToken}`
        },
        body: JSON.stringify({ ...payload, borrower_id: activeUser.id })
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error };
      setBookings((prev) => [data, ...prev]);
      return data;
    } catch {
      const end = new Date(payload.end_date);
      end.setDate(end.getDate() + 1);
      const bkId = `bk-${Date.now()}`;
      const qrToken = `RWQR-${bkId.slice(-8)}-${targetGarment.id.slice(-8)}-9F4A2D1C8E`;
      const created = {
        id: bkId,
        ...payload,
        borrower_id: activeUser.id,
        lender_id: targetGarment.owner_id,
        buffer_end_date: end.toISOString().split('T')[0],
        rental_amount: targetGarment.daily_rental_price * 2,
        platform_fee: Math.round(targetGarment.daily_rental_price * 0.2),
        pickup_fee: payload.handoff_mode === 'CONCIERGE_PICKUP' ? 180 : 0,
        deposit_amount: targetGarment.security_deposit,
        payment_status: 'ESCROW_HELD',
        booking_status: 'REQUESTED',
        inspection_qr_token: qrToken,
        garment: targetGarment,
        borrower: activeUser,
        lender: targetGarment.owner || users[0],
        condition_logs: []
      };
      setBookings((prev) => [created, ...prev]);
      return created;
    }
  };

  // Booking State Machine Transition Handler
  const handleUpdateBookingStatus = async (bookingId, payload) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updated = await res.json();
        setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
        return updated;
      }
    } catch {
      // Fallback
    }
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              ...payload,
              payment_status:
                payload.booking_status === 'COMPLETED'
                  ? 'RELEASED'
                  : payload.booking_status === 'DISPUTED'
                  ? 'DISPUTED'
                  : payload.booking_status === 'CANCELLED'
                  ? 'REFUNDED'
                  : b.payment_status
            }
          : b
      )
    );
  };

  // ESP32-CAM + Controlled LED Ring Hardware Scan Simulator
  const handleSimulateEsp32Scan = async (payload) => {
    try {
      const res = await fetch('/api/hardware/esp32-inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setBookings((prev) =>
          prev.map((b) => (b.id === data.booking.id ? data.booking : b))
        );
        if (data.auto_dispute) {
          setDisputes((prev) => [data.auto_dispute, ...prev]);
        }
        return data;
      }
    } catch {
      // Fallback client simulation
    }

    const isDamage =
      payload.simulate_defect_mode === 'DAMAGE_FLAGGED' ||
      payload.simulate_defect_mode === 'MINOR_DEFECT';
    const score = isDamage
      ? payload.simulate_defect_mode === 'MINOR_DEFECT'
        ? 81
        : 64
      : 98;
    const defects = isDamage
      ? [
          {
            id: `def-${Date.now()}`,
            type: 'STAIN',
            label: 'Beverage / Oil Stain on Lower Satin Hemline (4.2 cm)',
            severity: 'HIGH',
            confidence: 0.96,
            estimated_repair_cost_inr: 250,
            bbox: { x: 28, y: 68, width: 22, height: 18 }
          },
          {
            id: `def2-${Date.now()}`,
            type: 'LOOSE_THREAD_OR_SNAG',
            label: 'Concealed Zipper Slider Snag & Loose Seam Thread',
            severity: 'MEDIUM',
            confidence: 0.93,
            estimated_repair_cost_inr: 200,
            bbox: { x: 54, y: 34, width: 18, height: 16 }
          }
        ]
      : [];

    const newLog = {
      id: `esp-log-${Date.now()}`,
      stage: payload.stage,
      device_id: payload.device_id,
      led_lux_level: payload.led_lux_level,
      condition_score: score,
      detected_defects: defects,
      photo_urls: [payload.image_base64_or_url],
      checklist_json: {
        stains: isDamage,
        tears: false,
        buttons_zippers: isDamage,
        odor: false,
        missing_items: false
      },
      notes: `[${payload.device_id} @ ${payload.led_lux_level} lux] ESP32-CAM scan completed (Score: ${score}/100).`,
      created_at: new Date().toISOString()
    };

    setBookings((prev) =>
      prev.map((b) =>
        b.inspection_qr_token === payload.qr_token
          ? {
              ...b,
              booking_status:
                payload.stage === 'PRE_HANDOFF'
                  ? 'HANDED_OVER'
                  : isDamage
                  ? 'DISPUTED'
                  : 'RETURNED',
              payment_status: isDamage ? 'DISPUTED' : b.payment_status,
              condition_logs: [...(b.condition_logs || []), newLog]
            }
          : b
      )
    );

    return {
      message: `ESP32-CAM ${payload.stage} scan linked via QR token ${payload.qr_token}.`,
      ai_inspection: {
        condition_score: score,
        passed_clean: !isDamage,
        summary: newLog.notes
      }
    };
  };

  // Mobile Browser AI Condition Assistant
  const handleRunMobileAiInspection = async (payload) => {
    try {
      const res = await fetch('/api/ai/inspect-condition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.saved_condition_log) {
          setBookings((prev) =>
            prev.map((b) =>
              b.id === payload.booking_id
                ? {
                    ...b,
                    condition_logs: [
                      ...(b.condition_logs || []),
                      data.saved_condition_log
                    ]
                  }
                : b
            )
          );
        }
        return data;
      }
    } catch {
      // Fallback
    }
    const isDamage = payload.simulate_defect_mode === 'DAMAGE_FLAGGED';
    const score = isDamage ? 68 : 97;
    const createdLog = {
      id: `mob-log-${Date.now()}`,
      stage: payload.stage,
      device_id: 'MOBILE-WEB-AI-SCANNER',
      led_lux_level: 820,
      condition_score: score,
      detected_defects: isDamage
        ? [
            {
              id: `def-${Date.now()}`,
              type: 'STAIN',
              label: 'Mobile AI Flagged Hemline Stain',
              severity: 'MEDIUM',
              confidence: 0.91,
              estimated_repair_cost_inr: 250,
              bbox: { x: 30, y: 65, width: 20, height: 16 }
            }
          ]
        : [],
      photo_urls: [payload.image_base64_or_url],
      notes: payload.notes || `Mobile AI Scan completed (Score: ${score}/100)`,
      created_at: new Date().toISOString()
    };
    setBookings((prev) =>
      prev.map((b) =>
        b.id === payload.booking_id
          ? { ...b, condition_logs: [...(b.condition_logs || []), createdLog] }
          : b
      )
    );
    return { condition_score: score, summary: createdLog.notes };
  };

  const handleAddConditionLog = async (payload) => {
    try {
      const res = await fetch('/api/condition-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const createdLog = await res.json();
        setBookings((prev) =>
          prev.map((b) =>
            b.id === payload.booking_id
              ? { ...b, condition_logs: [...(b.condition_logs || []), createdLog] }
              : b
          )
        );
        return;
      }
    } catch {
      // Fallback
    }
    const createdLog = {
      id: `log-${Date.now()}`,
      ...payload,
      created_at: new Date().toISOString()
    };
    setBookings((prev) =>
      prev.map((b) =>
        b.id === payload.booking_id
          ? { ...b, condition_logs: [...(b.condition_logs || []), createdLog] }
          : b
      )
    );
  };

  const handleResolveDispute = async (disputeId, deductionAmount = 450) => {
    try {
      await fetch(`/api/disputes/${disputeId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolution_status: 'RESOLVED',
          deposit_deduction_amount: deductionAmount
        })
      });
    } catch {
      // Fallback
    }
    const targetDispute = disputes.find((d) => d.id === disputeId);
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === disputeId
          ? {
              ...d,
              resolution_status: 'RESOLVED',
              deposit_deduction_amount: deductionAmount
            }
          : d
      )
    );
    if (targetDispute) {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === targetDispute.booking_id
            ? { ...b, booking_status: 'COMPLETED', payment_status: 'RELEASED' }
            : b
        )
      );
    }
  };

  const handleVerifyKyc = async (userId, payload) => {
    try {
      const res = await fetch(`/api/users/${userId}/verify-kyc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const { user } = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === userId ? user : u)));
        return;
      }
    } catch {
      // Fallback
    }
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              kyc_status: payload.kyc_status,
              kyc_reference_token: payload.verification_reference
            }
          : u
      )
    );
  };

  // 1-Click AI Wardrobe Utilisation Optimization Handler
  const handleOptimizeGarment = async (garmentId, payload) => {
    try {
      const res = await fetch(`/api/garments/${garmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updated = await res.json();
        setGarments((prev) =>
          prev.map((g) => (g.id === garmentId ? updated : g))
        );
        return updated;
      }
    } catch {
      // Fallback
    }
    setGarments((prev) =>
      prev.map((g) => {
        if (g.id !== garmentId) return g;
        const extraPhotos = (payload.add_sample_photos || []).map((url, idx) => ({
          id: `opt-img-${Date.now()}-${idx}`,
          image_url: url,
          display_order: (g.images?.length || 1) + idx + 1
        }));
        return {
          ...g,
          daily_rental_price:
            payload.daily_rental_price !== undefined
              ? Number(payload.daily_rental_price)
              : g.daily_rental_price,
          occasion: payload.occasion || g.occasion,
          style_tags: payload.style_tag_to_add
            ? [payload.style_tag_to_add, ...(g.style_tags || [])]
            : g.style_tags,
          images: [...(g.images || []), ...extraPhotos]
        };
      })
    );
  };

  // Log Circular Lifecycle Event from End-of-Life Advisor or Local Partner Directory
  const handleLogLifecycleEvent = async (payload) => {
    try {
      const res = await fetch('/api/lifecycle-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.garment) {
          setGarments((prev) =>
            prev.map((g) => (g.id === data.garment.id ? data.garment : g))
          );
        }
        return data.event;
      }
    } catch {
      // Fallback
    }
    const createdEvent = {
      id: `lc-${Date.now()}`,
      ...payload,
      event_date: new Date().toISOString()
    };
    setGarments((prev) =>
      prev.map((g) =>
        g.id === payload.garment_id
          ? {
              ...g,
              status:
                payload.event_type === 'RESOLD' ||
                payload.event_type === 'DONATED'
                  ? 'RETIRED'
                  : 'AVAILABLE',
              lifecycle_events: [createdEvent, ...(g.lifecycle_events || [])]
            }
          : g
      )
    );
    return createdEvent;
  };

  // Submit Dual-Sided Post-Rental Review
  const handleSubmitReview = async (payload) => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const created = await res.json();
        setReviews((prev) => [created, ...prev]);
        if (created.reviewee) {
          setUsers((prev) =>
            prev.map((u) => (u.id === created.reviewee.id ? created.reviewee : u))
          );
        }
        return created;
      }
    } catch {
      // Fallback
    }
    const tagPrefix =
      Array.isArray(payload.quick_tags) && payload.quick_tags.length > 0
        ? `[${payload.quick_tags.join(' • ')}] `
        : '';
    const created = {
      id: `rev-${Date.now()}`,
      ...payload,
      comment: `${tagPrefix}${payload.comment || 'Smooth circular rental experience at DSU!'}`.trim(),
      reviewer: activeUser,
      created_at: new Date().toISOString()
    };
    setReviews((prev) => [created, ...prev]);
    return created;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#000000]">
      <Navbar
        activeUser={activeUser}
        sustainability={sustainability}
        onOpenVerificationModal={() => setIsVerificationOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <Routes>
          <Route
            path="/"
            element={
              <MarketplacePage
                garments={garments}
                activeUser={activeUser}
                onCreateBooking={handleCreateBooking}
                onOpenVerificationModal={() => setIsVerificationOpen(true)}
              />
            }
          />
          <Route
            path="/garments/:id"
            element={
              <GarmentDetailPage
                garments={garments}
                activeUser={activeUser}
                partners={partners}
                onCreateBooking={handleCreateBooking}
                onLogLifecycleEvent={handleLogLifecycleEvent}
                onOpenVerificationModal={() => setIsVerificationOpen(true)}
              />
            }
          />
          <Route
            path="/list"
            element={
              <ListGarmentPage
                activeUser={activeUser}
                onAddGarment={handleAddGarment}
                onOpenVerificationModal={() => setIsVerificationOpen(true)}
              />
            }
          />
          <Route
            path="/bookings"
            element={
              <BookingsAndConditionPage
                bookings={bookings}
                disputes={disputes}
                onUpdateBookingStatus={handleUpdateBookingStatus}
                onSimulateEsp32Scan={handleSimulateEsp32Scan}
                onRunMobileAiInspection={handleRunMobileAiInspection}
                onResolveDispute={handleResolveDispute}
              />
            }
          />
          <Route
            path="/profile"
            element={
              <ProfileDashboardPage
                activeUser={activeUser}
                users={users}
                garments={garments}
                bookings={bookings}
                reviews={reviews}
                onSelectUser={(id) => setActiveUserId(id)}
                onOpenVerificationModal={() => setIsVerificationOpen(true)}
                onOptimizeGarment={handleOptimizeGarment}
                onSubmitReview={handleSubmitReview}
              />
            }
          />
          <Route
            path="/auth"
            element={
              <AuthPage
                users={users}
                activeUser={activeUser}
                onLoginSuccess={handleLoginSuccess}
                onRegisterSuccess={handleRegisterSuccess}
                onOpenVerificationModal={() => setIsVerificationOpen(true)}
              />
            }
          />
          <Route
            path="/partners"
            element={
              <PartnersAndKycPage
                partners={partners}
                garments={garments}
                users={users}
                onVerifyKyc={handleVerifyKyc}
                onLogLifecycleEvent={handleLogLifecycleEvent}
              />
            }
          />
          <Route path="/schema" element={<SchemaAndThemePage />} />
        </Routes>
      </main>

      {/* 3-Tier Verification Center Modal */}
      <VerificationCenterModal
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
        activeUser={activeUser}
        onVerifyStudent={handleVerifyStudent}
        onVerifyAadhaarKyc={handleVerifyAadhaarKyc}
      />

      <footer className="border-t border-[#000000] bg-[#FFD5C2] mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
          <div>
            <span className="font-display font-bold text-sm">ReWear</span> — Wear More. Waste Less. Give Every Garment Another Life.
          </div>
          <div className="flex flex-wrap items-center gap-3 font-mono">
            <span>Launching at Dayananda Sagar University (DSU), Bengaluru</span>
            <span>•</span>
            <span>Palette: #588B8B | #FFFFFF | #FFD5C2 | #F28F3B | #C8553D | #000000</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
