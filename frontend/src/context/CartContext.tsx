import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import * as cartService from '../services/cart';
import * as ordersService from '../services/orders';
import { toast } from 'sonner';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  description: string;
  serverId?: string;
}

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  date: Date;
  status: OrderStatus;
  customerInfo?: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
}

interface CartContextType {
  items: CartItem[];
  orders: Order[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  checkout: (customerInfo: Order["customerInfo"]) => Promise<string | null>;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem('userToken');
    if (!token) return;

    (async () => {
      try {
        const res = await cartService.getCart();
        if (!mounted) return;
        const apiItems = (res?.data || []).map((ci: any) => ({
          id: String(ci.product?.id ?? ci.id),
          serverId: String(ci.id),
          name: ci.product?.name ?? '',
          price: ci.product?.price ?? 0,
          quantity: ci.quantity ?? 1,
          image: ci.product?.image_url || '',
          description: ci.product?.description || '',
        }));
        setItems(apiItems);
      } catch (e) {
        console.warn('Failed to load cart from API', e);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const addToCart = (item: Omit<CartItem, "quantity">) => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      setItems((prev) => {
        const existing = prev.find((i) => i.id === item.id);
        if (existing) return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
        return [...prev, { ...item, quantity: 1 }];
      });
      return;
    }

    (async () => {
      try {
        const res = await cartService.addCartItem(item.id, 1);
        const ci = res?.data;
        if (!ci) return;
        setItems((prev) => {
          const exists = prev.find((p) => p.id === String(ci.product?.id ?? item.id));
          if (exists) {
            return prev.map((p) =>
              p.id === String(ci.product?.id ?? item.id)
                ? { ...p, quantity: ci.quantity ?? (p.quantity + 1), serverId: String(ci.id) }
                : p
            );
          }
          return [...prev, {
            id: String(ci.product?.id ?? item.id),
            serverId: String(ci.id),
            name: ci.product?.name ?? item.name,
            price: ci.product?.price ?? item.price,
            quantity: ci.quantity ?? 1,
            image: ci.product?.image_url ?? item.image,
            description: ci.product?.description ?? item.description,
          }];
        });
      } catch {
        setItems((prev) => {
          const existing = prev.find((i) => i.id === item.id);
          if (existing) return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
          return [...prev, { ...item, quantity: 1 }];
        });
      }
    })();
  };

  const removeFromCart = (id: string) => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      return;
    }

    const item = items.find(i => i.id === id);
    if (!item?.serverId) {
      setItems((prev) => prev.filter(p => p.id !== id));
      return;
    }

    (async () => {
      try {
        await cartService.deleteCartItem(String(item.serverId));
        setItems((prev) => prev.filter(p => p.id !== id));
      } catch {
        console.warn('Failed to remove cart item on server');
      }
    })();
  };

  const updateQuantity = (id: string, quantity: number) => {
    const token = localStorage.getItem('userToken');
    const item = items.find(i => i.id === id);
    if (!token || !item?.serverId) {
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, quantity } : i));
      return;
    }

    (async () => {
      try {
        const res = await cartService.updateCartItem(String(item.serverId), quantity);
        const ci = res?.data;
        if (!ci) return;
        setItems((prev) => prev.map(p =>
          p.id === String(ci.product?.id ?? id) ? { ...p, quantity: ci.quantity ?? quantity } : p
        ));
      } catch {
        console.warn('Failed to update cart item on server');
      }
    })();
  };

  const clearCart = () => setItems([]);

  const checkout = async (customerInfo?: Order["customerInfo"]): Promise<string | null> => {
    if (items.length === 0) return null;

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    try {
      // Always use the API — the public POST /api/orders endpoint handles both
      // authenticated users and guests (requires name + phone for guests).
      const payload: Record<string, any> = {
        address: customerInfo?.address ?? '',
        items: items.map(i => ({ product_id: parseInt(i.id, 10), quantity: i.quantity })),
      };
      if (customerInfo?.name)  payload.name  = customerInfo.name;
      if (customerInfo?.phone) payload.phone = customerInfo.phone;

      const res = await ordersService.createOrder(payload);
      const orderData = res?.data;
      if (!orderData) throw new Error('Réponse commande invalide');

      const createdOrder: Order = {
        id: String(orderData.id),
        items: [...items],
        total: orderData.total ?? total,
        date: new Date(),
        status: (orderData.status as OrderStatus) ?? 'pending',
        customerInfo,
      };

      setOrders((prev) => [...prev, createdOrder]);
      clearCart();
      return createdOrder.id;
    } catch (e: any) {
      toast(`Erreur commande : ${e?.message || 'inconnu'}`, { icon: '⚠️' });
      return null;
    }
  };

  const cartTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, orders, addToCart, removeFromCart, updateQuantity, clearCart, checkout, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
