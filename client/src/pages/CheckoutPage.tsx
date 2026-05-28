import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import axiosInstance from "../services/api";
import { useAuthStore } from "../store/authStore";
import { getProductId, useShopStore } from "../store/shopStore";

type DeliveryMethod = "pickup" | "nova-poshta" | "courier";
type PaymentMethod = "cash" | "card";

interface CheckoutForm {
  name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  delivery: DeliveryMethod;
  payment: PaymentMethod;
  comment: string;
}

interface CheckoutErrors {
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  address?: string;
}

const initialForm: CheckoutForm = {
  name: "",
  phone: "",
  email: "",
  city: "",
  address: "",
  delivery: "nova-poshta",
  payment: "cash",
  comment: "",
};

function formatPrice(value: number) {
  return `₴${value.toLocaleString("uk-UA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

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

function normalizePhone(value: string) {
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
}

function formatPhoneInput(value: string) {
  const normalized = normalizePhone(value);

  if (!normalized) return value;

  return normalized.replace(
    /^\+380(\d{2})(\d{3})(\d{2})(\d{2})$/,
    "+380 $1 $2 $3 $4",
  );
}

function validateCheckout(form: CheckoutForm) {
  const errors: CheckoutErrors = {};
  const email = form.email.trim();

  if (form.name.trim().length < 2) {
    errors.name = "Вкажіть ім'я та прізвище.";
  }

  if (!normalizePhone(form.phone)) {
    errors.phone =
      "Вкажіть український мобільний номер у форматі +380 XX XXX XX XX або 0XX XXX XX XX.";
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Вкажіть коректний email або залиште поле порожнім.";
  }

  if (form.city.trim().length < 2) {
    errors.city = "Вкажіть населений пункт.";
  }

  if (form.delivery !== "pickup" && form.address.trim().length < 3) {
    errors.address = "Вкажіть відділення або адресу доставки.";
  }

  return errors;
}

export default function CheckoutPage() {
  const user = useAuthStore((state) => state.user);
  const cart = useShopStore((state) => state.cart);
  const clearCart = useShopStore((state) => state.clearCart);
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [orderNumber, setOrderNumber] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const itemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const deliveryPrice = form.delivery === "courier" ? 150 : 0;
  const grandTotal = total + deliveryPrice;
  const userFullName = [user?.name, user?.surname].filter(Boolean).join(" ");

  useEffect(() => {
    if (!user) return;

    setForm((current) => ({
      ...current,
      name: current.name || userFullName,
      email: current.email || user.email,
    }));
  }, [user, userFullName]);

  const orderItems = useMemo(
    () =>
      cart.map((item) => {
        const productId = getProductId(item.product);
        const title = item.product.name || item.product.title;

        return {
          productId,
          title,
          image: item.product.image || item.product.images[0] || "",
          quantity: item.quantity,
          price: item.product.price,
          total: item.product.price * item.quantity,
        };
      }),
    [cart],
  );

  function updateForm<K extends keyof CheckoutForm>(
    field: K,
    value: CheckoutForm[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateCheckout(form);
    setErrors(nextErrors);
    setSubmitError("");

    if (Object.keys(nextErrors).length > 0 || cart.length === 0) {
      return;
    }

    const normalizedPhone = normalizePhone(form.phone);

    if (!normalizedPhone) {
      setErrors((current) => ({
        ...current,
        phone:
          "Вкажіть український мобільний номер у форматі +380 XX XXX XX XX або 0XX XXX XX XX.",
      }));
      return;
    }

    const orderPayload = {
      customer: {
        name: form.name.trim() || userFullName,
        phone: normalizedPhone,
        email: user?.email || form.email.trim(),
      },
      delivery: {
        method: form.delivery,
        city: form.city.trim(),
        address:
          form.delivery === "pickup"
            ? "Самовивіз із магазину"
            : form.address.trim(),
        price: deliveryPrice,
      },
      payment: form.payment,
      comment: form.comment.trim(),
      items: orderItems,
      subtotal: total,
      total: grandTotal,
    };

    try {
      setIsSubmitting(true);
      const { data } = await axiosInstance.post<{ orderNumber: string }>(
        "/orders",
        orderPayload,
      );

      setOrderNumber(data.orderNumber);
      setForm(initialForm);
      clearCart();
    } catch {
      setSubmitError(
        "Не вдалося зберегти замовлення в базі даних. Перевірте сервер і спробуйте ще раз.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (orderNumber) {
    return (
      <div className="min-h-screen bg-white text-[#171612]">
        <SiteHeader searchPlaceholder="Пошук товарів..." />

        <main className="mx-auto max-w-[920px] px-4 py-10 lg:px-6">
          <section className="rounded-2xl border border-[#cce2c6] bg-[#f7fff5] p-8 text-center shadow-[0_12px_32px_rgba(23,22,18,0.06)]">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#4b8b3b]">
              Замовлення оформлено
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.03em]">
              Дякуємо за покупку!
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-[#6d5c4f]">
              Номер вашого замовлення:{" "}
              <span className="font-black text-[#171612]">{orderNumber}</span>.
              Ми зв'яжемося з вами для підтвердження деталей.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/catalog"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-[#ff7a1a] px-5 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Продовжити покупки
              </Link>
              <Link
                to="/account/orders"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-[#eadfd3] bg-white px-5 text-sm font-semibold text-[#171612] transition hover:bg-[#ff7a1a]/10"
              >
                Мої замовлення
              </Link>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#171612]">
      <SiteHeader searchPlaceholder="Пошук товарів..." />

      <main className="mx-auto max-w-[1320px] px-4 py-8 lg:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#a64e0d]">
              Оформлення
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.03em]">
              Оформлення замовлення
            </h1>
          </div>
          <Link
            to="/cart"
            className="inline-flex self-start rounded-xl border border-[#eadfd3] bg-[#fffaf5] px-4 py-3 text-sm font-semibold text-[#171612] transition hover:bg-[#ff7a1a]/10"
          >
            Повернутися до кошика
          </Link>
        </div>

        {cart.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-[#eadfd3] bg-white p-10 text-center text-[#6d5c4f] shadow-[0_12px_32px_rgba(23,22,18,0.06)]">
            Кошик порожній. Додайте товари перед оформленням замовлення.
            <div className="mt-5">
              <Link
                to="/catalog"
                className="inline-flex rounded-xl bg-[#FF7a1a] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Перейти в каталог
              </Link>
            </div>
          </section>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]"
          >
            <section className="rounded-2xl border border-[#eadfd3] bg-white p-5 shadow-[0_8px_24px_rgba(23,22,18,0.06)]">
              <h2 className="text-[22px] font-black">Дані для оформлення</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-[#6d5c4f]">
                  Ім'я та прізвище
                  <input
                    value={form.name}
                    onChange={(event) => updateForm("name", event.target.value)}
                    className="h-12 rounded-xl border border-[#eadfd3] bg-white px-4 text-sm text-[#171612] outline-none transition focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
                    placeholder="Іван Петренко"
                  />
                  {errors.name && (
                    <span className="text-xs text-[#e25666]">
                      {errors.name}
                    </span>
                  )}
                </label>

                <label className="grid gap-2 text-sm font-semibold text-[#6d5c4f]">
                  Телефон
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(event) =>
                      updateForm("phone", event.target.value)
                    }
                    onBlur={() =>
                      updateForm("phone", formatPhoneInput(form.phone))
                    }
                    className="h-12 rounded-xl border border-[#eadfd3] bg-white px-4 text-sm text-[#171612] outline-none transition focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
                    placeholder="+380 67 123 45 67"
                  />
                  {errors.phone && (
                    <span className="text-xs text-[#e25666]">
                      {errors.phone}
                    </span>
                  )}
                </label>

                <label className="grid gap-2 text-sm font-semibold text-[#6d5c4f]">
                  Email
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateForm("email", event.target.value)
                    }
                    className="h-12 rounded-xl border border-[#eadfd3] bg-white px-4 text-sm text-[#171612] outline-none transition focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
                    placeholder="name@email.com"
                  />
                  {errors.email && (
                    <span className="text-xs text-[#e25666]">
                      {errors.email}
                    </span>
                  )}
                </label>

                <label className="grid gap-2 text-sm font-semibold text-[#6d5c4f]">
                  Населений пункт
                  <input
                    value={form.city}
                    onChange={(event) => updateForm("city", event.target.value)}
                    className="h-12 rounded-xl border border-[#eadfd3] bg-white px-4 text-sm text-[#171612] outline-none transition focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
                    placeholder="Ваше місто або населений пункт"
                  />
                  {errors.city && (
                    <span className="text-xs text-[#e25666]">
                      {errors.city}
                    </span>
                  )}
                </label>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <fieldset>
                  <legend className="text-sm font-semibold text-[#6d5c4f]">
                    Доставка
                  </legend>
                  <div className="mt-3 grid gap-3">
                    {[
                      ["nova-poshta", "Нова пошта", "За тарифом перевізника"],
                      ["courier", "Кур'єр", "+150 грн"],
                      ["pickup", "Самовивіз", "Безкоштовно"],
                    ].map(([value, label, hint]) => (
                      <label
                        key={value}
                        className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4 transition ${
                          form.delivery === value
                            ? "border-[#ff7a1a] bg-[#fff4eb]"
                            : "border-[#eadfd3] bg-white hover:bg-[#ff7a1a]/10"
                        }`}
                      >
                        <span>
                          <span className="block text-sm font-black text-[#171612]">
                            {label}
                          </span>
                          <span className="text-xs font-semibold text-[#8b7b6d]">
                            {hint}
                          </span>
                        </span>
                        <input
                          type="radio"
                          name="delivery"
                          value={value}
                          checked={form.delivery === value}
                          onChange={() =>
                            updateForm("delivery", value as DeliveryMethod)
                          }
                          className="h-4 w-4 accent-[#ff7a1a]"
                        />
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="text-sm font-semibold text-[#6d5c4f]">
                    Оплата
                  </legend>
                  <div className="mt-3 grid gap-3">
                    {[
                      ["cash", "Післяплата", "Оплата при отриманні"],
                      ["card", "Карткою", "Менеджер надішле реквізити"],
                    ].map(([value, label, hint]) => (
                      <label
                        key={value}
                        className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4 transition ${
                          form.payment === value
                            ? "border-[#ff7a1a] bg-[#fff4eb]"
                            : "border-[#eadfd3] bg-white hover:bg-[#ff7a1a]/10"
                        }`}
                      >
                        <span>
                          <span className="block text-sm font-black text-[#171612]">
                            {label}
                          </span>
                          <span className="text-xs font-semibold text-[#8b7b6d]">
                            {hint}
                          </span>
                        </span>
                        <input
                          type="radio"
                          name="payment"
                          value={value}
                          checked={form.payment === value}
                          onChange={() =>
                            updateForm("payment", value as PaymentMethod)
                          }
                          className="h-4 w-4 accent-[#ff7a1a]"
                        />
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              <div className="mt-5 grid gap-4">
                {form.delivery !== "pickup" && (
                  <label className="grid gap-2 text-sm font-semibold text-[#6d5c4f]">
                    Відділення або адреса
                    <input
                      value={form.address}
                      onChange={(event) =>
                        updateForm("address", event.target.value)
                      }
                      className="h-12 rounded-xl border border-[#eadfd3] bg-white px-4 text-sm text-[#171612] outline-none transition focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
                      placeholder={
                        form.delivery === "courier"
                          ? "Вулиця, будинок, квартира"
                          : "Відділення або поштомат"
                      }
                    />
                    {errors.address && (
                      <span className="text-xs text-[#e25666]">
                        {errors.address}
                      </span>
                    )}
                  </label>
                )}

                <label className="grid gap-2 text-sm font-semibold text-[#6d5c4f]">
                  Коментар до замовлення
                  <textarea
                    value={form.comment}
                    onChange={(event) =>
                      updateForm("comment", event.target.value)
                    }
                    className="min-h-24 resize-y rounded-xl border border-[#eadfd3] bg-white px-4 py-3 text-sm text-[#171612] outline-none transition focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
                    placeholder="Зручний час для дзвінка або додаткові побажання"
                  />
                </label>
              </div>
            </section>

            <aside className="self-start rounded-2xl border border-[#eadfd3] bg-[#fffaf5] p-6 shadow-[0_8px_24px_rgba(23,22,18,0.06)] xl:sticky xl:top-6">
              <h2 className="text-[22px] font-black">Ваше замовлення</h2>

              <div className="mt-5 grid gap-3">
                {cart.map((item) => {
                  const productId = getProductId(item.product);
                  const title = item.product.name || item.product.title;

                  return (
                    <div
                      key={productId}
                      className="flex justify-between gap-4 text-sm text-[#6d5c4f]"
                    >
                      <span>
                        {title} x {item.quantity}
                      </span>
                      <span className="font-semibold text-[#171612]">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 grid gap-4 border-t border-[#eadfd3] pt-5 text-[16px] text-[#6d5c4f]">
                <div className="flex justify-between gap-4">
                  <span>Проміжна сума ({itemsCount} тов.)</span>
                  <span className="text-[#171612]">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Доставка:</span>
                  <span className="text-right text-[#171612]">
                    {deliveryPrice > 0
                      ? formatPrice(deliveryPrice)
                      : "Безкоштовно / за тарифом"}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex justify-between gap-4 border-t border-[#eadfd3] pt-5 text-[18px] font-black">
                <span>Разом</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-7 inline-flex h-[54px] w-full items-center justify-center rounded-xl bg-[#ff7a1a] px-5 text-[16px] font-semibold text-white transition hover:brightness-110"
              >
                {isSubmitting ? "Зберігаємо..." : "Підтвердити замовлення"}
              </button>

              {submitError && (
                <p className="mt-4 rounded-xl border border-[#f0c7ad] bg-[#fff4eb] px-4 py-3 text-sm font-semibold text-[#a64e0d]">
                  {submitError}
                </p>
              )}

              <p className="mt-4 text-center text-xs font-semibold leading-5 text-[#8b7b6d]">
                Після підтвердження замовлення збережеться в базі даних, а кошик
                очиститься.
              </p>
            </aside>
          </form>
        )}
      </main>
    </div>
  );
}
