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

// Дозволені значення доставки, оплати та статусів зберігаються в Set для швидкої перевірки.
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
  // Номер замовлення містить дату та випадкові цифри, наприклад GC-20260608-1234.
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

// Нормалізує український номер телефону до формату +380...
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
  // Дані замовлення приходять із checkout-форми, тому спочатку дістаємо і перевіряємо всі поля.
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
    return { error: "Ім'я покупця обов'язкове і має містити до 160 символів" };
  }

  if (!normalizedPhone || phone.length > 40) {
    return { error: "Введіть коректний номер телефону покупця" };
  }

  if (email && (email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return { error: "Email покупця некоректний" };
  }

  if (!deliveryMethods.has(deliveryMethod)) {
    return { error: "Спосіб доставки некоректний" };
  }

  if (city.length < 2 || city.length > 120) {
    return { error: "Місто доставки обов'язкове і має містити до 120 символів" };
  }

  if (address.length < 3 || address.length > 240) {
    return {
      error: "Адреса доставки обов'язкова і має містити до 240 символів",
    };
  }

  if (!paymentMethods.has(payment)) {
    return { error: "Спосіб оплати некоректний" };
  }

  if (comment.length > 1000) {
    return { error: "Коментар має містити до 1000 символів" };
  }

  // Із checkout потрібні тільки productId і quantity.
  // Назву, фото, ціну та підсумкові суми сервер бере з бази, щоб клієнт не міг підмінити ціну.
  const itemQuantities = new Map<string, number>();

  for (const item of items) {
    const source = item as Record<string, unknown>;
    const productId = String(source.productId ?? "").trim();
    const quantity = Number(source.quantity);

    if (!productId || !Number.isInteger(quantity) || quantity < 1) {
      return { error: "Товари в замовленні некоректні" };
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
    return { error: "Товари в замовленні некоректні" };
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
  // Після перевірки даних створюємо замовлення і прив'язуємо його до користувача, якщо він авторизований.
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
  // Для адмін-панелі замовлення повертаються сторінками.
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 15);
  const result = await findOrdersPage(page, limit);

  res.json(result);
};

export const getMyOrders = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  // Користувач бачить тільки власні замовлення.
  if (!req.user?.id) {
    return res.status(401).json({ message: "Потрібна авторизація" });
  }

  const user = await findUserById(req.user.id);

  if (!user) {
    return res.status(404).json({ message: "Користувача не знайдено" });
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
  // Адміністратор може змінити статус тільки на один із дозволених.
  const status = String(req.body.status ?? "") as OrderStatus;

  if (!orderStatuses.has(status)) {
    return res.status(400).json({ message: "Статус замовлення некоректний" });
  }

  const order = await updateOrderStatusRecord(String(req.params.id), status);

  if (!order) {
    return res.status(404).json({ message: "Замовлення не знайдено" });
  }

  res.json(order);
};

export const deleteOrder = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  // Видалення замовлення використовується в адмін-панелі.
  const order = await deleteOrderRecord(String(req.params.id));

  if (!order) {
    return res.status(404).json({ message: "Замовлення не знайдено" });
  }

  res.json({ message: "Замовлення видалено", order });
};
