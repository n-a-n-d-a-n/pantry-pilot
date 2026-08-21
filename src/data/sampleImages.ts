/**
 * Helper to generate crisp, high-resolution sample vegetarian food and receipt images using Canvas
 * to allow immediate, effortless testing of Gemini 2.5 Flash Vision & OCR capabilities.
 * 100% VEGETARIAN: No meat, poultry, fish, seafood, or eggs.
 */

export interface SampleImageOption {
  id: string;
  name: string;
  category: 'produce' | 'fridge' | 'receipt';
  description: string;
  thumbnailColor: string;
  generateBase64: () => string;
}

export function createSampleReceiptImage(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background receipt paper texture
  ctx.fillStyle = '#fbf9f4';
  ctx.fillRect(0, 0, 600, 800);

  // Paper header
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 26px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GREEN EARTH VEGETARIAN', 300, 50);

  ctx.font = '16px monospace';
  ctx.fillStyle = '#475569';
  ctx.fillText('108 Indiranagar 100ft Road, Bengaluru, KA', 300, 80);
  ctx.fillText(`DATE: ${new Date().toLocaleDateString('en-IN')}  14:32  REG 04`, 300, 105);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(30, 125);
  ctx.lineTo(570, 125);
  ctx.stroke();
  ctx.setLineDash([]);

  // Line items (Strictly vegetarian Indian groceries in INR)
  const items = [
    { name: '1  DESI TOMATOES 1KG', price: '₹40.00' },
    { name: '1  PALAK / BABY SPINACH 250G', price: '₹35.00' },
    { name: '2  HASS AVOCADOS', price: '₹180.00' },
    { name: '1  AMUL TAZA MILK 1L', price: '₹56.00' },
    { name: '1  FRESH MALAI PANEER 200G', price: '₹95.00' },
    { name: '1  MULTIGRAIN SOURDOUGH BREAD', price: '₹85.00' },
    { name: '1  EPIGAMIA GREEK YOGURT 400G', price: '₹120.00' },
    { name: '1  MAHABALESHWAR STRAWBERRIES', price: '₹110.00' },
    { name: '1  DAAWAT BASMATI RICE 1KG', price: '₹145.00' },
    { name: '1  ORGANIC CHICKPEA HUMMUS', price: '₹160.00' },
  ];

  ctx.textAlign = 'left';
  ctx.font = 'bold 18px monospace';
  ctx.fillStyle = '#0f172a';

  let y = 165;
  items.forEach((item) => {
    ctx.fillText(item.name, 40, y);
    ctx.textAlign = 'right';
    ctx.fillText(item.price, 560, y);
    ctx.textAlign = 'left';
    y += 38;
  });

  // Divider
  ctx.beginPath();
  ctx.moveTo(30, y + 10);
  ctx.lineTo(570, y + 10);
  ctx.stroke();

  // Total
  y += 45;
  ctx.font = 'bold 22px monospace';
  ctx.fillText('SUBTOTAL:', 40, y);
  ctx.textAlign = 'right';
  ctx.fillText('₹866.00', 560, y);

  y += 35;
  ctx.fillText('GST (5%):', 40, y);
  ctx.fillText('₹43.30', 560, y);

  y += 40;
  ctx.font = 'bold 26px monospace';
  ctx.fillText('TOTAL DUE:', 40, y);
  ctx.fillText('₹909.30', 560, y);

  // Footer barcode & thank you
  y += 60;
  ctx.textAlign = 'center';
  ctx.font = '14px monospace';
  ctx.fillStyle = '#64748b';
  ctx.fillText('100% VEGETARIAN ZERO-WASTE KITCHEN', 300, y);
  ctx.fillText('KEEP FOOD FRESH WITH PANTRYPILOT', 300, y + 24);

  // Barcode lines
  const startX = 140;
  const barcodeY = y + 45;
  for (let i = 0; i < 60; i++) {
    const w = i % 3 === 0 || i % 7 === 0 ? 4 : 2;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(startX + i * 5.2, barcodeY, w, 40);
  }

  return canvas.toDataURL('image/jpeg', 0.9);
}

