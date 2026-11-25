import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Shirt,
  ShieldCheck,
  Sparkles,
  PlusCircle,
  ClipboardCheck,
  Database,
  MapPin,
  Droplets,
  UserCheck,
  LogIn
} from 'lucide-react';

export default function Navbar({
  activeUser,
  sustainability,
  onOpenVerificationModal
}) {
  const navItems = [
    { to: '/', label: 'Campus Closet', icon: Shirt },
    { to: '/list', label: 'List Garment', icon: PlusCircle },
    { to: '/bookings', label: 'Escrow & 5-Pt Log', icon: ClipboardCheck },
    { to: '/profile', label: 'Profile & Impact', icon: UserCheck },
    { to: '/partners', label: 'Care & KYC', icon: Sparkles },
    { to: '/auth', label: 'Auth / Switch', icon: LogIn },
    { to: '/schema', label: 'DB Spec', icon: Database }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b border-[#000000]">
      {/* Top Sustainability & DSU Launch Ticker */}
      <div className="bg-[#588B8B] text-[#FFFFFF] border-b border-[#000000] px-4 py-1.5 text-xs font-semibold">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-[#FFD5C2] text-[#000000] font-extrabold px-2 py-0.5 border border-[#000000] uppercase">
              DSU Bengaluru Launch
            </span>
            <span className="hidden sm:inline">
              Harohalli • Kudlu Gate • Kumaraswamy Layout • Jayanagar • Koramangala
            </span>
          </div>
          <div className="flex items-center gap-4 font-mono">
            <span className="inline-flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-[#FFD5C2]" />
              {(sustainability?.total_water_saved_liters || 12930).toLocaleString()}L Water Saved
            </span>
            <span className="hidden md:inline">
              • {(sustainability?.total_co2_saved_kg || 72.3).toFixed(1)} kg CO₂e Avoided
            </span>
          </div>
        </div>
      </div>

      {/* Main Editorial Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-[#FFD5C2] border border-[#000000] shadow-editorial-sm flex items-center justify-center font-display font-bold text-xl">
            RW
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-2xl tracking-tight text-[#000000]">
                ReWear
              </span>
              <span className="text-[11px] font-bold uppercase px-2 py-0.5 bg-[#FFD5C2] border border-[#000000]">
                P2P Wardrobe
              </span>
            </div>
            <p className="text-xs font-medium text-[#000000] hidden sm:block">
              Wear More. Waste Less. Give Every Garment Another Life.
            </p>
          </div>
        </NavLink>

        {/* Desktop Nav Links */}
        <nav className="flex flex-wrap items-center gap-1.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-bold border border-[#000000] transition-all ${
                  isActive
                    ? 'bg-[#F28F3B] text-[#000000] shadow-editorial-sm'
                    : 'bg-[#FFFFFF] text-[#000000] hover:bg-[#FFD5C2]'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Active Verified Student Pill + Verification Center Trigger */}
        {activeUser && (
          <button
            type="button"
            onClick={onOpenVerificationModal}
            className="hidden xl:flex items-center gap-2.5 bg-[#FFD5C2] hover:bg-[#F28F3B] border border-[#000000] px-3 py-1.5 shadow-editorial-sm text-left transition-colors"
            title="Open 3-Tier Verification Center"
          >
            <ShieldCheck className="w-4 h-4 text-[#588B8B] shrink-0" />
            <div className="text-xs">
              <div className="font-bold text-[#000000]">{activeUser.full_name}</div>
              <div className="flex items-center gap-1 text-[10px] font-mono">
                <MapPin className="w-3 h-3" />
                <span>{activeUser.kyc_status}</span>
              </div>
            </div>
          </button>
        )}
      </div>
    </header>
  );
}
