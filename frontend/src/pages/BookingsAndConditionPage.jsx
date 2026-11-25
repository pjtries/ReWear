import React, { useState } from 'react';
import {
  ClipboardCheck,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  QrCode,
  Camera,
  Lock,
  ArrowRight,
  Sun,
  IndianRupee,
  SplitSquareVertical
} from 'lucide-react';
import QrCodeBadge from '../components/QrCodeBadge.jsx';

const BOOKING_STATE_FLOW = [
  'REQUESTED',
  'APPROVED',
  'HANDED_OVER',
  'ACTIVE',
  'RETURNED',
  'COMPLETED'
];

export default function BookingsAndConditionPage({
  bookings,
  disputes,
  onUpdateBookingStatus,
  onSimulateEsp32Scan,
  onRunMobileAiInspection,
  onResolveDispute
}) {
  const [selectedBookingId, setSelectedBookingId] = useState(
    bookings[1]?.id || bookings[0]?.id || ''
  );

  // ESP32-CAM Hardware Simulator Controls
  const [espStage, setEspStage] = useState('PRE_HANDOFF');
  const [espDeviceId, setEspDeviceId] = useState('ESP32-CAM-DSU-HAROHALLI-01');
  const [espLux, setEspLux] = useState(865);
  const [espDefectMode, setEspDefectMode] = useState('CLEAN'); // 'CLEAN' | 'MINOR_DEFECT' | 'DAMAGE_FLAGGED'
  const [espFeedback, setEspFeedback] = useState(null);
  const [isScanningEsp, setIsScanningEsp] = useState(false);

  // Mobile Browser Upload AI Defect Check Controls
  const [mobileStage, setMobileStage] = useState('AT_RETURN');
  const [mobilePhotoUrl, setMobilePhotoUrl] = useState(
    'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=80'
  );
  const [mobileNotes, setMobileNotes] = useState('');
  const [mobileFeedback, setMobileFeedback] = useState(null);

  // Dispute Deposit Deduction Calculator State
  const [customDeduction, setCustomDeduction] = useState(450);

  const selectedBooking =
    bookings.find((b) => b.id === selectedBookingId) || bookings[0];

  if (!selectedBooking) return null;

  const logs = selectedBooking.condition_logs || [];
  const preHandoffLog =
    logs.find((l) => l.stage === 'PRE_HANDOFF') || logs[0] || null;
  const atReturnLog =
    logs.find((l) => l.stage === 'AT_RETURN' || l.stage === 'DISPUTE_EVIDENCE') ||
    logs[1] ||
    null;

  // Trigger POST /api/hardware/esp32-inspection
  const handleSimulateEsp32 = async () => {
    setIsScanningEsp(true);
    setEspFeedback(null);
    try {
      const res = await onSimulateEsp32Scan({
        qr_token: selectedBooking.inspection_qr_token,
        device_id: espDeviceId,
        stage: espStage,
        led_lux_level: Number(espLux),
        simulate_defect_mode: espDefectMode,
        image_base64_or_url:
          selectedBooking.garment?.images?.[0]?.image_url ||
          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
        captured_timestamp: new Date().toISOString()
      });
      setEspFeedback(res);
    } finally {
      setIsScanningEsp(false);
    }
  };

  // Trigger POST /api/ai/inspect-condition from Mobile Browser
  const handleMobileInspect = async (e) => {
    e.preventDefault();
    const res = await onRunMobileAiInspection({
      booking_id: selectedBooking.id,
      stage: mobileStage,
      image_base64_or_url: mobilePhotoUrl,
      notes: mobileNotes,
      simulate_defect_mode:
        mobileNotes.toLowerCase().includes('stain') ||
        mobileNotes.toLowerCase().includes('tear')
          ? 'DAMAGE_FLAGGED'
          : 'CLEAN',
      save_to_log: true
    });
    setMobileFeedback(res);
    setMobileNotes('');
  };

  // Escrow Settlement math for selected booking
  const rentalAmount = Number(selectedBooking.rental_amount || 1560);
  const pickupFee =
    selectedBooking.handoff_mode === 'CONCIERGE_PICKUP'
      ? Number(selectedBooking.pickup_fee ?? 180)
      : 0;
  const depositAmount = Number(selectedBooking.deposit_amount || 2200);
  const commission10Pct = Math.round(rentalAmount * 0.1);
  const effectiveDeduction =
    selectedBooking.booking_status === 'DISPUTED' ||
    selectedBooking.payment_status === 'DISPUTED'
      ? Math.min(depositAmount, Number(customDeduction || 0))
      : 0;
  const lenderFinalRelease = rentalAmount - commission10Pct + effectiveDeduction;
  const borrowerFinalRefund = depositAmount - effectiveDeduction;

  return (
    <div className="space-y-8">
      {/* Top Editorial Banner */}
      <section className="editorial-card-peach p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-3xl space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="editorial-badge-teal">
                Booking State Machine & Razorpay Route Escrow
              </span>
              <span className="editorial-badge-terracotta">
                <Cpu className="w-3.5 h-3.5" />
                ESP32-CAM + Controlled LED Ring Station API
              </span>
            </div>
            <h1 className="font-display font-bold text-3xl text-[#000000]">
              QR-Linked Hardware Condition Inspection & Dispute Engine
            </h1>
            <p className="text-xs sm:text-sm">
              Every booking generates a signed `inspection_qr_token`, enforces a 1-day post-return calendar buffer (`buffer_end_date`), and compares timestamped `PRE_HANDOFF` vs `AT_RETURN` AI defect bounding boxes before releasing escrow.
            </p>
          </div>

          {/* Booking Selector */}
          <div className="bg-[#FFFFFF] border border-[#000000] p-3 shadow-editorial-sm">
            <label className="block text-[10px] font-bold uppercase mb-1">
              Active Booking Transaction:
            </label>
            <select
              value={selectedBooking.id}
              onChange={(e) => {
                setSelectedBookingId(e.target.value);
                setEspFeedback(null);
                setMobileFeedback(null);
              }}
              className="editorial-input text-xs font-bold bg-[#FFD5C2]"
            >
              {bookings.map((b) => (
                <option key={b.id} value={b.id}>
                  #{b.id.slice(-6)} — {b.garment?.title?.slice(0, 32)} ({b.booking_status})
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* 1. BOOKING STATE MACHINE STEPPER & SIGNED QR CODE CARD */}
      <section className="editorial-card p-6 bg-[#FFFFFF] space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#000000] pb-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="editorial-badge-teal">
                Booking #{selectedBooking.id.slice(-8)}
              </span>
              <span className="editorial-badge-peach font-mono">
                Handoff: {selectedBooking.handoff_mode}
              </span>
              <span
                className={
                  selectedBooking.payment_status === 'DISPUTED' ||
                  selectedBooking.booking_status === 'DISPUTED'
                    ? 'editorial-badge-terracotta'
                    : 'editorial-badge-teal'
                }
              >
                <Lock className="w-3 h-3" />
                Escrow: {selectedBooking.payment_status}
              </span>
            </div>
            <h2 className="font-display font-bold text-2xl">
              {selectedBooking.garment?.title || 'Circular Garment Rental'}
            </h2>
            <div className="text-xs font-mono">
              Rental Window: <strong>{selectedBooking.start_date}</strong> →{' '}
              <strong>{selectedBooking.end_date}</strong> •{' '}
              <span className="text-[#C8553D] font-bold">
                +1d Post-Return Buffer Locked Until: {selectedBooking.buffer_end_date}
              </span>
            </div>
          </div>

          {/* Scannable Signed QR Code Badge */}
          <div className="flex items-center gap-3 bg-[#FFD5C2] border border-[#000000] p-3">
            <div className="text-xs max-w-[170px] space-y-1">
              <div className="font-bold uppercase flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5 text-[#588B8B]" />
                <span>Inspection QR Token</span>
              </div>
              <p className="text-[11px] leading-snug">
                Scan at DSU ESP32-CAM LED Ring Booth to link `PRE_HANDOFF` & `AT_RETURN` captures.
              </p>
            </div>
            <QrCodeBadge token={selectedBooking.inspection_qr_token} size={86} />
          </div>
        </div>

        {/* Interactive State Machine Stepper */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase">
            <span>
              Interactive Booking State Machine (Click any state to transition):
            </span>
            <span className="font-mono">
              Current State: {selectedBooking.booking_status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {[...BOOKING_STATE_FLOW, 'DISPUTED', 'CANCELLED'].map((st) => {
              const isCurrent = selectedBooking.booking_status === st;
              const isAlertState = st === 'DISPUTED' || st === 'CANCELLED';
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() =>
                    onUpdateBookingStatus(selectedBooking.id, {
                      booking_status: st
                    })
                  }
                  className={`py-2.5 px-2 text-[11px] font-mono font-bold border border-[#000000] transition-all ${
                    isCurrent
                      ? isAlertState
                        ? 'bg-[#C8553D] text-[#FFFFFF] shadow-editorial-sm'
                        : 'bg-[#F28F3B] text-[#000000] shadow-editorial-sm'
                      : 'bg-[#FFD5C2] text-[#000000] hover:bg-[#FFFFFF]'
                  }`}
                >
                  {isCurrent ? `● ${st}` : st}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. ESP32-CAM HARDWARE SIMULATOR + MOBILE AI DEFECT SCANNER */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: ESP32-CAM + Controlled LED Ring Inspection Station Simulator */}
        <div className="lg:col-span-7 editorial-card p-6 bg-[#FFFFFF] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#000000] pb-3">
            <div>
              <span className="editorial-badge-teal">
                POST /api/hardware/esp32-inspection
              </span>
              <h3 className="font-display font-bold text-xl mt-1 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#588B8B]" />
                <span>ESP32-CAM + Controlled LED Ring Station Simulator</span>
              </h3>
            </div>
            <span className="editorial-badge-peach font-mono">
              QR: {selectedBooking.inspection_qr_token?.slice(0, 18)}...
            </span>
          </div>

          <p className="text-xs leading-relaxed">
            Simulates the physical ESP32-CAM station at the DSU Campus Hub or Concierge Desk. Validates the booking’s signed `qr_token`, verifies LED ring illumination lux, runs AI Vision Defect Detection (`stains`, `tears`, `loose threads`, `missing buttons`), and commits a timestamped record to `condition_logs`.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FFD5C2] border border-[#000000] p-4">
            <div>
              <label className="block text-[11px] font-bold uppercase mb-1">
                ESP32 Station Device ID
              </label>
              <select
                value={espDeviceId}
                onChange={(e) => setEspDeviceId(e.target.value)}
                className="editorial-input text-xs font-mono"
              >
                <option value="ESP32-CAM-DSU-HAROHALLI-01">
                  ESP32-CAM-DSU-HAROHALLI-01 (Main Campus)
                </option>
                <option value="ESP32-CAM-DSU-KUDLUGATE-02">
                  ESP32-CAM-DSU-KUDLUGATE-02 (Innovation Campus)
                </option>
                <option value="ESP32-CAM-JAYANAGAR-CONCIERGE-03">
                  ESP32-CAM-JAYANAGAR-CONCIERGE-03
                </option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase mb-1">
                Inspection Stage (`stage`)
              </label>
              <select
                value={espStage}
                onChange={(e) => setEspStage(e.target.value)}
                className="editorial-input text-xs font-bold"
              >
                <option value="PRE_HANDOFF">
                  PRE_HANDOFF (Baseline Scan Before Pickup)
                </option>
                <option value="AT_RETURN">
                  AT_RETURN (Post-Rental Verification Scan)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase mb-1">
                Controlled LED Ring Illumination (`led_lux_level`)
              </label>
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-[#F28F3B] shrink-0" />
                <input
                  type="number"
                  value={espLux}
                  onChange={(e) => setEspLux(e.target.value)}
                  className="editorial-input font-mono text-xs"
                  min="400"
                  max="1200"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase mb-1">
                Simulated Optical Sample Condition
              </label>
              <select
                value={espDefectMode}
                onChange={(e) => setEspDefectMode(e.target.value)}
                className="editorial-input text-xs"
              >
                <option value="CLEAN">
                  Clean Scan (Score 98/100 • 0 Defects)
                </option>
                <option value="MINOR_DEFECT">
                  Minor Thread/Button Anomaly (Score 81/100)
                </option>
                <option value="DAMAGE_FLAGGED">
                  Stain + Zipper Snag Detected (Score 64/100 • Auto-Dispute)
                </option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSimulateEsp32}
            disabled={isScanningEsp}
            className="editorial-btn-primary w-full text-sm"
          >
            <Cpu className={`w-4 h-4 ${isScanningEsp ? 'animate-spin' : ''}`} />
            <span>
              {isScanningEsp
                ? 'Capturing ESP32-CAM Frame & Running AI Defect Model...'
                : 'Simulate ESP32 Hardware Scan (QR-Linked)'}
            </span>
          </button>

          {espFeedback && (
            <div
              className={`p-4 border border-[#000000] text-xs space-y-1.5 ${
                espFeedback.ai_inspection?.passed_clean
                  ? 'bg-[#588B8B] text-[#FFFFFF]'
                  : 'bg-[#C8553D] text-[#FFFFFF]'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-sm">
                <span>{espFeedback.message}</span>
                <span className="font-mono bg-[#FFD5C2] text-[#000000] px-2 py-0.5 border border-[#000000]">
                  Score: {espFeedback.ai_inspection?.condition_score}/100
                </span>
              </div>
              <p>{espFeedback.ai_inspection?.summary}</p>
            </div>
          )}
        </div>

        {/* Right 5 Cols: Mobile Browser AI Condition Assistant (Fallback when ESP32 not used) */}
        <div className="lg:col-span-5 editorial-card p-6 bg-[#FFFFFF] space-y-4">
          <div className="border-b border-[#000000] pb-3">
            <span className="editorial-badge-peach">
              POST /api/ai/inspect-condition
            </span>
            <h3 className="font-display font-bold text-xl mt-1 flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#588B8B]" />
              <span>Mobile Web AI Condition Assistant</span>
            </h3>
            <p className="text-xs mt-0.5">
              For P2P campus gate meetups without an ESP32 booth, upload a smartphone photo to run the same AI Defect Detection model.
            </p>
          </div>

          <form onSubmit={handleMobileInspect} className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">
                Handoff Stage
              </label>
              <select
                value={mobileStage}
                onChange={(e) => setMobileStage(e.target.value)}
                className="editorial-input text-xs"
              >
                <option value="PRE_HANDOFF">PRE_HANDOFF</option>
                <option value="AT_RETURN">AT_RETURN</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1">
                Garment Photo URL
              </label>
              <input
                type="url"
                value={mobilePhotoUrl}
                onChange={(e) => setMobilePhotoUrl(e.target.value)}
                className="editorial-input font-mono text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1">
                Condition Notes (Type “stain” or “tear” to trigger AI bounding boxes)
              </label>
              <input
                type="text"
                value={mobileNotes}
                onChange={(e) => setMobileNotes(e.target.value)}
                placeholder="e.g. Clean return at DSU Gate, or beverage stain on hem..."
                className="editorial-input text-xs"
              />
            </div>

            <button type="submit" className="editorial-btn-teal w-full text-xs">
              <Camera className="w-4 h-4" />
              <span>Run Mobile AI Condition Scan & Log</span>
            </button>
          </form>

          {mobileFeedback && (
            <div className="p-3 bg-[#FFD5C2] border border-[#000000] text-xs space-y-1">
              <div className="font-bold">
                Mobile AI Score: {mobileFeedback.condition_score}/100
              </div>
              <p>{mobileFeedback.summary}</p>
            </div>
          )}
        </div>
      </section>

      {/* 3. SIDE-BY-SIDE DISPUTE RESOLUTION ENGINE (PRE_HANDOFF vs AT_RETURN + AI BOUNDING BOXES) */}
      <section className="editorial-card p-6 bg-[#FFFFFF] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#000000] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="editorial-badge-terracotta">
                <SplitSquareVertical className="w-3.5 h-3.5" />
                Side-by-Side Dispute Resolution & Escrow Deduction Engine
              </span>
              <span className="font-mono text-xs font-bold">
                Booking #{selectedBooking.id.slice(-8)}
              </span>
            </div>
            <h2 className="font-display font-bold text-2xl mt-1">
              Timestamped `PRE_HANDOFF` vs `AT_RETURN` Optical Comparison
            </h2>
          </div>

          <div className="bg-[#FFD5C2] border border-[#000000] px-4 py-2 text-xs font-mono font-bold">
            Score Delta:{' '}
            {preHandoffLog?.condition_score ?? 99}/100 →{' '}
            <span
              className={
                (atReturnLog?.condition_score ?? 98) < 85
                  ? 'text-[#C8553D]'
                  : 'text-[#588B8B]'
              }
            >
              {atReturnLog?.condition_score ?? 98}/100
            </span>
          </div>
        </div>

        {/* Side-by-Side Comparison Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel A: PRE_HANDOFF Baseline */}
          <div className="border border-[#000000] bg-[#FFD5C2] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="editorial-badge-teal">
                1. PRE_HANDOFF Baseline Capture
              </span>
              <span className="font-mono text-xs font-bold bg-[#FFFFFF] px-2 py-0.5 border border-[#000000]">
                Score: {preHandoffLog?.condition_score ?? 99}/100
              </span>
            </div>

            <div className="relative h-64 w-full border border-[#000000] overflow-hidden bg-[#FFFFFF]">
              <img
                src={
                  preHandoffLog?.photo_urls?.[0] ||
                  selectedBooking.garment?.images?.[0]?.image_url ||
                  'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80'
                }
                alt="Pre-handoff baseline"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-[#588B8B] text-[#FFFFFF] text-[11px] font-mono font-bold px-2.5 py-1 border border-[#000000]">
                ✓ 0 Defects • {preHandoffLog?.device_id || 'ESP32-CAM-DSU-01'} (
                {preHandoffLog?.led_lux_level || 860} lux)
              </div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#000000] p-3 text-xs space-y-1">
              <div className="font-mono text-[11px] font-bold">
                Timestamp:{' '}
                {preHandoffLog?.created_at
                  ? new Date(preHandoffLog.created_at).toLocaleString('en-IN')
                  : '2026-11-18 11:00 IST'}
              </div>
              <p>{preHandoffLog?.notes || 'Baseline verified clean prior to handoff.'}</p>
            </div>
          </div>

          {/* Panel B: AT_RETURN Capture with #C8553D AI Bounding Boxes */}
          <div className="border border-[#000000] bg-[#FFD5C2] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span
                className={
                  (atReturnLog?.detected_defects || []).length > 0
                    ? 'editorial-badge-terracotta'
                    : 'editorial-badge-teal'
                }
              >
                2. AT_RETURN Inspection Capture
              </span>
              <span className="font-mono text-xs font-bold bg-[#FFFFFF] px-2 py-0.5 border border-[#000000]">
                Score: {atReturnLog?.condition_score ?? 98}/100
              </span>
            </div>

            <div className="relative h-64 w-full border border-[#000000] overflow-hidden bg-[#FFFFFF]">
              <img
                src={
                  atReturnLog?.photo_urls?.[0] ||
                  selectedBooking.garment?.images?.[0]?.image_url ||
                  'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=80'
                }
                alt="At return inspection"
                className="w-full h-full object-cover"
              />

              {/* Render AI Defect Bounding Boxes in #C8553D Terracotta Red */}
              {(atReturnLog?.detected_defects || []).map((def) => (
                <div
                  key={def.id}
                  style={{
                    left: `${def.bbox?.x || 30}%`,
                    top: `${def.bbox?.y || 55}%`,
                    width: `${def.bbox?.width || 24}%`,
                    height: `${def.bbox?.height || 18}%`
                  }}
                  className="absolute border-2 border-[#C8553D] bg-[#C8553D]/25 flex items-start justify-start p-1"
                >
                  <span className="bg-[#C8553D] text-[#FFFFFF] text-[9px] font-mono font-bold px-1.5 py-0.5 border border-[#000000] whitespace-nowrap">
                    ⚠ {def.type} (₹{def.estimated_repair_cost_inr})
                  </span>
                </div>
              ))}

              <div
                className={`absolute bottom-2 left-2 text-[#FFFFFF] text-[11px] font-mono font-bold px-2.5 py-1 border border-[#000000] ${
                  (atReturnLog?.detected_defects || []).length > 0
                    ? 'bg-[#C8553D]'
                    : 'bg-[#588B8B]'
                }`}
              >
                {(atReturnLog?.detected_defects || []).length > 0
                  ? `⚠ ${atReturnLog.detected_defects.length} AI Defects Bounding-Boxed`
                  : '✓ Clean Return Match (0 Defects)'}
              </div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#000000] p-3 text-xs space-y-1.5">
              <div className="font-mono text-[11px] font-bold">
                Timestamp:{' '}
                {atReturnLog?.created_at
                  ? new Date(atReturnLog.created_at).toLocaleString('en-IN')
                  : 'Awaiting or Clean Return'}
              </div>
              <p>{atReturnLog?.notes || 'No return anomalies flagged.'}</p>

              {(atReturnLog?.detected_defects || []).length > 0 && (
                <div className="pt-1 space-y-1">
                  {atReturnLog.detected_defects.map((def) => (
                    <div
                      key={def.id}
                      className="bg-[#C8553D] text-[#FFFFFF] px-2.5 py-1 border border-[#000000] flex items-center justify-between font-mono text-[11px]"
                    >
                      <span>
                        {def.label} ({Math.round(def.confidence * 100)}% conf)
                      </span>
                      <span className="font-bold">
                        +₹{def.estimated_repair_cost_inr}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DEPOSIT DEDUCTION & RAZORPAY ROUTE ESCROW SETTLEMENT CALCULATOR */}
        <div className="border border-[#000000] bg-[#FFD5C2] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#000000] pb-3">
            <div>
              <span className="editorial-badge-teal">
                Razorpay Route Escrow Settlement & Deduction Calculator
              </span>
              <h3 className="font-display font-bold text-lg mt-1">
                Automated Split: Lender Payout (Rent - 10%) + Borrower Deposit Refund
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase">
                Repair Deduction (₹):
              </label>
              <input
                type="number"
                value={customDeduction}
                onChange={(e) => setCustomDeduction(e.target.value)}
                min="0"
                max={depositAmount}
                className="editorial-input w-28 font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-[#FFFFFF] border border-[#000000] p-3">
              <span className="block text-[10px] font-bold uppercase text-[#588B8B]">
                Total Escrow Held
              </span>
              <span className="font-display font-bold text-xl">
                ₹{(rentalAmount + pickupFee + depositAmount).toLocaleString('en-IN')}
              </span>
              <span className="block text-[10px] font-mono">
                Rent ₹{rentalAmount} + Pickup ₹{pickupFee} + Dep ₹{depositAmount}
              </span>
            </div>

            <div className="bg-[#FFFFFF] border border-[#000000] p-3">
              <span className="block text-[10px] font-bold uppercase text-[#588B8B]">
                Platform Fee (10%) + Pickup
              </span>
              <span className="font-display font-bold text-xl">
                ₹{(commission10Pct + pickupFee).toLocaleString('en-IN')}
              </span>
              <span className="block text-[10px] font-mono">
                10% Commission: ₹{commission10Pct}
              </span>
            </div>

            <div className="bg-[#FFFFFF] border border-[#000000] p-3">
              <span className="block text-[10px] font-bold uppercase text-[#588B8B]">
                Lender Net Payout Released
              </span>
              <span className="font-display font-bold text-xl text-[#588B8B]">
                ₹{lenderFinalRelease.toLocaleString('en-IN')}
              </span>
              <span className="block text-[10px] font-mono">
                (Rent - 10%) + ₹{effectiveDeduction} Repair Credit
              </span>
            </div>

            <div className="bg-[#FFFFFF] border border-[#000000] p-3">
              <span className="block text-[10px] font-bold uppercase text-[#C8553D]">
                Borrower Deposit Refund
              </span>
              <span className="font-display font-bold text-xl">
                ₹{borrowerFinalRefund.toLocaleString('en-IN')}
              </span>
              <span className="block text-[10px] font-mono">
                ₹{depositAmount} Deposit - ₹{effectiveDeduction} Deduction
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="text-xs font-medium">
              Click to finalize condition verification, settle Razorpay Route escrow split, and transition booking to <strong>COMPLETED</strong>:
            </div>
            <div className="flex flex-wrap gap-2">
              {disputes
                .filter((d) => d.booking_id === selectedBooking.id)
                .map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() =>
                      onResolveDispute(d.id, Number(customDeduction || 0))
                    }
                    className="editorial-btn-alert text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Settle Dispute (Deduct ₹{customDeduction}) & Release Escrow
                    </span>
                  </button>
                ))}
              <button
                type="button"
                onClick={() =>
                  onUpdateBookingStatus(selectedBooking.id, {
                    booking_status: 'COMPLETED',
                    payment_status: 'RELEASED'
                  })
                }
                className="editorial-btn-primary text-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Clean Return & Release Full Escrow (`COMPLETED`)</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
