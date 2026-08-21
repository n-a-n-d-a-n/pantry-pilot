import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { InventoryItem, WasteLogEntry, UserStatsSummary } from '../types';

export function subscribeToInventory(
  userId: string,
  onData: (items: InventoryItem[]) => void,
  onError?: (err: Error) => void,
  onMetadata?: (fromCache: boolean) => void
) {
  const collectionPath = `users/${userId}/inventory`;
  const q = query(collection(db, collectionPath));

  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      if (onMetadata) {
        onMetadata(snapshot.metadata.fromCache);
      }
      const items: InventoryItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const rawName = data.itemName || data.item || 'Unknown item';
        items.push({
          id: docSnap.id,
          itemName: rawName,
          item: rawName,
          quantity: data.quantity || '1 portion',
          category: data.category || 'Produce',
          storageLocation: data.storageLocation || 'Fridge',
          addedDate: data.addedDate || new Date().toISOString().split('T')[0],
          estimatedShelfLifeDays: typeof data.estimatedShelfLifeDays === 'number' ? data.estimatedShelfLifeDays : 5,
          status: data.status || 'active',
          confidence: data.confidence || '',
          notes: data.notes || '',
          scannedFrom: data.scannedFrom || 'photo',
          userId: data.userId || userId,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      });
      onData(items);
    },
    (error) => {
      console.error('Inventory subscription error:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, collectionPath);
    }
  );
}

