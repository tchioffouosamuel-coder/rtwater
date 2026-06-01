// Hook personnalisé pour accéder aux commandes avec localStorage persistence
import { useCart } from "./CartContext";
import { useEffect } from "react";

export function useOrders() {
  const { orders } = useCart();

  // Persister les commandes dans localStorage
  useEffect(() => {
    if (orders.length > 0) {
      localStorage.setItem("rtwater_orders", JSON.stringify(orders));
    }
  }, [orders]);

  return {
    orders,
    getOrderById: (id: string) => orders.find((order) => order.id === id),
    getTotalOrderValue: () =>
      orders.reduce((total, order) => total + order.total, 0),
    getTotalOrders: () => orders.length,
  };
}
