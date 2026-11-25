import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  initDatabase,
  isPostgresConnected,
  getStore,
  generateId,
  enrichGarment,
  enrichBooking
} from './db/repository.js';
import {
  signJwtToken,
  verifyJwtToken,
  hashPassword,
  generateAnonymizedKycToken,
  generateStudentToken
} from './auth/jwtAuth.js';
import { calculateUserImpact } from './services/impactCalculator.js';
import {
  analyzeGarmentWithAI,
  recommendGarmentPrice
} from './services/aiWardrobeService.js';
import {
  signInspectionQrToken,
  resolveBookingFromQrToken,
  runAiConditionInspection,
  calculateEscrowSettlement,
  calculateCheckoutCategoryImpact
} from './services/inspectionAndEscrowService.js';
import {
  generateWardrobeUtilisationInsights,
  evaluateGarmentEndOfLife,
  generateDemandForecast
} from './services/aiIntelligenceSuite.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const payload = verifyJwtToken(token);
  if (!payload?.userId) return null;
  const store = getStore();
  return store.users.find((u) => u.id === payload.userId) || null;
}

// ============================================================================
// HEALTH & PLATFORM METRICS
// ============================================================================
app.get('/api/health', (req, res) => {
  const store = getStore();
  res.json({
    status: 'ok',
    platform: 'ReWear — DSU & Bengaluru Circular Fashion API',
    tagline: 'Wear More. Waste Less. Give Every Garment Another Life.',
    database_mode: isPostgresConnected() ? 'postgresql_prisma' : 'seeded_relational_store',
    counts: {
      users: store.users.length,
      garments: store.garments.length,
      bookings: store.bookings.length,
      condition_logs: store.condition_logs.length,
      disputes: store.disputes.length,
      lifecycle_events: store.lifecycle_events.length,
      reviews: store.reviews.length,
      local_partners: store.local_partners.length
    }
  });
});

app.get('/api/metrics/sustainability', (req, res) => {
  const store = getStore();
  const totalWaterLiters = store.lifecycle_events.reduce(
    (sum, ev) => sum + Number(ev.estimated_water_saved_liters || 0),
    0
  );
  const totalCo2Kg = store.lifecycle_events.reduce(
    (sum, ev) => sum + Number(ev.estimated_co2_saved_kg || 0),
    0
  );
  const totalEnergyKwh = Number((totalCo2Kg * 2.18).toFixed(1));
  const totalRetailValueCirculated = store.garments.reduce(
    (sum, g) => sum + Number(g.retail_value || 0),
    0
  );

  res.json({
    total_water_saved_liters: totalWaterLiters,
    total_co2_saved_kg: Number(totalCo2Kg.toFixed(2)),
    total_energy_saved_kwh: totalEnergyKwh,
    total_retail_value_circulated: totalRetailValueCirculated,
    active_garments: store.garments.length,
    verified_campus_members: store.users.filter((u) => u.kyc_status !== 'UNVERIFIED').length,
    bengaluru_care_partners: store.local_partners.length
  });
});

// ============================================================================
// AI CLOTHING RECOGNITION, PRICE RECOMMENDER & AI CONDITION DEFECT DETECTION
// ============================================================================
app.post('/api/ai/analyze-garment', async (req, res) => {
  try {
    const { image_urls = [], image_name = '', user_hint = '' } = req.body;
    const analysis = await analyzeGarmentWithAI({
      image_urls,
      image_name,
      user_hint
    });
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: 'AI garment analysis failed', details: err.message });
  }
});

app.post('/api/ai/recommend-price', (req, res) => {
  const store = getStore();
  const {
    category,
    brand,
    retail_value,
    condition_grade = 'LIKE_NEW',
    campus_or_area
  } = req.body;

  const recommendation = recommendGarmentPrice({
    category,
    brand,
    retail_value,
    condition_grade,
    campus_or_area,
    store
  });

  res.json(recommendation);
});

/**
 * 4. GET /api/ai/wardrobe-insights/:userId
 * AI Wardrobe Utilisation Assistant: analyzes views, conversion rate, days idle,
 * price vs comparable listings, and photo count; returns one-click optimization actions.
 */
app.get('/api/ai/wardrobe-insights/:userId', (req, res) => {
  const store = getStore();
  const insights = generateWardrobeUtilisationInsights(req.params.userId, store);
  res.json(insights);
});

/**
 * 5. GET /api/ai/end-of-life/:garmentId
 * AI Garment End-of-Life Advisor: evaluates rental_count, cumulative condition_logs,
 * repair count, and fabric category; recommends KEEP_RENTING | REPAIR | RESELL | DONATE_RECYCLE.
 */
app.get('/api/ai/end-of-life/:garmentId', (req, res) => {
  const store = getStore();
  const advisor = evaluateGarmentEndOfLife(req.params.garmentId, store);
  if (!advisor) return res.status(404).json({ error: 'Garment not found' });
  res.json(advisor);
});

/**
 * 6. GET /api/ai/demand-forecast
 * AI Demand Prediction Engine: analyzes search velocity, booking velocity by category/occasion,
 * and upcoming DSU & Bengaluru event calendar.
 */
app.get('/api/ai/demand-forecast', (req, res) => {
  const store = getStore();
  res.json(generateDemandForecast(store));
});

/**
 * 3. POST /api/ai/inspect-condition
 * Runs AI Vision Defect Detection on mobile browser or ESP32-CAM garment photos.
 * Detects and bounding-boxes stains, tears, loose threads, or missing buttons,
 * outputting condition_score (0-100) and detected_defects[].
 */
