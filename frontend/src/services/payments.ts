import api from "./api";

export const OPERATORS = [
  { id: "Orange Money", label: "Orange Money", color: "#FF6200", logo: "🟠" },
  { id: "MTN Money",    label: "MTN Money",    color: "#FFCC00", logo: "🟡" },
  { id: "Moov Money",  label: "Moov Money",   color: "#0066CC", logo: "🔵" },
  { id: "Wave Money",  label: "Wave Money",   color: "#1AC8ED", logo: "🌊" },
] as const;

export type OperatorId = typeof OPERATORS[number]["id"];

export async function initiatePayment(
  orderId: string | number,
  payload: { operator: OperatorId; phone: string }
) {
  return api.request(`/orders/${orderId}/pay`, { method: "POST", body: payload });
}

export default { initiatePayment, OPERATORS };
