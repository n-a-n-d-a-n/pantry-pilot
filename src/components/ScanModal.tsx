import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Receipt,
  Sparkles,
  X,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  RefreshCw,
  Clock,
  MapPin,
  Tag,
  ArrowRight,
  ShieldCheck,
  Leaf,
  Info,
  SearchX,
  History,
} from 'lucide-react';
import { ScannedFoodItem, StorageLocation, FoodCategory, ScanHistoryRecord } from '../types';
import { SAMPLE_PRESETS, SampleImageOption } from '../data/sampleImages';
import { motion, AnimatePresence } from 'motion/react';

interface ScanModalProps {
  isOpen: boolean;
  initialMode?: 'photo' | 'receipt';
  onClose: () => void;
  onConfirmItems: (items: ScannedFoodItem[], scannedFrom: 'photo' | 'receipt') => void;
  onOpenManualAdd?: () => void;
}

const CATEGORIES: FoodCategory[] = [
  'Produce',
  'Dairy',
  'Bakery',
  'Pantry & Dry Goods',
  'Beverages',
  'Frozen',
  'Other',
];

const STORAGE_LOCATIONS: StorageLocation[] = ['Fridge', 'Pantry', 'Freezer', 'Counter'];
const SCAN_HISTORY_KEY = 'pantrypilot_scan_history_v1';