app.post('/api/ai/inspect-condition', async (req, res) => {
  try {
    const {
      booking_id,
      stage = 'AT_RETURN',
      image_base64_or_url = '',
      led_lux_level = 840,
      simulate_defect_mode = 'CLEAN',
      notes = '',
      save_to_log = false
    } = req.body;

    const inspection = await runAiConditionInspection({
      stage,
      image_base64_or_url,
      led_lux_level,
      simulate_defect_mode,
      notes
    });

    if (save_to_log && booking_id) {
      const store = getStore();
      const booking = store.bookings.find((b) => b.id === booking_id);
      if (booking) {
        const newLog = {
          id: generateId(),
          booking_id: booking.id,
          garment_id: booking.garment_id,
          logged_by_user_id: booking.lender_id,
          stage,
          device_id: 'MOBILE-WEB-AI-SCANNER',
          led_lux_level: inspection.led_lux_level,
          condition_score: inspection.condition_score,
          detected_defects: inspection.detected_defects,
          photo_urls: [
            image_base64_or_url ||
              'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80'
          ],
          checklist_json: inspection.checklist_json,
          notes: notes || inspection.summary,
          created_at: new Date().toISOString()
        };
        store.condition_logs.push(newLog);
        return res.json({ ...inspection, saved_condition_log: newLog });
      }
    }

    res.json(inspection);
  } catch (err) {
    res.status(500).json({ error: 'AI defect inspection failed', details: err.message });
  }
});

// ============================================================================
// ESP32-CAM + CONTROLLED LED RING HARDWARE STATION ENDPOINT
// ============================================================================

/**
 * POST /api/hardware/esp32-inspection
 * Dedicated REST endpoint for ESP32-CAM + Controlled LED Ring Inspection Station
 * Payload: { qr_token, device_id, stage: 'PRE_HANDOFF' | 'AT_RETURN', led_lux_level, image_base64_or_url, captured_timestamp, simulate_defect_mode }
 */
app.post('/api/hardware/esp32-inspection', async (req, res) => {
  const store = getStore();
  const configuredHwKey = process.env.ESP32_DEVICE_API_KEY;
  const providedHwKey = req.headers['x-esp32-device-key'];

  // If ESP32_DEVICE_API_KEY header is sent by physical hardware, validate it
  if (
    providedHwKey &&
    configuredHwKey &&
    providedHwKey !== configuredHwKey
  ) {
    return res.status(401).json({
      error: 'Invalid x-esp32-device-key header from ESP32-CAM station.'
    });
  }

  const {
    qr_token,
    device_id = 'ESP32-CAM-DSU-HAROHALLI-01',
    stage = 'PRE_HANDOFF',
    led_lux_level = 865,
    image_base64_or_url,
    captured_timestamp,
    simulate_defect_mode = 'CLEAN'
  } = req.body;

  if (!qr_token) {
    return res.status(400).json({ error: 'Missing qr_token from ESP32-CAM station payload.' });
  }

  const resolved = resolveBookingFromQrToken(qr_token, store);
  if (!resolved || !resolved.booking) {
    return res.status(404).json({
      error: `Invalid or unrecognized inspection_qr_token (${qr_token}). Cannot link hardware scan to booking.`
    });
  }

  const { booking, garment } = resolved;

  // Run AI Vision Defect Detection on the ESP32-CAM capture
  const defaultImg =
    store.garment_images.find((i) => i.garment_id === booking.garment_id)?.image_url ||
    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80';

  const photoUrl = image_base64_or_url || defaultImg;
  const aiInspection = await runAiConditionInspection({
    stage,
    image_base64_or_url: photoUrl,
    led_lux_level,
    simulate_defect_mode
  });

  // Persist timestamped PRE_HANDOFF or AT_RETURN record in condition_logs
  const createdLog = {
    id: generateId(),
    booking_id: booking.id,
    garment_id: booking.garment_id,
    logged_by_user_id: booking.lender_id,
    stage,
    device_id,
    led_lux_level: Number(led_lux_level) || 865,
    condition_score: aiInspection.condition_score,
    detected_defects: aiInspection.detected_defects,
    photo_urls: [photoUrl],
    checklist_json: aiInspection.checklist_json,
    notes: `[${device_id} @ ${led_lux_level} lux] ${aiInspection.summary}`,
    created_at: captured_timestamp || new Date().toISOString()
  };

  store.condition_logs.push(createdLog);

  // Advance Booking State Machine automatically based on hardware scan & AI result
  let autoDispute = null;
  if (stage === 'PRE_HANDOFF') {
    if (['REQUESTED', 'APPROVED'].includes(booking.booking_status)) {
      booking.booking_status = 'HANDED_OVER';
    }
    if (garment) garment.status = 'RENTED';
  } else if (stage === 'AT_RETURN') {
    if (aiInspection.passed_clean) {
      booking.booking_status = 'RETURNED';
      if (garment) garment.status = 'IN_CLEANING';
    } else {
      // Defects flagged at return -> freeze escrow & open dispute automatically
      booking.booking_status = 'DISPUTED';
      booking.payment_status = 'DISPUTED';
      if (garment) garment.status = 'IN_CLEANING';

      autoDispute = {
        id: generateId(),
        booking_id: booking.id,
        raised_by_id: booking.lender_id,
        reason: `ESP32-CAM Return Scan (${device_id}) flagged ${aiInspection.detected_defects
          .map((d) => d.label)
          .join('; ')}. Condition score dropped to ${aiInspection.condition_score}/100.`,
        evidence_photos: [photoUrl],
        deposit_deduction_amount: aiInspection.recommended_deposit_deduction_inr,
        resolution_status: 'OPEN',
        admin_notes: `Auto-flagged by ReWear AI Vision (${aiInspection.ai_vision_model}). Comparing PRE_HANDOFF baseline vs AT_RETURN scan.`
      };
      store.disputes.unshift(autoDispute);
    }
  }

  res.status(201).json({
    message: `ESP32-CAM ${stage} scan linked via QR token ${qr_token}. Condition Score: ${aiInspection.condition_score}/100.`,
    qr_token_verified: true,
    device_id,
    booking: enrichBooking(booking),
    condition_log: createdLog,
    ai_inspection: aiInspection,
    auto_dispute: autoDispute
  });
});