export function createSampleProduceImage(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 700;
  canvas.height = 500;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background rustic kitchen counter
  const grad = ctx.createLinearGradient(0, 0, 700, 500);
  grad.addColorStop(0, '#f8fafc');
  grad.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 700, 500);

  // Kitchen cutting board
  ctx.fillStyle = '#e8be89';
  ctx.beginPath();
  ctx.roundRect(50, 50, 600, 400, [16]);
  ctx.fill();
  ctx.strokeStyle = '#cda26f';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Draw simulated produce items with labels
  const drawFood = (x: number, y: number, color: string, name: string, emoji: string, size: number) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Emoji icon
    ctx.font = `${size * 0.9}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, x, y - 2);

    // Food tag
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(name, x, y + size + 20);
  };

  drawFood(160, 160, '#ef4444', '4 Roma Tomatoes', '🍅', 45);
  drawFood(350, 150, '#15803d', '1 Bag Baby Spinach', '🥬', 50);
  drawFood(530, 170, '#166534', '2 Ripe Avocados', '🥑', 45);
  drawFood(200, 310, '#fef08a', '1 Extra Firm Tofu', '🧈', 40);
  drawFood(360, 310, '#ec4899', '1 Clamshell Berries', '🍓', 45);
  drawFood(520, 310, '#0284c7', '1 Almond Milk', '🥛', 42);

  return canvas.toDataURL('image/jpeg', 0.92);
}

export function createSampleFridgeImage(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 650;
  canvas.height = 650;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Fridge interior background
  ctx.fillStyle = '#f0f9ff';
  ctx.fillRect(0, 0, 650, 650);

  // Refrigerator shelves
  ctx.strokeStyle = '#bae6fd';
  ctx.lineWidth = 6;
  ctx.strokeRect(30, 30, 590, 590);

  // Shelf 1 (Top)
  ctx.fillStyle = '#e0f2fe';
  ctx.fillRect(30, 200, 590, 14);
  // Shelf 2 (Middle)
  ctx.fillRect(30, 400, 590, 14);

  // Items on Top Shelf
  ctx.font = '55px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🥛', 130, 140);
  ctx.fillText('🧀', 280, 140);
  ctx.fillText('🍶', 430, 140);
  ctx.fillText('🧈', 540, 140);

  // Items on Middle Shelf
  ctx.fillText('🥬', 140, 340);
  ctx.fillText('🍓', 270, 340);
  ctx.fillText('🥒', 400, 340);
  ctx.fillText('🥦', 520, 340);

  // Items on Bottom Crisper
  ctx.fillText('🥕', 150, 530);
  ctx.fillText('🍅', 290, 530);
  ctx.fillText('🍎', 420, 530);
  ctx.fillText('🍋', 530, 530);

  // Text labels on shelves
  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = '#0369a1';
  ctx.fillText('Top Shelf: Oat Milk, Sharp Cheddar, Greek Yogurt, Tofu', 325, 185);
  ctx.fillText('Middle Shelf: Spinach Box, Strawberries, Cucumbers, Broccoli', 325, 385);
  ctx.fillText('Crisper Drawer: Carrots, Tomatoes, Red Apples, Lemons', 325, 580);

  return canvas.toDataURL('image/jpeg', 0.92);
}

export const SAMPLE_PRESETS: SampleImageOption[] = [
  {
    id: 'sample-groceries',
    name: 'Vegetarian Grocery Haul',
    category: 'produce',
    description: 'Tomatoes, Baby Spinach, Avocados, Berries & Tofu',
    thumbnailColor: 'from-emerald-500 to-teal-600',
    generateBase64: createSampleProduceImage,
  },
  {
    id: 'sample-fridge',
    name: 'Vegetarian Fridge Shelves',
    category: 'fridge',
    description: 'Dairy, Crisper Produce, Yogurt, Cheese, Fruit & Tofu',
    thumbnailColor: 'from-sky-500 to-blue-600',
    generateBase64: createSampleFridgeImage,
  },
  {
    id: 'sample-receipt',
    name: 'Vegetarian Store Receipt',
    category: 'receipt',
    description: 'Itemized OCR receipt with 10 plant-based & dairy items',
    thumbnailColor: 'from-amber-500 to-orange-600',
    generateBase64: createSampleReceiptImage,
  },
];