async function createCompactThumbnail(dataUrl: string, maxDim = 180): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      resolve(dataUrl || '');
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export const ScanModal: React.FC<ScanModalProps> = ({
  isOpen,
  initialMode = 'photo',
  onClose,
  onConfirmItems,
  onOpenManualAdd,
}) => {
  const [scanMode, setScanMode] = useState<'photo' | 'receipt'>(initialMode);
  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'samples' | 'history'>('upload');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgressText, setScanProgressText] = useState('Analyzing image...');
  const [scannedResults, setScannedResults] = useState<ScannedFoodItem[] | null>(null);
  const [hasNoItemsFound, setHasNoItemsFound] = useState(false);
  const [nonVegSkippedNote, setNonVegSkippedNote] = useState<string | null>(null);
  const [skippedNonVegItems, setSkippedNonVegItems] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Scan History state (last 5 scans)
  const [scanHistory, setScanHistory] = useState<ScanHistoryRecord[]>(() => {
    try {
      const raw = localStorage.getItem(SCAN_HISTORY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
    } catch (e) {
      return [];
    }
  });

  // Camera stream refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Sync mode
  useEffect(() => {
    setScanMode(initialMode);
  }, [initialMode]);

  // Clean camera on close/unmount
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setPreviewImage(null);
    setIsScanning(false);
    setScannedResults(null);
    setHasNoItemsFound(false);
    setNonVegSkippedNote(null);
    setSkippedNonVegItems([]);
    setErrorMessage(null);
    stopCamera();
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access not granted or unavailable. Try uploading an image or selecting a sample preset below.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureCameraFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      stopCamera();
      setPreviewImage(dataUrl);
      setHasNoItemsFound(false);
      processImageWithGemini(dataUrl, scanMode);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPreviewImage(base64);
      setHasNoItemsFound(false);
      processImageWithGemini(base64, scanMode);
    };
    reader.readAsDataURL(file);
  };

  const handleSampleSelect = (sample: SampleImageOption) => {
    const base64 = sample.generateBase64();
    setPreviewImage(base64);
    setHasNoItemsFound(false);
    if (sample.category === 'receipt') {
      setScanMode('receipt');
      processImageWithGemini(base64, 'receipt');
    } else {
      setScanMode('photo');
      processImageWithGemini(base64, 'photo');
    }
  };

  const processImageWithGemini = async (imageBase64: string, mode: 'photo' | 'receipt') => {
    setIsScanning(true);
    setErrorMessage(null);
    setNonVegSkippedNote(null);
    setSkippedNonVegItems([]);
    setHasNoItemsFound(false);
    setScanProgressText('Scanning image pixels...');

    // Progress text simulation during AI inference
    const timer1 = setTimeout(() => {
      setScanProgressText(
        mode === 'receipt'
          ? 'Extracting vegetarian receipt items via Gemini OCR...'
          : 'Gemini 2.5 Flash identifying vegetarian food items & quantities...'
      );
    }, 900);

    const timer2 = setTimeout(() => {
      setScanProgressText('Estimating realistic zero-waste shelf life windows...');
    }, 2200);

    try {
      const response = await fetch('/api/scan/groceries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mode,
          mimeType: 'image/jpeg',
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned error ${response.status}`);
      }

      const data = await response.json();
      const skippedList: string[] = Array.isArray(data.skippedNonVegetarian)
        ? data.skippedNonVegetarian
        : Array.isArray(data.skippedNonVegetarianItems)
        ? data.skippedNonVegetarianItems
        : [];
      setSkippedNonVegItems(skippedList);

      if (data.nonVegNote) {
        setNonVegSkippedNote(data.nonVegNote);
      }

      if (Array.isArray(data.items) && data.items.length > 0) {
        // Sanitize category if obsolete "Dairy & Eggs" was returned
        const sanitized = data.items.map((it: any) => ({
          ...it,
          category: it.category === 'Dairy & Eggs' ? 'Dairy' : it.category || 'Produce',
        }));
        setScannedResults(sanitized);
        setHasNoItemsFound(false);

        // Record scan into history (last 5 scans)
        saveScanToHistory(sanitized, imageBase64, mode);
      } else {
        // Zero items identified: do NOT fabricate fake items, show empty state
        setScannedResults(null);
        setHasNoItemsFound(true);
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      let userFriendlyMsg = err.message || 'Failed to scan image with Gemini. Please try again.';
      if (
        userFriendlyMsg.includes('503') ||
        userFriendlyMsg.includes('high demand') ||
        userFriendlyMsg.includes('UNAVAILABLE')
      ) {
        userFriendlyMsg = 'The AI model is momentarily experiencing high demand. Please click "Retry Scan" below.';
      }
      setErrorMessage(userFriendlyMsg);
    } finally {
      setIsScanning(false);
    }
  };

  // Scan History Management
  const saveScanToHistory = async (items: ScannedFoodItem[], imageBase64: string, mode: 'photo' | 'receipt') => {
    try {
      const thumb = await createCompactThumbnail(imageBase64);
      const newRecord: ScanHistoryRecord = {
        id: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
        mode,
        thumbnailUrl: thumb,
        items,
        itemCount: items.length,
      };
      setScanHistory((prev) => {
        const updated = [newRecord, ...prev.filter((r) => r.id !== newRecord.id)].slice(0, 5);
        try {
          localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(updated));
        } catch (err) {
          console.warn('Scan history localStorage notice:', err);
        }
        return updated;
      });
    } catch (e) {
      console.warn('Failed to save scan to history:', e);
    }
  };

  const handleSelectHistoryRecord = (record: ScanHistoryRecord) => {
    setPreviewImage(record.thumbnailUrl);
    setScanMode(record.mode);
    setScannedResults(record.items);
    setHasNoItemsFound(false);
    setNonVegSkippedNote(null);
    setSkippedNonVegItems([]);
  };

  const handleDeleteHistoryRecord = (recordId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setScanHistory((prev) => {
      const updated = prev.filter((r) => r.id !== recordId);
      try {
        localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });
  };

  const handleClearAllHistory = () => {
    setScanHistory([]);
    try {
      localStorage.removeItem(SCAN_HISTORY_KEY);
    } catch (e) {}
  };

  const formatScanTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return 'Recently';
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const isToday = date.toDateString() === now.toDateString();
      if (isToday) {
        return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recently';
    }
  };

  // Editable table helpers
  const handleItemChange = (index: number, field: keyof ScannedFoodItem, value: any) => {
    if (!scannedResults) return;
    const updated = [...scannedResults];
    updated[index] = { ...updated[index], [field]: value };
    setScannedResults(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (!scannedResults) return;
    const updated = scannedResults.filter((_, i) => i !== index);
    if (updated.length === 0) {
      setScannedResults(null);
      setHasNoItemsFound(true);
      setSkippedNonVegItems([]);
    } else {
      setScannedResults(updated);
    }
  };

  const handleAddNewRow = () => {
    const newItem: ScannedFoodItem = {
      item: 'Vegetarian Food Item',
      quantity: '1 count',
      estimatedShelfLifeDays: 7,
      category: 'Produce',
      storageLocation: 'Fridge',
    };
    setScannedResults([...(scannedResults || []), newItem]);
    setHasNoItemsFound(false);
  };

  const handleSaveToPantry = () => {
    if (!scannedResults || scannedResults.length === 0) return;
    onConfirmItems(scannedResults, scanMode);
    onClose();
  };

  const handleTryAgain = () => {
    setHasNoItemsFound(false);
    setErrorMessage(null);
    if (activeTab === 'camera') {
      startCamera();
    } else if (previewImage) {
      processImageWithGemini(previewImage, scanMode);
    } else {
      setActiveTab('camera');
      startCamera();
    }
  };

  const handleUploadDifferent = () => {
    resetState();
    setActiveTab('upload');
  };

  const handleAddManually = () => {
    onClose();
    if (onOpenManualAdd) {
      onOpenManualAdd();
    }
  };

  const isAllFilteredEmpty =
    hasNoItemsFound &&
    (!scannedResults || scannedResults.length === 0) &&
    skippedNonVegItems.length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="bg-[#FFFBF5]/95 dark:bg-[#181614]/95 backdrop-blur-xl rounded-3xl max-w-3xl w-full shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden flex flex-col max-h-[92vh] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 sm:px-7 py-4 border-b border-[#F0EAD6]/80 dark:border-[#3D3833]/80 flex items-center justify-between bg-white/90 dark:bg-[#262320]/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF2E6] dark:bg-[#382012] text-[#F27D26] border border-[#FFD8B8] dark:border-[#5C3119] flex items-center justify-center">
              {scanMode === 'receipt' ? <Receipt className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-[#2D2926] dark:text-[#F5F3EF]">
                  {scannedResults
                    ? 'Confirm Scanned Items'
                    : hasNoItemsFound
                    ? isAllFilteredEmpty
                      ? 'Only Non-Vegetarian Items Found'
                      : 'No Items Identified'
                    : 'Scan Vegetarian Groceries & Fridge'}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F0FDF4] dark:bg-[#142E1F] text-[#166534] dark:text-[#86EFAC] border border-[#DCFCE7] dark:border-[#1E4D2B]">
                  <Leaf className="w-2.5 h-2.5" />
                  Vegetarian
                </span>
              </div>
              <p className="text-xs text-[#8C8279] dark:text-[#A8A29E]">
                {scannedResults
                  ? 'Review AI estimations and adjust if needed before adding to your pantry'
                  : hasNoItemsFound
                  ? isAllFilteredEmpty
                    ? 'Identified items were excluded because PantryPilot tracks vegetarian groceries only'
                    : 'Gemini vision could not detect identifiable food items in this image'
                  : 'Multimodal AI identifies vegetarian items, quantities, and predicts expiry dates'}
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
          {/* Non-Vegetarian Filter Alert Banner (if non-veg items were detected and skipped) */}
          {nonVegSkippedNote && (
            <div className="p-3.5 rounded-2xl bg-[#FFFBEB] dark:bg-[#32230F] border border-[#FEF3C7] dark:border-[#523B19] text-[#92400E] dark:text-[#FDE68A] text-xs flex items-start gap-2.5 shadow-2xs">
              <Info className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-[#78350F] dark:text-[#FDE68A]">Vegetarian Filter Notice</p>
                <p className="mt-0.5 text-[#92400E] dark:text-[#FCD34D]">{nonVegSkippedNote}</p>
              </div>
              <button
                type="button"
                onClick={() => setNonVegSkippedNote(null)}
                className="text-[#92400E] dark:text-[#FDE68A] hover:text-[#78350F]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* EMPTY RESULTS STATE (Zero Items Found or All Items Filtered Out) */}
          {hasNoItemsFound && !isScanning && (
            <div className="py-8 px-4 sm:px-8 text-center space-y-6 max-w-lg mx-auto">
              {isAllFilteredEmpty ? (
                <div className="w-20 h-20 rounded-3xl bg-[#F0FDF4] dark:bg-[#142E1F] border border-[#DCFCE7] dark:border-[#1E4D2B] text-[#166534] dark:text-[#86EFAC] mx-auto flex items-center justify-center shadow-xs">
                  <Leaf className="w-10 h-10" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-3xl bg-[#FFF2E6] dark:bg-[#382012] border border-[#FFD8B8] dark:border-[#5C3119] text-[#F27D26] mx-auto flex items-center justify-center shadow-xs">
                  <SearchX className="w-10 h-10" />
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-bold text-[#2D2926] dark:text-[#F5F3EF]">
                  {isAllFilteredEmpty
                    ? 'Only Non-Vegetarian Items Found'
                    : "We couldn't identify any items in this photo"}
                </h3>
                <p className="text-xs sm:text-sm text-[#8C8279] dark:text-[#A8A29E] leading-relaxed">
                  {isAllFilteredEmpty ? (
                    <>
                      This photo only contained non-vegetarian item(s) (
                      <span className="font-semibold text-[#2D2926] dark:text-[#F5F3EF]">
                        {skippedNonVegItems.join(', ')}
                      </span>
                      ), which have been excluded since PantryPilot tracks vegetarian groceries only. Nothing was added to your pantry.
                    </>
                  ) : (
                    'The photo might be blurry, in low light, or contain non-food items. No fake items were added to your pantry.'
                  )}
                </p>
              </div>

              {previewImage && (
                <div className="inline-block p-1.5 bg-white dark:bg-[#262320] border border-[#E5E1D8] dark:border-[#3D3833] rounded-2xl shadow-2xs max-w-[180px]">
                  <img
                    src={previewImage}
                    alt="Scanned attempt"
                    className="w-full h-24 object-cover rounded-xl"
                  />
                  <span className="block text-[10px] text-[#8C8279] dark:text-[#A8A29E] mt-1 text-center">
                    Scanned image preview
                  </span>
                </div>
              )}

              {/* Three Distinct Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTryAgain}
                  className="py-3 px-4 rounded-2xl bg-[#F27D26] hover:brightness-105 text-white font-bold text-xs shadow-md shadow-[#F27D26]/20 flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again</span>
                </button>

                <button
                  type="button"
                  onClick={handleUploadDifferent}
                  className="py-3 px-4 rounded-2xl border border-[#E5E1D8] dark:border-[#3D3833] bg-white dark:bg-[#262320] hover:bg-[#F5F5F0] dark:hover:bg-[#2F2A26] text-[#2D2926] dark:text-[#F5F3EF] font-bold text-xs shadow-2xs flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Upload className="w-4 h-4 text-[#8C8279] dark:text-[#A8A29E]" />
                  <span>Upload Different Photo</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddManually}
                  className="py-3 px-4 rounded-2xl border border-[#166534]/30 dark:border-[#86EFAC]/30 bg-[#F0FDF4] dark:bg-[#142E1F] hover:bg-[#DCFCE7] dark:hover:bg-[#1E4D2B] text-[#166534] dark:text-[#86EFAC] font-bold text-xs shadow-2xs flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Manually</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: UPLOAD / CAMERA / SAMPLE SELECTION (If not yet scanned or re-taking) */}
          {!scannedResults && !isScanning && !hasNoItemsFound && (
            <>
              {/* Scan Mode Toggle (Photo vs Receipt OCR) */}
              <div className="flex items-center p-1 bg-[#F5F5F0] dark:bg-[#2F2A26] rounded-2xl border border-[#E5E1D8] dark:border-[#3D3833]">
                <button
                  type="button"
                  onClick={() => setScanMode('photo')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-2 ${
                    scanMode === 'photo'
                      ? 'bg-white dark:bg-[#181614] text-[#F27D26] shadow-xs'
                      : 'text-[#8C8279] dark:text-[#A8A29E] hover:text-[#2D2926] dark:hover:text-[#F5F3EF]'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Groceries & Fridge Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScanMode('receipt')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-2 ${
                    scanMode === 'receipt'
                      ? 'bg-white dark:bg-[#181614] text-[#F27D26] shadow-xs'
                      : 'text-[#8C8279] dark:text-[#A8A29E] hover:text-[#2D2926] dark:hover:text-[#F5F3EF]'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>Grocery Store Receipt</span>
                </button>
              </div>

              {/* Source Tabs: Upload vs Live Camera vs Quick Presets vs Scan History */}
              <div className="flex border-b border-[#F0EAD6] dark:border-[#3D3833] text-xs sm:text-sm font-medium space-x-4 sm:space-x-6 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => {
                    stopCamera();
                    setActiveTab('upload');
                  }}
                  className={`pb-2 transition-colors border-b-2 flex items-center space-x-1.5 whitespace-nowrap ${
                    activeTab === 'upload'
                      ? 'border-[#F27D26] text-[#F27D26] font-bold'
                      : 'border-transparent text-[#8C8279] dark:text-[#A8A29E] hover:text-[#2D2926] dark:hover:text-[#F5F3EF]'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload File / Drag Photo</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('camera');
                    startCamera();
                  }}
                  className={`pb-2 transition-colors border-b-2 flex items-center space-x-1.5 whitespace-nowrap ${
                    activeTab === 'camera'
                      ? 'border-[#F27D26] text-[#F27D26] font-bold'
                      : 'border-transparent text-[#8C8279] dark:text-[#A8A29E] hover:text-[#2D2926] dark:hover:text-[#F5F3EF]'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Take Live Photo</span>
                </button>
                <button
                  onClick={() => {
                    stopCamera();
                    setActiveTab('samples');
                  }}
                  className={`pb-2 transition-colors border-b-2 flex items-center space-x-1.5 whitespace-nowrap ${
                    activeTab === 'samples'
                      ? 'border-[#F27D26] text-[#F27D26] font-bold'
                      : 'border-transparent text-[#8C8279] dark:text-[#A8A29E] hover:text-[#2D2926] dark:hover:text-[#F5F3EF]'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-[#F27D26]" />
                  <span>1-Click Demo Samples</span>
                </button>
                <button
                  id="tab-btn-history"
                  onClick={() => {
                    stopCamera();
                    setActiveTab('history');
                  }}
                  className={`pb-2 transition-colors border-b-2 flex items-center space-x-1.5 whitespace-nowrap ${
                    activeTab === 'history'
                      ? 'border-[#F27D26] text-[#F27D26] font-bold'
                      : 'border-transparent text-[#8C8279] dark:text-[#A8A29E] hover:text-[#2D2926] dark:hover:text-[#F5F3EF]'
                  }`}
                >
                  <History className="w-4 h-4 text-[#F27D26]" />
                  <span>Scan History</span>
                  {scanHistory.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#FFF2E6] dark:bg-[#382012] text-[#F27D26] border border-[#FFD8B8] dark:border-[#5C3119]">
                      {scanHistory.length}
                    </span>
                  )}
                </button>
              </div>

              {/* TAB 1: FILE DRAG & DROP */}
              {activeTab === 'upload' && (
                <div className="space-y-4">
                  <label
                    htmlFor="photo-file-input"
                    className="border-2 border-dashed border-[#E5E1D8] dark:border-[#3D3833] hover:border-[#F27D26] dark:hover:border-[#F27D26] rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center bg-white dark:bg-[#262320] hover:bg-[#FFF2E6]/30 dark:hover:bg-[#382012]/30 group"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-[#FFF2E6] dark:bg-[#382012] text-[#F27D26] border border-[#FFD8B8] dark:border-[#5C3119] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-xs">
                      {scanMode === 'receipt' ? <Receipt className="w-8 h-8" /> : <Camera className="w-8 h-8" />}
                    </div>
                    <span className="text-base sm:text-lg font-bold text-[#2D2926] dark:text-[#F5F3EF]">
                      {scanMode === 'receipt'
                        ? 'Click to upload receipt photo or drag & drop'
                        : 'Click to upload grocery/fridge photo or drag & drop'}
                    </span>
                    <span className="text-xs text-[#8C8279] dark:text-[#A8A29E] mt-1 max-w-sm">
                      Supports JPG, PNG, WEBP. Gemini vision identifies vegetarian produce, dairy & pantry items with zero manual typing.
                    </span>
                    <span className="mt-4 px-5 py-2.5 rounded-xl bg-[#F27D26] text-white text-xs font-bold shadow-xs hover:brightness-105">
                      Select Photo from Device
                    </span>
                    <input
                      id="photo-file-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              )}

              {/* TAB 2: LIVE CAMERA FEED */}
              {activeTab === 'camera' && (
                <div className="space-y-4">
                  {cameraError ? (
                    <div className="p-4 rounded-2xl bg-[#FEF2F2] dark:bg-[#331515] border border-[#FEE2E2] dark:border-[#5C2323] text-[#991B1B] dark:text-[#FCA5A5] text-xs sm:text-sm flex items-start space-x-2">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">{cameraError}</p>
                        <p className="mt-1">
                          You can switch to the "Upload File" or "1-Click Demo Samples" tab above to test immediately.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center shadow-inner">
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {/* Aim box overlay */}
                      <div className="absolute inset-8 border-2 border-white/50 border-dashed rounded-2xl pointer-events-none flex items-center justify-center">
                        <span className="bg-black/60 backdrop-blur-xs text-white text-xs px-3 py-1 rounded-full">
                          {scanMode === 'receipt' ? 'Align receipt in frame' : 'Aim at groceries or fridge'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center">
                    <button
                      type="button"
                      disabled={!isCameraActive}
                      onClick={captureCameraFrame}
                      className="px-6 py-3 rounded-2xl bg-[#F27D26] hover:brightness-105 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-[#F27D26]/25 flex items-center space-x-2 transition-all active:scale-95"
                    >
                      <Camera className="w-5 h-5" />
                      <span>Snap Photo & Analyze</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: DEMO PRESETS */}
              {activeTab === 'samples' && (
                <div className="space-y-3">
                  <p className="text-xs text-[#8C8279] dark:text-[#A8A29E]">
                    No photo handy? Click any vegetarian sample below to test Gemini AI vision instantly:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {SAMPLE_PRESETS.map((sample) => (
                      <button
                        key={sample.id}
                        onClick={() => handleSampleSelect(sample)}
                        className="text-left p-4 rounded-2xl border border-[#F0EAD6] dark:border-[#3D3833] bg-white dark:bg-[#262320] hover:border-[#F27D26] dark:hover:border-[#F27D26] transition-all group flex flex-col justify-between"
                      >
                        <div>
                          <div
                            className="w-full h-20 rounded-xl bg-[#F5F5F0] dark:bg-[#2F2A26] border border-[#E5E1D8] dark:border-[#3D3833] flex items-center justify-center text-2xl mb-3 group-hover:scale-102 transition-transform"
                          >
                            {sample.category === 'produce' ? '🥑 🍅 🧈' : sample.category === 'fridge' ? '🧊 🧀 🍓' : '🧾 🏷️'}
                          </div>
                          <h4 className="font-bold text-sm text-[#2D2926] dark:text-[#F5F3EF]">
                            {sample.name}
                          </h4>
                          <p className="text-xs text-[#8C8279] dark:text-[#A8A29E] mt-1">
                            {sample.description}
                          </p>
                        </div>
                        <div className="mt-3 flex items-center text-xs font-bold text-[#F27D26]">
                          <span>Scan this sample</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: SCAN HISTORY (Last 5 Scanned Photos & Extracted Items) */}
              <AnimatePresence>
                {activeTab === 'history' && (
                  <motion.div
                    id="scan-history-section"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4 pt-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-[#2D2926] dark:text-[#F5F3EF] flex items-center gap-2">
                            <span>Recent Scan History</span>
                            <span className="text-xs font-normal text-[#8C8279] dark:text-[#A8A29E]">
                              (Last {scanHistory.length} of 5 photos)
                            </span>
                          </h3>
                          <p className="text-xs text-[#8C8279] dark:text-[#A8A29E]">
                            Review photo thumbnails and items extracted during recent scans.
                          </p>
                        </div>
                        {scanHistory.length > 0 && (
                          <button
                            id="btn-clear-scan-history"
                            type="button"
                            onClick={handleClearAllHistory}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg text-[#8C8279] dark:text-[#A8A29E] hover:text-[#991B1B] dark:hover:text-[#FCA5A5] hover:bg-[#FEF2F2] dark:hover:bg-[#331515] transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Clear History</span>
                          </button>
                        )}
                      </div>

                      {scanHistory.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.25, delay: 0.1 }}
                          className="p-8 text-center rounded-2xl border-2 border-dashed border-[#E5E1D8] dark:border-[#3D3833] bg-white dark:bg-[#262320] space-y-3"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-[#F5F5F0] dark:bg-[#2F2A26] text-[#8C8279] dark:text-[#A8A29E] flex items-center justify-center mx-auto">
                            <History className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-[#2D2926] dark:text-[#F5F3EF]">No Scan History Yet</p>
                            <p className="text-xs text-[#8C8279] dark:text-[#A8A29E] max-w-sm mx-auto">
                              When you upload grocery pictures, snap live photos, or test demo samples, your last 5 extractions will be recorded here for quick review and re-use.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab('upload')}
                            className="px-4 py-2 rounded-xl bg-[#F27D26] text-white text-xs font-bold shadow-xs hover:brightness-105"
                          >
                            Scan a Photo Now
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div
                          initial="hidden"
                          animate="show"
                          variants={{
                            hidden: { opacity: 0 },
                            show: {
                              opacity: 1,
                              transition: {
                                staggerChildren: 0.06,
                              },
                            },
                          }}
                          className="space-y-3"
                        >
                          {scanHistory.map((record, index) => (
                            <motion.div
                              key={record.id || `history-${index}`}
                              id={`scan-history-card-${index}`}
                              variants={{
                                hidden: { opacity: 0, y: 12 },
                                show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
                              }}
                              className="p-3.5 rounded-2xl border border-[#F0EAD6] dark:border-[#3D3833] bg-white dark:bg-[#262320] hover:border-[#F27D26] dark:hover:border-[#F27D26] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs group"
                            >
                              <div className="flex items-start sm:items-center space-x-3 min-w-0">
                                {/* Photo Thumbnail */}
                                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#F5F5F0] dark:bg-[#2F2A26] border border-[#E5E1D8] dark:border-[#3D3833] shrink-0">
                                  {record.thumbnailUrl ? (
                                    <img
                                      src={record.thumbnailUrl}
                                      alt="Scanned item preview"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-lg">
                                      {record.mode === 'receipt' ? '🧾' : '🥗'}
                                    </div>
                                  )}
                                  <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded text-[8px] font-bold bg-black/70 text-white uppercase">
                                    {record.mode === 'receipt' ? 'Receipt' : 'Photo'}
                                  </span>
                                </div>

                                {/* Extracted Details */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-[#2D2926] dark:text-[#F5F3EF]">
                                      {record.itemCount} item{record.itemCount !== 1 ? 's' : ''} extracted
                                    </span>
                                    <span className="text-[11px] text-[#8C8279] dark:text-[#A8A29E] flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatScanTime(record.timestamp)}
                                    </span>
                                  </div>

                                  {/* Extracted Item Pills */}
                                  <div className="flex flex-wrap gap-1.5 mt-1.5 max-h-16 overflow-hidden">
                                    {record.items.slice(0, 4).map((it, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#F5F5F0] dark:bg-[#2F2A26] text-[#2D2926] dark:text-[#F5F3EF] border border-[#E5E1D8] dark:border-[#3D3833]"
                                      >
                                        <span className="font-semibold text-[#F27D26]">{it.quantity}</span> {it.item}
                                      </span>
                                    ))}
                                    {record.items.length > 4 && (
                                      <span className="text-[10px] text-[#8C8279] dark:text-[#A8A29E] self-center">
                                        +{record.items.length - 4} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                <button
                                  id={`btn-load-history-${index}`}
                                  type="button"
                                  onClick={() => handleSelectHistoryRecord(record)}
                                  className="px-3 py-1.5 rounded-xl bg-[#FFF2E6] dark:bg-[#382012] hover:bg-[#F27D26] text-[#F27D26] hover:text-white border border-[#FFD8B8] dark:border-[#5C3119] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                                >
                                  <span>Review & Use</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  id={`btn-delete-history-${index}`}
                                  type="button"
                                  onClick={(e) => handleDeleteHistoryRecord(record.id, e)}
                                  className="p-1.5 rounded-xl text-[#8C8279] dark:text-[#A8A29E] hover:text-[#991B1B] dark:hover:text-[#FCA5A5] hover:bg-[#FEF2F2] dark:hover:bg-[#331515] transition-colors"
                                  title="Delete this scan log"
                                  aria-label="Delete scan record"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {/* STEP 2: LOADING SCAN STATE */}
          {isScanning && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-5 animate-pulse">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-[#FFF2E6] dark:bg-[#382012] border border-[#FFD8B8] dark:border-[#5C3119] flex items-center justify-center text-[#F27D26]">
                  <Sparkles className="w-10 h-10 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#F27D26] text-white flex items-center justify-center text-xs font-bold shadow-md">
                  AI
                </div>
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="text-lg font-bold text-[#2D2926] dark:text-[#F5F3EF]">
                  Analyzing with Gemini Vision
                </h3>
                <p className="text-sm text-[#8C8279] dark:text-[#A8A29E] font-medium">
                  {scanProgressText}
                </p>
                <div className="w-48 h-1.5 bg-[#E5E1D8] dark:bg-[#3D3833] rounded-full mx-auto overflow-hidden mt-3">
                  <div className="w-full h-full bg-[#F27D26] rounded-full animate-indeterminate"></div>
                </div>
              </div>
            </div>
          )}

          {/* ERROR DISPLAY */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-[#FEF2F2] dark:bg-[#331515] border border-[#FEE2E2] dark:border-[#5C2323] text-[#991B1B] dark:text-[#FCA5A5] text-sm flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Scan encountered an issue</p>
                <p className="mt-0.5 text-xs text-[#7F1D1D] dark:text-[#F87171]">{errorMessage}</p>
                <div className="mt-3 flex items-center gap-3">
                  {previewImage && (
                    <button
                      type="button"
                      onClick={() => processImageWithGemini(previewImage, scanMode)}
                      className="px-3 py-1.5 rounded-lg bg-[#991B1B] text-white text-xs font-bold shadow-xs hover:bg-[#7F1D1D] transition-colors"
                    >
                      Retry Scan
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={resetState}
                    className="text-xs font-semibold text-[#991B1B] dark:text-[#FCA5A5] underline hover:text-[#7F1D1D]"
                  >
                    Try another photo or preset
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: EDITABLE RESULTS CONFIRMATION TABLE */}
          {scannedResults && !isScanning && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-[#166534] dark:text-[#86EFAC]" />
                  <span className="text-sm font-bold text-[#2D2926] dark:text-[#F5F3EF]">
                    Recognized {scannedResults.length} vegetarian item{scannedResults.length > 1 ? 's' : ''}:
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddNewRow}
                  className="px-3 py-1.5 rounded-xl border border-[#E5E1D8] dark:border-[#3D3833] bg-white dark:bg-[#262320] hover:bg-[#F5F5F0] dark:hover:bg-[#2F2A26] text-xs font-bold text-[#2D2926] dark:text-[#F5F3EF] flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5 text-[#F27D26]" />
                  <span>Add Item</span>
                </button>
              </div>

              {/* Items Table */}
              <div className="border border-[#F0EAD6] dark:border-[#3D3833] bg-white dark:bg-[#262320] rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-[#F5F5F0] dark:bg-[#2F2A26] text-[#8C8279] dark:text-[#A8A29E] font-bold border-b border-[#F0EAD6] dark:border-[#3D3833] sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Item Name</th>
                        <th className="py-2.5 px-3">Quantity</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Shelf Life</th>
                        <th className="py-2.5 px-3">Storage</th>
                        <th className="py-2.5 px-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EAD6] dark:divide-[#3D3833]">
                      {scannedResults.map((item, idx) => (
                        <tr
                          key={`scan-row-${idx}`}
                          className="hover:bg-[#FFFBF5] dark:hover:bg-[#2F2A26]/50 transition-colors"
                        >
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.item}
                              onChange={(e) => handleItemChange(idx, 'item', e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-[#E5E1D8] dark:border-[#3D3833] bg-white dark:bg-[#181614] text-[#2D2926] dark:text-[#F5F3EF] font-semibold text-xs sm:text-sm focus:ring-2 focus:ring-[#F27D26]"
                              placeholder="e.g. Roma Tomatoes"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                              className="w-28 px-2 py-1.5 rounded-lg border border-[#E5E1D8] dark:border-[#3D3833] bg-white dark:bg-[#181614] text-[#2D2926] dark:text-[#F5F3EF] text-xs sm:text-sm focus:ring-2 focus:ring-[#F27D26]"
                              placeholder="e.g. 3 medium"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={item.category}
                              onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                              className="px-2 py-1.5 rounded-lg border border-[#E5E1D8] dark:border-[#3D3833] bg-white dark:bg-[#181614] text-[#2D2926] dark:text-[#F5F3EF] text-xs font-semibold focus:ring-2 focus:ring-[#F27D26]"
                            >
                              {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center space-x-1.5">
                              <input
                                type="number"
                                min="1"
                                max="730"
                                value={item.estimatedShelfLifeDays}
                                onChange={(e) =>
                                  handleItemChange(
                                    idx,
                                    'estimatedShelfLifeDays',
                                    parseInt(e.target.value, 10) || 1
                                  )
                                }
                                className="w-16 px-2 py-1.5 rounded-lg border border-[#E5E1D8] dark:border-[#3D3833] bg-white dark:bg-[#181614] text-[#2D2926] dark:text-[#F5F3EF] text-xs font-bold text-center focus:ring-2 focus:ring-[#F27D26]"
                              />
                              <span className="text-xs text-[#8C8279] dark:text-[#A8A29E] font-medium">days</span>
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={item.storageLocation || 'Fridge'}
                              onChange={(e) =>
                                handleItemChange(idx, 'storageLocation', e.target.value as StorageLocation)
                              }
                              className="px-2 py-1.5 rounded-lg border border-[#E5E1D8] dark:border-[#3D3833] bg-white dark:bg-[#181614] text-[#2D2926] dark:text-[#F5F3EF] text-xs font-semibold focus:ring-2 focus:ring-[#F27D26]"
                            >
                              {STORAGE_LOCATIONS.map((loc) => (
                                <option key={loc} value={loc}>
                                  {loc}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-[#8C8279] dark:text-[#A8A29E] hover:text-[#991B1B] dark:hover:text-[#FCA5A5] hover:bg-[#FEF2F2] dark:hover:bg-[#331515] transition-colors active:scale-95 mx-auto"
                              title="Remove item"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Confidence Notice */}
              <div className="p-3 bg-white dark:bg-[#262320] rounded-xl border border-[#F0EAD6] dark:border-[#3D3833] text-xs text-[#8C8279] dark:text-[#A8A29E] flex items-center justify-between">
                <span>
                  💡 <strong>Pro-Tip:</strong> Estimated shelf lives reflect optimal vegetarian storage. You can adjust days if an item is already very ripe.
                </span>
                <button
                  type="button"
                  onClick={resetState}
                  className="text-[#F27D26] font-bold hover:underline flex items-center space-x-1 shrink-0 ml-2"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Scan Different Photo</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-7 py-4 border-t border-[#F0EAD6]/80 dark:border-[#3D3833]/80 bg-white/90 dark:bg-[#262320]/90 backdrop-blur-sm flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#E5E1D8] dark:border-[#3D3833] text-[#2D2926] dark:text-[#F5F3EF] font-semibold text-xs sm:text-sm hover:bg-[#F5F5F0] dark:hover:bg-[#2F2A26] transition-colors"
          >
            Cancel
          </button>

          {scannedResults ? (
            <button
              id="confirm-inventory-save-btn"
              type="button"
              onClick={handleSaveToPantry}
              className="px-6 py-2.5 rounded-xl bg-[#F27D26] hover:brightness-105 text-white font-bold text-xs sm:text-sm shadow-md shadow-[#F27D26]/20 flex items-center space-x-2 transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Save {scannedResults.length} Items to Cloud Pantry</span>
            </button>
          ) : (
            <div className="text-xs text-[#8C8279] dark:text-[#A8A29E] font-medium">
              3 steps: Take photo → Confirm AI data → Saved!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