// ============================================================================
// AUTHENTICATION (UNIFIED LENDER + BORROWER ACCOUNTS WITH JWT)
// ============================================================================
app.post('/api/auth/register', (req, res) => {
  const store = getStore();
  const { full_name, email, phone, password, campus_or_area, student_srn } = req.body;

  if (!full_name || !email || !phone) {
    return res.status(400).json({ error: 'full_name, email, and phone are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = store.users.find(
    (u) => u.email.toLowerCase() === normalizedEmail || u.phone === phone
  );
  if (existing) {
    return res.status(409).json({ error: 'Account with this email or phone already exists.' });
  }

  const isDsuStudent =
    normalizedEmail.endsWith('@dsu.edu.in') || Boolean(student_srn && String(student_srn).trim());

  const initialKycStatus = isDsuStudent ? 'STUDENT_VERIFIED' : 'UNVERIFIED';
  const initialToken = isDsuStudent
    ? generateStudentToken(student_srn || normalizedEmail.split('@')[0])
    : null;

  const newUser = {
    id: generateId(),
    full_name: full_name.trim(),
    email: normalizedEmail,
    phone: phone.trim(),
    password_hash: hashPassword(password || 'rewear2026'),
    campus_or_area: campus_or_area || 'Dayananda Sagar University (Harohalli Main Campus)',
    kyc_status: initialKycStatus,
    kyc_reference_token: initialToken,
    lender_rating: 5.0,
    borrower_rating: 5.0,
    total_reviews: 0,
    created_at: new Date().toISOString()
  };

  store.users.unshift(newUser);

  const token = signJwtToken({
    userId: newUser.id,
    email: newUser.email,
    kyc_status: newUser.kyc_status,
    roles: ['LENDER', 'BORROWER']
  });

  const { password_hash, ...safeUser } = newUser;
  res.status(201).json({
    token,
    user: safeUser,
    instant_student_verified: isDsuStudent,
    message: isDsuStudent
      ? 'Unified account created with instant DSU STUDENT_VERIFIED status!'
      : 'Unified account created. Complete Student ID or Aadhaar KYC in the Verification Center.'
  });
});

app.post('/api/auth/login', (req, res) => {
  const store = getStore();
  const { email, user_id } = req.body;

  let user = null;
  if (user_id) {
    user = store.users.find((u) => u.id === user_id);
  } else if (email) {
    const normalizedEmail = String(email).trim().toLowerCase();
    user = store.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  }

  if (!user) {
    return res.status(401).json({
      error: 'No ReWear account found for that email. Try a seeded DSU member or Register.'
    });
  }

  const token = signJwtToken({
    userId: user.id,
    email: user.email,
    kyc_status: user.kyc_status,
    roles: ['LENDER', 'BORROWER']
  });

  const { password_hash, ...safeUser } = user;
  res.json({
    token,
    user: safeUser,
    message: `Logged in as ${user.full_name} (Unified Lender & Borrower Account)`
  });
});

app.get('/api/auth/me', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Invalid or expired JWT token' });
  const { password_hash, ...safeUser } = user;
  res.json({ user: safeUser });
});

// ============================================================================
// CAMPUS & AADHAAR KYC VERIFICATION ENDPOINTS (ZERO RAW AADHAAR STORAGE)
// ============================================================================
app.post('/api/users/:id/verify-student', (req, res) => {
  const store = getStore();
  const user = store.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { dsu_email, student_srn } = req.body;

  if (
    !user.email.endsWith('@dsu.edu.in') &&
    (!dsu_email || !String(dsu_email).toLowerCase().endsWith('@dsu.edu.in')) &&
    (!student_srn || String(student_srn).trim().length < 4)
  ) {
    return res.status(400).json({
      error: 'Please provide a valid @dsu.edu.in campus email or DSU Student ID / SRN.'
    });
  }

  if (user.kyc_status !== 'AADHAAR_KYC_VERIFIED') {
    user.kyc_status = 'STUDENT_VERIFIED';
  }
  user.kyc_reference_token = generateStudentToken(student_srn || dsu_email || user.email);

  const token = signJwtToken({
    userId: user.id,
    email: user.email,
    kyc_status: user.kyc_status,
    roles: ['LENDER', 'BORROWER']
  });

  res.json({
    message: 'Instant STUDENT_VERIFIED badge unlocked for DSU campus P2P rentals!',
    token,
    user
  });
});

app.post('/api/users/:id/verify-aadhaar-kyc', (req, res) => {
  const store = getStore();
  const user = store.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { provider = 'DIGILOCKER', otp_code, raw_aadhaar_input, aadhaar_card_image } = req.body;

  if (raw_aadhaar_input && /^\d{12}$/.test(String(raw_aadhaar_input).replace(/\s|-/g, ''))) {
    return res.status(400).json({
      error:
        'PRIVACY & SECURITY BLOCK: ReWear never collects or stores raw 12-digit Aadhaar numbers. Use the tokenized DigiLocker / Cashfree OAuth handshake.'
    });
  }
  if (aadhaar_card_image) {
    return res.status(400).json({
      error:
        'PRIVACY & SECURITY BLOCK: Raw Aadhaar card image uploads are prohibited. Only anonymized provider tokens are accepted.'
    });
  }

  if (otp_code && String(otp_code).trim().length < 4) {
    return res.status(400).json({ error: 'Invalid provider OTP confirmation code.' });
  }

  const anonymizedToken = generateAnonymizedKycToken(provider);
  user.kyc_status = 'AADHAAR_KYC_VERIFIED';
  user.kyc_reference_token = anonymizedToken;

  const token = signJwtToken({
    userId: user.id,
    email: user.email,
    kyc_status: user.kyc_status,
    roles: ['LENDER', 'BORROWER']
  });

  res.json({
    message: `Verified via ${provider} KYC handshake. Stored anonymized token ${anonymizedToken} (Zero raw Aadhaar data stored). HIGH_VALUE_CONCIERGE tier unlocked!`,
    provider,
    kyc_reference_token: anonymizedToken,
    token,
    user
  });
});

app.post('/api/users/:id/verify-kyc', (req, res) => {
  const store = getStore();
  const user = store.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { kyc_status, verification_reference } = req.body;
  if (
    verification_reference &&
    /^\d{12}$/.test(String(verification_reference).replace(/\s|-/g, ''))
  ) {
    return res.status(400).json({
      error:
        'SECURITY VIOLATION: Raw 12-digit Aadhaar numbers must never be stored. Submit a tokenized DigiLocker or DSU Student ID reference token.'
    });
  }

  user.kyc_status = kyc_status || 'STUDENT_VERIFIED';
  user.kyc_reference_token =
    verification_reference || generateAnonymizedKycToken('DIGILOCKER');

  res.json({
    message: 'KYC verification token updated safely without storing raw Aadhaar.',
    user
  });
});

// ============================================================================
// 1. USERS, DUAL-SIDED PROFILE & PERSONAL SUSTAINABILITY IMPACT
// ============================================================================
app.get('/api/users', (req, res) => {
  const store = getStore();
  res.json(store.users);
});

app.get('/api/users/:id', (req, res) => {
  const store = getStore();
  const user = store.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const garments = store.garments.filter((g) => g.owner_id === user.id).map(enrichGarment);
  const bookings_as_lender = store.bookings
    .filter((b) => b.lender_id === user.id)
    .map(enrichBooking);
  const bookings_as_borrower = store.bookings
    .filter((b) => b.borrower_id === user.id)
    .map(enrichBooking);

  const reviews_received = store.reviews
    .filter((r) => r.reviewee_id === user.id)
    .map((r) => ({
      ...r,
      reviewer: store.users.find((u) => u.id === r.reviewer_id) || null
    }));

  const lender_reviews = reviews_received.filter((r) => r.role_reviewed === 'LENDER');
  const borrower_reviews = reviews_received.filter((r) => r.role_reviewed === 'BORROWER');
  const impact = calculateUserImpact(user.id, store);

  res.json({
    ...user,
    garments,
    bookings_as_lender,
    bookings_as_borrower,
    reviews_received,
    lender_reviews,
    borrower_reviews,
    impact
  });
});

app.get('/api/users/:id/impact', (req, res) => {
  const store = getStore();
  const impact = calculateUserImpact(req.params.id, store);
  if (!impact) return res.status(404).json({ error: 'User not found' });
  res.json(impact);
});

// ============================================================================
// 2 & 3. SMART DISCOVERY MARKETPLACE (GET /api/garments) & LISTING
// ============================================================================
app.get('/api/garments', (req, res) => {
  const store = getStore();
  const {
    occasion,
    size,
    category,
    color,
    pattern,
    min_price,
    max_price,
    location_tag,
    location,
    luxury_tier,
    status,
    available_from,
    available_to,
    search
  } = req.query;

  let list = store.garments.map(enrichGarment);

  if (occasion && occasion !== 'ALL') {
    list = list.filter((g) => g.occasion.toLowerCase() === occasion.toLowerCase());
  }
  if (size && size !== 'ALL') {
    list = list.filter((g) => g.size.toLowerCase() === size.toLowerCase());
  }
  if (category && category !== 'ALL') {
    list = list.filter((g) =>
      g.category.toLowerCase().includes(category.toLowerCase())
    );
  }
  if (color && color !== 'ALL') {
    const c = color.toLowerCase();
    list = list.filter(
      (g) =>
        (g.primary_color && g.primary_color.toLowerCase().includes(c)) ||
        (g.secondary_color && g.secondary_color.toLowerCase().includes(c)) ||
        g.title.toLowerCase().includes(c)
    );
  }
  if (pattern && pattern !== 'ALL') {
    list = list.filter(
      (g) => g.pattern && g.pattern.toLowerCase() === pattern.toLowerCase()
    );
  }
  if (min_price !== undefined && min_price !== '') {
    list = list.filter((g) => Number(g.daily_rental_price) >= Number(min_price));
  }
  if (max_price !== undefined && max_price !== '') {
    list = list.filter((g) => Number(g.daily_rental_price) <= Number(max_price));
  }
  const locQuery = location_tag || location;
  if (locQuery && locQuery !== 'ALL') {
    list = list.filter((g) =>
      g.location_tag.toLowerCase().includes(locQuery.toLowerCase())
    );
  }
  if (luxury_tier && luxury_tier !== 'ALL') {
    list = list.filter((g) => g.luxury_tier === luxury_tier);
  }
  if (status && status !== 'ALL') {
    list = list.filter((g) => g.status === status);
  }

  if (available_from || available_to) {
    const reqStart = new Date(available_from || available_to);
    const reqEnd = new Date(available_to || available_from);

    if (!isNaN(reqStart) && !isNaN(reqEnd)) {
      list = list.filter((g) => {
        if (g.status === 'RETIRED') return false;
        const blockingBookings = (g.bookings || []).filter(
          (b) => !['CANCELLED', 'COMPLETED'].includes(b.booking_status)
        );
        const hasOverlap = blockingBookings.some((b) => {
          const bStart = new Date(b.start_date);
          const bBufferEnd = new Date(b.buffer_end_date || b.end_date);
          return reqStart <= bBufferEnd && reqEnd >= bStart;
        });
        return !hasOverlap;
      });
    }
  }

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.brand.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        g.location_tag.toLowerCase().includes(q) ||
        (g.primary_color && g.primary_color.toLowerCase().includes(q)) ||
        (g.pattern && g.pattern.toLowerCase().includes(q))
    );
  }

  res.json(list);
});

