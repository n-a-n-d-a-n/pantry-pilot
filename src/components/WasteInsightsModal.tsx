import React from 'react';
import {
  BarChart3,
  AlertTriangle,
  Leaf,
  X,
  Lightbulb,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { WasteLogEntry, CookedItemRecord, InventoryItem, UserStatsSummary } from '../types';
import { formatINR } from '../lib/currency';

interface WasteInsightsModalProps {
  isOpen: boolean;
  wastedItems: WasteLogEntry[];
  cookedItems?: (CookedItemRecord | InventoryItem)[];
  userStats?: UserStatsSummary;
  onClose: () => void;
  onClearHistory?: () => void;
}

export const WasteInsightsModal: React.FC<WasteInsightsModalProps> = ({
  isOpen,
  wastedItems,
  cookedItems = [],
  userStats,
  onClose,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  // Compute stats prioritizing Firestore userStats summary if available
  const totalWasted = wastedItems.length;
  const totalCooked = userStats?.totalItemsRescued !== undefined
    ? userStats.totalItemsRescued
    : cookedItems.length;
  const totalTracked = totalWasted + totalCooked;
  const zeroWasteScore = userStats?.zeroWasteScore !== undefined
    ? userStats.zeroWasteScore
    : (totalTracked > 0 ? Math.round((totalCooked / totalTracked) * 100) : 100);

  // Compute recurring wasted frequency
  const frequencyMap: Record<string, number> = {};
  wastedItems.forEach((w) => {
    const name = w.itemName || w.item || 'Item';
    const key = name.trim();
    frequencyMap[key] = (frequencyMap[key] || 0) + 1;
  });

  const recurringItems = Object.entries(frequencyMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Estimated money saved (using userStats or fallback estimation in INR)
  const estimatedMoneySaved = userStats?.estimatedMoneySaved !== undefined
    ? userStats.estimatedMoneySaved
    : totalCooked * 120;

  // Generate 7-day trend data for items saved by cooking
  const trendData = React.useMemo(() => {
    const days: { day: string; fullDate: string; itemsSaved: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const displayLabel = i === 0 ? 'Today' : dayName;

      // Count items cooked on this day
      const count = cookedItems.filter((item) => {
        const itemDate = (item as CookedItemRecord).dateCooked ||
          (item as InventoryItem).updatedAt?.split('T')[0] ||
          (item as InventoryItem).addedDate;
        return itemDate === dateStr;
      }).length;

      days.push({
        day: displayLabel,
        fullDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        itemsSaved: count,
      });
    }
    return days;
  }, [cookedItems]);

  const totalSavedIn7Days = React.useMemo(() => {
    return trendData.reduce((acc, curr) => acc + curr.itemsSaved, 0);
  }, [trendData]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="bg-[#FFFBF5]/95 dark:bg-[#181614]/95 backdrop-blur-xl rounded-3xl max-w-2xl w-full shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden flex flex-col max-h-[92vh] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 sm:px-7 py-4 border-b border-[#F0EAD6]/80 dark:border-[#3D3833]/80 flex items-center justify-between bg-white/90 dark:bg-[#262320]/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF2E6] dark:bg-[#382012] text-[#F27D26] border border-[#FFD8B8] dark:border-[#5C3119] flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#2D2926] dark:text-[#F5F3EF]">
                Waste & Impact Insights
              </h2>
              <p className="text-xs text-[#8C8279] dark:text-[#A8A29E]">
                Tracking food waste patterns to improve kitchen habits
              </p>
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* Key Metrics Bento */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {/* Zero Waste Score */}
            <div className="p-4 rounded-2xl bg-[#F0FDF4] dark:bg-[#142E1F] border border-[#DCFCE7] dark:border-[#1E4D2B] text-center">
              <div className="text-2xl sm:text-3xl font-black text-[#166534] dark:text-[#86EFAC]">
                {zeroWasteScore}%
              </div>
              <div className="text-xs font-semibold text-[#166534] dark:text-[#86EFAC] mt-1">
                Zero-Waste Score
              </div>
              <div className="text-2xs text-[#166534]/80 dark:text-[#86EFAC]/80 mt-0.5">
                {totalCooked} of {totalTracked} items saved
              </div>
            </div>

            {/* Items Wasted */}
            <div className="p-4 rounded-2xl bg-[#FFFBEB] dark:bg-[#32230F] border border-[#FEF3C7] dark:border-[#523B19] text-center">
              <div className="text-2xl sm:text-3xl font-black text-[#92400E] dark:text-[#FDE68A]">
                {totalWasted}
              </div>
              <div className="text-xs font-semibold text-[#92400E] dark:text-[#FDE68A] mt-1">
                Items Wasted
              </div>
              <div className="text-2xs text-[#92400E]/80 dark:text-[#FDE68A]/80 mt-0.5">
                Recorded so far
              </div>
            </div>

            {/* Estimated ₹ Saved */}
            <div className="p-4 rounded-2xl bg-[#EFF6FF] dark:bg-[#1E293B] border border-[#DBEAFE] dark:border-[#334155] text-center">
              <div className="text-2xl sm:text-3xl font-black text-[#1D4ED8] dark:text-[#93C5FD]">
                {formatINR(estimatedMoneySaved)}
              </div>
              <div className="text-xs font-semibold text-[#1D4ED8] dark:text-[#93C5FD] mt-1">
                Est. Money Saved
              </div>
              <div className="text-2xs text-[#1D4ED8]/80 dark:text-[#93C5FD]/80 mt-0.5">
                By eating food on time
              </div>
            </div>
          </div>

          {/* Recipe Success 7-Day Trend Chart */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#262320] border border-[#F0EAD6] dark:border-[#3D3833] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#F0FDF4] dark:bg-[#142E1F] text-[#166534] dark:text-[#86EFAC] border border-[#DCFCE7] dark:border-[#1E4D2B] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#2D2926] dark:text-[#F5F3EF] flex items-center gap-1.5">
                    <span>Recipe Success Trend</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#166534] dark:bg-[#142E1F] dark:text-[#86EFAC] border border-[#DCFCE7] dark:border-[#1E4D2B]">
                      Last 7 Days
                    </span>
                  </h3>
                  <p className="text-2xs text-[#8C8279] dark:text-[#A8A29E]">
                    Pantry items rescued from waste by cooking recipes
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base sm:text-lg font-black text-[#166534] dark:text-[#86EFAC]">
                  {totalSavedIn7Days}
                </span>
                <p className="text-2xs text-[#8C8279] dark:text-[#A8A29E]">items rescued</p>
              </div>
            </div>

            <div className="h-36 sm:h-40 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="recipeSavedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#166534" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#166534" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E1D8" opacity={0.4} />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: '#8C8279' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: '#8C8279' }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white/95 dark:bg-[#1E1B18]/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-[#F0EAD6] dark:border-[#3D3833] text-xs space-y-0.5">
                            <p className="font-bold text-[#2D2926] dark:text-[#F5F3EF]">{data.fullDate}</p>
                            <p className="text-[#166534] dark:text-[#86EFAC] font-semibold">
                              {data.itemsSaved} item{data.itemsSaved === 1 ? '' : 's'} rescued
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="itemsSaved"
                    stroke="#166534"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#recipeSavedGrad)"
                    activeDot={{ r: 4, fill: '#166534', stroke: '#DCFCE7', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recurring Waste Patterns */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#2D2926] dark:text-[#F5F3EF] flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-[#F27D26]" />
              <span>Waste Pattern Detection</span>
            </h3>

            {recurringItems.length > 0 ? (
              <div className="space-y-2">
                {recurringItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl border border-[#F0EAD6] dark:border-[#3D3833] bg-white dark:bg-[#262320] flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#FFF2E6] dark:bg-[#382012] text-[#F27D26] text-xs font-bold flex items-center justify-center border border-[#FFD8B8] dark:border-[#5C3119]">
                        {item.count}x
                      </span>
                      <div>
                        <span className="font-bold text-xs sm:text-sm text-[#2D2926] dark:text-[#F5F3EF]">
                          {item.name}
                        </span>
                        <p className="text-2xs text-[#8C8279] dark:text-[#A8A29E]">
                          Wasted {item.count} time{item.count > 1 ? 's' : ''} recently
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-xs">
                      {item.count >= 2 ? (
                        <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-[#FEF2F2] dark:bg-[#331515] text-[#991B1B] dark:text-[#FCA5A5]">
                          Buy smaller quantity
                        </span>
                      ) : (
                        <span className="text-2xs text-[#8C8279] dark:text-[#A8A29E]">Single incident</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[#F0FDF4] dark:bg-[#142E1F] border border-[#DCFCE7] dark:border-[#1E4D2B] text-center space-y-1">
                <Leaf className="w-8 h-8 text-[#166534] dark:text-[#86EFAC] mx-auto" />
                <p className="text-xs font-bold text-[#166534] dark:text-[#86EFAC]">
                  Zero food wasted so far!
                </p>
                <p className="text-2xs text-[#166534]/80 dark:text-[#86EFAC]/80">
                  Keep cooking your expiring items to maintain your zero-waste streak!
                </p>
              </div>
            )}
          </div>

          {/* AI Smart Prevention Tips */}
          <div className="p-4 rounded-2xl bg-[#FFF2E6] dark:bg-[#382012] border border-[#FFD8B8] dark:border-[#5C3119] text-xs text-[#2D2926] dark:text-[#F5F3EF] space-y-2">
            <div className="font-bold flex items-center space-x-1.5 text-[#F27D26]">
              <Lightbulb className="w-4 h-4 text-[#F27D26]" />
              <span>PantryPilot Vegetarian Waste Prevention Rules:</span>
            </div>
            <ul className="space-y-1.5 pl-5 list-disc text-[#2D2926] dark:text-[#F5F3EF]">
              <li>
                <strong>Fresh Herbs (Cilantro / Parsley):</strong> Trim stems and place in a small glass of water in fridge with a loose bag over leaves to triple shelf life.
              </li>
              <li>
                <strong>Berries & Strawberries:</strong> Do not wash until right before eating. Moisture accelerates mold spores.
              </li>
              <li>
                <strong>Avocados:</strong> Once ripe, move immediately from counter into the fridge to pause ripening for 3-5 days.
              </li>
              <li>
                <strong>Sourdough & Artisanal Bread:</strong> Slice and freeze immediately. Toast directly from frozen!
              </li>
              <li>
                <strong>Tofu & Plant Milk:</strong> Once opened, consume within 5-7 days or freeze cubed tofu for stir-fries.
              </li>
            </ul>
          </div>

          {/* Detailed Wasted Log */}
          {wastedItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#2D2926] dark:text-[#F5F3EF] uppercase tracking-wider">
                  Discard Log History:
                </h4>
                {onClearHistory && (
                  <button
                    type="button"
                    onClick={onClearHistory}
                    className="text-2xs text-[#8C8279] dark:text-[#A8A29E] hover:text-[#991B1B] dark:hover:text-[#FCA5A5] underline"
                  >
                    Clear history
                  </button>
                )}
              </div>
              <div className="max-h-40 overflow-y-auto divide-y divide-[#F0EAD6] dark:divide-[#3D3833] border border-[#F0EAD6] dark:border-[#3D3833] rounded-2xl bg-white dark:bg-[#262320]">
                {wastedItems.map((w) => (
                  <div key={w.id} className="p-3 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-[#2D2926] dark:text-[#F5F3EF]">{w.itemName || w.item}</span>
                      <span className="text-[#8C8279] dark:text-[#A8A29E] ml-1.5">({w.quantity})</span>
                      {w.reason && <p className="text-2xs text-[#8C8279] dark:text-[#A8A29E] italic">"{w.reason}"</p>}
                    </div>
                    <span className="text-2xs text-[#8C8279] dark:text-[#A8A29E]">{w.dateDiscarded}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-7 py-4 border-t border-[#F0EAD6]/80 dark:border-[#3D3833]/80 bg-white/90 dark:bg-[#262320]/90 backdrop-blur-sm flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#2D2926] dark:bg-[#F5F3EF] hover:bg-black dark:hover:bg-white text-white dark:text-[#2D2926] font-bold text-xs sm:text-sm transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
