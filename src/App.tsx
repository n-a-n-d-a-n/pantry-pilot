/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  InventoryItem,
  ScannedFoodItem,
  RecipeSuggestion,
  WasteLogEntry,
  UserStatsSummary,
  calculateDaysLeft,
  getUrgencyLevel,
} from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { FirebaseHealthProvider, useFirebaseHealth } from './context/FirebaseHealthContext';
import { AuthScreen } from './components/AuthScreen';
import { Navbar } from './components/Navbar';
import { FirebaseHealthIndicator } from './components/FirebaseHealthIndicator';
import { InventoryDashboard } from './components/InventoryDashboard';
import { ScanModal } from './components/ScanModal';
import { RecipeModal } from './components/RecipeModal';
import { WasteInsightsModal } from './components/WasteInsightsModal';
import { ManualItemModal } from './components/ManualItemModal';
import { StorageAdviceModal } from './components/StorageAdviceModal';
import { DiscardReasonModal } from './components/DiscardReasonModal';
import {
  subscribeToInventory,
  subscribeToStats,
  subscribeToWasteLog,
  addInventoryItems,
  updateInventoryItem,
  markItemCooked,
  markItemDiscarded,
  resetToDemoVegetarianPantry,
  clearWasteLog,
} from './services/firestoreService';
import { Check, Leaf, RefreshCw, Sparkles, X } from 'lucide-react';

interface ToastItem {
  id: string;
  message: string;
}

