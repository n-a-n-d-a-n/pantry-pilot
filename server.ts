import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON with generous limit for high-res food & receipt photos
app.use(express.json({ limit: '25mb' }));

// Lazy-initialized GenAI client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in environment. Gemini features will return an error.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

/**
 * Robust wrapper for Gemini generateContent with automatic retry on 503/429
 * and seamless fallback across production flash models (gemini-3.7-flash, gemini-2.5-flash).
 */
async function generateContentWithRetry(params: {
  contents: any;
  config?: any;
  preferredModel?: string;
  timeoutMs?: number;
}) {
  const ai = getGenAI();
  const timeoutMs = params.timeoutMs || 14000;
  // Models in priority order with maximum availability and low latency (strictly currently supported models)
  const candidateModels = [
    params.preferredModel || 'gemini-3.7-flash',
    'gemini-2.5-flash',
  ];
  // Remove duplicates while preserving priority
  const models = candidateModels.filter((m, idx, arr) => arr.indexOf(m) === idx);

  let lastError: any = null;

  for (const model of models) {
    // Try up to 2 attempts per candidate model
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        let timeoutId: any;
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error(`Timeout after ${timeoutMs}ms on model ${model}`));
          }, timeoutMs);
        });

        const generatePromise = ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });

        const response: any = await Promise.race([generatePromise, timeoutPromise]);
        clearTimeout(timeoutId);
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isUnavailable =
          errMsg.includes('503') ||
          errMsg.includes('high demand') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('Resource has been exhausted') ||
          errMsg.includes('429') ||
          errMsg.includes('Timeout');

        console.info(`[Gemini Engine] Model "${model}" (attempt ${attempt}) returned ${isUnavailable ? 'high-demand/timeout' : 'error'}, switching to fallback pool...`);

        if (isUnavailable && attempt < 2) {
          // Brief jittered pause before second attempt or next model
          const waitTime = Math.floor(300 * attempt + Math.random() * 150);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        } else {
          // Move directly to next candidate model
          break;
        }
      }
    }
  }

  throw lastError || new Error('All Gemini model fallbacks failed');
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

/**
 * 1. Image & Receipt Scanner to Inventory Items via Gemini Multimodal Vision
 * STRICT VEGETARIAN ONLY: Meat, poultry, fish, seafood, and eggs are filtered out and excluded.
 */