app.get('/api/garments/:id', (req, res) => {
  const store = getStore();
  const garment = store.garments.find((g) => g.id === req.params.id);
  if (!garment) return res.status(404).json({ error: 'Garment not found' });

  res.json(enrichGarment(garment));
});

app.post('/api/garments', (req, res) => {
  const store = getStore();
  const authUser = getAuthenticatedUser(req);
  const {
    owner_id,
    title,
    description,
    category,
    primary_color,
    secondary_color,
    pattern,
    style_tags = [],
    condition_grade = 'LIKE_NEW',
    occasion,
    size,
    brand,
    retail_value,
    daily_rental_price,
    suggested_price,
    security_deposit,
    luxury_tier,
    care_instructions,
    location_tag,
    image_urls = []
  } = req.body;

  if (!title || !retail_value || !daily_rental_price) {
    return res.status(400).json({ error: 'Missing required garment listing fields' });
  }

  const effectiveOwner =
    authUser ||
    store.users.find((u) => u.id === owner_id) ||
    store.users[0];

  const numericRetail = Number(retail_value);
  const computedSuggested =
    Number(suggested_price) || Math.round(numericRetail * 0.055);

  const resolvedLuxuryTier =
    luxury_tier === 'HIGH_VALUE_CONCIERGE' || numericRetail >= 5000
      ? 'HIGH_VALUE_CONCIERGE'
      : 'STANDARD';

  if (
    resolvedLuxuryTier === 'HIGH_VALUE_CONCIERGE' &&
    effectiveOwner.kyc_status !== 'AADHAAR_KYC_VERIFIED'
  ) {
    return res.status(403).json({
      code: 'KYC_TIER_REQUIRED',
      required_kyc_status: 'AADHAAR_KYC_VERIFIED',
      current_kyc_status: effectiveOwner.kyc_status,
      error: `Listing HIGH_VALUE_CONCIERGE outfits (Retail ≥ ₹5,000) requires AADHAAR_KYC_VERIFIED status. Current status for ${effectiveOwner.full_name} is ${effectiveOwner.kyc_status}.`
    });
  }

  const newGarment = {
    id: generateId(),
    owner_id: effectiveOwner.id,
    title,
    description: description || 'Curated circular garment listed by DSU community member.',
    category: category || 'Lehenga',
    primary_color: primary_color || 'Emerald Green',
    secondary_color: secondary_color || 'Antique Gold',
    pattern: pattern || 'Embroidered',
    style_tags: Array.isArray(style_tags) ? style_tags : [],
    condition_grade,
    occasion: occasion || 'College Event',
    size: size || 'M',
    brand: brand || 'Independent Designer',
    retail_value: numericRetail,
    daily_rental_price: Number(daily_rental_price),
    suggested_price: computedSuggested,
    security_deposit: Number(security_deposit) || Math.round(numericRetail * 0.18),
    luxury_tier: resolvedLuxuryTier,
    care_instructions: care_instructions || 'Dry clean only via ReWear Verified Partner.',
    location_tag: location_tag || effectiveOwner.campus_or_area,
    status: 'AVAILABLE',
    created_at: new Date().toISOString()
  };

  store.garments.unshift(newGarment);

  const urls =
    image_urls.length > 0
      ? image_urls
      : [
          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=900&q=80'
        ];

  urls.forEach((url, index) => {
    store.garment_images.push({
      id: generateId(),
      garment_id: newGarment.id,
      image_url: url,
      display_order: index + 1
    });
  });

  store.lifecycle_events.push({
    id: generateId(),
    garment_id: newGarment.id,
    event_type: 'LISTED',
    description: `AI-Verified & Listed on ReWear Circular Wardrobe at ${newGarment.location_tag}.`,
    partner_name: 'ReWear DSU Campus Hub',
    estimated_water_saved_liters: 0,
    estimated_co2_saved_kg: 0,
    event_date: new Date().toISOString()
  });

  res.status(201).json(enrichGarment(newGarment));
});

