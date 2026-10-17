/** Statuts de commande : libellés, couleurs et étapes du suivi, partagés par tout l'espace client. */

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";
type Lang = "fr" | "en";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "En attente de paiement",
  paid: "Payée, en préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const ORDER_STATUS_LABELS_EN: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  paid: "Paid, being prepared",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
  paid: "bg-brand-100 text-brand-800 dark:bg-brand-900/20 dark:text-brand-300",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
};

/** Étapes affichées dans la frise de suivi */
export const ORDER_STEPS: { key: Exclude<OrderStatus, "cancelled">; label: string; labelEn: string }[] = [
  { key: "pending", label: "Commande reçue", labelEn: "Order received" },
  { key: "paid", label: "Paiement confirmé", labelEn: "Payment confirmed" },
  { key: "shipped", label: "Expédiée", labelEn: "Shipped" },
  { key: "delivered", label: "Livrée", labelEn: "Delivered" },
];

export function orderStepIndex(status: string): number {
  return ORDER_STEPS.findIndex((s) => s.key === status);
}

export function statusLabel(status: string, lang: Lang = "fr"): string {
  const labels = lang === "en" ? ORDER_STATUS_LABELS_EN : ORDER_STATUS_LABELS;
  return labels[status as OrderStatus] ?? status;
}

export function statusColor(status: string): string {
  return ORDER_STATUS_COLORS[status as OrderStatus] ?? "bg-gray-100 text-gray-700";
}

/** Référence lisible ; repli si l'API ne la fournit pas encore. */
export function orderReference(order: { id: string | number; reference?: string }): string {
  return order.reference ?? `CMD-${String(order.id).padStart(6, "0")}`;
}

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  new: "Reçue",
  in_progress: "En cours d'étude",
  quoted: "Devis envoyé",
  converted: "Acceptée",
  rejected: "Clôturée",
};

const QUOTE_STATUS_LABELS_EN: Record<string, string> = {
  new: "Received",
  in_progress: "Under review",
  quoted: "Quote sent",
  converted: "Accepted",
  rejected: "Closed",
};

export function quoteStatusLabel(status: string, lang: Lang = "fr"): string {
  return (lang === "en" ? QUOTE_STATUS_LABELS_EN : QUOTE_STATUS_LABELS)[status] ?? status;
}
