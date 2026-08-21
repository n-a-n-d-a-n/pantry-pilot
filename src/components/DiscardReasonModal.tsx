import React, { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { InventoryItem } from '../types';

interface DiscardReasonModalProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDiscard: (item: InventoryItem, reason: string) => void;
}

const COMMON_REASONS = [
  'Forgot in back of fridge / crisper',
  'Turned slimy or wilted',
  'Grew mold or sour odor',
  'Overbought / too large portion',
  'Past expiration date',
  'Other / Unusable',
];

export const DiscardReasonModal: React.FC<DiscardReasonModalProps> = ({
  item,
  isOpen,
  onClose,
  onConfirmDiscard,
}) => {
  const [selectedReason, setSelectedReason] = useState(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState('');

  if (!isOpen || !item) return null;

  const displayName = item.itemName || item.item || 'Food Item';

  const handleConfirm = () => {
    const finalReason =
      selectedReason === 'Other / Unusable' && customReason.trim()
        ? customReason.trim()
        : selectedReason;
    onConfirmDiscard(item, finalReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="bg-[#FFFBF5]/95 dark:bg-[#181614]/95 backdrop-blur-xl rounded-3xl max-w-md w-full shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden flex flex-col max-h-[92vh] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#F0EAD6]/80 dark:border-[#3D3833]/80 flex items-center justify-between bg-white/90 dark:bg-[#262320]/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center space-x-2 text-[#991B1B] dark:text-[#FCA5A5]">
            <Trash2 className="w-5 h-5" />
            <h3 className="font-bold text-base text-[#2D2926] dark:text-[#F5F3EF]">Record Wasted Food</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#8C8279] dark:text-[#A8A29E] hover:text-[#2D2926] dark:hover:text-[#F5F3EF] hover:bg-[#F5F5F0] dark:hover:bg-[#2F2A26] transition-colors active:scale-95 shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <p className="text-xs text-[#8C8279] dark:text-[#A8A29E]">
            Removing <strong className="text-[#2D2926] dark:text-[#F5F3EF]">{displayName}</strong> ({item.quantity}). Recording the reason helps identify waste patterns in your kitchen.
          </p>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#2D2926] dark:text-[#F5F3EF]">
              Why was this item discarded?
            </label>
            <div className="space-y-1.5">
              {COMMON_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                    selectedReason === r
                      ? 'border-[#FCA5A5] dark:border-[#7F1D1D] bg-[#FEF2F2] dark:bg-[#331515] text-[#991B1B] dark:text-[#FCA5A5] font-semibold'
                      : 'border-[#E5E1D8] dark:border-[#3D3833] bg-white dark:bg-[#262320] text-[#2D2926] dark:text-[#F5F3EF] hover:bg-[#F5F5F0] dark:hover:bg-[#2F2A26]'
                  }`}
                >
                  <input
                    type="radio"
                    name="waste-reason"
                    value={r}
                    checked={selectedReason === r}
                    onChange={() => setSelectedReason(r)}
                    className="mr-2.5 text-[#991B1B] focus:ring-[#991B1B]"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>

            {selectedReason === 'Other / Unusable' && (
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Specific reason (optional)..."
                className="w-full mt-2 px-3 py-2 rounded-xl border border-[#E5E1D8] dark:border-[#3D3833] text-xs text-[#2D2926] dark:text-[#F5F3EF] bg-white dark:bg-[#181614] focus:ring-2 focus:ring-[#F27D26] outline-none"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#F0EAD6]/80 dark:border-[#3D3833]/80 bg-white/90 dark:bg-[#262320]/90 backdrop-blur-sm flex justify-end space-x-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8C8279] dark:text-[#A8A29E] hover:bg-[#F5F5F0] dark:hover:bg-[#2F2A26] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 rounded-xl bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold shadow-xs transition-colors active:scale-95"
          >
            Confirm & Log Waste
          </button>
        </div>
      </div>
    </div>
  );
};