/**
 * PATCH /api/garments/:id
 * Supports one-click AI Wardrobe Utilisation Assistant optimizations
 * (lowering daily_rental_price, adding natural-light photos, tagging for DSU events, or updating status).
 */
app.patch('/api/garments/:id', (req, res) => {
  const store = getStore();
  const garment = store.garments.find((g) => g.id === req.params.id);
  if (!garment) return res.status(404).json({ error: 'Garment not found' });

  const {
    daily_rental_price,
    occasion,
    status,
    style_tag_to_add,
    add_sample_photos
  } = req.body;

  if (daily_rental_price !== undefined) {
    garment.daily_rental_price = Number(daily_rental_price);
  }
  if (occasion) {
    garment.occasion = occasion;
  }
  if (status) {
    garment.status = status;
  }
  if (style_tag_to_add) {
    const existingTags = Array.isArray(garment.style_tags) ? garment.style_tags : [];
    if (!existingTags.includes(style_tag_to_add)) {
      garment.style_tags = [style_tag_to_add, ...existingTags];
    }
  }
  if (Array.isArray(add_sample_photos) && add_sample_photos.length > 0) {
    const currentImages = store.garment_images.filter((i) => i.garment_id === garment.id);
    add_sample_photos.forEach((url, idx) => {
      store.garment_images.push({
        id: generateId(),
        garment_id: garment.id,
        image_url: url,
        display_order: currentImages.length + idx + 1
      });
    });
  }

  res.json(enrichGarment(garment));
});

