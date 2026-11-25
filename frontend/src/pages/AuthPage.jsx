import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  GraduationCap,
  MapPin,
  Sparkles,
  UserCheck,
  ArrowRight,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { REWEAR_THEME } from '../theme/rewearTheme.js';

export default function AuthPage({
  users,
  activeUser,
  onLoginSuccess,
  onRegisterSuccess,
  onOpenVerificationModal
}) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('LOGIN'); // 'LOGIN' | 'REGISTER'
  const [email, setEmail] = useState(users[0]?.email || 'ananya.rao.cse26@dsu.edu.in');
  const [password, setPassword] = useState('rewear2026');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+91-98450');
  const [campusOrArea, setCampusOrArea] = useState(
    'Dayananda Sagar University (Harohalli Main Campus)'
  );
  const [studentSrn, setStudentSrn] = useState('');
  const [statusBanner, setStatusBanner] = useState(null);

  const isDsuEmailPreview = email.trim().toLowerCase().endsWith('@dsu.edu.in');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const result = await onLoginSuccess({ email });
    if (result?.error) {
      setStatusBanner({ type: 'error', text: result.error });
    } else {
      setStatusBanner({
        type: 'success',
        text: `Signed in as ${result.user.full_name} (JWT Session Active • Dual Lender & Borrower Mode)`
      });
      setTimeout(() => navigate('/profile'), 700);
    }
  };

  const handleQuickPersonaSwitch = async (user) => {
    setEmail(user.email);
    const result = await onLoginSuccess({ user_id: user.id, email: user.email });
    if (result?.user) {
      setStatusBanner({
        type: 'success',
        text: `Switched active JWT session to ${result.user.full_name} (${result.user.kyc_status})`
      });
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const result = await onRegisterSuccess({
      full_name: fullName,
      email,
      phone,
      password,
      campus_or_area: campusOrArea,
      student_srn: studentSrn
    });
    if (result?.error) {
      setStatusBanner({ type: 'error', text: result.error });
    } else {
      setStatusBanner({
        type: 'success',
        text: result.message || 'Unified Lender & Borrower account created!'
      });
      setTimeout(() => navigate('/profile'), 900);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Top Editorial Banner */}
      <section className="editorial-card-peach p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="editorial-badge-teal">
                <GraduationCap className="w-3.5 h-3.5" />
                DSU Campus Fast-Track Verification
              </span>
              <span className="editorial-badge-peach">
                Unified Account: Lend & Borrow
              </span>
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#000000]">
              One Circular Wardrobe Account for DSU & Bengaluru
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#000000]">
              Sign up with your <span className="font-mono font-bold">@dsu.edu.in</span> campus email or Student SRN for instant <span className="font-mono font-bold">STUDENT_VERIFIED</span> status. Upgrade to tokenized <span className="font-mono font-bold">AADHAAR_KYC_VERIFIED</span> to unlock High-Value Concierge outfits.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenVerificationModal}
            className="editorial-btn-teal text-xs"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Open 3-Tier Verification Center</span>
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Login / Register Form */}
        <div className="lg:col-span-7 editorial-card p-6 bg-[#FFFFFF] space-y-5">
          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 border border-[#000000] bg-[#FFD5C2] p-1 gap-1">
            <button
              type="button"
              onClick={() => {
                setMode('LOGIN');
                setStatusBanner(null);
              }}
              className={`py-2.5 text-xs font-bold uppercase tracking-wider border transition-all ${
                mode === 'LOGIN'
                  ? 'bg-[#F28F3B] text-[#000000] border-[#000000] shadow-editorial-sm'
                  : 'border-transparent text-[#000000]'
              }`}
            >
              Sign In (JWT Login)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('REGISTER');
                setEmail('');
                setStatusBanner(null);
              }}
              className={`py-2.5 text-xs font-bold uppercase tracking-wider border transition-all ${
                mode === 'REGISTER'
                  ? 'bg-[#F28F3B] text-[#000000] border-[#000000] shadow-editorial-sm'
                  : 'border-transparent text-[#000000]'
              }`}
            >
              Create Unified Account
            </button>
          </div>

          {statusBanner && (
            <div
              className={`p-3.5 border border-[#000000] text-xs font-bold flex items-center gap-2 ${
                statusBanner.type === 'error'
                  ? 'bg-[#C8553D] text-[#FFFFFF]'
                  : 'bg-[#588B8B] text-[#FFFFFF]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusBanner.text}</span>
            </div>
          )}

          {mode === 'LOGIN' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">
                  Campus or Personal Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@dsu.edu.in or name@gmail.com"
                  className="editorial-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="editorial-input"
                  required
                />
              </div>

              <div className="bg-[#FFD5C2] border border-[#000000] p-3 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#588B8B]" />
                  <span>Unified Dual-Sided JWT Session</span>
                </div>
                <p>
                  Your single ReWear account lets you both <strong>Lend outfits from your closet</strong> and <strong>Borrow verified fits</strong> with separate Lender & Borrower trust ratings.
                </p>
              </div>

              <button type="submit" className="editorial-btn-primary w-full">
                <span>Sign In with JWT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Aditya Vishwanath"
                    className="editorial-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">
                    Mobile Phone (UPI / Escrow Alerts) *
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91-9845099112"
                    className="editorial-input font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase">
                    Email Address (`@dsu.edu.in` unlocks instant verification) *
                  </label>
                  {isDsuEmailPreview && (
                    <span className="editorial-badge-teal">
                      ✓ Instant STUDENT_VERIFIED Eligible
                    </span>
                  )}
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aditya.cse26@dsu.edu.in"
                  className="editorial-input"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">
                    DSU Campus or Bengaluru Neighborhood *
                  </label>
                  <select
                    value={campusOrArea}
                    onChange={(e) => setCampusOrArea(e.target.value)}
                    className="editorial-input"
                  >
                    {REWEAR_THEME.campusesAndHubs.map((hub) => (
                      <option key={hub} value={hub}>
                        {hub}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1">
                    DSU Student ID / SRN (Optional if non-DSU)
                  </label>
                  <input
                    type="text"
                    value={studentSrn}
                    onChange={(e) => setStudentSrn(e.target.value)}
                    placeholder="e.g. ENG24CSE0142"
                    className="editorial-input font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1">
                  Create Password *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="editorial-input"
                  required
                />
              </div>

              <button type="submit" className="editorial-btn-primary w-full">
                <Sparkles className="w-4 h-4" />
                <span>Create Unified Account & Mint JWT</span>
              </button>
            </form>
          )}
        </div>

        {/* Right 5 Cols: Quick Switch Demo Personas across KYC Tiers */}
        <div className="lg:col-span-5 space-y-4">
          <div className="editorial-card p-5 bg-[#FFFFFF] space-y-4">
            <div className="border-b border-[#000000] pb-3">
              <span className="editorial-badge-teal">Instant Demo Switcher</span>
              <h2 className="font-display font-bold text-lg mt-1">
                Test KYC Tiers with Seeded DSU & Bengaluru Accounts
              </h2>
              <p className="text-xs mt-0.5">
                Click any member below to switch your active JWT session and test `HIGH_VALUE_CONCIERGE` gating and dual profiles:
              </p>
            </div>

            <div className="space-y-2.5">
              {users.map((u) => {
                const isCurrent = activeUser?.id === u.id;
                return (
                  <div
                    key={u.id}
                    className={`p-3 border border-[#000000] transition-all ${
                      isCurrent ? 'bg-[#FFD5C2] shadow-editorial-sm' : 'bg-[#FFFFFF]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-sm flex items-center gap-1.5">
                          <span>{u.full_name}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-[#F28F3B] px-1.5 py-0.5 border border-[#000000] font-mono uppercase">
                              Active JWT
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono">{u.email}</div>
                        <div className="text-[11px] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#588B8B]" />
                          <span>{u.campus_or_area}</span>
                        </div>
                      </div>

                      <span
                        className={
                          u.kyc_status === 'AADHAAR_KYC_VERIFIED'
                            ? 'editorial-badge-teal'
                            : u.kyc_status === 'STUDENT_VERIFIED'
                            ? 'editorial-badge-peach'
                            : 'editorial-badge-terracotta'
                        }
                      >
                        {u.kyc_status}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-[#000000] flex items-center justify-between text-xs">
                      <span className="font-mono text-[11px]">
                        Lender ★ {Number(u.lender_rating).toFixed(2)} • Borrower ★{' '}
                        {Number(u.borrower_rating).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuickPersonaSwitch(u)}
                        className="px-2.5 py-1 bg-[#F28F3B] text-[#000000] font-bold border border-[#000000] text-[11px]"
                      >
                        {isCurrent ? 'Selected' : 'Switch Account'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