function PantryPilotMain() {
  const { user, loading: authLoading } = useAuth();
  const { reportSnapshotSuccess, reportSnapshotError } = useFirebaseHealth();

  // Firestore real-time state
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [wasteLog, setWasteLog] = useState<WasteLogEntry[]>([]);
  const [userStats, setUserStats] = useState<UserStatsSummary | undefined>(undefined);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Modal states
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [scanMode, setScanMode] = useState<'photo' | 'receipt'>('photo');
  const [isRecipesOpen, setIsRecipesOpen] = useState(false);
  const [isWasteInsightsOpen, setIsWasteInsightsOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
  const [adviceItem, setAdviceItem] = useState<InventoryItem | null>(null);
  const [discardTargetItem, setDiscardTargetItem] = useState<InventoryItem | null>(null);

  // Stacked toast notifications
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showToast = (msg: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message: msg }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  // Real-time Firestore subscriptions for authenticated user
  useEffect(() => {
    if (!user) {
      setInventory([]);
      setWasteLog([]);
      setIsDataLoading(false);
      return;
    }

    setIsDataLoading(true);

    const unsubInventory = subscribeToInventory(
      user.uid,
      (items) => {
        setInventory(items);
        setIsDataLoading(false);
      },
      (error) => {
        console.error('Inventory subscription error:', error);
        reportSnapshotError(error, `users/${user.uid}/inventory`);
        setIsDataLoading(false);
      },
      (fromCache) => {
        reportSnapshotSuccess(fromCache);
      }
    );

    const unsubStats = subscribeToStats(
      user.uid,
      (stats) => {
        setUserStats(stats);
      },
      (error) => {
        console.error('Stats subscription error:', error);
        reportSnapshotError(error, `users/${user.uid}/stats/summary`);
      },
      (fromCache) => {
        reportSnapshotSuccess(fromCache);
      }
    );

    const unsubWaste = subscribeToWasteLog(
      user.uid,
      (entries) => {
        setWasteLog(entries);
      },
      (error) => {
        console.error('WasteLog subscription error:', error);
        reportSnapshotError(error, `users/${user.uid}/wasteLog`);
      },
      (fromCache) => {
        reportSnapshotSuccess(fromCache);
      }
    );

    return () => {
      unsubInventory();
      unsubStats();
      unsubWaste();
    };
  }, [user, reportSnapshotSuccess, reportSnapshotError]);

  // Loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] dark:bg-[#181614] text-[#2D2926] dark:text-[#F5F3EF] flex flex-col items-center justify-center p-4 transition-colors">
        <div className="bg-white/80 dark:bg-[#262320]/80 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-3xl p-8 shadow-xl flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#FFF2E6] dark:bg-[#382012] text-[#F27D26] border border-[#FFD8B8] dark:border-[#5C3119] flex items-center justify-center animate-pulse shadow-sm">
            <Leaf className="w-8 h-8" />
          </div>
          <p className="text-sm font-semibold text-[#8C8279] dark:text-[#A8A29E]">Loading PantryPilot...</p>
        </div>
      </div>
    );
  }

  // If user is not logged in, show the AuthScreen
  if (!user) {
    return <AuthScreen />;
  }

  // Active items calculation
  const activeItems = inventory.filter((i) => i.status === 'active');
  const urgentCount = activeItems.filter((i) => {
    const days = calculateDaysLeft(i.addedDate, i.estimatedShelfLifeDays);
    return getUrgencyLevel(days) === 'urgent';
  }).length;

  // Handlers
  const handleOpenScan = (mode: 'photo' | 'receipt' = 'photo') => {
    setScanMode(mode);
    setIsScanOpen(true);
  };

  const handleConfirmScannedItems = async (
    scannedItems: ScannedFoodItem[],
    scannedFrom: 'photo' | 'receipt'
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const itemsToAdd: Omit<InventoryItem, 'id'>[] = scannedItems.map((s) => ({
      itemName: s.item,
      item: s.item,
      quantity: s.quantity || '1 portion',
      category: s.category === 'Dairy & Eggs' ? 'Dairy' : s.category || 'Produce',
      estimatedShelfLifeDays: s.estimatedShelfLifeDays || 7,
      addedDate: todayStr,
      storageLocation: s.storageLocation || 'Fridge',
      status: 'active',
      notes: s.confidenceNote || '',
      confidence: s.confidenceNote || 'AI Scan',
    }));

    try {
      await addInventoryItems(user.uid, itemsToAdd);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#166534', '#F27D26', '#EAB308'],
        });
      } catch {
        // ignore
      }
      showToast(`Saved ${itemsToAdd.length} vegetarian items to your Cloud Pantry!`);
    } catch (err: any) {
      console.error('Error adding scanned items:', err);
      showToast(`Failed to save items: ${err.message}`);
    }
  };

  const handleCookItem = async (item: InventoryItem) => {
    try {
      await markItemCooked(user.uid, item);
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#166534', '#F27D26', '#0284C7'],
        });
      } catch {
        // ignore
      }
      showToast(`Zero-Waste win! Rescued ${item.itemName || item.item} from going to waste.`);
    } catch (err: any) {
      console.error('Error marking item cooked:', err);
      showToast(`Could not update item: ${err.message}`);
    }
  };

  const handleCookRecipe = async (recipe: RecipeSuggestion, usedItemIds: string[]) => {
    try {
      for (const id of usedItemIds) {
        const item = inventory.find((i) => i.id === id);
        if (item) {
          await markItemCooked(user.uid, item, recipe.recipeName);
        }
      }
      showToast(`Cooked "${recipe.recipeName}"! Rescued ${usedItemIds.length} ingredients.`);
    } catch (err: any) {
      console.error('Error cooking recipe:', err);
      showToast(`Could not record recipe: ${err.message}`);
    }
  };

  const handleConfirmDiscard = async (item: InventoryItem, reason: string) => {
    try {
      await markItemDiscarded(user.uid, item, reason);
      showToast(`Logged discard of ${item.itemName || item.item}. Added to Waste Insights.`);
    } catch (err: any) {
      console.error('Error discarding item:', err);
      showToast(`Could not log discard: ${err.message}`);
    }
  };

  const handleSaveManualItem = async (
    itemData: Omit<InventoryItem, 'id' | 'status'> & { id?: string }
  ) => {
    try {
      if (itemData.id) {
        await updateInventoryItem(user.uid, itemData.id, itemData);
        showToast(`Updated ${itemData.itemName || itemData.item}.`);
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        await addInventoryItems(user.uid, [
          {
            itemName: itemData.itemName || itemData.item,
            item: itemData.itemName || itemData.item,
            quantity: itemData.quantity || '1 count',
            category: itemData.category || 'Produce',
            estimatedShelfLifeDays: itemData.estimatedShelfLifeDays || 7,
            addedDate: itemData.addedDate || todayStr,
            storageLocation: itemData.storageLocation || 'Fridge',
            status: 'active',
            notes: itemData.notes || '',
            confidence: itemData.confidence || 'Manual entry',
          },
        ]);
        showToast(`Added ${itemData.itemName || itemData.item} to your Cloud Pantry.`);
      }
    } catch (err: any) {
      console.error('Error saving manual item:', err);
      showToast(`Error: ${err.message}`);
    }
  };

  const handleResetDemoData = async () => {
    try {
      await resetToDemoVegetarianPantry(user.uid);
      showToast('Loaded starter 100% vegetarian pantry items into Firestore!');
    } catch (err: any) {
      console.error('Error resetting demo data:', err);
      showToast(`Error: ${err.message}`);
    }
  };

  const handleClearWasteHistory = async () => {
    try {
      await clearWasteLog(user.uid);
      showToast('Waste history cleared.');
    } catch (err: any) {
      console.error('Error clearing waste log:', err);
      showToast(`Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF5] dark:bg-[#181614] text-[#2D2926] dark:text-[#F5F3EF] flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar
        urgentCount={urgentCount}
        wastedCount={wasteLog.length}
        totalActiveCount={activeItems.length}
        userStats={userStats}
        onOpenScan={handleOpenScan}
        onOpenRecipes={() => setIsRecipesOpen(true)}
        onOpenWasteInsights={() => setIsWasteInsightsOpen(true)}
        onOpenManualAdd={() => {
          setItemToEdit(null);
          setIsManualModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <InventoryDashboard
          inventory={inventory}
          isLoading={isDataLoading}
          userStats={userStats}
          onOpenScan={handleOpenScan}
          onOpenRecipes={() => setIsRecipesOpen(true)}
          onOpenManualAdd={() => {
            setItemToEdit(null);
            setIsManualModalOpen(true);
          }}
          onCookItem={handleCookItem}
          onDiscardItem={(item) => setDiscardTargetItem(item)}
          onEditItem={(item) => {
            setItemToEdit(item);
            setIsManualModalOpen(true);
          }}
          onGetAdvice={(item) => setAdviceItem(item)}
          onResetDemoData={handleResetDemoData}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#F0EAD6] dark:border-[#3D3833] bg-[#FFFBF5] dark:bg-[#181614] py-8 mt-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8C8279] dark:text-[#A8A29E] gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-md bg-[#F27D26] text-white flex items-center justify-center">
              <Leaf className="w-3 h-3" />
            </div>
            <span className="font-bold text-[#2D2926] dark:text-[#F5F3EF]">PantryPilot</span>
            <span>• 100% Vegetarian Zero-Waste Kitchen</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              id="btn-reset-demo-pantry"
              onClick={handleResetDemoData}
              className="hover:text-[#2D2926] dark:hover:text-[#F5F3EF] underline font-medium"
            >
              Reset Demo Vegetarian Pantry
            </button>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[#166534] dark:text-[#86EFAC] font-medium">
                <Sparkles className="w-3 h-3 text-[#F27D26]" />
                Gemini + Firestore
              </span>
              <FirebaseHealthIndicator variant="footer" />
            </div>

            {/* Non-intrusive Dev Mode HMR indicator */}
            {import.meta.env.DEV && (
              <div
                id="dev-mode-indicator"
                title="HMR is disabled in this sandboxed environment. Please manually reload/refresh the preview after code changes."
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E5E1D8]/60 dark:bg-[#2D2926] text-[#78716C] dark:text-[#A8A29E] border border-[#D6CEBF]/50 dark:border-[#3D3833] text-[10px] font-medium cursor-help select-none"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Dev Mode (HMR Off • Refresh manually)</span>
                <RefreshCw className="w-2.5 h-2.5 opacity-60 ml-0.5" />
              </div>
            )}
          </div>
        </div>
      </footer>

      {/* Toast Floating Stack Notifications */}
      {toasts.length > 0 && (
        <div
          id="toast-stack-container"
          className="fixed bottom-6 right-6 z-50 flex flex-col space-y-2.5 max-w-sm sm:max-w-md pointer-events-none"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              id={`toast-${toast.id}`}
              className="pointer-events-auto p-3.5 sm:p-4 rounded-2xl bg-[#2D2926] dark:bg-[#262320] text-white shadow-2xl border border-[#E5E1D8]/20 dark:border-[#3D3833] flex items-center justify-between space-x-3 text-xs sm:text-sm font-semibold transition-all transform animate-slideUp backdrop-blur-md"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-6 h-6 rounded-full bg-[#F27D26] text-white shrink-0 flex items-center justify-center shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span className="truncate">{toast.message}</span>
              </div>
              <button
                id={`toast-dismiss-${toast.id}`}
                onClick={() => dismissToast(toast.id)}
                className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 shrink-0 transition-colors"
                aria-label="Dismiss toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODALS */}
      {/* 1. Camera / Photo / Receipt Scan Modal */}
      <ScanModal
        isOpen={isScanOpen}
        initialMode={scanMode}
        onClose={() => setIsScanOpen(false)}
        onConfirmItems={handleConfirmScannedItems}
        onOpenManualAdd={() => {
          setIsScanOpen(false);
          setItemToEdit(null);
          setIsManualModalOpen(true);
        }}
      />

      {/* 2. "Cook This" Recipe Suggestions Modal */}
      <RecipeModal
        isOpen={isRecipesOpen}
        inventory={inventory}
        onClose={() => setIsRecipesOpen(false)}
        onCookRecipe={handleCookRecipe}
      />

      {/* 3. Waste Insights & History Modal */}
      <WasteInsightsModal
        isOpen={isWasteInsightsOpen}
        wastedItems={wasteLog}
        cookedItems={inventory.filter((i) => i.status === 'cooked')}
        userStats={userStats}
        onClose={() => setIsWasteInsightsOpen(false)}
        onClearHistory={handleClearWasteHistory}
      />

      {/* 4. Manual Add / Edit Food Item Modal */}
      <ManualItemModal
        isOpen={isManualModalOpen}
        itemToEdit={itemToEdit}
        onClose={() => {
          setIsManualModalOpen(false);
          setItemToEdit(null);
        }}
        onSave={handleSaveManualItem}
      />

      {/* 5. Storage Advice & Freshness Modal */}
      <StorageAdviceModal
        item={adviceItem}
        isOpen={!!adviceItem}
        onClose={() => setAdviceItem(null)}
      />

      {/* 6. Discard Reason Modal */}
      <DiscardReasonModal
        item={discardTargetItem}
        isOpen={!!discardTargetItem}
        onClose={() => setDiscardTargetItem(null)}
        onConfirmDiscard={handleConfirmDiscard}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FirebaseHealthProvider>
          <PantryPilotMain />
        </FirebaseHealthProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
