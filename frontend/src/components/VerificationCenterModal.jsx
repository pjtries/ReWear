import React, { useState } from 'react';
import {
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Lock,
  CheckCircle2,
  AlertTriangle,
  X,
  KeyRound
} from 'lucide-react';

const VERIFICATION_TIERS = [
  {
    tier: 'UNVERIFIED',
    number: 'Tier 1',
    title: 'Basic Account (UNVERIFIED)',
    badgeClass: 'editorial-badge-terracotta',
    perks: [
      'Browse DSU Harohalli, Kudlu Gate & Bengaluru closets',
      'Save garments & calculate circular ecological impact',
      'Cannot rent or list HIGH_VALUE_CONCIERGE designer pieces'
    ]
  },
  {
    tier: 'STUDENT_VERIFIED',
    number: 'Tier 2',
    title: 'DSU Student Verified (STUDENT_VERIFIED)',
    badgeClass: 'editorial-badge-peach',
    perks: [
      'Instant unlock via @dsu.edu.in email or DSU Smart ID SRN',
      'Rent & list STANDARD tier outfits on campus with zero courier fee (P2P Meetup)',
      'Displays DSU Campus Trust Badge on Lender & Borrower profile'
    ]
  },
  {
    tier: 'AADHAAR_KYC_VERIFIED',
    number: 'Tier 3',
    title: 'Aadhaar KYC Verified (AADHAAR_KYC_VERIFIED)',
    badgeClass: 'editorial-badge-teal',
    perks: [
      'Unlocks listing & renting HIGH_VALUE_CONCIERGE outfits (Retail ≥ ₹18,000)',
      'Tokenized 3rd-party DigiLocker / Cashfree handshake (Zero raw Aadhaar digits or card images stored)',
      'Priority Escrow release & insured doorstep Concierge Pickup'
    ]
  }
];

