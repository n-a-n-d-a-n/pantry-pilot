import React, { useState, useEffect } from 'react';
import { Sparkles, X, Lightbulb, ShieldAlert, HeartHandshake, Refrigerator, Leaf } from 'lucide-react';
import { InventoryItem } from '../types';

interface StorageAdviceModalProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

interface StorageAdviceData {
  optimalStorage: string;
  shelfLifeExtensionTip: string;
  spoilageCheck: string;
  quickRescueIdea: string;
}

export const StorageAdviceModal: React.FC<StorageAdviceModalProps> = ({
  item,
  isOpen,
  onClose,
}) => {
  const [advice, setAdvice] = useState<StorageAdviceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && item) {
      fetchAdvice();
    } else {
      setAdvice(null);
      setError(null);
    }
  }, [isOpen, item]);

  const fetchAdvice = async () => {
    if (!item) return;
    setIsLoading(true);
    setError(null);

    const name = item.itemName || item.item || '';

    try {
      const response = await fetch('/api/item/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item: name,
          quantity: item.quantity,
          category: item.category,
          currentStorage: item.storageLocation,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to load storage advice');
      }

      const data = await response.json();
      setAdvice(data);
    } catch (err: any) {
      console.error(err);
      setError('Could not fetch storage advice. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  const displayName = item.itemName || item.item || 'Item';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="bg-[#FFFBF5]/95 dark:bg-[#181614]/95 backdrop-blur-xl rounded-3xl max-w-lg w-full shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden flex flex-col max-h-[92vh] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#F0EAD6]/80 dark:border-[#3D3833]/80 flex items-center justify-between bg-white/90 dark:bg-[#262320]/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFF2E6] dark:bg-[#382012] text-[#F27D26] border border-[#FFD8B8] dark:border-[#5C3119] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-[#2D2926] dark:text-[#F5F3EF]">
                  Freshness & Storage Hack
                </h2>
                <Leaf className="w-3 h-3 text-[#166534] dark:text-[#86EFAC]" />
              </div>
              <p className="text-xs text-[#8C8279] dark:text-[#A8A29E]">{displayName}</p>
            </div>
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

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading && (
            <div className="py-8 text-center space-y-2 animate-pulse">
              <Sparkles className="w-8 h-8 text-[#F27D26] mx-auto animate-spin" />
              <p className="text-xs text-[#8C8279] dark:text-[#A8A29E]">Consulting vegetarian preservation guidelines...</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-[#FEF2F2] dark:bg-[#331515] text-[#991B1B] dark:text-[#FCA5A5] text-xs rounded-xl border border-[#FEE2E2] dark:border-[#5C2323]">
              {error}
            </div>
          )}

          {advice && (
            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="p-3.5 rounded-2xl bg-[#F0FDF4] dark:bg-[#142E1F] border border-[#DCFCE7] dark:border-[#1E4D2B]">
                <div className="font-bold text-[#166534] dark:text-[#86EFAC] flex items-center space-x-1.5 mb-1">
                  <Refrigerator className="w-4 h-4 text-[#166534] dark:text-[#86EFAC]" />
                  <span>Optimal Storage Spot:</span>
                </div>
                <p className="text-[#166534] dark:text-[#86EFAC] leading-relaxed">
                  {advice.optimalStorage}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FFF2E6] dark:bg-[#382012] border border-[#FFD8B8] dark:border-[#5C3119]">
                <div className="font-bold text-[#9A3412] dark:text-[#FDBA74] flex items-center space-x-1.5 mb-1">
                  <Lightbulb className="w-4 h-4 text-[#F27D26]" />
                  <span>How to Extend Shelf Life:</span>
                </div>
                <p className="text-[#9A3412] dark:text-[#FDBA74] leading-relaxed">
                  {advice.shelfLifeExtensionTip}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#262320] border border-[#F0EAD6] dark:border-[#3D3833]">
                <div className="font-bold text-[#2D2926] dark:text-[#F5F3EF] flex items-center space-x-1.5 mb-1">
                  <ShieldAlert className="w-4 h-4 text-[#8C8279] dark:text-[#A8A29E]" />
                  <span>Signs of Spoilage:</span>
                </div>
                <p className="text-[#8C8279] dark:text-[#A8A29E] leading-relaxed">
                  {advice.spoilageCheck}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F0FDF4] dark:bg-[#142E1F] border border-[#DCFCE7] dark:border-[#1E4D2B]">
                <div className="font-bold text-[#166534] dark:text-[#86EFAC] flex items-center space-x-1.5 mb-1">
                  <HeartHandshake className="w-4 h-4 text-[#166534] dark:text-[#86EFAC]" />
                  <span>Quick Zero-Waste Rescue Idea:</span>
                </div>
                <p className="text-[#166534] dark:text-[#86EFAC] leading-relaxed">
                  {advice.quickRescueIdea}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#F0EAD6]/80 dark:border-[#3D3833]/80 bg-white/90 dark:bg-[#262320]/90 backdrop-blur-sm flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#2D2926] dark:bg-[#F5F3EF] text-white dark:text-[#2D2926] text-xs font-bold hover:bg-black dark:hover:bg-white transition-colors active:scale-95 shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
