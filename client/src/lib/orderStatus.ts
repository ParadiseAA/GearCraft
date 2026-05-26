export type OrderStatus =
  | "new"
  | "awaiting_payment"
  | "paid"
  | "processing"
  | "confirmed"
  | "preparing_shipment"
  | "shipped"
  | "pickup_point"
  | "delivered"
  | "completed"
  | "cancelled"
  | "return_requested"
  | "returned";

export const statusLabels: Record<OrderStatus, string> = {
  new: "Нове замовлення",
  awaiting_payment: "Очікує оплати",
  paid: "Оплачено",
  processing: "В обробці",
  confirmed: "Підтверджено",
  preparing_shipment: "Готується до відправки",
  shipped: "Відправлено",
  pickup_point: "У пункті видачі",
  delivered: "Доставлено",
  completed: "Завершено",
  cancelled: "Скасовано",
  return_requested: "Запит на повернення",
  returned: "Повернено",
};

export const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: "delivered", label: statusLabels.delivered },
  { value: "new", label: statusLabels.new },
  { value: "awaiting_payment", label: statusLabels.awaiting_payment },
  { value: "paid", label: statusLabels.paid },
  { value: "processing", label: statusLabels.processing },
  { value: "confirmed", label: statusLabels.confirmed },
  { value: "preparing_shipment", label: statusLabels.preparing_shipment },
  { value: "shipped", label: statusLabels.shipped },
  { value: "pickup_point", label: statusLabels.pickup_point },
  { value: "completed", label: statusLabels.completed },
  { value: "cancelled", label: statusLabels.cancelled },
  { value: "return_requested", label: statusLabels.return_requested },
  { value: "returned", label: statusLabels.returned },
];

export function getStatusBadgeClass(status: OrderStatus) {
  if (status === "cancelled" || status === "returned") {
    return "bg-[#ffe8e8] text-[#d22f2f]";
  }

  if (status === "delivered" || status === "completed") {
    return "bg-[#e7f8e8] text-[#24823a]";
  }

  if (status === "awaiting_payment" || status === "return_requested") {
    return "bg-[#fff4d8] text-[#a64e0d]";
  }

  return "bg-[#fff4eb] text-[#a64e0d]";
}
