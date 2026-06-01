import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface StockMovement {
  id: string;
  productId: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string; // 'purchase', 'sale', 'adjustment', 'damage', etc.
  timestamp: Date;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  lastRestockDate: Date;
  cost: number;
  location?: string; // Emplacement physique
}

interface InventoryContextType {
  items: InventoryItem[];
  movements: StockMovement[];
  getLowStockItems: () => InventoryItem[];
  getCriticalStockItems: () => InventoryItem[];
  addMovement: (movement: Omit<StockMovement, 'id'>) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  getItemById: (id: string) => InventoryItem | undefined;
  getMovementsByProduct: (productId: string) => StockMovement[];
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

// Données mock initiales
const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: '1',
    sku: 'FILT-001',
    name: 'Filtre à cartouche',
    quantity: 45,
    minQuantity: 10,
    maxQuantity: 100,
    lastRestockDate: new Date('2024-02-01'),
    cost: 45.00,
    location: 'A-01',
  },
  {
    id: '2',
    sku: 'PUMP-001',
    name: 'Pompe aquatique 5000L',
    quantity: 8,
    minQuantity: 5,
    maxQuantity: 50,
    lastRestockDate: new Date('2024-01-15'),
    cost: 120.00,
    location: 'A-02',
  },
  {
    id: '3',
    sku: 'CHEM-001',
    name: 'Traitement chlore 1kg',
    quantity: 5,
    minQuantity: 20,
    maxQuantity: 100,
    lastRestockDate: new Date('2024-02-05'),
    cost: 15.00,
    location: 'B-01',
  },
];

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [movements, setMovements] = useState<StockMovement[]>([]);

  const getLowStockItems = useCallback(() => {
    return items.filter(item => item.quantity <= item.minQuantity && item.quantity > 0);
  }, [items]);

  const getCriticalStockItems = useCallback(() => {
    return items.filter(item => item.quantity <= 5);
  }, [items]);

  const addMovement = useCallback((movement: Omit<StockMovement, 'id'>) => {
    const newMovement: StockMovement = {
      ...movement,
      id: Date.now().toString(),
    };

    setMovements(prev => [newMovement, ...prev]);

    // Mettre à jour la quantité de l'article
    setItems(prev =>
      prev.map(item => {
        if (item.id === movement.productId) {
          const newQuantity = movement.type === 'in'
            ? item.quantity + movement.quantity
            : Math.max(0, item.quantity - movement.quantity);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  }, []);

  const updateItemQuantity = useCallback((itemId: string, quantity: number) => {
    setItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity: Math.max(0, quantity) } : item
      )
    );
  }, []);

  const getItemById = useCallback((id: string) => {
    return items.find(item => item.id === id);
  }, [items]);

  const getMovementsByProduct = useCallback((productId: string) => {
    return movements.filter(m => m.productId === productId);
  }, [movements]);

  return (
    <InventoryContext.Provider
      value={{
        items,
        movements,
        getLowStockItems,
        getCriticalStockItems,
        addMovement,
        updateItemQuantity,
        getItemById,
        getMovementsByProduct,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within InventoryProvider');
  }
  return context;
};