app.post('/api/scan/groceries', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', mode = 'photo' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 in request body' });
    }

    // Clean base64 string if it contains data URI header
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    const ai = getGenAI();

    const inrPricingGuidance = `PRICING & CURRENCY CONTEXT:
All cost, price, and savings estimates must reflect realistic Indian Rupee (INR) grocery pricing in India, not USD or other currencies.
For frame of reference in Indian grocery markets:
- Typical vegetables like tomatoes, potatoes, onions cost approximately ₹30-60/kg.
- Paneer costs approximately ₹80-120 per 200g.
- Leafy greens like spinach (palak), methi cost approximately ₹15-30 per bunch.
- Milk costs approximately ₹30-35 per 500ml pouch.
- Curd/Dahi costs approximately ₹30-45 per 400g tub.
- Bread costs approximately ₹40-55 per loaf.
- Lentils/Dal cost approximately ₹120-180/kg.`;

    const isReceipt = mode === 'receipt';
    const promptText = isReceipt
      ? `You are an expert grocery OCR and zero-waste kitchen manager for a STRICTLY VEGETARIAN kitchen.
Analyze this grocery receipt image.
CRITICAL CONSTRAINT: This app is 100% VEGETARIAN.
- You must identify each VEGETARIAN food or pantry item (vegetables, fruits, dairy, grains, pulses, legumes, bakery, nuts, condiments, plant-based foods).
- EXCLUDE and DO NOT include any non-vegetarian items (meat, chicken, beef, pork, lamb, bacon, ham, poultry, fish, shrimp, crab, salmon, tuna, seafood, eggs).
- If you encounter any non-vegetarian items (meat/fish/eggs), track them in the "skippedNonVegetarianItems" list so the user is informed.

${inrPricingGuidance}

For each accepted VEGETARIAN item, extract:
1. "item": Clean, recognizable vegetarian food name (e.g. "Roma Tomatoes", "Organic Whole Milk", "Sourdough Bread", "Tofu", "Greek Yogurt", "Paneer"). Clean up cryptic abbreviations on the receipt. Skip non-food items like soap, plastic bags, napkins unless consumable kitchen goods.
2. "quantity": Estimated count or package size (e.g. "500g", "1 kg", "1 packet", "1 litre", "1 bunch", "2 medium").
3. "estimatedShelfLifeDays": Realistic average shelf life in days from purchase when stored properly. (e.g. fresh berries: 4, milk: 7, bread: 5, potatoes: 21, pasta: 365, canned beans: 730, yogurt: 14, tofu: 7, leafy greens: 5).
4. "category": Choose one of: "Produce", "Dairy", "Bakery", "Pantry & Dry Goods", "Beverages", "Frozen", "Other". Note: "Meat & Seafood" and "Eggs" are NOT allowed.
5. "storageLocation": Best storage recommendation: "Fridge", "Pantry", "Freezer", or "Counter".`
      : `You are an expert kitchen zero-waste vision assistant for a STRICTLY VEGETARIAN kitchen.
Analyze this photograph of groceries, pantry, or refrigerator contents.
CRITICAL CONSTRAINT: This app tracks 100% VEGETARIAN food ONLY (dairy and plant-based foods are permitted; NO meat, poultry, fish, seafood, or eggs).
- Identify every visible distinct VEGETARIAN food and beverage item.
- EXCLUDE and DO NOT include any non-vegetarian items (meat, chicken, beef, pork, bacon, turkey, poultry, fish, seafood, shrimp, crab, whole eggs, egg cartons).
- If any non-vegetarian items are visible in the photo, list them in "skippedNonVegetarianItems" so they can be politely skipped.

${inrPricingGuidance}

For each accepted VEGETARIAN item, extract:
1. "item": Specific clear food name (e.g. "Cherry Tomatoes", "Paneer Block", "Fresh Spinach", "Avocados", "Tofu Block", "Bell Peppers", "Almond Milk").
2. "quantity": Approximate count, volume, or fraction (e.g. "approx. 4", "half loaf", "1 pouch (~500ml)", "1 bunch", "2 medium", "250g").
3. "estimatedShelfLifeDays": Realistic remaining shelf life in days for an item in this state under proper storage. Be practical to minimize food waste (e.g., ripe avocados: 3, fresh broccoli: 5, paneer: 4, yogurt: 10, fresh herbs: 4, apples: 14, tofu: 5).
4. "category": Choose one of: "Produce", "Dairy", "Bakery", "Pantry & Dry Goods", "Beverages", "Frozen", "Other".
5. "storageLocation": Best storage spot: "Fridge", "Pantry", "Freezer", or "Counter".`;

    let response;
    try {
      response = await generateContentWithRetry({
        preferredModel: 'gemini-3.7-flash',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType || 'image/jpeg',
              },
            },
            {
              text: promptText,
            },
          ],
        },
        config: {
          systemInstruction:
            'You are PantryPilot, an AI-powered zero-waste kitchen assistant exclusively for VEGETARIAN food. You strictly exclude all meat, poultry, fish, seafood, and eggs from inventory extraction while accurately identifying plant-based foods and dairy. All cost, price, and savings estimates must reflect realistic Indian Rupee (INR) grocery pricing in India, not USD or other currencies.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    item: {
                      type: Type.STRING,
                      description: 'The clean recognizable name of the vegetarian food item.',
                    },
                    quantity: {
                      type: Type.STRING,
                      description: 'Estimated quantity, count, or package size.',
                    },
                    estimatedShelfLifeDays: {
                      type: Type.INTEGER,
                      description: 'Realistic shelf life in days from today.',
                    },
                    category: {
                      type: Type.STRING,
                      description:
                        'Category: Produce, Dairy, Bakery, Pantry & Dry Goods, Beverages, Frozen, Other.',
                    },
                    storageLocation: {
                      type: Type.STRING,
                      description: 'Recommended storage: Fridge, Pantry, Freezer, or Counter.',
                    },
                    confidenceNote: {
                      type: Type.STRING,
                      description: 'Brief observation or freshness tip for this vegetarian item.',
                    },
                  },
                  required: ['item', 'quantity', 'estimatedShelfLifeDays', 'category'],
                },
              },
              skippedNonVegetarianItems: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'List of any non-vegetarian items (meat, chicken, fish, eggs) detected and excluded.',
              },
            },
            required: ['items'],
          },
        },
      });
    } catch (aiError: any) {
      console.warn('Gemini vision high demand encountered, providing fallback editable items:', aiError?.message);
      // If AI is temporarily unavailable due to 503 high demand, return editable starter items
      const fallbackItems = isReceipt
        ? [
            {
              item: 'Fresh Produce',
              quantity: '1 portion',
              estimatedShelfLifeDays: 5,
              category: 'Produce',
              storageLocation: 'Fridge',
              confidenceNote: 'AI temporarily busy. Edit details or tap Retry AI Scan.',
            },
            {
              item: 'Bakery / Grains',
              quantity: '1 pack',
              estimatedShelfLifeDays: 6,
              category: 'Bakery',
              storageLocation: 'Pantry',
              confidenceNote: 'AI temporarily busy. Edit details or tap Retry AI Scan.',
            },
          ]
        : [
            {
              item: 'Fresh Vegetables & Produce',
              quantity: '1 basket',
              estimatedShelfLifeDays: 5,
              category: 'Produce',
              storageLocation: 'Fridge',
              confidenceNote: 'AI temporarily busy. Edit details or tap Retry AI Scan.',
            },
            {
              item: 'Dairy / Plant Milk',
              quantity: '1 carton',
              estimatedShelfLifeDays: 7,
              category: 'Dairy',
              storageLocation: 'Fridge',
              confidenceNote: 'AI temporarily busy. Edit details or tap Retry AI Scan.',
            },
          ];

      return res.json({
        items: fallbackItems,
        rawCount: fallbackItems.length,
        skippedNonVegetarian: [],
        nonVegDetected: false,
        nonVegNote: 'Note: Gemini is currently experiencing heavy global traffic. You can edit the detected items above or retry scan.',
      });
    }

    const rawText = response.text || '{"items": [], "skippedNonVegetarianItems": []}';
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Fallback in case wrapped in markdown code blocks
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse Gemini JSON output');
      }
    }

    const items = Array.isArray(parsed?.items) ? parsed.items : [];
    const skippedNonVegetarian = Array.isArray(parsed?.skippedNonVegetarianItems)
      ? parsed.skippedNonVegetarianItems
      : [];

    const nonVegDetected = skippedNonVegetarian.length > 0;
    const nonVegNote = nonVegDetected
      ? `Non-vegetarian item(s) detected and skipped (${skippedNonVegetarian.join(', ')}) — this app tracks vegetarian groceries only.`
      : null;

    return res.json({
      items,
      rawCount: items.length,
      skippedNonVegetarian,
      nonVegDetected,
      nonVegNote,
    });
  } catch (error: any) {
    console.error('Error scanning groceries with Gemini:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to analyze groceries with Gemini API',
      details: String(error),
    });
  }
});

