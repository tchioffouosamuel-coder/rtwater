import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface CartItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount?: number; // En pourcentage
  category?: string;
}

export interface PaymentMethod {
  type: 'cash' | 'card' | 'check' | 'transfer' | 'orange_money' | 'mtn_money' | 'moov_money' | 'wave';
  amount: number;
}

export interface POSTransaction {
  id: string;
  timestamp: Date;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  payments: PaymentMethod[];
  change: number;
  notes?: string;
  receiptId?: string;
}

interface POSContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCart: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  calculateSubtotal: () => number;
  calculateTax: (subtotal: number, rate?: number) => number;
  calculateTotal: () => number;
  completeTransaction: (payments: PaymentMethod[], notes?: string) => POSTransaction;
  transactions: POSTransaction[];
  getTodayTransactions: () => POSTransaction[];
  getDayTotal: () => number;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export const POSProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<POSTransaction[]>([]);

  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => {
      const existingItem = prev.find(i => i.id === item.id);
      if (existingItem) {
        return prev.map(i =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const updateCart = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCart(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        )
      );
    }
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const calculateSubtotal = useCallback(() => {
    return cart.reduce((total, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      const discount = item.discount ? itemTotal * (item.discount / 100) : 0;
      return total + (itemTotal - discount);
    }, 0);
  }, [cart]);

  const calculateTax = useCallback((subtotal: number, rate: number = 0.2) => {
    return subtotal * rate;
  }, []);

  const calculateTotal = useCallback(() => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    return subtotal + tax;
  }, [calculateSubtotal, calculateTax]);

  const completeTransaction = useCallback(
    (payments: PaymentMethod[], notes?: string): POSTransaction => {
      const subtotal = calculateSubtotal();
      const tax = calculateTax(subtotal);
      const total = subtotal + tax;

      const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
      const change = totalPayments - total;

      const transaction: POSTransaction = {
        id: `TXN-${Date.now()}`,
        timestamp: new Date(),
        items: [...cart],
        subtotal,
        tax,
        total,
        payments,
        change: Math.max(0, change),
        notes,
      };

      setTransactions(prev => [transaction, ...prev]);
      clearCart();

      return transaction;
    },
    [cart, calculateSubtotal, calculateTax, clearCart]
  );

  const getTodayTransactions = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return transactions.filter(t => {
      const tDate = new Date(t.timestamp);
      tDate.setHours(0, 0, 0, 0);
      return tDate.getTime() === today.getTime();
    });
  }, [transactions]);

  const getDayTotal = useCallback(() => {
    return getTodayTransactions().reduce((total, t) => total + t.total, 0);
  }, [getTodayTransactions]);

  return (
    <POSContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateCart,
        clearCart,
        calculateSubtotal,
        calculateTax,
        calculateTotal,
        completeTransaction,
        transactions,
        getTodayTransactions,
        getDayTotal,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (context === undefined) {
    throw new Error('usePOS must be used within POSProvider');
  }
  return context;
};