export default function VerificationCenterModal({
  isOpen,
  onClose,
  activeUser,
  onVerifyStudent,
  onVerifyAadhaarKyc
}) {
  const [dsuEmail, setDsuEmail] = useState(
    activeUser?.email?.endsWith('@dsu.edu.in')
      ? activeUser.email
      : 'rohan.kulkarni.mba@dsu.edu.in'
  );
  const [studentSrn, setStudentSrn] = useState('ENG24DSU0198');
  const [provider, setProvider] = useState('DIGILOCKER_OAUTH');
  const [last4Preview, setLast4Preview] = useState('4829');
  const [otpCode, setOtpCode] = useState('829410');
  const [rawTestInput, setRawTestInput] = useState('');
  const [feedback, setFeedback] = useState(null);

  if (!isOpen || !activeUser) return null;

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    const res = await onVerifyStudent(activeUser.id, {
      dsu_email: dsuEmail,
      student_srn: studentSrn
    });
    if (res?.error) {
      setFeedback({ type: 'error', text: res.error });
    } else {
      setFeedback({
        type: 'success',
        text:
          res.message ||
          `Instant STUDENT_VERIFIED status unlocked! Token: ${res.user?.kyc_reference_token}`
      });
    }
  };

  const handleAadhaarSubmit = async (e) => {
    e.preventDefault();
    const res = await onVerifyAadhaarKyc(activeUser.id, {
      provider,
      otp_code: otpCode,
      raw_aadhaar_input: rawTestInput.trim() || undefined
    });
    if (res?.error) {
      setFeedback({ type: 'error', text: res.error });
    } else {
      setFeedback({
        type: 'success',
        text:
          res.message ||
          `AADHAAR_KYC_VERIFIED unlocked! Anonymized reference token: ${res.kyc_reference_token}`
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#000000]/75 flex items-center justify-center p-4 overflow-y-auto">
      <div className="editorial-card max-w-4xl w-full bg-[#FFFFFF] p-6 space-y-6 my-8 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-[#000000] pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="editorial-badge-teal">
                ReWear 3-Tier Trust & KYC Center
              </span>
              <span className="editorial-badge-peach font-mono">
                Active User: {activeUser.full_name} ({activeUser.kyc_status})
              </span>
            </div>
            <h2 className="font-display font-bold text-2xl text-[#000000]">
              Campus & Tokenized Aadhaar KYC Verification
            </h2>
            <p className="text-xs font-medium mt-0.5">
              Zero Raw Aadhaar Storage Policy: ReWear never stores 12-digit Aadhaar numbers or card images—only anonymized DigiLocker/Cashfree cryptographic reference tokens.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-[#FFD5C2] border border-[#000000] shadow-editorial-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Verification Tiers Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {VERIFICATION_TIERS.map((t) => {
            const isCurrent = activeUser.kyc_status === t.tier;
            return (
              <div
                key={t.tier}
                className={`border border-[#000000] p-4 flex flex-col justify-between space-y-3 ${
                  isCurrent ? 'bg-[#FFD5C2] shadow-editorial-sm' : 'bg-[#FFFFFF]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase">
                      {t.number}
                    </span>
                    <span className={t.badgeClass}>{t.tier}</span>
                  </div>
                  <h3 className="font-display font-bold text-base">{t.title}</h3>
                  <ul className="space-y-1.5 text-xs">
                    {t.perks.map((perk, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="font-bold text-[#588B8B]">•</span>
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-[#000000] text-xs font-bold flex items-center justify-between">
                  <span>Status:</span>
                  <span className="font-mono">
                    {isCurrent ? '✓ CURRENT TIER' : 'Available'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {feedback && (
          <div
            className={`p-3.5 border border-[#000000] text-xs font-bold flex items-center gap-2 ${
              feedback.type === 'error'
                ? 'bg-[#C8553D] text-[#FFFFFF]'
                : 'bg-[#588B8B] text-[#FFFFFF]'
            }`}
          >
            {feedback.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Two Action Columns: Tier 2 Student Verification & Tier 3 Aadhaar KYC Provider Simulation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Column 1: Instant DSU Student Verification */}
          <form
            onSubmit={handleStudentSubmit}
            className="border border-[#000000] bg-[#FFD5C2] p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="editorial-badge-teal">
                <GraduationCap className="w-3.5 h-3.5" />
                Tier 2: DSU Campus Fast-Track
              </span>
              <span className="font-mono text-[11px] font-bold">Instant Approval</span>
            </div>

            <h3 className="font-display font-bold text-lg">
              Verify `@dsu.edu.in` Email or Student ID
            </h3>

            <div>
              <label className="block text-xs font-bold uppercase mb-1">
                DSU Institutional Email
              </label>
              <input
                type="email"
                value={dsuEmail}
                onChange={(e) => setDsuEmail(e.target.value)}
                className="editorial-input"
                placeholder="student@dsu.edu.in"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1">
                DSU Student SRN / Smart Card ID
              </label>
              <input
                type="text"
                value={studentSrn}
                onChange={(e) => setStudentSrn(e.target.value)}
                className="editorial-input font-mono"
                placeholder="ENG24CSE0142"
              />
            </div>

            <button type="submit" className="editorial-btn-primary w-full text-xs">
              <GraduationCap className="w-4 h-4" />
              <span>Verify DSU Student Status (`STUDENT_VERIFIED`)</span>
            </button>
          </form>

          {/* Column 2: Simulated 3rd-Party Aadhaar KYC Provider (DigiLocker / Cashfree) */}
          <form
            onSubmit={handleAadhaarSubmit}
            className="border border-[#000000] bg-[#FFFFFF] p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="editorial-badge-terracotta">
                <Sparkles className="w-3.5 h-3.5" />
                Tier 3: Unlocks High-Value Concierge
              </span>
              <span className="font-mono text-[11px] font-bold">Tokenized OAuth</span>
            </div>

            <h3 className="font-display font-bold text-lg">
              DigiLocker / Cashfree e-KYC Simulator
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">
                  3rd-Party KYC Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="editorial-input"
                >
                  <option value="DIGILOCKER_OAUTH">DigiLocker Meripehchaan</option>
                  <option value="CASHFREE_VKYC">Cashfree Secure e-KYC</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">
                  Provider OTP Token
                </label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="editorial-input font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1">
                Guardrail Test (Optional: Enter 12 digits to test Privacy Block)
              </label>
              <input
                type="text"
                value={rawTestInput}
                onChange={(e) => setRawTestInput(e.target.value)}
                placeholder="Leave blank for valid OAuth token, or type 12 digits to test block"
                className="editorial-input font-mono text-xs"
              />
            </div>

            <button type="submit" className="editorial-btn-teal w-full text-xs">
              <KeyRound className="w-4 h-4" />
              <span>Complete 3rd-Party KYC (`AADHAAR_KYC_VERIFIED`)</span>
            </button>
          </form>
        </div>

        {/* Current Stored Reference Token Audit Bar */}
        <div className="bg-[#FFD5C2] border border-[#000000] p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-bold">
            <Lock className="w-4 h-4 text-[#588B8B]" />
            <span>
              Database `users.kyc_reference_token` for {activeUser.full_name}:
            </span>
          </div>
          <span className="font-mono font-bold bg-[#FFFFFF] px-2.5 py-1 border border-[#000000]">
            {activeUser.kyc_reference_token || 'NULL (UNVERIFIED)'}
          </span>
        </div>
      </div>
    </div>
  );
}