export function subscribeToWasteLog(
  userId: string,
  onData: (entries: WasteLogEntry[]) => void,
  onError?: (err: Error) => void,
  onMetadata?: (fromCache: boolean) => void
) {
  const collectionPath = `users/${userId}/wasteLog`;
  const q = query(collection(db, collectionPath));

  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      if (onMetadata) {
        onMetadata(snapshot.metadata.fromCache);
      }
      const entries: WasteLogEntry[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const rawName = data.itemName || data.item || 'Unnamed item';
        entries.push({
          id: docSnap.id,
          itemName: rawName,
          item: rawName,
          discardedDate: data.discardedDate || data.dateDiscarded || new Date().toISOString(),
          dateDiscarded: data.dateDiscarded || data.discardedDate || new Date().toISOString().split('T')[0],
          reason: data.reason || 'expired',
          quantity: data.quantity || '1 portion',
          category: data.category || 'Produce',
          estimatedCost: typeof data.estimatedCost === 'number' ? data.estimatedCost : 60,
          userId: data.userId || userId,
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
      onData(entries);
    },
    (error) => {
      console.error('WasteLog subscription error:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, collectionPath);
    }
  );
}

export function subscribeToStats(
  userId: string,
  onData: (stats: UserStatsSummary) => void,
  onError?: (err: Error) => void,
  onMetadata?: (fromCache: boolean) => void
) {
  const docPath = `users/${userId}/stats/summary`;
  const docRef = doc(db, docPath);

  return onSnapshot(
    docRef,
    { includeMetadataChanges: true },
    (docSnap) => {
      if (onMetadata) {
        onMetadata(docSnap.metadata.fromCache);
      }
      if (docSnap.exists()) {
        const data = docSnap.data();
        onData({
          zeroWasteScore: typeof data.zeroWasteScore === 'number' ? data.zeroWasteScore : 95,
          totalItemsRescued: typeof data.totalItemsRescued === 'number' ? data.totalItemsRescued : 0,
          estimatedMoneySaved: typeof data.estimatedMoneySaved === 'number' ? data.estimatedMoneySaved : 0,
          currentStreak: typeof data.currentStreak === 'number' ? data.currentStreak : 1,
          userId: data.userId || userId,
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      } else {
        onData({
          zeroWasteScore: 95,
          totalItemsRescued: 0,
          estimatedMoneySaved: 0,
          currentStreak: 1,
          userId,
        });
      }
    },
    (error) => {
      console.error('Stats summary subscription error:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, docPath);
    }
  );
}

export async function addInventoryItem(
  userId: string,
  itemData: Omit<InventoryItem, 'id' | 'userId'>
): Promise<string> {
  const itemId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const docPath = `users/${userId}/inventory/${itemId}`;
  const now = new Date().toISOString();

  try {
    const rawName = itemData.itemName || itemData.item || 'Item';
    const payload = {
      itemName: rawName,
      quantity: itemData.quantity || '1 portion',
      category: itemData.category || 'Produce',
      storageLocation: itemData.storageLocation || 'Fridge',
      addedDate: itemData.addedDate || now.split('T')[0],
      estimatedShelfLifeDays: Number(itemData.estimatedShelfLifeDays) || 5,
      confidence: itemData.confidence || '',
      notes: itemData.notes || '',
      scannedFrom: itemData.scannedFrom || 'manual',
      status: itemData.status || 'active',
      userId,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, docPath), payload);
    return itemId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
    throw error;
  }
}

export async function addInventoryItems(
  userId: string,
  items: Omit<InventoryItem, 'id' | 'userId'>[]
): Promise<void> {
  for (const item of items) {
    await addInventoryItem(userId, item);
  }
}

export async function updateInventoryItem(
  userId: string,
  itemId: string,
  updates: Partial<InventoryItem>
): Promise<void> {
  const docPath = `users/${userId}/inventory/${itemId}`;
  const now = new Date().toISOString();

  try {
    const cleanUpdates: Record<string, any> = {
      updatedAt: now,
    };
    if (updates.itemName !== undefined) cleanUpdates.itemName = updates.itemName;
    if (updates.item !== undefined && !updates.itemName) cleanUpdates.itemName = updates.item;
    if (updates.quantity !== undefined) cleanUpdates.quantity = updates.quantity;
    if (updates.category !== undefined) cleanUpdates.category = updates.category;
    if (updates.storageLocation !== undefined) cleanUpdates.storageLocation = updates.storageLocation;
    if (updates.addedDate !== undefined) cleanUpdates.addedDate = updates.addedDate;
    if (updates.estimatedShelfLifeDays !== undefined)
      cleanUpdates.estimatedShelfLifeDays = Number(updates.estimatedShelfLifeDays);
    if (updates.status !== undefined) cleanUpdates.status = updates.status;
    if (updates.confidence !== undefined) cleanUpdates.confidence = updates.confidence;
    if (updates.notes !== undefined) cleanUpdates.notes = updates.notes;

    await updateDoc(doc(db, docPath), cleanUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
    throw error;
  }
}

export async function deleteInventoryItem(userId: string, itemId: string): Promise<void> {
  const docPath = `users/${userId}/inventory/${itemId}`;
  try {
    await deleteDoc(doc(db, docPath));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
    throw error;
  }
}

export async function markItemCooked(
  userId: string,
  itemOrId: InventoryItem | string,
  recipeName?: string,
  currentStats?: UserStatsSummary
): Promise<void> {
  const itemId = typeof itemOrId === 'string' ? itemOrId : itemOrId.id;
  const docPath = `users/${userId}/inventory/${itemId}`;
  const now = new Date().toISOString();

  try {
    await updateDoc(doc(db, docPath), {
      status: 'cooked',
      updatedAt: now,
    });

    const statsDocPath = `users/${userId}/stats/summary`;
    const newRescued = ((currentStats?.totalItemsRescued) || 0) + 1;
    const newSaved = ((currentStats?.estimatedMoneySaved) || 0) + 120;
    const newScore = Math.min(100, ((currentStats?.zeroWasteScore) || 94) + 1);

    await setDoc(
      doc(db, statsDocPath),
      {
        zeroWasteScore: newScore,
        totalItemsRescued: newRescued,
        estimatedMoneySaved: Math.round(newSaved),
        currentStreak: ((currentStats?.currentStreak) || 1) + 1,
        userId,
        updatedAt: now,
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
    throw error;
  }
}

export async function markItemDiscarded(
  userId: string,
  item: InventoryItem,
  reason: string,
  currentStats?: UserStatsSummary
): Promise<void> {
  const now = new Date().toISOString();
  const logId = `waste_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const wastePath = `users/${userId}/wasteLog/${logId}`;
  const itemPath = `users/${userId}/inventory/${item.id}`;

  try {
    const rawName = item.itemName || item.item || 'Item';
    const wastePayload: WasteLogEntry = {
      id: logId,
      itemName: rawName,
      item: rawName,
      discardedDate: now,
      dateDiscarded: now.split('T')[0],
      reason: reason || 'expired',
      quantity: item.quantity || '1 portion',
      category: String(item.category || 'Produce'),
      estimatedCost: 80,
      userId,
      createdAt: now,
    };
    await setDoc(doc(db, wastePath), wastePayload);

    await updateDoc(doc(db, itemPath), {
      status: 'discarded',
      updatedAt: now,
    });

    const statsDocPath = `users/${userId}/stats/summary`;
    const currentScore = currentStats?.zeroWasteScore || 90;
    const newScore = Math.max(50, currentScore - 4);
    await setDoc(
      doc(db, statsDocPath),
      {
        zeroWasteScore: newScore,
        totalItemsRescued: currentStats?.totalItemsRescued || 0,
        estimatedMoneySaved: currentStats?.estimatedMoneySaved || 0,
        currentStreak: 1,
        userId,
        updatedAt: now,
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, wastePath);
    throw error;
  }
}

export async function clearWasteLog(userId: string): Promise<void> {
  const collectionPath = `users/${userId}/wasteLog`;
  try {
    const q = query(collection(db, collectionPath));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, collectionPath);
    throw error;
  }
}

export async function resetToDemoVegetarianPantry(userId: string): Promise<void> {
  const inventoryCol = `users/${userId}/inventory`;
  const wasteCol = `users/${userId}/wasteLog`;

  try {
    // 1. Clear existing active items
    const invSnap = await getDocs(query(collection(db, inventoryCol)));
    const batch = writeBatch(db);
    invSnap.forEach((d) => batch.delete(d.ref));

    const wasteSnap = await getDocs(query(collection(db, wasteCol)));
    wasteSnap.forEach((d) => batch.delete(d.ref));
    await batch.commit();

    // 2. Populate 100% vegetarian starter items
    const today = new Date();
    const starterVegetarianItems: Omit<InventoryItem, 'id' | 'userId'>[] = [
      {
        itemName: 'Hass Avocados',
        item: 'Hass Avocados',
        quantity: '2 ripe',
        category: 'Produce',
        estimatedShelfLifeDays: 1, // Urgent
        addedDate: new Date(today.getTime() - 2 * 86400000).toISOString().split('T')[0],
        storageLocation: 'Counter',
        status: 'active',
        notes: 'Very ripe, soft to touch',
        scannedFrom: 'photo',
      },
      {
        itemName: 'Organic Baby Spinach',
        item: 'Organic Baby Spinach',
        quantity: '1 bag (5 oz)',
        category: 'Produce',
        estimatedShelfLifeDays: 2, // Soon
        addedDate: new Date(today.getTime() - 3 * 86400000).toISOString().split('T')[0],
        storageLocation: 'Fridge',
        status: 'active',
        notes: 'Opened 2 days ago',
        scannedFrom: 'photo',
      },
      {
        itemName: 'Plain Greek Yogurt',
        item: 'Plain Greek Yogurt',
        quantity: '1 tub (32 oz)',
        category: 'Dairy',
        estimatedShelfLifeDays: 4, // Soon
        addedDate: new Date(today.getTime() - 1 * 86400000).toISOString().split('T')[0],
        storageLocation: 'Fridge',
        status: 'active',
        notes: '100% vegetarian dairy',
        scannedFrom: 'receipt',
      },
      {
        itemName: 'Organic Extra Firm Tofu',
        item: 'Organic Extra Firm Tofu',
        quantity: '1 block (14 oz)',
        category: 'Produce',
        estimatedShelfLifeDays: 6, // Fresh
        addedDate: today.toISOString().split('T')[0],
        storageLocation: 'Fridge',
        status: 'active',
        scannedFrom: 'receipt',
      },
      {
        itemName: 'Artisanal Sourdough Bread',
        item: 'Artisanal Sourdough Bread',
        quantity: '1/2 loaf',
        category: 'Bakery',
        estimatedShelfLifeDays: 2, // Soon
        addedDate: new Date(today.getTime() - 2 * 86400000).toISOString().split('T')[0],
        storageLocation: 'Counter',
        status: 'active',
        notes: 'Toast or freeze',
        scannedFrom: 'manual',
      },
      {
        itemName: 'Fresh Strawberries',
        item: 'Fresh Strawberries',
        quantity: '1 clamshell (1 lb)',
        category: 'Produce',
        estimatedShelfLifeDays: 1, // Urgent
        addedDate: new Date(today.getTime() - 3 * 86400000).toISOString().split('T')[0],
        storageLocation: 'Fridge',
        status: 'active',
        notes: 'Eat or blend into smoothie',
        scannedFrom: 'photo',
      },
      {
        itemName: 'Cheddar Cheese Block',
        item: 'Cheddar Cheese Block',
        quantity: '8 oz',
        category: 'Dairy',
        estimatedShelfLifeDays: 14, // Fresh
        addedDate: today.toISOString().split('T')[0],
        storageLocation: 'Fridge',
        status: 'active',
        scannedFrom: 'photo',
      },
    ];

    for (const item of starterVegetarianItems) {
      await addInventoryItem(userId, item);
    }

    // 3. Reset stats summary
    const statsDocPath = `users/${userId}/stats/summary`;
    await setDoc(doc(db, statsDocPath), {
      zeroWasteScore: 96,
      totalItemsRescued: 4,
      estimatedMoneySaved: 480,
      currentStreak: 3,
      userId,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error resetting demo vegetarian pantry:', error);
    throw error;
  }
}
