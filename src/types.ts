export type UrgencyLevel = 'fresh' | 'soon' | 'urgent' | 'expired';

export type FoodCategory =
  | 'Produce'
  | 'Dairy'
  | 'Bakery'
  | 'Pantry & Dry Goods'
  | 'Beverages'
  | 'Frozen'
  | 'Other';

export type StorageLocation = 'Fridge' | 'Pantry' | 'Freezer' | 'Counter';

export interface InventoryItem {
  id: string;
  itemName: string;
  item?: string; // alias for backwards/view compatibility
  quantity: string;
  category: FoodCategory | string;
  estimatedShelfLifeDays: number;
  addedDate: string; // ISO format: YYYY-MM-DD
  storageLocation: StorageLocation;
  status: 'active' | 'cooked' | 'discarded';
  confidence?: string;
  notes?: string;
  scannedFrom?: 'photo' | 'receipt' | 'manual';
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScannedFoodItem {
  item: string;
  quantity: string;
  estimatedShelfLifeDays: number;
  category: string;
  storageLocation?: StorageLocation;
  confidenceNote?: string;
}

export interface RecipeSuggestion {
  id: string;
  recipeName: string;
  recipeNameHindi?: string;
  description: string;
  descriptionHindi?: string;
  usesIngredients: string[];
  usesIngredientsHindi?: string[];
  additionalIngredientsNeeded: string[];
  additionalIngredientsNeededHindi?: string[];
  steps: string[];
  stepsHindi?: string[];
  cookTimeMinutes: number;
  cookingTime?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | string;
  chefTip: string;
  chefTipHindi?: string;
}

export interface ScanHistoryRecord {
  id: string;
  timestamp: string; // ISO date string
  mode: 'photo' | 'receipt';
  thumbnailUrl: string;
  items: ScannedFoodItem[];
  itemCount: number;
}

export interface WasteLogEntry {
  id: string;
  itemName: string;
  item?: string;
  discardedDate?: string; // ISO string
  dateDiscarded?: string;
  reason: 'expired' | 'overbought' | 'other' | string;
  quantity?: string;
  category?: string;
  estimatedCost?: number;
  userId?: string;
  createdAt?: string;
}

// Backwards compatibility alias
export type WastedItemRecord = WasteLogEntry;

export interface CookedItemRecord {
  id: string;
  itemName: string;
  quantity: string;
  category: string;
  dateCooked: string;
  recipeName?: string;
  userId?: string;
}

export interface UserStatsSummary {
  zeroWasteScore: number;
  totalItemsRescued: number;
  estimatedMoneySaved: number;
  currentStreak: number;
  userId?: string;
  updatedAt?: string;
}

/**
 * Calculates days remaining from added date + shelf life days against today
 */
export function calculateDaysLeft(addedDateStr: string, shelfLifeDays: number): number {
  if (!addedDateStr) return shelfLifeDays || 3;
  const added = new Date(addedDateStr);
  added.setHours(0, 0, 0, 0);

  const expiry = new Date(added);
  expiry.setDate(expiry.getDate() + (shelfLifeDays || 0));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = expiry.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Determines urgency classification based on days left
 */
export function getUrgencyLevel(daysLeft: number): UrgencyLevel {
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 1) return 'urgent'; // 0 or 1 day
  if (daysLeft <= 5) return 'soon'; // 2 to 5 days
  return 'fresh'; // > 5 days
}

export const URGENCY_CONFIG = {
  fresh: {
    label: 'Fresh',
    badgeText: 'Fresh (>5d)',
    badgeBg: 'bg-[#F0FDF4] text-[#166534] border-[#DCFCE7] dark:bg-[#142E1F] dark:text-[#86EFAC] dark:border-[#1E4D2B]',
    cardBorder: 'border-[#F0EAD6] hover:border-[#166534]/50 dark:border-[#3D3833] dark:hover:border-[#86EFAC]/50',
    indicatorBg: 'bg-[#166534] dark:bg-[#22C55E]',
    accentColor: 'text-[#166534] dark:text-[#86EFAC]',
    lightBg: 'bg-[#F0FDF4] dark:bg-[#142E1F]/50',
    description: 'More than 5 days remaining. Good condition.',
  },
  soon: {
    label: 'Use Soon',
    badgeText: 'Use Soon (2-5d)',
    badgeBg: 'bg-[#FFFBEB] text-[#92400E] border-[#FEF3C7] dark:bg-[#32230F] dark:text-[#FDE68A] dark:border-[#523B19]',
    cardBorder: 'border-[#F0EAD6] hover:border-[#92400E]/50 dark:border-[#3D3833] dark:hover:border-[#FDE68A]/50',
    indicatorBg: 'bg-[#F27D26] dark:bg-[#F59E0B]',
    accentColor: 'text-[#92400E] dark:text-[#FDE68A]',
    lightBg: 'bg-[#FFFBEB] dark:bg-[#32230F]/50',
    description: 'Use within 2 to 5 days.',
  },
  urgent: {
    label: 'Expiring Now',
    badgeText: 'Expiring (Today/Tomorrow)',
    badgeBg: 'bg-[#FEF2F2] text-[#991B1B] border-[#FEE2E2] dark:bg-[#331515] dark:text-[#FCA5A5] dark:border-[#5C2323]',
    cardBorder: 'border-[#FEE2E2] hover:border-[#991B1B]/50 ring-1 ring-[#FEE2E2] dark:border-[#5C2323] dark:ring-[#5C2323] dark:hover:border-[#FCA5A5]/50',
    indicatorBg: 'bg-[#991B1B] animate-pulse dark:bg-[#EF4444]',
    accentColor: 'text-[#991B1B] dark:text-[#FCA5A5]',
    lightBg: 'bg-[#FEF2F2] dark:bg-[#331515]/50',
    description: 'Expiring today or tomorrow! Cook first.',
  },
  expired: {
    label: 'Expired',
    badgeText: 'Likely Expired',
    badgeBg: 'bg-[#F5F5F0] text-[#8C8279] border-[#E5E1D8] dark:bg-[#262320] dark:text-[#A8A29E] dark:border-[#3D3833]',
    cardBorder: 'border-[#E5E1D8] opacity-80 dark:border-[#3D3833]',
    indicatorBg: 'bg-[#8C8279] dark:bg-[#78716C]',
    accentColor: 'text-[#8C8279] dark:text-[#A8A29E]',
    lightBg: 'bg-[#F5F5F0] dark:bg-[#262320]/50',
    description: 'Past estimated shelf life. Check freshness or discard.',
  },
};
