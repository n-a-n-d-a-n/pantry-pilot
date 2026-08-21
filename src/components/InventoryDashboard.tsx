import React, { useState, useMemo } from 'react';
import {
  Camera,
  Receipt,
  Search,
  Plus,
  AlertTriangle,
  Sparkles,
  UtensilsCrossed,
  Leaf,
  CheckCircle2,
} from 'lucide-react';
import {
  InventoryItem,
  UrgencyLevel,
  calculateDaysLeft,
  getUrgencyLevel,
  FoodCategory,
  UserStatsSummary,
} from '../types';
import { InventoryCard } from './InventoryCard';

interface InventoryDashboardProps {
  inventory: InventoryItem[];
  isLoading?: boolean;
  userStats?: UserStatsSummary;
  onOpenScan: (mode?: 'photo' | 'receipt') => void;
  onOpenRecipes: () => void;
  onOpenManualAdd: () => void;
  onCookItem: (item: InventoryItem) => void;
  onDiscardItem: (item: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
  onGetAdvice: (item: InventoryItem) => void;
  onResetDemoData: () => void;
}

export const InventoryDashboard: React.FC<InventoryDashboardProps> = ({
  inventory,
  isLoading = false,
  userStats,
  onOpenScan,
  onOpenRecipes,
  onOpenManualAdd,
  onCookItem,
  onDiscardItem,
  onEditItem,
  onGetAdvice,
  onResetDemoData,
}) => {
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | UrgencyLevel>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [storageFilter, setStorageFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'urgency' | 'addedDate' | 'name'>('urgency');

  // Filter active items and enrich with computed days left
  const activeItems = useMemo(() => {
    return inventory
      .filter((i) => i.status === 'active')
      .map((item) => {
        const daysLeft = calculateDaysLeft(item.addedDate, item.estimatedShelfLifeDays);
        const urgency = getUrgencyLevel(daysLeft);
        return { ...item, daysLeft, urgency };
      });
  }, [inventory]);

  // Counts by urgency
  const counts = useMemo(() => {
    const total = activeItems.length;
    const urgent = activeItems.filter((i) => i.urgency === 'urgent').length;
    const soon = activeItems.filter((i) => i.urgency === 'soon').length;
    const fresh = activeItems.filter((i) => i.urgency === 'fresh').length;
    const expired = activeItems.filter((i) => i.urgency === 'expired').length;
    return { total, urgent, soon, fresh, expired };
  }, [activeItems]);

  // Filter & sort
  const filteredItems = useMemo(() => {
    let list = [...activeItems];

    // Urgency filter
    if (urgencyFilter !== 'all') {
      list = list.filter((i) => i.urgency === urgencyFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      list = list.filter((i) => {
        const cat = i.category === 'Dairy & Eggs' ? 'Dairy' : i.category;
        return cat === categoryFilter;
      });
    }

    // Storage filter
    if (storageFilter !== 'all') {
      list = list.filter((i) => i.storageLocation === storageFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((i) => {
        const name = (i.itemName || i.item || '').toLowerCase();
        const cat = (i.category || '').toLowerCase();
        const notes = (i.notes || '').toLowerCase();
        return name.includes(q) || cat.includes(q) || notes.includes(q);
      });
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'urgency') {
        return a.daysLeft - b.daysLeft;
      } else if (sortBy === 'addedDate') {
        return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
      } else {
        const nameA = a.itemName || a.item || '';
        const nameB = b.itemName || b.item || '';
        return nameA.localeCompare(nameB);
      }
    });

    return list;
  }, [activeItems, urgencyFilter, categoryFilter, storageFilter, searchQuery, sortBy]);

  const categoriesList: FoodCategory[] = [
    'Produce',
    'Dairy',
    'Bakery',
    'Pantry & Dry Goods',
    'Beverages',
    'Frozen',
    'Other',
  ];

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* 1. HERO FRICTIONLESS SCAN ACTION CENTER (Clean Minimalism) */}
      <section className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#262320] border border-[#F0EAD6] dark:border-[#3D3833] p-8 sm:p-12 shadow-sm text-center flex flex-col items-center transition-colors">
        {/* Big Orange Camera Icon */}
        <div className="w-20 h-20 bg-[#F27D26] rounded-3xl flex items-center justify-center shadow-lg shadow-[#F27D26]/25 mb-5 text-white">
          <Camera className="w-10 h-10" />
        </div>

        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FFF2E6] dark:bg-[#382012] text-[#F27D26] border border-[#FFD8B8] dark:border-[#5C3119] text-[11px] font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Zero Manual Typing • Multimodal Vision AI</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#2D2926] dark:text-[#F5F3EF] leading-tight max-w-2xl">
          Zero Waste, One Photo.
        </h1>

        <p className="mt-3 text-base sm:text-lg text-[#8C8279] dark:text-[#A8A29E] leading-relaxed max-w-lg">
          Snap a photo of your vegetarian groceries, fridge, or receipt. Gemini AI identifies items, predicts shelf life, and rescues expiring food.
        </p>

        {/* Primary Quick Actions Banner */}
        <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-3.5">
          {/* Big Snap Camera CTA */}
          <button
            id="hero-scan-groceries-btn"
            onClick={() => onOpenScan('photo')}
            className="px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl bg-[#F27D26] hover:bg-[#E06D19] text-white font-bold text-base sm:text-lg shadow-md shadow-[#F27D26]/20 flex items-center space-x-2.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Camera className="w-5 h-5" />
            <span>Scan Groceries</span>
          </button>

          {/* Receipt Scan CTA */}
          <button
            id="hero-scan-receipt-btn"
            onClick={() => onOpenScan('receipt')}
            className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-white dark:bg-[#262320] border-2 border-[#E5E1D8] dark:border-[#3D3833] hover:bg-[#F9F8F6] dark:hover:bg-[#2F2A26] text-[#2D2926] dark:text-[#F5F3EF] font-bold text-base sm:text-lg flex items-center space-x-2 transition-all"
          >
            <Receipt className="w-5 h-5 text-[#F27D26]" />
            <span>Scan Receipt</span>
          </button>

          {/* Manual Add Button */}
          <button
            id="hero-manual-add-btn"
            onClick={onOpenManualAdd}
            className="px-5 py-3.5 sm:py-4 rounded-2xl bg-[#F5F5F0] dark:bg-[#2F2A26] hover:bg-[#E5E1D8] dark:hover:bg-[#3D3833] text-[#2D2926] dark:text-[#F5F3EF] font-semibold text-sm sm:text-base flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4 text-[#8C8279] dark:text-[#A8A29E]" />
            <span>Manual Add</span>
          </button>
        </div>
      </section>

      {/* 2. URGENT EXPIRY RESCUE CALLOUT (If red items exist) */}
      {counts.urgent > 0 && (
        <section className="p-5 sm:p-6 rounded-2xl bg-[#FEF2F2] dark:bg-[#331515] border border-[#FEE2E2] dark:border-[#5C2323] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs transition-colors">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#991B1B] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#991B1B]/20">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#991B1B] dark:text-[#FCA5A5] flex items-center gap-2">
                <span>
                  {counts.urgent} vegetarian item{counts.urgent > 1 ? 's' : ''} expiring today or tomorrow!
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-[#451B1B] text-[#991B1B] dark:text-[#FCA5A5] border border-[#FEE2E2] dark:border-[#5C2323] uppercase tracking-wider">
                  Priority
                </span>
              </h2>
              <p className="text-xs text-[#B91C1C] dark:text-[#F87171] mt-0.5">
                Rescue them before they spoil. Generate a zero-waste vegetarian recipe tonight.
              </p>
            </div>
          </div>

          <button
            id="urgent-rescue-recipe-btn"
            onClick={onOpenRecipes}
            className="px-5 py-2.5 rounded-xl bg-[#F27D26] hover:bg-[#E06D19] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#F27D26]/20 flex items-center justify-center space-x-2 shrink-0 transition-all active:scale-95"
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Generate Recipes</span>
          </button>
        </section>
      )}

      {/* 3. URGENCY TABS & CATEGORY FILTERS */}
      <section className="space-y-4">
        {/* Section Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-[#8C8279] dark:text-[#A8A29E] uppercase tracking-widest">
              Pantry Inventory & Shelf Life
            </h2>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#166534] dark:text-[#86EFAC] bg-[#F0FDF4] dark:bg-[#142E1F] px-2 py-0.5 rounded-full border border-[#DCFCE7] dark:border-[#1E4D2B]">
              <Leaf className="w-3 h-3" />
              100% Vegetarian
            </span>
          </div>
          <button
            onClick={onOpenRecipes}
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[#6B635B] dark:text-[#A8A29E] hover:text-[#2D2926] dark:hover:text-[#F5F3EF] hover:bg-[#F5F5F0] dark:hover:bg-[#262320] text-xs font-semibold transition-colors"
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-[#F27D26]" />
            <span>Rescue recipes</span>
          </button>
        </div>

        {/* Urgency Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#F0EAD6] dark:border-[#3D3833] pb-3">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* All */}
            <button
              onClick={() => setUrgencyFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 ${
                urgencyFilter === 'all'
                  ? 'bg-[#2D2926] dark:bg-[#F5F3EF] text-white dark:text-[#2D2926] shadow-xs'
                  : 'bg-white dark:bg-[#262320] border border-[#E5E1D8] dark:border-[#3D3833] text-[#8C8279] dark:text-[#A8A29E] hover:text-[#2D2926] dark:hover:text-[#F5F3EF]'
              }`}
            >
              <span>All Items</span>
              <span className="px-1.5 py-0.2 rounded-full text-2xs bg-[#F5F5F0] dark:bg-[#3D3833] text-[#2D2926] dark:text-[#F5F3EF] font-mono font-bold">
                {counts.total}
              </span>
            </button>

            {/* Expiring (Urgent) */}
            <button
              onClick={() => setUrgencyFilter('urgent')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 border ${
                urgencyFilter === 'urgent'
                  ? 'bg-[#991B1B] text-white border-[#991B1B] shadow-xs'
                  : 'bg-[#FEF2F2] dark:bg-[#331515] border-[#FEE2E2] dark:border-[#5C2323] text-[#991B1B] dark:text-[#FCA5A5] hover:bg-[#FEE2E2] dark:hover:bg-[#451B1B]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#991B1B] dark:bg-[#EF4444] animate-pulse"></span>
              <span>Expiring (Today/1d)</span>
              <span className="px-1.5 py-0.2 rounded-full text-2xs bg-white/30 font-mono font-bold">
                {counts.urgent}
              </span>
            </button>

            {/* Use Soon */}
            <button
              onClick={() => setUrgencyFilter('soon')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 border ${
                urgencyFilter === 'soon'
                  ? 'bg-[#92400E] dark:bg-[#D97706] text-white border-[#92400E] dark:border-[#D97706] shadow-xs'
                  : 'bg-[#FFFBEB] dark:bg-[#32230F] border-[#FEF3C7] dark:border-[#523B19] text-[#92400E] dark:text-[#FDE68A] hover:bg-[#FEF3C7] dark:hover:bg-[#422F14]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#F27D26] dark:bg-[#F59E0B]"></span>
              <span>Use Soon (2-5d)</span>
              <span className="px-1.5 py-0.2 rounded-full text-2xs bg-white/30 font-mono font-bold">
                {counts.soon}
              </span>
            </button>

            {/* Fresh */}
            <button
              onClick={() => setUrgencyFilter('fresh')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 border ${
                urgencyFilter === 'fresh'
                  ? 'bg-[#166534] dark:bg-[#15803D] text-white border-[#166534] dark:border-[#15803D] shadow-xs'
                  : 'bg-[#F0FDF4] dark:bg-[#142E1F] border-[#DCFCE7] dark:border-[#1E4D2B] text-[#166534] dark:text-[#86EFAC] hover:bg-[#DCFCE7] dark:hover:bg-[#1A3D29]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#166534] dark:bg-[#22C55E]"></span>
              <span>Fresh (&gt;5d)</span>
              <span className="px-1.5 py-0.2 rounded-full text-2xs bg-white/30 font-mono font-bold">
                {counts.fresh}
              </span>
            </button>

            {/* Expired */}
            {counts.expired > 0 && (
              <button
                onClick={() => setUrgencyFilter('expired')}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 border ${
                  urgencyFilter === 'expired'
                    ? 'bg-[#8C8279] text-white border-[#8C8279] shadow-xs'
                    : 'bg-[#F5F5F0] dark:bg-[#262320] border-[#E5E1D8] dark:border-[#3D3833] text-[#8C8279] dark:text-[#A8A29E]'
                }`}
              >
                <span>Expired</span>
                <span className="px-1.5 py-0.2 rounded-full text-2xs bg-white dark:bg-[#3D3833] dark:text-[#F5F3EF] font-mono font-bold">
                  {counts.expired}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Sort Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#8C8279] dark:text-[#A8A29E] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vegetarian pantry, categories, or notes..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E5E1D8] dark:border-[#3D3833] bg-white dark:bg-[#262320] text-[#2D2926] dark:text-[#F5F3EF] text-xs sm:text-sm placeholder-[#8C8279] dark:placeholder-[#78716C] focus:ring-2 focus:ring-[#F27D26] focus:border-[#F27D26] outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-2.5 py-1 text-xs font-semibold text-[#8C8279] dark:text-[#A8A29E] hover:text-[#2D2926] dark:hover:text-[#F5F3EF] absolute right-2 top-1/2 -translate-y-1/2 rounded-md hover:bg-[#F5F5F0] dark:hover:bg-[#3D3833] transition-colors"
                aria-label="Clear search"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Pills / Sorting */}
          <div className="flex items-center space-x-2 text-xs">
            {/* Category dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-[#E5E1D8] dark:border-[#3D3833] bg-white dark:bg-[#262320] text-[#2D2926] dark:text-[#F5F3EF] font-semibold focus:ring-2 focus:ring-[#F27D26] outline-none"
            >
              <option value="all">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Storage dropdown */}
            <select
              value={storageFilter}
              onChange={(e) => setStorageFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-[#E5E1D8] dark:border-[#3D3833] bg-white dark:bg-[#262320] text-[#2D2926] dark:text-[#F5F3EF] font-semibold focus:ring-2 focus:ring-[#F27D26] outline-none"
            >
              <option value="all">All Storage</option>
              <option value="Fridge">Fridge</option>
              <option value="Pantry">Pantry</option>
              <option value="Freezer">Freezer</option>
              <option value="Counter">Counter</option>
            </select>

            {/* Sort order */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 rounded-xl border border-[#E5E1D8] dark:border-[#3D3833] bg-white dark:bg-[#262320] text-[#2D2926] dark:text-[#F5F3EF] font-semibold focus:ring-2 focus:ring-[#F27D26] outline-none"
            >
              <option value="urgency">Sort: Expiry (Soonest)</option>
              <option value="addedDate">Sort: Added Date (Newest)</option>
              <option value="name">Sort: Name (A-Z)</option>
            </select>
          </div>
        </div>
      </section>

      {/* 4. INVENTORY ITEMS GRID OR LOADING SKELETON */}
      {isLoading ? (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={`skeleton-${n}`}
              className="rounded-2xl bg-white dark:bg-[#262320] border border-[#F0EAD6] dark:border-[#3D3833] p-5 h-44 flex flex-col justify-between"
            >
              <div className="flex justify-between">
                <div className="w-24 h-5 bg-[#F5F5F0] dark:bg-[#2F2A26] rounded-full" />
                <div className="w-16 h-5 bg-[#F5F5F0] dark:bg-[#2F2A26] rounded-lg" />
              </div>
              <div className="space-y-2 my-2">
                <div className="w-3/4 h-5 bg-[#E5E1D8] dark:bg-[#3D3833] rounded-md" />
                <div className="w-1/2 h-3.5 bg-[#F5F5F0] dark:bg-[#2F2A26] rounded-md" />
              </div>
              <div className="pt-3 border-t border-[#F0EAD6] dark:border-[#3D3833] flex justify-between">
                <div className="w-20 h-4 bg-[#F5F5F0] dark:bg-[#2F2A26] rounded-md" />
                <div className="w-24 h-6 bg-[#FFF2E6] dark:bg-[#382012] rounded-xl" />
              </div>
            </div>
          ))}
        </section>
      ) : filteredItems.length > 0 ? (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <InventoryCard
              key={item.id}
              item={item}
              onCooked={onCookItem}
              onDiscard={onDiscardItem}
              onEdit={onEditItem}
              onGetAdvice={onGetAdvice}
            />
          ))}
        </section>
      ) : (
        /* Empty state */
        <div className="py-16 px-4 text-center rounded-3xl border border-dashed border-[#E5E1D8] dark:border-[#3D3833] bg-white dark:bg-[#262320] space-y-4 transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-[#FFF2E6] dark:bg-[#382012] text-[#F27D26] flex items-center justify-center mx-auto">
            <Leaf className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base sm:text-lg font-bold text-[#2D2926] dark:text-[#F5F3EF]">
              {searchQuery || urgencyFilter !== 'all' || categoryFilter !== 'all'
                ? 'No matching vegetarian food items found'
                : 'Your vegetarian pantry is empty!'}
            </h3>
            <p className="text-xs text-[#8C8279] dark:text-[#A8A29E]">
              {searchQuery || urgencyFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try resetting the filters or clearing the search query.'
                : 'Take a photo of your groceries, snap your open fridge, or scan a receipt to populate your cloud tracker.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onOpenScan('photo')}
              className="px-5 py-2.5 rounded-xl bg-[#F27D26] hover:bg-[#E06D19] text-white text-xs font-bold shadow-md shadow-[#F27D26]/20 flex items-center space-x-1.5"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Groceries</span>
            </button>
            <button
              onClick={onResetDemoData}
              className="px-4 py-2.5 rounded-xl border border-[#E5E1D8] dark:border-[#3D3833] text-[#2D2926] dark:text-[#F5F3EF] text-xs font-semibold hover:bg-[#F9F8F6] dark:hover:bg-[#2F2A26]"
            >
              Load Sample Vegetarian Pantry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