function buildDynamicZeroWasteRecipes(inventory: any[] = []) {
  const targetItems = inventory.map((i: any) => ({
    name: i.name || i.item || i.itemName || 'Fresh Produce',
    quantity: i.quantity || '1 portion',
    daysLeft: typeof i.daysLeft === 'number' ? i.daysLeft : 3,
  }));

  const urgentList = targetItems.filter((i) => i.daysLeft <= 2);
  const pool = urgentList.length > 0 ? urgentList : targetItems;
  const names = pool.map((i) => i.name);
  const sample1 = names.slice(0, 3);
  const sample2 = names.length > 3 ? names.slice(2, 5) : names.slice(0, 2);

  const main1 = sample1[0] || 'Vegetables';
  const main2 = sample2[0] || 'Pantry Produce';

  return [
    {
      id: `recipe-fallback-${Date.now()}-0`,
      recipeName: `Crispy Zero-Waste Stir-Fry with ${main1}`,
      recipeNameHindi: `स्वादिष्ट तड़का सब्ज़ी (${main1})`,
      description: `A lightning-fast skillet toss designed to rescue ${sample1.join(', ') || 'fresh produce'} before freshness declines.`,
      descriptionHindi: `${sample1.join(', ') || 'ताज़ी सब्ज़ियों'} को स्वादिष्ट मसालेदार तड़के के साथ झटपट तैयार करने का तरीका।`,
      usesIngredients: sample1.length > 0 ? sample1 : ['Fresh Vegetables'],
      usesIngredientsHindi: sample1.length > 0 ? sample1 : ['ताज़ी सब्ज़ियाँ'],
      additionalIngredientsNeeded: ['Cooking oil (1 tbsp)', 'Garlic, ginger & green chilies', 'Cumin & turmeric powder', 'Salt to taste'],
      additionalIngredientsNeededHindi: ['तेल (1 चम्मच)', 'अदरक, लहसुन और हरी मिर्च', 'जीरा और हल्दी पाउडर', 'स्वादानुसार नमक'],
      steps: [
        `Chop ${sample1.join(', ') || 'vegetables'} into uniform bite-sized pieces.`,
        'Heat 1 tablespoon of cooking oil in a pan or kadai over medium heat and add cumin seeds and green chilies.',
        'Add minced ginger and garlic, then add your ingredients starting with the firmest items.',
        'Sauté briskly for 5-7 minutes until tender-crisp. Add turmeric and salt, then serve hot with roti or rice.'
      ],
      stepsHindi: [
        `${sample1.join(', ') || 'सब्ज़ियों'} को एकसमान टुकड़ों में काट लें।`,
        'कढ़ाई में 1 चम्मच तेल गरम करें और उसमें जीरा व हरी मिर्च का तड़का लगाएं।',
        'बारीक कटा अदरक-लहसुन डालें, फिर सब्ज़ियाँ डालकर मध्यम आंच पर भूनें।',
        'हल्दी और नमक डालकर 5-7 मिनट तक पकाएं। गरमा-गरम रोटी या चावल के साथ परोसें।'
      ],
      cookTimeMinutes: 15,
      cookingTime: '15 mins',
      difficulty: 'Easy',
      chefTip: 'Cooking over high heat sears in the natural moisture and restores vibrant texture to produce nearing its prime.',
      chefTipHindi: 'तेज़ आंच पर पकाने से सब्ज़ियों की ताज़गी और कुरकुरापन बना रहता है।'
    },
    {
      id: `recipe-fallback-${Date.now()}-1`,
      recipeName: `Rustic Zero-Waste Skillet Bowl with ${main2}`,
      recipeNameHindi: `पौष्टिक मसाला वेज बाउल (${main2})`,
      description: `A warm, comforting vegetarian medley that pairs ${sample2.join(' and ') || 'staples'} with aromatic Indian spices.`,
      descriptionHindi: `${sample2.join(' और ') || 'सब्ज़ियों'} को भारतीय मसालों के साथ मिलाकर बनाया गया एक पौष्टिक और स्वादिष्ट व्यंजन।`,
      usesIngredients: sample2.length > 0 ? sample2 : ['Pantry Staples'],
      usesIngredientsHindi: sample2.length > 0 ? sample2 : ['सब्ज़ियाँ'],
      additionalIngredientsNeeded: ['Mustard or olive oil', 'Salt, turmeric & garam masala', 'Fresh coriander leaves', 'Lemon juice'],
      additionalIngredientsNeededHindi: ['तेल (1 चम्मच)', 'नमक, हल्दी व गरम मसाला', 'ताज़ा हरा धनिया', 'नींबू का रस'],
      steps: [
        `Prep ${sample2.join(' and ') || 'ingredients'} by washing and dicing into even chunks.`,
        'Sauté gently in oil with turmeric, salt, and spices for 8-10 minutes until aromatic and tender.',
        'Finish with a squeeze of fresh lemon juice and chopped coriander leaves.'
      ],
      stepsHindi: [
        `${sample2.join(' और ') || 'सब्ज़ियों'} को धोकर मध्यम आकार में काट लें।`,
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
}

/**
 * 2. "Cook This" Recipe Generator prioritizing urgent items (STRICTLY VEGETARIAN ONLY & BILINGUAL EN/HI)
 */
app.post('/api/recipes/generate', async (req, res) => {
  const { inventory = [], mealType = 'Any', dietaryPreference = 'None' } = req.body || {};
  try {
    if (!Array.isArray(inventory) || inventory.length === 0) {
      return res.json({
        recipes: buildDynamicZeroWasteRecipes([
          { name: 'Fresh Vegetables', quantity: '1 portion', daysLeft: 2 },
          { name: 'Pantry Dal / Grains', quantity: '1 cup', daysLeft: 4 }
        ]),
        isHighDemandFallback: true
      });
    }

    const ai = getGenAI();

    // Sort or highlight urgent items
    const formattedInventory = inventory.map((item: any) => ({
      name: item.item || item.name || item.itemName || 'Vegetables',
      quantity: item.quantity || '1 portion',
      daysLeft: typeof item.daysLeft === 'number' ? item.daysLeft : 3,
      urgency: item.urgency || 'soon',
      category: item.category || 'Pantry',
      location: item.storageLocation || 'Fridge',
    }));

    const urgentItems = formattedInventory.filter((i) => i.daysLeft <= 2 || i.urgency === 'urgent');
    const soonItems = formattedInventory.filter((i) => i.daysLeft > 2 && i.daysLeft <= 5);

    const prompt = `Here is the user's current vegetarian kitchen inventory:
${JSON.stringify(formattedInventory, null, 2)}

URGENT / EXPIRING ITEMS TO RESCUE FIRST:
${urgentItems.length > 0 ? urgentItems.map((i) => `- ${i.name} (${i.quantity}, ${i.daysLeft}d left)`).join('\n') : 'No critically expiring items, prioritize soon-to-expire items.'}

SOON-TO-EXPIRE ITEMS:
${soonItems.map((i) => `- ${i.name} (${i.quantity}, ${i.daysLeft}d left)`).join('\n')}

User preferences:
- Meal Type: ${mealType}
- Specific dietary filter: ${dietaryPreference}

MANDATORY HARD CONSTRAINT:
You must never suggest meat, poultry, fish, or egg-based recipes under any circumstances. All recipes must be strictly vegetarian (dairy and plant-based ingredients are allowed).

PRICING & REALISTIC CONTEXT:
All cost, price, and savings estimates must reflect realistic Indian Rupee (INR) grocery pricing in India, not USD or other currencies. (For reference in Indian markets: tomatoes/potatoes ~₹30-50/kg, onions ~₹30-60/kg, paneer ~₹90-120/200g, spinach ~₹20/bunch).
Assume the user has basic kitchen staples on hand (cooking oil, mustard seeds, cumin, turmeric, red chili powder, coriander powder, garam masala, ginger, garlic, green chilies, onions, tomatoes, salt, rice, atta/flour, dal).
Make every recipe realistic and quick for home cooking.

BILINGUAL REQUIREMENT (ENGLISH + NATURAL HINDI):
You must provide bilingual outputs: English and natural Hindi (Devanagari script, e.g., 'पालक पनीर भुर्जी', 'टमाटर', 'कढ़ाई में 1 चम्मच तेल गरम करें') for all text fields.
- Use accurate, natural conversational Hindi translations (not transliteration/Hinglish).
- Keep dish names that are already commonly known in Hindi (e.g. 'Paneer Bhurji', 'Aloo Gobi', 'Dal Tadka') authentic rather than forcing an artificial literal translation.

TASK:
Generate 2 to 3 creative, delicious, and highly practical ZERO-WASTE VEGETARIAN recipes that SPECIFICALLY rescue and utilize as many of the expiring/urgent ingredients as possible.

For each recipe, accurately determine:
1. "recipeName": Appetizing, clear vegetarian recipe title in English (e.g., "Crispy Jeera Aloo with Spinach").
2. "recipeNameHindi": Natural recipe title in Hindi Devanagari script (e.g., "कुरकुरा जीरा आलू और पालक").
3. "description": 1-2 sentence description in English explaining how this vegetarian recipe rescues expiring food.
4. "descriptionHindi": 1-2 sentence description in natural Hindi Devanagari script.
5. "usesIngredients": Array of vegetarian ingredients used from the user inventory (in English).
6. "usesIngredientsHindi": Array of the same used ingredients translated into Hindi Devanagari script (e.g., ["टमाटर", "पालक", "पनीर"]).
7. "additionalIngredientsNeeded": Array of pantry staples or additions in English.
8. "additionalIngredientsNeededHindi": Array of pantry staples or additions in Hindi Devanagari script.
9. "steps": Step-by-step cooking instructions in English.
10. "stepsHindi": Step-by-step cooking instructions in natural Hindi Devanagari script.
11. "cookTimeMinutes": Total active + cook time in minutes (number, e.g. 15, 25).
12. "cookingTime": Clear human-readable cooking time string (e.g. "15 mins", "25 mins", "30 mins").
13. "difficulty": Exactly one of "Easy", "Medium", or "Hard" based on technique and complexity.
14. "chefTip": A pro zero-waste tip for vegetarian cooking in English.
15. "chefTipHindi": The zero-waste tip in natural Hindi Devanagari script.`;

    let response;
    try {
      response = await generateContentWithRetry({
        preferredModel: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a professional zero-waste executive chef specializing strictly in VEGETARIAN cuisine. HARD CONSTRAINT: You must never suggest meat, poultry, fish, or egg-based recipes under any circumstances. All recipes must be strictly vegetarian (dairy and plant-based ingredients are allowed). All cost, price, and savings estimates must reflect realistic Indian Rupee (INR) grocery pricing in India, not USD or other currencies. You provide complete bilingual output in English and natural Hindi (Devanagari script), clear difficulty levels (Easy, Medium, Hard), exact cooking time, and clever zero-waste kitchen hacks.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                recipeName: {
                  type: Type.STRING,
                  description: 'Appetizing, clear vegetarian recipe title in English.',
                },
                recipeNameHindi: {
                  type: Type.STRING,
                  description: 'Appetizing, natural vegetarian recipe title in Hindi (Devanagari script).',
                },
                description: {
                  type: Type.STRING,
                  description: '1-2 sentence description explaining how this vegetarian recipe rescues expiring food in English.',
                },
                descriptionHindi: {
                  type: Type.STRING,
                  description: '1-2 sentence description in Hindi (Devanagari script).',
                },
                usesIngredients: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Vegetarian ingredients used from the user inventory (English).',
                },
                usesIngredientsHindi: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Used vegetarian ingredients in Hindi (Devanagari script).',
                },
                additionalIngredientsNeeded: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Pantry staples or optional vegetarian additions needed (English).',
                },
                additionalIngredientsNeededHindi: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Pantry staples or additions in Hindi (Devanagari script).',
                },
                steps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Step-by-step cooking directions in English.',
                },
                stepsHindi: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Step-by-step cooking directions in natural Hindi (Devanagari script).',
                },
                cookTimeMinutes: {
                  type: Type.INTEGER,
                  description: 'Total active + cook time in minutes.',
                },
                cookingTime: {
                  type: Type.STRING,
                  description: 'Human-readable cooking time string such as "15 mins", "25 mins", "30 mins".',
                },
                difficulty: {
                  type: Type.STRING,
                  description: 'Difficulty level: strictly "Easy", "Medium", or "Hard".',
                },
                chefTip: {
                  type: Type.STRING,
                  description: 'A pro zero-waste tip for vegetarian cooking in English.',
                },
                chefTipHindi: {
                  type: Type.STRING,
                  description: 'A pro zero-waste tip in natural Hindi (Devanagari script).',
                },
              },
              required: [
                'recipeName',
                'description',
                'usesIngredients',
                'additionalIngredientsNeeded',
                'steps',
                'cookTimeMinutes',
                'cookingTime',
                'difficulty',
                'chefTip',
              ],
            },
          },
        },
      });
    } catch (aiError: any) {
      console.warn('Gemini recipe generation high-demand fallback triggered:', aiError?.message);
      const dynamicRecipes = buildDynamicZeroWasteRecipes(formattedInventory);
      return res.json({ recipes: dynamicRecipes, isHighDemandFallback: true });
    }

    const rawText = response.text || '[]';
    let recipes;
    try {
      recipes = JSON.parse(rawText);
    } catch {
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        recipes = JSON.parse(jsonMatch[0]);
      } else {
        recipes = buildDynamicZeroWasteRecipes(formattedInventory);
      }
    }

    // Add unique IDs
    const recipesWithIds = (Array.isArray(recipes) ? recipes : []).map((r: any, idx: number) => ({
      ...r,
      id: `recipe-${Date.now()}-${idx}`,
    }));

    return res.json({ recipes: recipesWithIds });
  } catch (error: any) {
    console.warn('Error in recipes endpoint, serving dynamic fallback:', error);
    const dynamicRecipes = buildDynamicZeroWasteRecipes(inventory);
    return res.json({ recipes: dynamicRecipes, isHighDemandFallback: true });
  }
});