// ============================================================================
// 4. BOOKING STATE MACHINE, 1-DAY BUFFER, QR TOKEN & ESCROW PAYMENTS
// ============================================================================
app.get('/api/bookings', (req, res) => {
  const store = getStore();
  res.json(store.bookings.map(enrichBooking));
});

app.post('/api/bookings', (req, res) => {
  const store = getStore();
  const authUser = getAuthenticatedUser(req);
  const {
    garment_id,
    borrower_id,
    start_date,
    end_date,
    handoff_mode,
    payment_method = 'UPI_ESCROW_AUTOPAY'
  } = req.body;

  const garment = store.garments.find((g) => g.id === garment_id);
  if (!garment) return res.status(404).json({ error: 'Garment not found' });

  const borrower =
    authUser ||
    store.users.find((u) => u.id === borrower_id) ||
    store.users[1];

  if (
    garment.luxury_tier === 'HIGH_VALUE_CONCIERGE' &&
    borrower.kyc_status !== 'AADHAAR_KYC_VERIFIED'
  ) {
    return res.status(403).json({
      code: 'KYC_TIER_REQUIRED',
      required_kyc_status: 'AADHAAR_KYC_VERIFIED',
      current_kyc_status: borrower.kyc_status,
      error: `Renting HIGH_VALUE_CONCIERGE garments ("${garment.title}") requires AADHAAR_KYC_VERIFIED status. Your current status is ${borrower.kyc_status}. Please complete DigiLocker/Cashfree KYC in the Verification Center.`
    });
  }

  const start = new Date(start_date);
  const end = new Date(end_date);
  if (isNaN(start) || isNaN(end) || end < start) {
    return res.status(400).json({ error: 'Invalid rental start/end dates' });
  }

  // REQUIREMENT: Auto-block a 1-day post-return buffer (`buffer_end_date`) on the garment calendar
  const bufferEnd = new Date(end);
  bufferEnd.setDate(bufferEnd.getDate() + 1);

  const existingBookings = store.bookings.filter(
    (b) =>
      b.garment_id === garment.id &&
      !['CANCELLED', 'COMPLETED'].includes(b.booking_status)
  );
  const conflict = existingBookings.find((b) => {
    const bStart = new Date(b.start_date);
    const bBufEnd = new Date(b.buffer_end_date || b.end_date);
    return start <= bBufEnd && bufferEnd >= bStart;
  });
  if (conflict) {
    return res.status(409).json({
      error: `Selected dates overlap with an existing booking or 1-day post-return buffer (${conflict.start_date} to ${conflict.buffer_end_date}).`
    });
  }

  const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
  const rentalAmount = Number((days * Number(garment.daily_rental_price)).toFixed(2));
  const platformFee = Number((rentalAmount * 0.1).toFixed(2));
  const depositAmount = Number(garment.security_deposit);

  const effectiveHandoff =
    garment.luxury_tier === 'HIGH_VALUE_CONCIERGE'
      ? 'CONCIERGE_PICKUP'
      : handoff_mode || 'P2P_MEETUP';

  const pickupFee = effectiveHandoff === 'CONCIERGE_PICKUP' ? 180 : 0;
  const bookingId = generateId();
  const qrToken = signInspectionQrToken(bookingId, garment.id);

  const categoryImpact = calculateCheckoutCategoryImpact(garment.category, days);

  const newBooking = {
    id: bookingId,
    garment_id: garment.id,
    borrower_id: borrower.id,
    lender_id: garment.owner_id,
    start_date: start.toISOString().split('T')[0],
    end_date: end.toISOString().split('T')[0],
    buffer_end_date: bufferEnd.toISOString().split('T')[0],
    handoff_mode: effectiveHandoff,
    rental_amount: rentalAmount,
    platform_fee: platformFee,
    pickup_fee: pickupFee,
    deposit_amount: depositAmount,
    payment_method,
    payment_status: 'ESCROW_HELD',
    booking_status: 'REQUESTED',
    inspection_qr_token: qrToken,
    created_at: new Date().toISOString()
  };

  store.bookings.unshift(newBooking);

  store.lifecycle_events.unshift({
    id: generateId(),
    garment_id: garment.id,
    event_type: 'RENTED',
    description: `Booked by ${borrower.full_name} for ${days}-day rental via ${effectiveHandoff.replace('_', ' ')} (Razorpay Route Escrow Held • QR: ${qrToken}).`,
    partner_name:
      effectiveHandoff === 'CONCIERGE_PICKUP'
        ? 'ReWear Bengaluru Concierge'
        : 'DSU Campus Meetup Zone',
    estimated_water_saved_liters: categoryImpact.water_saved_liters,
    estimated_co2_saved_kg: categoryImpact.carbon_avoided_kg_co2e,
    event_date: new Date().toISOString()
  });

  res.status(201).json(enrichBooking(newBooking));
});

/**
 * PATCH /api/bookings/:id/status
 * Drives the Rental Booking State Machine:
 * REQUESTED -> APPROVED -> HANDED_OVER -> ACTIVE -> RETURNED -> COMPLETED (plus CANCELLED and DISPUTED)
 * Handles Razorpay Route Escrow release:
 * Releases (rental_amount - 10% commission) to lender and refunds deposit to borrower on COMPLETED.
 */
