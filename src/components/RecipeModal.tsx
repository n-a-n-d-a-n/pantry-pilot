import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Clock,
  ChefHat,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Flame,
  CheckCircle2,
  X,
  RefreshCw,
  ShoppingBag,
  Sparkle,
  Leaf,
  Languages,
  UtensilsCrossed,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { InventoryItem, RecipeSuggestion, calculateDaysLeft, getUrgencyLevel } from '../types';

interface RecipeModalProps {
  isOpen: boolean;
  inventory: InventoryItem[];
  onClose: () => void;
  onCookRecipe: (recipe: RecipeSuggestion, usedItemIds: string[]) => void;
}

interface ImageCacheEntry {
  url?: string;
  status: 'idle' | 'loading' | 'loaded' | 'error';
}

interface RecipeImageBannerProps {
  recipe: RecipeSuggestion;
  cached?: ImageCacheEntry;
  onUpdateCache: (recipeId: string, entry: ImageCacheEntry) => void;
  onClickHeader?: () => void;
}

const RecipeImageBanner: React.FC<RecipeImageBannerProps> = ({
  recipe,
  cached,
  onUpdateCache,
  onClickHeader,
}) => {
  const recipeId = recipe.id;
  const status = cached?.status || 'idle';
  const imageUrl = cached?.url;

  useEffect(() => {
    // If already attempted, loaded, or in-flight, skip re-fetch
    if (status !== 'idle') return;

    let isMounted = true;
    onUpdateCache(recipeId, { status: 'loading' });

    /**
     * COST AWARENESS:
     * Note: Calling Gemini image generation models incurs a real per-image API cost
     * and adds latency per recipe. This is an intentional tradeoff requested by the user,
     * executed asynchronously and lazily per recipe card in the background rather than blocking initial text recipes.
     */
    const fetchImage = async () => {
      try {
        const response = await fetch('/api/recipes/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipeName: recipe.recipeName,
            keyIngredients: recipe.usesIngredients,
          }),
        });

        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}`);
        }

        const data = await response.json();
        if (data?.imageUrl && isMounted) {
          onUpdateCache(recipeId, { url: data.imageUrl, status: 'loaded' });
        } else if (isMounted) {
          onUpdateCache(recipeId, { status: 'error' });
        }
      } catch (err) {
        if (isMounted) {
          onUpdateCache(recipeId, { status: 'error' });
        }
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
    };
  }, [recipeId, recipe.recipeName, status]);

  if (status === 'loaded' && imageUrl) {
    return (
      <div
        onClick={onClickHeader}
        className="w-full aspect-[16/9] sm:h-52 bg-[#F5F5F0] dark:bg-[#1E1B18] overflow-hidden relative group cursor-pointer"
      >
        <img
          src={imageUrl}
          alt={recipe.recipeName}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        <span className="absolute bottom-2.5 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 backdrop-blur-md text-white/90 border border-white/10 flex items-center gap-1 shadow-2xs">
          <Sparkles className="w-3 h-3 text-[#F27D26]" />
          AI Visual
        </span>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div
        onClick={onClickHeader}
        className="w-full aspect-[16/9] sm:h-48 bg-[#F5F5F0] dark:bg-[#262320] flex flex-col items-center justify-center text-[#8C8279] dark:text-[#A8A29E] relative overflow-hidden animate-pulse border-b border-[#F0EAD6] dark:border-[#3D3833] cursor-pointer"
      >
        <div className="w-10 h-10 rounded-2xl bg-[#FFF2E6] dark:bg-[#382012] text-[#F27D26] flex items-center justify-center mb-2 shadow-2xs">
          <Sparkles className="w-5 h-5 animate-spin text-[#F27D26]" />
        </div>
        <span className="text-xs font-semibold tracking-wide text-[#8C8279] dark:text-[#A8A29E]">
          Generating appetizing recipe photo...
        </span>
        <span className="text-[10px] text-[#A8A29E] dark:text-[#78716C] mt-0.5">
          Gemini Vision Cuisine
        </span>
      </div>
    );
  }

  // Error / Fallback (graceful category illustration)
  return (
    <div
      onClick={onClickHeader}
      className="w-full h-24 sm:h-28 bg-gradient-to-br from-[#FFF9F2] to-[#FFF2E6] dark:from-[#262320] dark:to-[#382012] border-b border-[#F0EAD6]/80 dark:border-[#3D3833]/80 flex items-center justify-between px-5 sm:px-6 relative overflow-hidden cursor-pointer"
    >
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-2xl bg-white/90 dark:bg-[#201D1A]/90 text-[#F27D26] border border-[#FFD8B8] dark:border-[#5C3119] flex items-center justify-center shadow-xs">
          <UtensilsCrossed className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-[#2D2926] dark:text-[#F5F3EF]">
            Vegetarian Zero-Waste Creation
          </p>
          <p className="text-[10px] text-[#8C8279] dark:text-[#A8A29E]">
            Authentic home-cooked Indian vegetarian recipe
          </p>
        </div>
      </div>
      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-[#166534] dark:text-[#86EFAC] bg-[#F0FDF4] dark:bg-[#142E1F] px-2.5 py-1 rounded-full border border-[#DCFCE7] dark:border-[#1E4D2B]">
        <Leaf className="w-3 h-3" />
        Pure Veg
      </span>
    </div>
  );
};

// Helper for difficulty badge styling
const getDifficultyBadge = (difficulty?: string) => {
  const normalized = (difficulty || 'Easy').toLowerCase();
  if (normalized.includes('hard')) {
    return {
      label: 'Hard',
      className:
        'bg-[#FEF2F2] dark:bg-[#331515] text-[#991B1B] dark:text-[#FCA5A5] border border-[#FEE2E2] dark:border-[#5C2323]',
      dotColor: 'bg-[#DC2626]',
    };
  }
  if (normalized.includes('med')) {
    return {
      label: 'Medium',
      className:
        'bg-[#FFFBEB] dark:bg-[#32230F] text-[#92400E] dark:text-[#FDE68A] border border-[#FEF3C7] dark:border-[#523B19]',
      dotColor: 'bg-[#D97706]',
    };
  }
  return {
    label: 'Easy',
    className:
      'bg-[#F0FDF4] dark:bg-[#142E1F] text-[#166534] dark:text-[#86EFAC] border border-[#DCFCE7] dark:border-[#1E4D2B]',
    dotColor: 'bg-[#16A34A]',
  };
};

const formatCookingTime = (recipe: RecipeSuggestion) => {
  if (recipe.cookingTime && recipe.cookingTime.trim()) {
    return recipe.cookingTime;
  }
  if (recipe.cookTimeMinutes) {
    return `${recipe.cookTimeMinutes} mins`;
  }
  return '15-20 mins';
};

export const RecipeModal: React.FC<RecipeModalProps> = ({
  isOpen,
  inventory,
  onClose,
  onCookRecipe,
}) => {
  const [recipes, setRecipes] = useState<RecipeSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mealType, setMealType] = useState<string>('Any');
  const [dietaryPreference, setDietaryPreference] = useState<string>('Vegetarian');
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);
  const [cookedRecipeIds, setCookedRecipeIds] = useState<string[]>([]);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [isHighDemandMode, setIsHighDemandMode] = useState(false);
  const [recipeImageCache, setRecipeImageCache] = useState<Record<string, ImageCacheEntry>>({});

  const handleUpdateImageCache = (recipeId: string, entry: ImageCacheEntry) => {
    setRecipeImageCache((prev) => ({
      ...prev,
      [recipeId]: entry,
    }));
  };

  // Compute items breakdown
  const activeItems = inventory.filter((i) => i.status === 'active');
  const itemsWithDays = activeItems.map((item) => {
    const daysLeft = calculateDaysLeft(item.addedDate, item.estimatedShelfLifeDays);
    const urgency = getUrgencyLevel(daysLeft);
    return { ...item, daysLeft, urgency };
  });

  const urgentItems = itemsWithDays.filter((i) => i.urgency === 'urgent');
  const soonItems = itemsWithDays.filter((i) => i.urgency === 'soon');

  // Client-side dynamic recipe generator as a failsafe
  const generateClientFallback = (): RecipeSuggestion[] => {
    const targetPool = urgentItems.length > 0 ? urgentItems : itemsWithDays;
    const itemNames = targetPool.map((i) => i.itemName || i.item || 'Vegetables');
    const set1 = itemNames.slice(0, 3);
    const set2 = itemNames.length > 3 ? itemNames.slice(2, 5) : itemNames.slice(0, 2);

    const main1 = set1[0] || 'Vegetables';
    const main2 = set2[0] || 'Pantry Produce';

    return [
      {
        id: `recipe-client-${Date.now()}-0`,
        recipeName: `Crispy Zero-Waste Skillet with ${main1}`,
        recipeNameHindi: `स्वादिष्ट तड़का सब्ज़ी (${main1})`,
        description: `A lightning-fast skillet toss designed to rescue ${set1.join(', ') || 'fresh produce'} before flavor and crispness decline.`,
        descriptionHindi: `${set1.join(', ') || 'ताज़ी सब्ज़ियों'} को स्वादिष्ट मसालेदार तड़के के साथ झटपट तैयार करने का आसान तरीका।`,
        usesIngredients: set1.length > 0 ? set1 : ['Fresh Vegetables'],
        usesIngredientsHindi: set1.length > 0 ? set1 : ['ताज़ी सब्ज़ियाँ'],
        additionalIngredientsNeeded: ['Cooking oil (1 tbsp)', 'Garlic, ginger & green chilies', 'Cumin & turmeric powder', 'Salt to taste'],
        additionalIngredientsNeededHindi: ['तेल (1 चम्मच)', 'अदरक, लहसुन और हरी मिर्च', 'जीरा और हल्दी पाउडर', 'स्वादानुसार नमक'],
        steps: [
          `Chop ${set1.join(', ') || 'ingredients'} into uniform bite-sized pieces.`,
          'Heat 1 tablespoon of cooking oil in a pan or kadai over medium heat and add cumin seeds and green chilies.',
          'Add minced ginger and garlic, then add your ingredients starting with the firmest items.',
          'Sauté briskly for 5-7 minutes until tender-crisp. Add turmeric and salt, then serve hot with roti or rice.'
        ],
        stepsHindi: [
          `${set1.join(', ') || 'सब्ज़ियों'} को एकसमान टुकड़ों में काट लें।`,
          'कढ़ाई में 1 चम्मच तेल गरम करें और उसमें जीरा व हरी मिर्च का तड़का लगाएं।',
          'बारीक कटा अदरक-लहसुन डालें, फिर कटी हुई सब्ज़ियाँ डालकर मध्यम आंच पर भूनें।',
          'हल्दी और नमक डालकर 5-7 मिनट तक पकाएं। गरमा-गरम रोटी या चावल के साथ परोसें।'
        ],
        cookTimeMinutes: 15,
        cookingTime: '15 mins',
        difficulty: 'Easy',
        chefTip: 'Cooking over high heat sears in the natural moisture and restores vibrant texture to produce nearing its prime.',
        chefTipHindi: 'तेज़ आंच पर पकाने से सब्ज़ियों की ताज़गी और कुरकुरापन बना रहता है।'
      },
      {
        id: `recipe-client-${Date.now()}-1`,
        recipeName: `Rustic Zero-Waste Skillet Bowl with ${main2}`,
        recipeNameHindi: `पौष्टिक मसाला वेज बाउल (${main2})`,
        description: `A warm, comforting vegetarian medley that pairs ${set2.join(' and ') || 'staples'} with aromatic Indian spices.`,
        descriptionHindi: `${set2.join(' और ') || 'सब्ज़ियों'} को भारतीय मसालों के साथ मिलाकर बनाया गया एक पौष्टिक और स्वादिष्ट व्यंजन।`,
        usesIngredients: set2.length > 0 ? set2 : ['Pantry Staples'],
        usesIngredientsHindi: set2.length > 0 ? set2 : ['सब्ज़ियाँ'],
        additionalIngredientsNeeded: ['Mustard or olive oil', 'Salt, turmeric & garam masala', 'Fresh coriander leaves', 'Lemon juice'],
        additionalIngredientsNeededHindi: ['तेल (1 चम्मच)', 'नमक, हल्दी व गरम मसाला', 'ताज़ा हरा धनिया', 'नींबू का रस'],
        steps: [
          `Prep ${set2.join(' and ') || 'ingredients'} by washing and dicing into even chunks.`,
          'Sauté gently in oil with turmeric, salt, and spices for 8-10 minutes until aromatic and tender.',
          'Finish with a squeeze of fresh lemon juice and chopped coriander leaves.'
        ],
        stepsHindi: [
          `${set2.join(' और ') || 'सब्ज़ियों'} को धोकर मध्यम आकार में काट लें।`,
          'पैन में तेल गरम करके हल्दी, नमक और मसालों के साथ 8-10 मिनट तक धीमी आंच पर पकाएं।',
          'ऊपर से ताज़ा नींबू का रस और हरा धनिया डालकर परोसें।'
        ],
        cookTimeMinutes: 20,
        cookingTime: '20 mins',
        difficulty: 'Easy',
        chefTip: 'Store any leftover cooked portions in an airtight container in the fridge for up to 3 days.',
        chefTipHindi: 'बची हुई पकी सब्ज़ी को फ्रिज में एयरटाइट डिब्बे में 3 दिनों तक सुरक्षित रखा जा सकता है।'
      }
    ];
  };

  // Trigger recipe generation
  const handleGenerateRecipes = async () => {
    if (activeItems.length === 0) {
      setErrorMessage('Your pantry is empty! Please scan or add some vegetarian grocery items first.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setIsHighDemandMode(false);

    try {
      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventory: itemsWithDays.map((i) => ({
            item: i.itemName || i.item,
            quantity: i.quantity,
            daysLeft: i.daysLeft,
            urgency: i.urgency,
            category: i.category,
            storageLocation: i.storageLocation,
          })),
          mealType,
          dietaryPreference,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${response.status}`);
      }

      const data = await response.json();
      if (data.isHighDemandFallback) {
        setIsHighDemandMode(true);
      }
      if (Array.isArray(data.recipes) && data.recipes.length > 0) {
        setRecipes(data.recipes);
        setExpandedRecipeId(data.recipes[0].id);
      } else {
        const fallbacks = generateClientFallback();
        setRecipes(fallbacks);
        setExpandedRecipeId(fallbacks[0]?.id || null);
        setIsHighDemandMode(true);
      }
    } catch (err: any) {
      console.warn('Network or AI issue in recipe generation, using dynamic zero-waste generator:', err);
      const fallbacks = generateClientFallback();
      setRecipes(fallbacks);
      setExpandedRecipeId(fallbacks[0]?.id || null);
      setIsHighDemandMode(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate on open if recipes empty
  useEffect(() => {
    if (isOpen && recipes.length === 0 && activeItems.length > 0 && !isLoading) {
      handleGenerateRecipes();
    }
  }, [isOpen]);

  const handleMarkCooked = (recipe: RecipeSuggestion) => {
    // Zero-waste confetti trigger
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#166534', '#F27D26', '#EAB308', '#0284C7'],
      });
    } catch {
      // ignore
    }

    // Match inventory item IDs used
    const usedItemIds: string[] = [];
    recipe.usesIngredients.forEach((ing) => {
      const lower = ing.toLowerCase();
      const match = activeItems.find((it) => {
        const name = (it.itemName || it.item || '').toLowerCase();
        return lower.includes(name) || name.includes(lower);
      });
      if (match && !usedItemIds.includes(match.id)) {
        usedItemIds.push(match.id);
      }
    });

    setCookedRecipeIds((prev) => [...prev, recipe.id]);
    onCookRecipe(recipe, usedItemIds);
  };

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
            <div className="w-10 h-10 rounded-2xl bg-[#FFF2E6] dark:bg-[#382012] text-[#F27D26] border border-[#FFD8B8] dark:border-[#5C3119] flex items-center justify-center shadow-xs">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-[#2D2926] dark:text-[#F5F3EF]">
                  "Cook This" Vegetarian Zero-Waste Chef
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#166534] dark:text-[#86EFAC] bg-[#F0FDF4] dark:bg-[#142E1F] px-2 py-0.5 rounded-full border border-[#DCFCE7] dark:border-[#1E4D2B]">
                  <Leaf className="w-2.5 h-2.5" />
                  Vegetarian
                </span>
              </div>
              <p className="text-xs text-[#8C8279] dark:text-[#A8A29E]">
                Recipes engineered to rescue your expiring produce & dairy first
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
          {/* Priority Rescue Banner */}
          {(urgentItems.length > 0 || soonItems.length > 0) && (
            <div className="p-4 rounded-2xl bg-[#FEF2F2] dark:bg-[#331515] border border-[#FEE2E2] dark:border-[#5C2323] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-1.5 text-xs font-bold text-[#991B1B] dark:text-[#FCA5A5]">
                  <Flame className="w-4 h-4 text-[#991B1B] dark:text-[#FCA5A5]" />
                  <span>Targeted Rescue Ingredients:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {urgentItems.map((i) => (
                    <span
                      key={i.id}
                      className="px-2 py-0.5 rounded-md text-xs font-bold bg-white dark:bg-[#181614] text-[#991B1B] dark:text-[#FCA5A5] border border-[#FEE2E2] dark:border-[#5C2323] flex items-center space-x-1"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#991B1B] dark:bg-[#FCA5A5] animate-ping mr-0.5"></span>
                      {i.itemName || i.item} ({i.quantity})
                    </span>
                  ))}
                  {soonItems.map((i) => (
                    <span
                      key={i.id}
                      className="px-2 py-0.5 rounded-md text-xs font-semibold bg-[#FFFBEB] dark:bg-[#32230F] text-[#92400E] dark:text-[#FDE68A] border border-[#FEF3C7] dark:border-[#523B19]"
                    >
                      {i.itemName || i.item} ({i.quantity})
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleGenerateRecipes}
                className="px-3 py-1.5 rounded-xl border border-[#E5E1D8] dark:border-[#3D3833] bg-white dark:bg-[#262320] hover:bg-[#F5F5F0] dark:hover:bg-[#2F2A26] disabled:opacity-50 text-[#2D2926] dark:text-[#F5F3EF] font-semibold text-xs shadow-2xs flex items-center justify-center space-x-1.5 shrink-0 self-start sm:self-center transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Re-generate</span>
              </button>
            </div>
          )}

          {/* Recipe Controls (Meal Type, Dietary & Bilingual Language Toggle) */}
          <div className="flex flex-wrap gap-3 items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#262320] border border-[#F0EAD6] dark:border-[#3D3833] text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-[#8C8279] dark:text-[#A8A29E] font-semibold">Meal Type:</span>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-[#E5E1D8] dark:border-[#3D3833] bg-[#F5F5F0] dark:bg-[#181614] text-[#2D2926] dark:text-[#F5F3EF] font-bold focus:ring-2 focus:ring-[#F27D26] outline-none"
                >
                  <option value="Any">Any Meal</option>
                  <option value="Quick 15-Minute Meal">Quick 15-Min Dinner</option>
                  <option value="One-Pot / Skillet">One-Pot Skillet</option>
                  <option value="Hearty Lunch">Hearty Lunch</option>
                  <option value="Breakfast / Brunch">Breakfast / Brunch</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[#8C8279] dark:text-[#A8A29E] font-semibold">Dietary:</span>
                <select
                  value={dietaryPreference}
                  onChange={(e) => setDietaryPreference(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-[#E5E1D8] dark:border-[#3D3833] bg-[#F5F5F0] dark:bg-[#181614] text-[#2D2926] dark:text-[#F5F3EF] font-bold focus:ring-2 focus:ring-[#F27D26] outline-none"
                >
                  <option value="Vegetarian">Strictly Vegetarian</option>
                  <option value="Vegan">Vegan (Plant-Based)</option>
                  <option value="Gluten-Free">Gluten-Free Vegetarian</option>
                  <option value="Dairy-Free">Dairy-Free Vegetarian</option>
                  <option value="High-Protein">High-Protein Vegetarian</option>
                </select>
              </div>
            </div>

            {/* Language Toggle (EN / हिन्दी) */}
            <div className="flex items-center space-x-1.5 ml-auto sm:ml-0">
              <span className="text-[#8C8279] dark:text-[#A8A29E] font-semibold flex items-center gap-1">
                <Languages className="w-3.5 h-3.5 text-[#F27D26]" />
                <span>Language:</span>
              </span>
              <div className="flex items-center p-0.5 rounded-xl bg-[#F5F5F0] dark:bg-[#181614] border border-[#E5E1D8] dark:border-[#3D3833]">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    language === 'en'
                      ? 'bg-white dark:bg-[#262320] text-[#2D2926] dark:text-[#F5F3EF] shadow-2xs'
                      : 'text-[#8C8279] dark:text-[#A8A29E] hover:text-[#2D2926] dark:hover:text-[#F5F3EF]'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('hi')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold font-['Noto_Sans_Devanagari',sans-serif] transition-all ${
                    language === 'hi'
                      ? 'bg-white dark:bg-[#262320] text-[#2D2926] dark:text-[#F5F3EF] shadow-2xs'
                      : 'text-[#8C8279] dark:text-[#A8A29E] hover:text-[#2D2926] dark:hover:text-[#F5F3EF]'
                  }`}
                >
                  हिन्दी
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-[#FFF2E6] dark:bg-[#382012] text-[#F27D26] flex items-center justify-center animate-bounce">
                <ChefHat className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-[#2D2926] dark:text-[#F5F3EF] text-base">
                  Chef Gemini is formulating 100% vegetarian recipes...
                </h4>
                <p className="text-xs text-[#8C8279] dark:text-[#A8A29E]">
                  Matching expiring produce, dairy & grains with zero-waste pantry staples
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-[#FEF2F2] dark:bg-[#331515] border border-[#FEE2E2] dark:border-[#5C2323] text-[#991B1B] dark:text-[#FCA5A5] text-xs sm:text-sm flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Could not generate recipes</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* High Demand / Offline Fallback Notice */}
          {isHighDemandMode && !isLoading && recipes.length > 0 && (
            <div className="p-3 rounded-2xl bg-[#FFFBEB] dark:bg-[#32230F] border border-[#FEF3C7] dark:border-[#523B19] text-[#92400E] dark:text-[#FDE68A] text-xs flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <Sparkle className="w-4 h-4 text-[#D97706] shrink-0" />
                <span>
                  {language === 'hi'
                    ? 'आपकी सामग्री से तैयार ज़ीरो-वेस्ट रेसिपी। ऑनलाइन AI सुझावों के लिए पुनः प्रयास कर सकते हैं।'
                    : 'Instant zero-waste recipes crafted from your ingredients. Tap Re-generate anytime to query AI.'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleGenerateRecipes}
                className="px-2.5 py-1 rounded-lg bg-[#D97706] text-white font-bold text-[11px] shadow-2xs hover:bg-[#B45309] transition-colors shrink-0"
              >
                {language === 'hi' ? 'पुनः प्रयास' : 'Retry AI'}
              </button>
            </div>
          )}

          {/* Recipes List */}
          {!isLoading && recipes.length > 0 && (
            <div className="space-y-4">
              {recipes.map((recipe, idx) => {
                const isExpanded = expandedRecipeId === recipe.id;
                const isCooked = cookedRecipeIds.includes(recipe.id);

                // Language-aware content selection
                const isHindi = language === 'hi';
                const displayedTitle = (isHindi && recipe.recipeNameHindi) ? recipe.recipeNameHindi : recipe.recipeName;
                const displayedDescription = (isHindi && recipe.descriptionHindi) ? recipe.descriptionHindi : recipe.description;
                const displayedUses = (isHindi && recipe.usesIngredientsHindi && recipe.usesIngredientsHindi.length > 0)
                  ? recipe.usesIngredientsHindi
                  : recipe.usesIngredients;
                const displayedAdditional = (isHindi && recipe.additionalIngredientsNeededHindi && recipe.additionalIngredientsNeededHindi.length > 0)
                  ? recipe.additionalIngredientsNeededHindi
                  : recipe.additionalIngredientsNeeded;
                const displayedSteps = (isHindi && recipe.stepsHindi && recipe.stepsHindi.length > 0)
                  ? recipe.stepsHindi
                  : recipe.steps;
                const displayedTip = (isHindi && recipe.chefTipHindi) ? recipe.chefTipHindi : recipe.chefTip;

                return (
                  <div
                    key={recipe.id || idx}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isCooked
                        ? 'border-[#DCFCE7] dark:border-[#1E4D2B] bg-[#F0FDF4] dark:bg-[#142E1F]'
                        : isExpanded
                        ? 'border-[#F27D26] bg-white dark:bg-[#262320] shadow-md'
                        : 'border-[#F0EAD6] dark:border-[#3D3833] bg-white dark:bg-[#262320] hover:border-[#E5E1D8] dark:hover:border-[#5C3119]'
                    }`}
                  >
                    {/* AI-Generated Recipe Visual Banner */}
                    <RecipeImageBanner
                      recipe={recipe}
                      cached={recipeImageCache[recipe.id]}
                      onUpdateCache={handleUpdateImageCache}
                      onClickHeader={() => setExpandedRecipeId(isExpanded ? null : recipe.id)}
                    />

                    {/* Card Header (Always visible) */}
                    <div
                      onClick={() => setExpandedRecipeId(isExpanded ? null : recipe.id)}
                      className="p-4 sm:p-5 flex items-start justify-between cursor-pointer select-none"
                    >
                      <div className="space-y-1.5 flex-1 pr-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#FEF2F2] dark:bg-[#331515] text-[#991B1B] dark:text-[#FCA5A5] border border-[#FEE2E2] dark:border-[#5C2323]">
                            {recipe.usesIngredients.length} {isHindi ? 'बचाया गया' : 'Rescued'}
                          </span>
                          
                          {/* Cooking Time Badge */}
                          <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#F5F5F0] dark:bg-[#2F2A26] text-[#44403C] dark:text-[#D6D3D1] border border-[#E5E1D8] dark:border-[#3D3833]">
                            <Clock className="w-3 h-3 text-[#F27D26] mr-1" />
                            {formatCookingTime(recipe)}
                          </span>

                          {/* Difficulty Badge */}
                          {(() => {
                            const diff = getDifficultyBadge(recipe.difficulty);
                            return (
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${diff.className}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${diff.dotColor}`} />
                                {diff.label}
                              </span>
                            );
                          })()}

                          {isCooked && (
                            <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-[#166534] text-white flex items-center space-x-1">
                              <Check className="w-3 h-3" />
                              <span>{isHindi ? 'पकाया और बचाया गया!' : 'Cooked & Rescued!'}</span>
                            </span>
                          )}
                        </div>

                        <h3 className={`text-base sm:text-lg font-bold text-[#2D2926] dark:text-[#F5F3EF] leading-snug ${isHindi ? "font-['Noto_Sans_Devanagari',sans-serif]" : ''}`}>
                          {displayedTitle}
                        </h3>

                        <p className={`text-xs text-[#8C8279] dark:text-[#A8A29E] line-clamp-2 ${isHindi ? "font-['Noto_Sans_Devanagari',sans-serif]" : ''}`}>
                          {displayedDescription}
                        </p>
                      </div>

                      <div className="p-1 text-[#8C8279] dark:text-[#A8A29E] hover:text-[#2D2926] dark:hover:text-[#F5F3EF] rounded-lg">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>

                    {/* Expanded Recipe Details */}
                    {isExpanded && (
                      <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-[#F0EAD6] dark:border-[#3D3833] space-y-4">
                        {/* Ingredients Columns */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          {/* Rescued from pantry */}
                          <div className="p-3 rounded-xl bg-[#F0FDF4] dark:bg-[#142E1F] border border-[#DCFCE7] dark:border-[#1E4D2B]">
                            <h4 className={`text-xs font-bold text-[#166534] dark:text-[#86EFAC] flex items-center space-x-1 mb-2 ${isHindi ? "font-['Noto_Sans_Devanagari',sans-serif]" : ''}`}>
                              <Sparkle className="w-3.5 h-3.5 text-[#166534] dark:text-[#86EFAC]" />
                              <span>{isHindi ? 'रसोई की बची सामग्री से उपयोग:' : 'Rescues From Your Vegetarian Pantry:'}</span>
                            </h4>
                            <ul className={`text-xs text-[#166534] dark:text-[#86EFAC] space-y-1 ${isHindi ? "font-['Noto_Sans_Devanagari',sans-serif]" : ''}`}>
                              {displayedUses.map((ing, i) => (
                                <li key={i} className="flex items-center space-x-1.5">
                                  <Check className="w-3 h-3 text-[#166534] dark:text-[#86EFAC] shrink-0" />
                                  <span className="font-semibold">{ing}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Extra pantry staples needed */}
                          <div className="p-3 rounded-xl bg-[#F5F5F0] dark:bg-[#2F2A26] border border-[#E5E1D8] dark:border-[#3D3833]">
                            <h4 className={`text-xs font-bold text-[#2D2926] dark:text-[#F5F3EF] flex items-center space-x-1 mb-2 ${isHindi ? "font-['Noto_Sans_Devanagari',sans-serif]" : ''}`}>
                              <ShoppingBag className="w-3.5 h-3.5 text-[#8C8279] dark:text-[#A8A29E]" />
                              <span>{isHindi ? 'मसाले व आवश्यक सामग्री:' : 'Basic Staples / Spices:'}</span>
                            </h4>
                            <ul className={`text-xs text-[#8C8279] dark:text-[#A8A29E] space-y-1 ${isHindi ? "font-['Noto_Sans_Devanagari',sans-serif]" : ''}`}>
                              {displayedAdditional.map((ing, i) => (
                                <li key={i} className="flex items-center space-x-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#8C8279] dark:bg-[#A8A29E] shrink-0"></span>
                                  <span>{ing}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Step by step directions */}
                        <div className="space-y-2">
                          <h4 className={`text-xs font-bold text-[#2D2926] dark:text-[#F5F3EF] uppercase tracking-wider ${isHindi ? "font-['Noto_Sans_Devanagari',sans-serif]" : ''}`}>
                            {isHindi ? 'बनाने की विधि:' : 'Preparation & Cooking Steps:'}
                          </h4>
                          <ol className={`space-y-2 ${isHindi ? "font-['Noto_Sans_Devanagari',sans-serif]" : ''}`}>
                            {displayedSteps.map((step, stepIdx) => (
                              <li
                                key={stepIdx}
                                className="text-xs sm:text-sm text-[#2D2926] dark:text-[#F5F3EF] flex items-start space-x-2.5"
                              >
                                <span className="w-5 h-5 rounded-full bg-[#FFF2E6] dark:bg-[#382012] text-[#F27D26] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 border border-[#FFD8B8] dark:border-[#5C3119]">
                                  {stepIdx + 1}
                                </span>
                                <span className="leading-relaxed">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>

                        {/* Zero-Waste Chef Tip */}
                        {displayedTip && (
                          <div className="p-3 rounded-xl bg-[#FFF2E6] dark:bg-[#382012] border border-[#FFD8B8] dark:border-[#5C3119] text-xs text-[#2D2926] dark:text-[#F5F3EF] flex items-start space-x-2">
                            <Sparkles className="w-4 h-4 text-[#F27D26] shrink-0 mt-0.5" />
                            <div className={isHindi ? "font-['Noto_Sans_Devanagari',sans-serif]" : ''}>
                              <strong className="font-bold text-[#F27D26]">
                                {isHindi ? 'ज़ीरो-वेस्ट शेफ सुझाव: ' : 'Zero-Waste Chef Hack: '}
                              </strong>
                              <span>{displayedTip}</span>
                            </div>
                          </div>
                        )}

                        {/* Mark Cooked Action */}
                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkCooked(recipe);
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs active:scale-95 ${
                              isCooked
                                ? 'bg-[#F0FDF4] dark:bg-[#142E1F] text-[#166534] dark:text-[#86EFAC] border border-[#DCFCE7] dark:border-[#1E4D2B]'
                                : 'bg-[#F27D26] hover:bg-[#E06D19] text-white shadow-md shadow-[#F27D26]/20'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span className={isHindi ? "font-['Noto_Sans_Devanagari',sans-serif]" : ''}>
                              {isCooked
                                ? (isHindi ? 'सामग्री का उपयोग हुआ व पकाया गया!' : 'Ingredients Rescued & Cooked!')
                                : (isHindi ? 'मैंने यह रेसिपी बनाई! (खाना बचाया)' : 'I Cooked This Recipe! (Save Food)')}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-7 py-4 border-t border-[#F0EAD6]/80 dark:border-[#3D3833]/80 bg-white/90 dark:bg-[#262320]/90 backdrop-blur-sm flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#E5E1D8] dark:border-[#3D3833] text-[#2D2926] dark:text-[#F5F3EF] font-semibold text-xs sm:text-sm hover:bg-[#F5F5F0] dark:hover:bg-[#2F2A26] transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            disabled={isLoading || activeItems.length === 0}
            onClick={handleGenerateRecipes}
            className="px-5 py-2 rounded-xl bg-[#F27D26] hover:bg-[#E06D19] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#F27D26]/20 flex items-center space-x-1.5 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate New Recipes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
