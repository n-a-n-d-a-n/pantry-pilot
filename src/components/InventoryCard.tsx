import React from 'react';
import {
  Clock,
  CheckCircle2,
  Trash2,
  Edit2,
  Sparkles,
  Refrigerator,
  Box,
  ThermometerSnowflake,
} from 'lucide-react';
import {
  InventoryItem,
  calculateDaysLeft,
  getUrgencyLevel,
  URGENCY_CONFIG,
} from '../types';

interface InventoryCardProps {
  item: InventoryItem;
  onCooked: (item: InventoryItem) => void;
  onDiscard: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
  onGetAdvice: (item: InventoryItem) => void;
}

export const InventoryCard: React.FC<InventoryCardProps> = ({
  item,
  onCooked,
  onDiscard,
  onEdit,
  onGetAdvice,
}) => {
  const daysLeft = calculateDaysLeft(item.addedDate, item.estimatedShelfLifeDays);
  const urgency = getUrgencyLevel(daysLeft);
  const config = URGENCY_CONFIG[urgency];
  const displayName = item.itemName || item.item || 'Vegetarian Food';

  // Storage icon
  const getStorageIcon = () => {
    switch (item.storageLocation) {
      case 'Fridge':
        return <Refrigerator className="w-3.5 h-3.5" />;
      case 'Freezer':
        return <ThermometerSnowflake className="w-3.5 h-3.5" />;
      case 'Pantry':
      case 'Counter':
      default:
        return <Box className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div
      className={`group relative rounded-2xl bg-white dark:bg-[#262320] border transition-all duration-200 shadow-xs hover:shadow-md p-4 sm:p-5 flex flex-col justify-between ${config.cardBorder}`}
    >
      {/* Top Row: Urgency Badge & Action Menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Urgency Pill */}
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${config.badgeBg}`}
          >
            <span className={`w-2 h-2 rounded-full mr-1.5 ${config.indicatorBg}`}></span>
            {daysLeft < 0 ? (
              <span>Expired {Math.abs(daysLeft)}d ago</span>
            ) : daysLeft === 0 ? (
              <span>Expires Today!</span>
            ) : daysLeft === 1 ? (
              <span>Expires Tomorrow!</span>
            ) : (
              <span>{daysLeft} days left</span>
            )}
          </span>

          {/* Storage location badge */}
          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-[#F5F5F0] dark:bg-[#2F2A26] text-[#8C8279] dark:text-[#A8A29E] border border-[#E5E1D8] dark:border-[#3D3833]">
            {getStorageIcon()}
            <span className="ml-1">{item.storageLocation}</span>
          </span>
        </div>

        {/* Quick Edit & Delete icons with 40-44px touch targets & spatial separation */}
        <div className="flex items-center gap-1.5 sm:gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onGetAdvice(item)}
            className="w-10 h-10 rounded-xl text-[#8C8279] dark:text-[#A8A29E] hover:text-[#F27D26] hover:bg-[#FFF2E6] dark:hover:bg-[#382012] flex items-center justify-center transition-all active:scale-95 border border-transparent hover:border-[#FFD8B8] dark:hover:border-[#5C3119]"
            title="Freshness & Storage Hacks"
            aria-label="Freshness advice"
          >
            <Sparkles className="w-4.5 h-4.5 text-[#F27D26]" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="w-10 h-10 rounded-xl text-[#8C8279] dark:text-[#A8A29E] hover:text-[#2D2926] dark:hover:text-[#F5F3EF] hover:bg-[#F5F5F0] dark:hover:bg-[#2F2A26] flex items-center justify-center transition-all active:scale-95 border border-transparent hover:border-[#E5E1D8] dark:hover:border-[#3D3833]"
            title="Edit Item"
            aria-label="Edit item"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {/* Spatial separation divider between Edit and Discard to prevent mis-taps */}
          <div className="h-4 w-px bg-[#E5E1D8] dark:bg-[#3D3833] mx-0.5 shrink-0" />

          <button
            type="button"
            onClick={() => onDiscard(item)}
            className="w-10 h-10 rounded-xl text-[#8C8279] dark:text-[#A8A29E] hover:text-[#991B1B] dark:hover:text-[#FCA5A5] hover:bg-[#FEF2F2] dark:hover:bg-[#331515] flex items-center justify-center transition-all active:scale-95 border border-transparent hover:border-[#FEE2E2] dark:hover:border-[#5C2323]"
            title="Discard / Expired"
            aria-label="Discard item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Details */}
      <div className="my-3 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base sm:text-lg font-bold text-[#2D2926] dark:text-[#F5F3EF] leading-tight">
            {displayName}
          </h3>
          <span className="font-mono text-xs sm:text-sm font-bold text-[#2D2926] dark:text-[#F5F3EF] bg-[#F5F5F0] dark:bg-[#2F2A26] px-2 py-0.5 rounded-md shrink-0">
            {item.quantity}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-[#8C8279] dark:text-[#A8A29E]">
          <span>{item.category === 'Dairy & Eggs' ? 'Dairy' : item.category}</span>
        </div>

        {item.notes && (
          <p className="text-xs text-[#8C8279] dark:text-[#A8A29E] italic line-clamp-1">
            "{item.notes}"
          </p>
        )}
      </div>

      {/* Bottom Row: Days remaining meter & "Mark as Cooked" CTA */}
      <div className="pt-3 border-t border-[#F0EAD6] dark:border-[#3D3833] flex items-center justify-between gap-2">
        <div className="text-[11px] text-[#8C8279] dark:text-[#A8A29E] flex items-center space-x-1 font-medium">
          <Clock className="w-3.5 h-3.5 text-[#A19E95] dark:text-[#78716C]" />
          <span>Added {item.addedDate}</span>
        </div>

        {urgency === 'expired' ? (
          <button
            type="button"
            onClick={() => onDiscard(item)}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#F5F5F0] dark:bg-[#2F2A26] hover:bg-[#E5E1D8] dark:hover:bg-[#3D3833] text-[#8C8279] dark:text-[#A8A29E] hover:text-[#2D2926] dark:hover:text-[#F5F3EF] text-xs font-semibold flex items-center space-x-1.5 transition-colors active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span>Remove Expired</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onCooked(item)}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#FFF2E6] dark:bg-[#382012] hover:bg-[#F27D26] text-[#F27D26] hover:text-white border border-[#FFD8B8] dark:border-[#5C3119] hover:border-[#F27D26] text-xs font-bold flex items-center space-x-1.5 transition-all shadow-2xs active:scale-95"
            title="Mark as cooked or eaten (Zero-Waste victory!)"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Cooked / Eaten</span>
          </button>
        )}
      </div>
    </div>
  );
};