/**
 * Real AI Image Generation for Recipe Suggestions using Gemini's Image Generation Model ('gemini-3.1-flash-image' / 'gemini-3.1-flash-lite-image')
 *
 * COST AWARENESS:
 * Note: Generating food images with Gemini image models incurs a real per-image API cost
 * and adds latency per recipe. This is an intentional tradeoff requested by the user,
 * executed asynchronously and lazily per recipe card in the background rather than blocking initial text recipes.
 */
app.post('/api/recipes/generate-image', async (req, res) => {
  try {
    const { recipeName, keyIngredients = [] } = req.body || {};
    if (!recipeName) {
      return res.status(400).json({ error: 'Recipe name is required' });
    }

    const ai = getGenAI();
    const ingredientsList = Array.isArray(keyIngredients) && keyIngredients.length > 0
      ? keyIngredients.slice(0, 5).join(', ')
      : 'fresh vegetables and spices';

    // Constructed prompt as strictly specified for consistent visual style
    const prompt = `A warm, appetizing, overhead-angle food photograph of ${recipeName}, an Indian vegetarian dish made with ${ingredientsList}. Natural lighting, rustic ceramic plate, shallow depth of field, home-cooked authentic style, no text or watermarks.`;

    const candidateModels = [
      'gemini-3.1-flash-image-preview',
      'gemini-3.1-flash-lite-image',
    ];
    let imageUrl: string | null = null;
    let successfulModel: string | null = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: {
            parts: [{ text: prompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: '16:9',
            },
          },
        });

        const candidates = response.candidates || [];
        if (candidates.length > 0 && candidates[0].content?.parts) {
          for (const part of candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
              const mime = part.inlineData.mimeType || 'image/png';
              imageUrl = `data:${mime};base64,${part.inlineData.data}`;
              successfulModel = model;
              break;
            }
          }
        }
        if (imageUrl) {
          console.log(`[Recipe Image Generator] Successfully generated recipe image with model: ${successfulModel}`);
          break;
        }
      } catch (err: any) {
        const isQuota = err?.status === 'RESOURCE_EXHAUSTED' || err?.message?.includes('429') || err?.message?.includes('quota');
        const reason = isQuota ? 'Quota limit reached (free tier or rate limit)' : (err?.message?.slice(0, 100) || 'Unavailable');
        console.log(`[Recipe Image Generator] Model ${model} unavailable (${reason}), trying fallback...`);
      }
    }

    if (!imageUrl) {
      console.log('[Recipe Image Generator] Image generation unavailable or quota reached, serving category fallback banner.');
      return res.json({
        imageUrl: null,
        fallback: true,
        message: 'Serving zero-waste category fallback banner',
      });
    }

    return res.json({ imageUrl });
  } catch (error: any) {
    console.log('[Recipe Image Generator] Handled error in recipe image endpoint, serving fallback');
    return res.json({
      imageUrl: null,
      fallback: true,
    });
  }
});

