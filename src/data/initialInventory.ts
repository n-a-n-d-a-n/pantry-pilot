import { InventoryItem, WasteLogEntry, CookedItemRecord } from '../types';

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'item-1',
    itemName: 'Hass Avocados',
    item: 'Hass Avocados',
    quantity: '2 ripe',
    category: 'Produce',
    estimatedShelfLifeDays: 1, // Urgent (today/tomorrow)
    addedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    storageLocation: 'Counter',
    status: 'active',
    notes: 'Very ripe, soft to touch',
    scannedFrom: 'photo',
  },
  {
    id: 'item-2',
    itemName: 'Baby Spinach',
    item: 'Baby Spinach',
    quantity: '1 bag (approx. 5oz)',
    category: 'Produce',
    estimatedShelfLifeDays: 2, // Urgent / Soon
    addedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    storageLocation: 'Fridge',
    status: 'active',
    notes: 'Opened 3 days ago',
    scannedFrom: 'photo',
  },
  {
    id: 'item-3',
    itemName: 'Greek Yogurt (Plain)',
    item: 'Greek Yogurt (Plain)',
    quantity: '1 tub (50% full)',
    category: 'Dairy',
    estimatedShelfLifeDays: 4, // Soon (yellow)
    addedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    storageLocation: 'Fridge',
    status: 'active',
    scannedFrom: 'receipt',
  },
  {
    id: 'item-4',
    itemName: 'Roma Tomatoes',
    item: 'Roma Tomatoes',
    quantity: '4 medium',
    category: 'Produce',
    estimatedShelfLifeDays: 5, // Soon (yellow)
    addedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    storageLocation: 'Counter',
    status: 'active',
    scannedFrom: 'photo',
  },
  {
    id: 'item-5',
    itemName: 'Organic Oat Milk',
    item: 'Organic Oat Milk',
    quantity: '1/2 gallon',
    category: 'Dairy',
    estimatedShelfLifeDays: 7, // Fresh (green)
    addedDate: new Date().toISOString().split('T')[0],
    storageLocation: 'Fridge',
    status: 'active',
    scannedFrom: 'receipt',
  },
  {
    id: 'item-6',
    itemName: 'Sharp Cheddar Cheese',
    item: 'Sharp Cheddar Cheese',
    quantity: '1 block (8 oz)',
    category: 'Dairy',
    estimatedShelfLifeDays: 14, // Fresh (green)
    addedDate: new Date().toISOString().split('T')[0],
    storageLocation: 'Fridge',
    status: 'active',
    scannedFrom: 'manual',
  },
  {
    id: 'item-7',
    itemName: 'Fresh Strawberries',
    item: 'Fresh Strawberries',
    quantity: '1 clamshell (16 oz)',
    category: 'Produce',
    estimatedShelfLifeDays: 0, // Urgent (today)
    addedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    storageLocation: 'Fridge',
    status: 'active',
    notes: 'Starting to soften',
    scannedFrom: 'photo',
  },
  {
    id: 'item-8',
    itemName: 'Fresh Cilantro / Coriander',
    item: 'Fresh Cilantro / Coriander',
    quantity: '1 bunch',
    category: 'Produce',
    estimatedShelfLifeDays: 1, // Urgent / Past life
    addedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    storageLocation: 'Fridge',
    status: 'active',
    notes: 'Leaves wilting, use today',
    scannedFrom: 'photo',
  },
];

export const INITIAL_WASTED_ITEMS: WasteLogEntry[] = [
  {
    id: 'waste-1',
    itemName: 'Fresh Cilantro / Coriander',
    quantity: '1 bunch',
    category: 'Produce',
    dateDiscarded: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    discardedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    reason: 'Forgot in back of crisper drawer',
  },
  {
    id: 'waste-2',
    itemName: 'Fresh Cilantro / Coriander',
    quantity: '1 bunch',
    category: 'Produce',
    dateDiscarded: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    discardedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    reason: 'Turned slimy before cooking',
  },
  {
    id: 'waste-3',
    itemName: 'Sourdough Bread',
    quantity: '3 slices',
    category: 'Bakery',
    dateDiscarded: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    discardedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    reason: 'Grew mold',
  },
];

export const INITIAL_COOKED_ITEMS: CookedItemRecord[] = [
  {
    id: 'cook-1',
    itemName: 'Bell Peppers & Zucchini',
    quantity: '3 mixed',
    category: 'Produce',
    dateCooked: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    recipeName: 'Pantry Rescue Veggie Stir Fry',
  },
  {
    id: 'cook-2',
    itemName: 'Tofu & Spinach',
    quantity: '1 block tofu, 1 cup spinach',
    category: 'Produce',
    dateCooked: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    recipeName: 'Zero-Waste Tofu Scramble',
  },
];