app.patch('/api/bookings/:id/status', (req, res) => {
  const store = getStore();
  const booking = store.bookings.find((b) => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const { booking_status, payment_status } = req.body;
  if (booking_status) booking.booking_status = booking_status;
  if (payment_status) booking.payment_status = payment_status;

  const garment = store.garments.find((g) => g.id === booking.garment_id);

  if (booking.booking_status === 'APPROVED') {
    booking.payment_status = 'ESCROW_HELD';
  } else if (
    booking.booking_status === 'HANDED_OVER' ||
    booking.booking_status === 'ACTIVE'
  ) {
    booking.payment_status = 'ESCROW_HELD';
    if (garment) garment.status = 'RENTED';
  } else if (booking.booking_status === 'RETURNED') {
    if (garment) garment.status = 'IN_CLEANING';
  } else if (booking.booking_status === 'DISPUTED') {
    booking.payment_status = 'DISPUTED';
    if (garment) garment.status = 'IN_CLEANING';
  } else if (booking.booking_status === 'COMPLETED') {
    booking.payment_status = 'RELEASED';
    if (garment) garment.status = 'AVAILABLE';
  } else if (booking.booking_status === 'CANCELLED') {
    booking.payment_status = 'REFUNDED';
    if (garment) garment.status = 'AVAILABLE';
  }

  res.json(enrichBooking(booking));
});

// ============================================================================
// 5, 6, 7, 8, 9. CONDITION LOGS, DISPUTES, LIFECYCLE, REVIEWS, PARTNERS
// ============================================================================
app.get('/api/condition-logs', (req, res) => {
  const store = getStore();
  const { booking_id } = req.query;
  const logs = booking_id
    ? store.condition_logs.filter((l) => l.booking_id === booking_id)
    : store.condition_logs;
  res.json(logs);
});

app.post('/api/condition-logs', async (req, res) => {
  const store = getStore();
  const {
    booking_id,
    garment_id,
    logged_by_user_id,
    stage,
    device_id = 'MOBILE-WEB-UPLOAD',
    led_lux_level = 820,
    photo_urls = [],
    checklist_json,
    detected_defects,
    condition_score,
    notes
  } = req.body;

  if (!booking_id || !stage) {
    return res
      .status(400)
      .json({ error: 'booking_id and stage are required' });
  }

  // If caller didn't pass detected_defects, run AI defect analyzer
  let aiRes = null;
  if (!detected_defects) {
    const hasFlag =
      checklist_json &&
      Object.values(checklist_json).some((v) => v === true);
    aiRes = await runAiConditionInspection({
      stage,
      image_base64_or_url: photo_urls[0] || '',
      led_lux_level,
      simulate_defect_mode: hasFlag ? 'DAMAGE_FLAGGED' : 'CLEAN',
      notes
    });
  }

  const normalizedChecklist = checklist_json
    ? {
        stains: Boolean(checklist_json.stains),
        tears: Boolean(checklist_json.tears),
        buttons_zippers: Boolean(checklist_json.buttons_zippers),
        odor: Boolean(checklist_json.odor),
        missing_items: Boolean(checklist_json.missing_items)
      }
    : aiRes.checklist_json;

  const newLog = {
    id: generateId(),
    booking_id,
    garment_id:
      garment_id || store.bookings.find((b) => b.id === booking_id)?.garment_id,
    logged_by_user_id: logged_by_user_id || store.users[0].id,
    stage,
    device_id,
    led_lux_level: Number(led_lux_level) || 820,
    condition_score:
      condition_score !== undefined ? Number(condition_score) : aiRes.condition_score,
    detected_defects: detected_defects || aiRes.detected_defects,
    photo_urls: photo_urls.length
      ? photo_urls
      : [
          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80'
        ],
    checklist_json: normalizedChecklist,
    notes: notes || aiRes?.summary || '5-point digital twin inspection logged.',
    created_at: new Date().toISOString()
  };

  store.condition_logs.push(newLog);
  res.status(201).json(newLog);
});

app.get('/api/disputes', (req, res) => {
  const store = getStore();
  const enriched = store.disputes.map((d) => {
    const booking = store.bookings.find((b) => b.id === d.booking_id);
    const raised_by = store.users.find((u) => u.id === d.raised_by_id);
    return {
      ...d,
      deposit_deduction_amount: Number(d.deposit_deduction_amount),
      booking: booking ? enrichBooking(booking) : null,
      raised_by
    };
  });
  res.json(enriched);
});

app.post('/api/disputes', (req, res) => {
  const store = getStore();
  const {
    booking_id,
    raised_by_id,
    reason,
    evidence_photos = [],
    deposit_deduction_amount
  } = req.body;

  const booking = store.bookings.find((b) => b.id === booking_id);
  if (!booking) return res.status(404).json({ error: 'Associated booking not found' });

  booking.payment_status = 'DISPUTED';
  booking.booking_status = 'DISPUTED';

  const newDispute = {
    id: generateId(),
    booking_id,
    raised_by_id: raised_by_id || booking.lender_id,
    reason,
    evidence_photos,
    deposit_deduction_amount: Number(deposit_deduction_amount || 350),
    resolution_status: 'OPEN',
    admin_notes:
      'Escrow frozen automatically. Comparing PRE_HANDOFF and AT_RETURN condition logs.'
  };

  store.disputes.unshift(newDispute);
  res.status(201).json(newDispute);
});

app.patch('/api/disputes/:id/resolve', (req, res) => {
  const store = getStore();
  const dispute = store.disputes.find((d) => d.id === req.params.id);
  if (!dispute) return res.status(404).json({ error: 'Dispute not found' });

  const { resolution_status, deposit_deduction_amount, admin_notes } = req.body;
  if (resolution_status) dispute.resolution_status = resolution_status;
  if (deposit_deduction_amount !== undefined) {
    dispute.deposit_deduction_amount = Number(deposit_deduction_amount);
  }
  if (admin_notes) dispute.admin_notes = admin_notes;

  const booking = store.bookings.find((b) => b.id === dispute.booking_id);
  if (dispute.resolution_status === 'RESOLVED' && booking) {
    booking.payment_status = 'RELEASED';
    booking.booking_status = 'COMPLETED';
    const garment = store.garments.find((g) => g.id === booking.garment_id);
    if (garment) garment.status = 'AVAILABLE';
  }

  res.json({
    ...dispute,
    settlement: booking
      ? calculateEscrowSettlement(booking, dispute.deposit_deduction_amount)
      : null
  });
});

app.get('/api/lifecycle-events', (req, res) => {
  const store = getStore();
  const { garment_id } = req.query;
  const list = garment_id
    ? store.lifecycle_events.filter((e) => e.garment_id === garment_id)
    : store.lifecycle_events;
  res.json(list);
});

/**
 * POST /api/lifecycle-events
 * Logs a new circular passport event (LISTED, RENTED, CLEANED, REPAIRED, RESOLD, DONATED)
 * from the End-of-Life Advisor or Local Partner booking trigger.
 */
app.post('/api/lifecycle-events', (req, res) => {
  const store = getStore();
  const {
    garment_id,
    event_type = 'CLEANED',
    description,
    partner_name,
    estimated_water_saved_liters = 1850,
    estimated_co2_saved_kg = 11.2
  } = req.body;

  if (!garment_id) {
    return res.status(400).json({ error: 'garment_id is required' });
  }

  const garment = store.garments.find((g) => g.id === garment_id);
  if (garment) {
    if (event_type === 'RESOLD' || event_type === 'DONATED') {
      garment.status = 'RETIRED';
    } else if (event_type === 'CLEANED' || event_type === 'REPAIRED') {
      garment.status = 'AVAILABLE';
    }
  }

  const newEvent = {
    id: generateId(),
    garment_id,
    event_type,
    description:
      description ||
      `${event_type} service scheduled via ${partner_name || 'Verified Bengaluru Partner'}.`,
    partner_name: partner_name || 'ReWear Verified Care Partner',
    estimated_water_saved_liters: Number(estimated_water_saved_liters),
    estimated_co2_saved_kg: Number(estimated_co2_saved_kg),
    event_date: new Date().toISOString()
  };

  store.lifecycle_events.unshift(newEvent);
  res.status(201).json({
    event: newEvent,
    garment: garment ? enrichGarment(garment) : null
  });
});

app.get('/api/reviews', (req, res) => {
  const store = getStore();
  const { user_id } = req.query;
  let reviews = store.reviews.map((r) => ({
    ...r,
    reviewer: store.users.find((u) => u.id === r.reviewer_id) || null,
    reviewee: store.users.find((u) => u.id === r.reviewee_id) || null
  }));
  if (user_id) {
    reviews = reviews.filter((r) => r.reviewee_id === user_id);
  }
  res.json(reviews);
});

/**
 * POST /api/reviews
 * Submits a dual-sided post-rental rating (1-5 stars + quick tags + comment)
 * for either LENDER or BORROWER and recalculates the target user's rating.
 */
app.post('/api/reviews', (req, res) => {
  const store = getStore();
  const {
    booking_id,
    reviewer_id,
    reviewee_id,
    role_reviewed = 'LENDER',
    rating = 5,
    quick_tags = [],
    comment = ''
  } = req.body;

  const numRating = Math.min(5, Math.max(1, Number(rating) || 5));
  const tagPrefix =
    Array.isArray(quick_tags) && quick_tags.length > 0
      ? `[${quick_tags.join(' • ')}] `
      : '';

  const newReview = {
    id: generateId(),
    booking_id: booking_id || store.bookings[0]?.id,
    reviewer_id: reviewer_id || store.users[0]?.id,
    reviewee_id: reviewee_id || store.users[1]?.id,
    role_reviewed,
    rating: numRating,
    quick_tags,
    comment: `${tagPrefix}${comment || 'Smooth circular rental experience at DSU!'}`.trim(),
    created_at: new Date().toISOString()
  };

  store.reviews.unshift(newReview);

  // Recalculate reviewee's lender_rating or borrower_rating
  const reviewee = store.users.find((u) => u.id === newReview.reviewee_id);
  if (reviewee) {
    const roleReviews = store.reviews.filter(
      (r) =>
        r.reviewee_id === reviewee.id && r.role_reviewed === role_reviewed
    );
    const avg =
      roleReviews.reduce((s, r) => s + Number(r.rating), 0) /
      Math.max(1, roleReviews.length);

    if (role_reviewed === 'LENDER') {
      reviewee.lender_rating = Number(avg.toFixed(2));
    } else {
      reviewee.borrower_rating = Number(avg.toFixed(2));
    }
    reviewee.total_reviews = Number(reviewee.total_reviews || 0) + 1;
  }

  res.status(201).json({
    ...newReview,
    reviewer: store.users.find((u) => u.id === newReview.reviewer_id) || null,
    reviewee
  });
});

app.get('/api/local-partners', (req, res) => {
  const store = getStore();
  const { service_type, area } = req.query;
  let partners = store.local_partners;

  if (service_type && service_type !== 'ALL') {
    partners = partners.filter((p) => p.service_type === service_type);
  }
  if (area && area !== 'ALL') {
    partners = partners.filter((p) =>
      p.area.toLowerCase().includes(area.toLowerCase())
    );
  }

  res.json(partners);
});

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 ReWear Backend API running at http://localhost:${PORT}`);
  });
});