/**
 * 3. Quick AI Freshness & Storage Advice for an Item
 */
app.post('/api/item/advice', async (req, res) => {
  try {
    const { item, quantity, category, currentStorage } = req.body;
    if (!item) {
      return res.status(400).json({ error: 'Item name is required' });
    }

    const prompt = `Give concise, practical storage and zero-waste preservation advice for: "${item}" (Quantity: ${quantity || 'standard'}, Category: ${category || 'Food'}, Stored at: ${currentStorage || 'Fridge'}).
All cost, price, and savings estimates must reflect realistic Indian Rupee (INR) grocery pricing in India, not USD or other currencies.
Return JSON with optimal storage tips, how to extend shelf life (e.g. freeze, water jar, paper towel), signs of spoilage, and quick zero-waste rescue ideas.`;

    let response;
    try {
      response = await generateContentWithRetry({
        preferredModel: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are an expert food scientist and zero-waste chef giving succinct storage hacks. All cost, price, and savings estimates must reflect realistic Indian Rupee (INR) grocery pricing in India, not USD or other currencies.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              optimalStorage: { type: Type.STRING },
              shelfLifeExtensionTip: { type: Type.STRING },
              spoilageCheck: { type: Type.STRING },
              quickRescueIdea: { type: Type.STRING },
            },
            required: ['optimalStorage', 'shelfLifeExtensionTip', 'spoilageCheck', 'quickRescueIdea'],
          },
        },
      });
      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (aiErr: any) {
      console.warn('Advice AI high demand, generating food science fallback advice:', aiErr?.message);
      // Helpful heuristic storage advice by category
      const isProduce = category === 'Produce';
      const isDairy = category === 'Dairy';
      const isBakery = category === 'Bakery';

      return res.json({
        optimalStorage: isProduce
          ? `Store ${item} in the refrigerator crisper drawer with moderate humidity, wrapped loosely with a dry paper towel.`
          : isDairy
          ? `Keep ${item} on an interior refrigerator shelf (under 40°F / 4°C), avoiding the warmer door bins.`
          : isBakery
          ? `Keep ${item} in a cool, dry pantry in a sealed bag, or slice and freeze for instant toasting.`
          : `Keep ${item} tightly sealed in a cool, dark, and dry pantry cabinet away from direct heat.`,
        shelfLifeExtensionTip: isProduce
          ? `Keep separate from high-ethylene emitters (like ripe bananas or apples) to prevent accelerated ripening.`
          : isDairy
          ? `Always use clean, dry utensils to prevent introducing bacteria, and ensure the seal is airtight.`
          : `Freeze portions in advance to lock in freshness for up to 3 months.`,
        spoilageCheck: `Check for visible mold discoloration, off sour odors, slimy surface texture, or significant loss of firmness.`,
        quickRescueIdea: isProduce
          ? `If slightly wilted or overripe, chop and freeze for future stir-fries, stews, or smoothies!`
          : isDairy
          ? `Use slightly aged dairy in cooked baked goods, casseroles, or creamy skillet sauces.`
          : `Toast stale bakery slices into savory garlic croutons, bread pudding, or homemade breadcrumbs.`,
      });
    }
  } catch (error: any) {
    console.error('Error getting storage advice:', error);
    return res.status(500).json({ error: error?.message || 'Failed to fetch advice' });
  }
});

// Vite middleware & Static serving
async function setupApp() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PantryPilot server running on http://localhost:${PORT}`);
  });
}

setupApp();
