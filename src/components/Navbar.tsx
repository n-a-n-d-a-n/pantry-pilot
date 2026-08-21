import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  UtensilsCrossed,
  BarChart3,
  Leaf,
  AlertTriangle,
  LogOut,
  ChevronDown,
  CheckCircle2,
  Sun,
  Moon,
  Package,
  Menu,
  Database,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useFirebaseHealth } from '../context/FirebaseHealthContext';
import { UserStatsSummary } from '../types';
import { formatINR } from '../lib/currency';
import { FirebaseHealthIndicator } from './FirebaseHealthIndicator';
import { FirebaseHealthModal } from './FirebaseHealthModal';

interface NavbarProps {
  urgentCount: number;
  wastedCount: number;
  totalActiveCount: number;
  userStats?: UserStatsSummary;
  onOpenScan: (mode?: 'photo' | 'receipt') => void;
  onOpenRecipes: () => void;
  onOpenWasteInsights: () => void;
  onOpenManualAdd: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  urgentCount,
  wastedCount,
  totalActiveCount,
  userStats,
  onOpenScan,
  onOpenRecipes,
  onOpenWasteInsights,
}) => {
  const { user, logOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { status, errorType } = useFirebaseHealth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dbHealthModalOpen, setDbHealthModalOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Status styling for mobile dropdown
  const getMobileStatusDot = () => {
    switch (status) {
      case 'connected':
        return 'bg-emerald-500';
      case 'connecting':
        return 'bg-amber-500 animate-pulse';
      case 'error':
        return 'bg-red-500 animate-pulse';
    }
  };

  const getMobileStatusLabel = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        if (errorType === 'permission-denied') return 'Rules Alert';
        if (errorType === 'network') return 'Offline';
        return 'Error';
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Vegetarian Cook';
  const displayEmail = user?.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-[#FFFBF5]/85 dark:bg-[#181614]/85 backdrop-blur-md border-b border-[#F0EAD6]/80 dark:border-[#3D3833]/80 transition-colors shadow-2xs">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-1.5 sm:gap-3">
          {/* Cluster 1: Logo & Branding + Badges */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0 min-w-fit">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#F27D26] flex items-center justify-center shadow-md shadow-[#F27D26]/20 text-white shrink-0">
              <Leaf className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="shrink-0 min-w-fit">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="text-lg sm:text-2xl font-bold tracking-tight text-[#2D2926] dark:text-[#F5F3EF] whitespace-nowrap min-w-fit shrink-0">
                  Pantry<span className="text-[#F27D26]">Pilot</span>
                </span>

                {/* 100% Vegetarian Trust Signal Badge (Glass pill) - Shown on sm+ to prevent mobile crowding */}
                <span
                  id="badge-100-veg-header"
                  className="hidden sm:inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-[#F0FDF4]/80 dark:bg-[#142E1F]/80 backdrop-blur-xs text-[#166534] dark:text-[#86EFAC] border border-[#DCFCE7]/90 dark:border-[#1E4D2B]/90 shadow-2xs shrink-0 whitespace-nowrap min-w-fit"
                  title="100% Vegetarian: Meat, poultry, fish, and eggs are strictly excluded"
                >
                  <CheckCircle2 className="w-3 h-3 text-[#166534] dark:text-[#86EFAC] shrink-0" />
                  <span className="hidden md:inline ml-1">100% Vegetarian</span>
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#8C8279] dark:text-[#A8A29E] hidden md:block font-medium whitespace-nowrap">
                AI Zero-Waste Kitchen & Expiry Tracker
              </p>
            </div>
          </div>

          {/* Center Badges for Large Screens (>= lg) (Adaptive flex-row) */}
          <div className="hidden lg:flex flex-row items-center space-x-2 shrink-0">
            {urgentCount > 0 ? (
              <button
                onClick={onOpenRecipes}
                className="flex flex-row items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-[#FEF2F2]/85 dark:bg-[#331515]/85 backdrop-blur-xs border border-[#FEE2E2]/90 dark:border-[#5C2323]/90 text-[#991B1B] dark:text-[#FCA5A5] hover:bg-[#FEE2E2] dark:hover:bg-[#451B1B] transition-all text-xs font-semibold shadow-2xs whitespace-nowrap min-w-fit"
              >
                <AlertTriangle className="w-4 h-4 text-[#991B1B] dark:text-[#FCA5A5] animate-pulse shrink-0" />
                <span>
                  {urgentCount} <span className="hidden xl:inline">item{urgentCount > 1 ? 's' : ''} expiring soon</span><span className="xl:hidden">expiring</span>
                </span>
                <span className="font-bold underline ml-1 hidden xl:inline">Cook now →</span>
              </button>
            ) : (
              <div className="flex flex-row items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-[#F0FDF4]/85 dark:bg-[#142E1F]/85 backdrop-blur-xs border border-[#DCFCE7]/90 dark:border-[#1E4D2B]/90 text-[#166534] dark:text-[#86EFAC] text-xs font-medium shadow-2xs whitespace-nowrap min-w-fit">
                <span className="w-2 h-2 rounded-full bg-[#166534] dark:bg-[#22C55E] shrink-0"></span>
                <span className="hidden xl:inline">{totalActiveCount} items fresh in pantry</span>
                <span className="xl:hidden font-semibold">{totalActiveCount} fresh</span>
              </div>
            )}
          </div>

          {/* Right Action Clusters */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
            {/* ── MOBILE ONLY: Hamburger / More Actions Menu Dropdown (< md) ── */}
            <div className="relative md:hidden shrink-0" ref={mobileMenuRef}>
              <button
                type="button"
                id="btn-mobile-more-menu"
                onClick={() => {
                  setMobileMenuOpen(!mobileMenuOpen);
                  if (!mobileMenuOpen) setProfileOpen(false);
                }}
                className="w-9 h-9 rounded-xl text-[#6B635B] dark:text-[#A8A29E] hover:text-[#2D2926] dark:hover:text-[#F5F3EF] hover:bg-[#F5F5F0]/80 dark:hover:bg-[#262320]/80 flex items-center justify-center transition-all relative active:scale-95"
                title="More menu (Recipes, Insights, Theme)"
                aria-label="More options"
                aria-expanded={mobileMenuOpen}
              >
                <Menu className="w-5 h-5 text-[#2D2926] dark:text-[#F5F3EF]" />
                {/* Notification Badge if urgent items or waste exists */}
                {urgentCount > 0 ? (
                  <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EF4444] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#DC2626]"></span>
                  </span>
                ) : wastedCount > 0 ? (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#F27D26]"></span>
                ) : null}
              </button>

              {/* Mobile Actions Dropdown Panel */}
              {mobileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white/95 dark:bg-[#262320]/95 backdrop-blur-md border border-[#F0EAD6]/80 dark:border-[#3D3833]/80 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-1 space-y-1">
                    {/* 1. Rescue Recipes Item */}
                    <button
                      type="button"
                      id="mobile-nav-recipes-btn"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenRecipes();
                      }}
                      className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-[#2D2926] dark:text-[#F5F3EF] hover:bg-[#F5F5F0] dark:hover:bg-[#2F2A26] transition-colors flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#FFF2E6] dark:bg-[#382012] flex items-center justify-center text-[#F27D26]">
                          <UtensilsCrossed className="w-4 h-4" />
                        </div>
                        <span>Rescue Recipes</span>
                      </div>
                      {urgentCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#FEF2F2] dark:bg-[#331515] text-[#991B1B] dark:text-[#FCA5A5] text-[10px] font-bold border border-[#FEE2E2] dark:border-[#5C2323]">
                          {urgentCount} urgent
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#8C8279] dark:text-[#A8A29E]">AI Chef</span>
                      )}
                    </button>

                    {/* 2. Waste Insights Item */}
                    <button
                      type="button"
                      id="mobile-nav-insights-btn"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenWasteInsights();
                      }}
                      className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-[#2D2926] dark:text-[#F5F3EF] hover:bg-[#F5F5F0] dark:hover:bg-[#2F2A26] transition-colors flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] dark:bg-[#142E1F] flex items-center justify-center text-[#166534] dark:text-[#86EFAC]">
                          <BarChart3 className="w-4 h-4" />
                        </div>
                        <span>Waste Insights</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#FFF2E6] dark:bg-[#382012] text-[#F27D26] text-[10px] font-bold">
                        {formatINR(userStats?.estimatedMoneySaved ?? 0)}
                      </span>
                    </button>

                    {/* Divider */}
                    <div className="h-px bg-[#F0EAD6] dark:bg-[#3D3833] my-1" />

                    {/* 3. Theme Toggle Item */}
                    <button
                      type="button"
                      id="mobile-nav-theme-toggle-btn"
                      onClick={() => {
                        toggleTheme();
                      }}
                      className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-[#2D2926] dark:text-[#F5F3EF] hover:bg-[#F5F5F0] dark:hover:bg-[#2F2A26] transition-colors flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#F5F5F0] dark:bg-[#3D3833] flex items-center justify-center text-[#6B635B] dark:text-[#A8A29E]">
                          {theme === 'dark' ? (
                            <Sun className="w-4 h-4 text-[#F59E0B]" />
                          ) : (
                            <Moon className="w-4 h-4 text-[#6B635B]" />
                          )}
                        </div>
                        <span>Appearance</span>
                      </div>
                      <span className="text-[11px] font-medium text-[#8C8279] dark:text-[#A8A29E] capitalize">
                        {theme} Mode
                      </span>
                    </button>

                    {/* 4. Firebase Health Item (Mobile) */}
                    <button
                      type="button"
                      id="mobile-nav-db-health-btn"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setDbHealthModalOpen(true);
                      }}
                      className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-[#2D2926] dark:text-[#F5F3EF] hover:bg-[#F5F5F0] dark:hover:bg-[#2F2A26] transition-colors flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#F5F5F0] dark:bg-[#3D3833] flex items-center justify-center text-[#6B635B] dark:text-[#A8A29E]">
                          <Database className="w-4 h-4 text-[#F27D26]" />
                        </div>
                        <span>Database Health</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${getMobileStatusDot()}`} />
                        <span className="text-[11px] font-medium text-[#8C8279] dark:text-[#A8A29E]">
                          {getMobileStatusLabel()}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── DESKTOP ONLY: Inline Utility Icons & Actions (>= md) ── */}
            <div className="hidden md:flex items-center space-x-1.5">
              {/* Firebase Live Health Indicator Dot/Status */}
              <FirebaseHealthIndicator variant="navbar" />

              {/* Waste Insights & Saved Tracker (Ghost style) */}
              <button
                id="nav-waste-insights-btn"
                onClick={onOpenWasteInsights}
                className="px-2.5 py-1.5 rounded-xl text-[#6B635B] dark:text-[#A8A29E] hover:text-[#2D2926] dark:hover:text-[#F5F3EF] hover:bg-[#F5F5F0]/80 dark:hover:bg-[#262320]/80 text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 active:scale-95 shrink-0"
                title="Waste Insights & Money Saved"
                aria-label="Waste Insights & Money Saved"
              >
                <BarChart3 className="w-4 h-4 text-[#F27D26] shrink-0" />
                <span className="hidden 2xl:inline">Insights</span>
                <span className="px-2 py-0.5 rounded-full bg-[#FFF2E6] dark:bg-[#382012] text-[#F27D26] text-[11px] font-bold border border-[#FFD8B8] dark:border-[#5C3119] whitespace-nowrap shrink-0">
                  {formatINR(userStats?.estimatedMoneySaved ?? 0)}
                </span>
              </button>

              {/* Theme Toggle (Ghost style) */}
              <button
                type="button"
                id="btn-theme-toggle"
                onClick={toggleTheme}
                className="w-10 h-10 rounded-xl text-[#6B635B] dark:text-[#A8A29E] hover:text-[#2D2926] dark:hover:text-[#F5F3EF] hover:bg-[#F5F5F0]/80 dark:hover:bg-[#262320]/80 transition-colors flex items-center justify-center group relative active:scale-95"
                title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
                aria-label={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
              >
                <span className="relative w-4.5 h-4.5 flex items-center justify-center transition-transform duration-300 transform group-hover:scale-110">
                  {theme === 'dark' ? (
                    <Sun className="w-4.5 h-4.5 text-[#F59E0B] transition-all duration-300 rotate-0 scale-100" />
                  ) : (
                    <Moon className="w-4.5 h-4.5 text-[#6B635B] dark:text-[#A8A29E] group-hover:text-[#F27D26] transition-all duration-300 rotate-0 scale-100" />
                  )}
                </span>
              </button>

              {/* Thin Divider Between Utilities and Actions */}
              <div className="h-5 w-px bg-[#E5E1D8] dark:bg-[#3D3833] mx-1 shrink-0" />

              {/* Recipes Ghost Button */}
              <button
                id="nav-cook-this-btn"
                onClick={onOpenRecipes}
                className="min-h-[40px] px-2.5 xl:px-3 py-2 rounded-xl text-[#6B635B] dark:text-[#A8A29E] hover:text-[#2D2926] dark:hover:text-[#F5F3EF] hover:bg-[#F5F5F0]/80 dark:hover:bg-[#262320]/80 font-semibold text-xs sm:text-sm transition-all flex items-center space-x-1.5 active:scale-95"
                title="Rescue Recipes"
              >
                <UtensilsCrossed className="w-4 h-4 text-[#F27D26] shrink-0" />
                <span className="hidden xl:inline">Recipes</span>
              </button>
            </div>

            {/* ── ALWAYS VISIBLE: Single Primary Solid CTA: Scan Food ── */}
            <button
              id="nav-scan-cta-btn"
              onClick={() => onOpenScan('photo')}
              className="min-h-[36px] sm:min-h-[40px] px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#F27D26] hover:bg-[#E06D19] text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow-md shadow-[#F27D26]/20 transition-all flex items-center space-x-1 sm:space-x-1.5 active:scale-95 shrink-0"
              title="Scan food or receipts"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Scan Food</span>
              <span className="sm:hidden">Scan</span>
            </button>

            {/* ── ALWAYS VISIBLE: User Profile Menu ── */}
            <div className="relative shrink-0" ref={profileRef}>
              <button
                type="button"
                id="btn-user-profile-menu"
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  if (!profileOpen) setMobileMenuOpen(false);
                }}
                className="min-h-[36px] sm:min-h-[40px] flex items-center gap-1 p-1 sm:px-2 sm:py-1.5 rounded-xl border border-[#E5E1D8]/80 dark:border-[#3D3833]/80 bg-white/80 dark:bg-[#262320]/80 backdrop-blur-xs hover:bg-[#FFFBF5] dark:hover:bg-[#2F2A26] transition-all text-xs font-medium text-[#2D2926] dark:text-[#F5F3EF] shadow-2xs active:scale-95 shrink-0"
                aria-label="User Profile"
                aria-expanded={profileOpen}
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={displayName}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#2D2926] dark:bg-[#3D3833] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {initial}
                  </div>
                )}
                <span className="hidden xl:inline max-w-[100px] truncate">{displayName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8C8279] dark:text-[#A8A29E] shrink-0" />
              </button>

              {/* Profile Dropdown (Glass container) */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white/95 dark:bg-[#262320]/95 backdrop-blur-md border border-[#F0EAD6]/80 dark:border-[#3D3833]/80 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2.5 border-b border-[#F0EAD6]/80 dark:border-[#3D3833]/80">
                    <p className="text-xs font-bold text-[#2D2926] dark:text-[#F5F3EF] truncate">{displayName}</p>
                    <p className="text-[11px] text-[#8C8279] dark:text-[#A8A29E] truncate">{displayEmail}</p>
                    {/* Active inventory item count */}
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#F5F5F0]/80 dark:bg-[#181614]/80 text-[#6B635B] dark:text-[#A8A29E] text-[10px] font-medium border border-[#E5E1D8]/80 dark:border-[#3D3833]/80">
                      <Package className="w-3 h-3 text-[#F27D26]" />
                      <span>{totalActiveCount} items in pantry</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      id="btn-profile-signout"
                      onClick={() => {
                        setProfileOpen(false);
                        logOut();
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-medium text-[#991B1B] dark:text-[#FCA5A5] hover:bg-[#FEF2F2] dark:hover:bg-[#331515] rounded-xl transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4 text-[#991B1B] dark:text-[#FCA5A5]" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <FirebaseHealthModal
        isOpen={dbHealthModalOpen}
        onClose={() => setDbHealthModalOpen(false)}
      />
    </header>
  );
};

