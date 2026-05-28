import { Request, Response } from "express";
import {
  createOrderRecord,
  DeliveryMethod,
  deleteOrderRecord,
  findOrdersByUser,
  findOrdersPage,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  updateOrderStatusRecord,
} from "../models/Order";
import { AuthenticatedRequest } from "../middleware/auth";
import { findUserById } from "../models/User";

const deliveryMethods = new Set<DeliveryMethod>([
  "pickup",
  "nova-poshta",
  "courier",
]);
const paymentMethods = new Set<PaymentMethod>(["cash", "card"]);
const orderStatuses = new Set<OrderStatus>([
  "new",
  "awaiting_payment",
  "paid",
  "processing",
  "confirmed",
  "preparing_shipment",
  "shipped",
  "pickup_point",
  "delivered",
  "completed",
  "cancelled",
  "return_requested",
  "returned",
]);

const createOrderNumber = () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.floor(1000 + Math.random() * 9000);

  return `GC-${datePart}-${randomPart}`;
};

const ukrainianMobileCodes = new Set([
  "39",
  "50",
  "63",
  "66",
  "67",
  "68",
  "73",
  "91",
  "92",
  "93",
  "94",
  "95",
  "96",
  "97",
  "98",
  "99",
]);

const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  const localDigits =
    digits.length === 12 && digits.startsWith("380")
      ? digits.slice(2)
      : digits.length === 10 && digits.startsWith("0")
        ? digits
        : "";

  if (!localDigits) return null;

  const operatorCode = localDigits.slice(1, 3);

  if (!ukrainianMobileCodes.has(operatorCode)) return null;

  return `+38${localDigits}`;
};

const normalizeOrderInput = (body: Record<string, unknown>) => {
  const customer = (body.customer ?? {}) as Record<string, unknown>;
  const delivery = (body.delivery ?? {}) as Record<string, unknown>;
  const name = String(customer.name ?? "").trim();
  const phone = String(customer.phone ?? "").trim();
  const email = String(customer.email ?? "").trim();
  const deliveryMethod = String(delivery.method ?? "") as DeliveryMethod;
  const city = String(delivery.city ?? "").trim();
  const address = String(delivery.address ?? "").trim();
  const payment = String(body.payment ?? "") as PaymentMethod;
  const comment = String(body.comment ?? "").trim();
  const items = Array.isArray(body.items) ? body.items : [];
  const normalizedPhone = normalizePhone(phone);

  if (name.length < 2 || name.length > 160) {
    return { error: "Customer name is required and must be up to 160 characters" };
  }

  if (!normalizedPhone || phone.length > 40) {
    return { error: "A valid customer phone is required" };
  }

  if (email && (email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return { error: "Customer email is invalid" };
  }

  if (!deliveryMethods.has(deliveryMethod)) {
    return { error: "Delivery method is invalid" };
  }

  if (city.length < 2 || city.length > 120) {
    return { error: "Delivery city is required and must be up to 120 characters" };
  }

  if (address.length < 3 || address.length > 240) {
    return {
      error: "Delivery address is required and must be up to 240 characters",
    };
  }

  if (!paymentMethods.has(payment)) {
    return { error: "Payment method is invalid" };
  }

  if (comment.length > 1000) {
    return { error: "Comment must be up to 1000 characters" };
  }

  const itemQuantities = new Map<string, number>();

  for (const item of items) {
    const source = item as Record<string, unknown>;
    const productId = String(source.productId ?? "").trim();
    const quantity = Number(source.quantity);

    if (!productId || !Number.isInteger(quantity) || quantity < 1) {
      return { error: "Order items are invalid" };
    }

    itemQuantities.set(productId, (itemQuantities.get(productId) ?? 0) + quantity);
  }

  const normalizedItems: OrderItem[] = Array.from(itemQuantities).map(
    ([productId, quantity]) => ({
      productId,
      title: "",
      image: "",
      quantity,
      price: 0,
      total: 0,
    }),
  );

  if (normalizedItems.length === 0) {
    return { error: "Order items are invalid" };
  }

  return {
    data: {
      customer: { name, phone: normalizedPhone, email },
      delivery: {
        method: deliveryMethod,
        city,
        address,
        price: deliveryMethod === "courier" ? 150 : 0,
      },
      payment,
      comment,
      items: normalizedItems,
    },
  };
};

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  const normalized = normalizeOrderInput(req.body);

  if ("error" in normalized) {
    return res.status(400).json({ message: normalized.error });
  }

  try {
    const order = await createOrderRecord({
      userId: req.user?.id,
      orderNumber: createOrderNumber(),
      ...normalized.data,
    });

    return res.status(201).json(order);
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Не вдалося оформити замовлення",
    });
  }
};

export const getAdminOrders = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 15);
  const result = await findOrdersPage(page, limit);

  res.json(result);
};

export const getMyOrders = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const user = await findUserById(req.user.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const orders = await findOrdersByUser({
    userId: user.id,
    email: user.email,
  });

  res.json({ orders });
};

export const updateOrderStatus = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const status = String(req.body.status ?? "") as OrderStatus;

  if (!orderStatuses.has(status)) {
    return res.status(400).json({ message: "Order status is invalid" });
  }

  const order = await updateOrderStatusRecord(String(req.params.id), status);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  res.json(order);
};

export const deleteOrder = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const order = await deleteOrderRecord(String(req.params.id));

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  res.json({ message: "Order deleted", order });
};
