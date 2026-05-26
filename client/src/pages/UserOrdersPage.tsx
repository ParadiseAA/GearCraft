import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import {
  getStatusBadgeClass,
  statusLabels,
  type OrderStatus,
} from "../lib/orderStatus";
import api from "../services/api";

type DeliveryMethod = "pickup" | "nova-poshta" | "courier";
type PaymentMethod = "cash" | "card";

interface UserOrder {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  delivery: {
    method: DeliveryMethod;
    city: string;
    address: string;
    price: number;
  };
  payment: PaymentMethod;
  comment: string;
  items: Array<{
    productId: string;
    title: string;
    quantity: number;
    price: number;
    total: number;
    image?: string;
  }>;
  subtotal: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

const deliveryLabels: Record<DeliveryMethod, string> = {
  pickup: "Самовивіз",
  "nova-poshta": "Нова пошта",
  courier: "Кур'єр",
};

const paymentLabels: Record<PaymentMethod, string> = {
  cash: "Післяплата",
  card: "Карткою",
};

function formatPrice(value: number) {
  return `₴${value.toLocaleString("uk-UA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function UserOrdersPage() {
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        setIsLoading(true);
        setError("");
        const { data } = await api.get<{ orders: UserOrder[] }>("/orders/my");
        setOrders(data.orders);
      } catch {
        setError("Не вдалося завантажити ваші замовлення.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadOrders();
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#171612]">
      <SiteHeader searchPlaceholder="Пошук товарів..." />

      <main className="mx-auto max-w-[980px] px-4 py-8 lg:px-6">
        <nav className="flex items-center gap-2 text-sm text-[#7f6e5f]">
          <Link to="/" className="transition hover:text-[#ff7a1a]">
            Головна
          </Link>
          <span className="text-[#d8cabc]">/</span>
          <Link to="/account" className="transition hover:text-[#ff7a1a]">
            Мій кабінет
          </Link>
          <span className="text-[#d8cabc]">/</span>
          <span className="font-semibold text-[#171612]">Мої замовлення</span>
        </nav>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-3xl font-black tracking-[-0.02em]">
            Мої замовлення
          </h1>
          <Link
            to="/account"
            className="inline-flex self-start rounded-xl border border-[#eadfd3] bg-[#fffaf5] px-4 py-3 text-sm font-semibold text-[#171612] transition hover:bg-[#ff7a1a]/10"
          >
            Назад в кабінет
          </Link>
        </div>

        {isLoading ? (
          <section className="mt-8 rounded-2xl border border-[#eadfd3] bg-white p-10 text-center text-[#6d5c4f] shadow-[0_12px_32px_rgba(23,22,18,0.06)]">
            Завантажуємо замовлення...
          </section>
        ) : error ? (
          <section className="mt-8 rounded-2xl border border-[#f0c7ad] bg-[#fff4eb] p-10 text-center font-semibold text-[#a64e0d] shadow-[0_12px_32px_rgba(23,22,18,0.06)]">
            {error}
          </section>
        ) : orders.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-[#eadfd3] bg-white p-10 text-center text-[#6d5c4f] shadow-[0_12px_32px_rgba(23,22,18,0.06)]">
            У вас поки немає замовлень.
            <div className="mt-5">
              <Link
                to="/catalog"
                className="inline-flex rounded-xl bg-[#ff7a1a] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Перейти в каталог
              </Link>
            </div>
          </section>
        ) : (
          <section className="mt-8 grid gap-4">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order.id;

              return (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-2xl border border-[#eadfd3] bg-white shadow-[0_8px_24px_rgba(23,22,18,0.06)]"
                >
                  <div className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <h2 className="text-lg font-black">
                        {order.orderNumber}
                      </h2>
                      <p className="mt-1 text-sm font-semibold text-[#7f6e5f]">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 md:justify-end">
                      <span
                        className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ${getStatusBadgeClass(order.status)}`}
                      >
                        {statusLabels[order.status]}
                      </span>
                      <span className="text-lg font-black">
                        {formatPrice(order.total)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedOrderId((current) =>
                            current === order.id ? null : order.id,
                          )
                        }
                        className="rounded-lg border border-[#eadfd3] bg-white px-3 py-2 text-sm font-semibold text-[#171612] transition hover:bg-[#ff7a1a]/10"
                      >
                        Детальніше
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-[#eadfd3] bg-white px-4 py-5 lg:px-5">
                      <div className="grid gap-4 lg:grid-cols-3">
                        <section className="rounded-xl border border-[#eadfd3] bg-[#fffaf5] p-4">
                          <h4 className="text-sm font-black">Клієнт</h4>
                          <p className="mt-2 font-semibold">
                            {order.customer.name}
                          </p>
                          <p className="mt-1 text-sm text-[#6d5c4f]">
                            {order.customer.phone}
                          </p>
                          {order.customer.email && (
                            <p className="mt-1 break-words text-sm text-[#6d5c4f]">
                              {order.customer.email}
                            </p>
                          )}
                        </section>

                        <section className="rounded-xl border border-[#eadfd3] bg-[#fffaf5] p-4">
                          <h4 className="text-sm font-black">Доставка</h4>
                          <p className="mt-2 font-semibold">
                            {deliveryLabels[order.delivery.method]}
                          </p>
                          <p className="mt-1 text-sm text-[#6d5c4f]">
                            {order.delivery.city}
                          </p>
                          <p className="mt-1 break-words text-sm text-[#6d5c4f]">
                            {order.delivery.address}
                          </p>
                        </section>

                        <section className="rounded-xl border border-[#eadfd3] bg-[#fffaf5] p-4">
                          <h4 className="text-sm font-black">Оплата</h4>
                          <p className="mt-2 font-semibold">
                            {paymentLabels[order.payment]}
                          </p>
                          <div className="mt-3 grid gap-1 text-sm text-[#6d5c4f]">
                            <div className="flex justify-between gap-3">
                              <span>Товари</span>
                              <span className="font-semibold text-[#171612]">
                                {formatPrice(order.subtotal)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span>Доставка</span>
                              <span className="font-semibold text-[#171612]">
                                {formatPrice(order.delivery.price)}
                              </span>
                            </div>
                          </div>
                        </section>
                      </div>

                      <div className="mt-5 overflow-x-auto rounded-xl border border-[#eadfd3]">
                        <table className="min-w-full text-left text-sm">
                          <thead className="bg-[#fffaf5] text-xs uppercase tracking-[0.16em] text-[#7f6e5f]">
                            <tr>
                              <th className="px-4 py-3">Товар</th>
                              <th className="px-4 py-3">К-сть</th>
                              <th className="px-4 py-3">Ціна</th>
                              <th className="px-4 py-3 text-right">Сума</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#eadfd3]">
                            {order.items.map((item) => (
                              <tr key={`${order.id}-${item.productId}`}>
                                <td className="px-4 py-3">
                                  <div className="grid grid-cols-[52px_1fr] items-center gap-3">
                                    <div className="flex h-[52px] w-[52px] items-center justify-center rounded-lg bg-[#faf8f4] p-2">
                                      {item.image ? (
                                        <img
                                          src={item.image}
                                          alt={item.title}
                                          className="h-full w-full object-contain"
                                        />
                                      ) : (
                                        <div className="h-full w-full rounded bg-white" />
                                      )}
                                    </div>
                                    <span className="font-semibold">
                                      {item.title}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-[#6d5c4f]">
                                  {item.quantity}
                                </td>
                                <td className="px-4 py-3 text-[#6d5c4f]">
                                  {formatPrice(item.price)}
                                </td>
                                <td className="px-4 py-3 text-right font-semibold">
                                  {formatPrice(item.total)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {order.comment && (
                        <div className="mt-4 rounded-xl border border-[#eadfd3] bg-white px-4 py-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-[#7f6e5f]">
                            Коментар
                          </p>
                          <p className="mt-1 text-sm text-[#6d5c4f]">
                            {order.comment}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
