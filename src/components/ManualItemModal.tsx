import React, { useState, useEffect } from 'react';
import { X, Check, Leaf } from 'lucide-react';
import { InventoryItem, FoodCategory, StorageLocation } from '../types';

interface ManualItemModalProps {
  isOpen: boolean;
  itemToEdit?: InventoryItem | null;
  onClose: () => void;
  onSave: (itemData: Omit<InventoryItem, 'id' | 'status'> & { id?: string }) => void;
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

export const ManualItemModal: React.FC<ManualItemModalProps> = ({
  isOpen,
  itemToEdit,
  onClose,
  onSave,
}) => {
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState<FoodCategory>('Produce');
  const [shelfLifeDays, setShelfLifeDays] = useState(7);
  const [storageLocation, setStorageLocation] = useState<StorageLocation>('Fridge');
  const [addedDate, setAddedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (itemToEdit) {
      setItemName(itemToEdit.itemName || itemToEdit.item || '');
      setQuantity(itemToEdit.quantity || '1 portion');
      const cat = itemToEdit.category === 'Dairy & Eggs' ? 'Dairy' : (itemToEdit.category as FoodCategory) || 'Produce';
      setCategory(cat);
      setShelfLifeDays(itemToEdit.estimatedShelfLifeDays || 7);
      setStorageLocation(itemToEdit.storageLocation || 'Fridge');
      setAddedDate(itemToEdit.addedDate || new Date().toISOString().split('T')[0]);
      setNotes(itemToEdit.notes || '');
    } else {
      setItemName('');
      setQuantity('1 count');
      setCategory('Produce');
      setShelfLifeDays(7);
      setStorageLocation('Fridge');
      setAddedDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
  }, [itemToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    onSave({
      id: itemToEdit?.id,
      itemName: itemName.trim(),
      item: itemName.trim(),
      quantity: quantity.trim() || '1 item',
      category,
      estimatedShelfLifeDays: Number(shelfLifeDays) || 7,
      storageLocation,
      addedDate,
      notes: notes.trim(),
      confidence: itemToEdit?.confidence || 'Manual entry',
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="bg-[#FFFBF5]/95 dark:bg-[#181614]/95 backdrop-blur-xl rounded-3xl max-w-lg w-full shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden flex flex-col max-h-[92vh] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#F0EAD6]/80 dark:border-[#3D3833]/80 flex items-center justify-between bg-white/90 dark:bg-[#262320]/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#2D2926] dark:text-[#F5F3EF]">
              {itemToEdit ? 'Edit Vegetarian Item' : 'Add Vegetarian Item'}
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F0FDF4] dark:bg-[#142E1F] text-[#166534] dark:text-[#86EFAC] border border-[#DCFCE7] dark:border-[#1E4D2B]">
              <Leaf className="w-2.5 h-2.5" />
              Vegetarian
            </span>
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

        {/* Form Container with scrollable body and fixed footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#2D2926] dark:text-[#F5F3EF] mb-1">
                Food Item Name * (Vegetarian)
              </label>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Sourdough Bread, Strawberries, Tofu, Greek Yogurt"
                className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] dark:border-[#3D3833] bg-white dark:bg-[#181614] text-[#2D2926] dark:text-[#F5F3EF] text-xs sm:text-sm focus:ring-2 focus:ring-[#F27D26] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#2D2926] dark:text-[#F5F3EF] mb-1">
                  Estimated Quantity
                </label>
                <input
                  type="text"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 4 pieces, 1 carton"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] dark:border-[#3D3833] bg-white dark:bg-[#181614] text-[#2D2926] dark:text-[#F5F3EF] text-xs sm:text-sm focus:ring-2 focus:ring-[#F27D26] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2926] dark:text-[#F5F3EF] mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FoodCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] dark:border-[#3D3833] bg-white dark:bg-[#181614] text-[#2D2926] dark:text-[#F5F3EF] text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-[#F27D26] outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#2D2926] dark:text-[#F5F3EF] mb-1">
                  Shelf Life (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="730"
                  value={shelfLifeDays}
                  onChange={(e) => setShelfLifeDays(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] dark:border-[#3D3833] bg-white dark:bg-[#181614] text-[#2D2926] dark:text-[#F5F3EF] text-xs sm:text-sm font-bold focus:ring-2 focus:ring-[#F27D26] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2926] dark:text-[#F5F3EF] mb-1">
                  Storage Spot
                </label>
                <select
                  value={storageLocation}
                  onChange={(e) => setStorageLocation(e.target.value as StorageLocation)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] dark:border-[#3D3833] bg-white dark:bg-[#181614] text-[#2D2926] dark:text-[#F5F3EF] text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-[#F27D26] outline-none"
                >
                  {STORAGE_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D2926] dark:text-[#F5F3EF] mb-1">
                Date Added / Bought
              </label>
              <input
                type="date"
                value={addedDate}
                onChange={(e) => setAddedDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] dark:border-[#3D3833] bg-white dark:bg-[#181614] text-[#2D2926] dark:text-[#F5F3EF] text-xs sm:text-sm focus:ring-2 focus:ring-[#F27D26] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D2926] dark:text-[#F5F3EF] mb-1">
                Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Keep in airtight container"
                className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] dark:border-[#3D3833] bg-white dark:bg-[#181614] text-[#2D2926] dark:text-[#F5F3EF] text-xs sm:text-sm focus:ring-2 focus:ring-[#F27D26] outline-none"
              />
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="px-6 py-3.5 border-t border-[#F0EAD6]/80 dark:border-[#3D3833]/80 bg-white/90 dark:bg-[#262320]/90 backdrop-blur-sm flex justify-end space-x-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E5E1D8] dark:border-[#3D3833] text-[#2D2926] dark:text-[#F5F3EF] text-xs font-semibold hover:bg-[#F5F5F0] dark:hover:bg-[#2F2A26] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#F27D26] hover:bg-[#E06D19] text-white text-xs font-bold shadow-sm flex items-center space-x-1.5 active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{itemToEdit ? 'Save Changes' : 'Add to Cloud Pantry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
