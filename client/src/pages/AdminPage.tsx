import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, ClipboardEvent, DragEvent, FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  TiEdit,
  TiEyeOutline,
  TiPlus,
  TiRefreshOutline,
  TiTimes,
  TiTrash,
} from "react-icons/ti";
import SiteHeader from "../components/SiteHeader";
import api from "../services/api";
import { uploadProductImage } from "../lib/api";
import type { OrderStatus } from "../lib/orderStatus";
import type { Product } from "../types/product";

type AdminTab = "products" | "orders" | "payments" | "promos";

interface ProductForm {
  name: string;
  category: string;
  price: string;
  countInStock: string;
  description: string;
  images: string[];
  imageUrl: string;
}

type DeliveryMethod = "pickup" | "nova-poshta" | "courier";
type PaymentMethod = "cash" | "card";
interface AdminOrderItem {
  productId: string;
  title: string;
  image?: string;
  quantity: number;
  price: number;
  total: number;
}

interface AdminOrder {
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
  items: AdminOrderItem[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

const tabs: { id: AdminTab; label: string }[] = [
  { id: "products", label: "Товари" },
  { id: "orders", label: "Замовлення" },
  { id: "payments", label: "Оплати" },
  { id: "promos", label: "Промокоди" },
];

const emptyForm: ProductForm = {
  name: "",
  category: "",
  price: "",
  countInStock: "",
  description: "",
  images: [],
  imageUrl: "",
};

function getProductId(product: Product) {
  return product._id || product.id || "";
}

function uniqueUrls(urls: string[]) {
  return Array.from(new Set(urls.map((url) => url.trim()).filter(Boolean)));
}

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

const deliveryLabels: Record<DeliveryMethod, string> = {
  pickup: "Самовивіз",
  "nova-poshta": "Нова пошта",
  courier: "Кур'єр",
};

const paymentLabels: Record<PaymentMethod, string> = {
  cash: "Післяплата",
  card: "Карткою",
};

const statusLabels: Record<OrderStatus, string> = {
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

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: "delivered", label: "Доставлено" },
  { value: "new", label: "Нове замовлення" },
  { value: "awaiting_payment", label: "Очікує оплати" },
  { value: "paid", label: "Оплачено" },
  { value: "processing", label: "В обробці" },
  { value: "confirmed", label: "Підтверджено" },
  { value: "preparing_shipment", label: "Готується до відправки" },
  { value: "shipped", label: "Відправлено" },
  { value: "pickup_point", label: "У пункті видачі" },
  { value: "completed", label: "Завершено" },
  { value: "cancelled", label: "Скасовано" },
  { value: "return_requested", label: "Запит на повернення" },
  { value: "returned", label: "Повернено" },
];

const paidStatuses = new Set<OrderStatus>([
  "paid",
  "confirmed",
  "preparing_shipment",
  "shipped",
  "pickup_point",
  "delivered",
  "completed",
]);

const deliveredStatuses = new Set<OrderStatus>(["delivered", "completed"]);

function getStatusBadgeClass(status: OrderStatus) {
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

function ConfirmModal({
  title,
  message,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
        <h2 className="text-xl font-black text-[#171612]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#6d5c4f]">{message}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[#eadfd3] px-4 py-2 text-sm font-semibold text-[#171612] transition hover:bg-[#ff7a1a]/10"
          >
            Скасувати
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-[#a64e0d] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Видалити
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<AdminTab>("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPages, setOrdersPages] = useState(1);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [statusSavingId, setStatusSavingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [orderDeleteTarget, setOrderDeleteTarget] = useState<AdminOrder | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);
  const [lastUploadedUrls, setLastUploadedUrls] = useState<string[]>([]);

  const firstImage = form.images[0] ?? "";

  const loadProducts = useCallback(async (nextPage: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await api.get<{
        products: Product[];
        page: number;
        pages: number;
        total: number;
      }>("/products/admin/all", {
        params: { page: nextPage, limit: 8, noCache: true },
      });

      setProducts(data.products);
      setPage(data.page);
      setPages(data.pages);
      setTotal(data.total);
    } catch {
      setError("Не вдалося завантажити товари.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadOrders = useCallback(async (nextPage: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await api.get<{
        orders: AdminOrder[];
        page: number;
        pages: number;
        total: number;
      }>("/orders/admin/all", {
        params: { page: nextPage, limit: 10, noCache: true },
      });

      setOrders(data.orders);
      setOrdersPage(data.page);
      setOrdersPages(data.pages);
      setExpandedOrderId(null);
    } catch {
      setError("Не вдалося завантажити замовлення.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get("tab") as AdminTab | null;
    const savedTab = localStorage.getItem("adminTab") as AdminTab | null;
    const nextTab: AdminTab = tabs.some((tab) => tab.id === tabParam)
      ? (tabParam as AdminTab)
      : tabs.some((tab) => tab.id === savedTab)
        ? (savedTab as AdminTab)
        : "products";

    setActiveTab(nextTab);
    localStorage.setItem("adminTab", nextTab);
    if (searchParams.get("tab") !== nextTab) {
      setSearchParams({ tab: nextTab }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (activeTab === "products") {
      void loadProducts(1);
    }
    if (activeTab === "orders") {
      void loadOrders(1);
    }
  }, [activeTab, loadOrders, loadProducts]);

  const changeTab = (tab: AdminTab) => {
    setActiveTab(tab);
    localStorage.setItem("adminTab", tab);
    setSearchParams({ tab });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setSelectedFileNames([]);
    setLastUploadedUrls([]);
  };

  const editProduct = (product: Product) => {
    setEditingId(getProductId(product));
    setForm({
      name: product.name || product.title,
      category: product.category,
      price: String(product.price),
      countInStock: String(product.countInStock ?? product.stock),
      description: product.description,
      images: uniqueUrls(product.images || []),
      imageUrl: "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addImageUrl = () => {
    setForm((current) => ({
      ...current,
      images: uniqueUrls([...current.images, current.imageUrl]),
      imageUrl: "",
    }));
  };

  const removeImageUrl = (url: string) => {
    setForm((current) => ({
      ...current,
      images: current.images.filter((image) => image !== url),
    }));
  };

  const uploadFiles = async (files: File[]) => {
    const imageFiles = files.filter((file) =>
      ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
        file.type,
      ),
    );
    if (imageFiles.length === 0) {
      setError("Оберіть зображення у форматі jpg, jpeg, png або webp.");
      return;
    }

    setSelectedFileNames(imageFiles.map((file) => file.name));
    setIsUploading(true);
    setError(null);

    try {
      const uploadedUrls = await Promise.all(
        imageFiles.map((file) => uploadProductImage(file)),
      );

      setForm((current) => ({
        ...current,
        images: uniqueUrls([...current.images, ...uploadedUrls]),
      }));
      setLastUploadedUrls(uploadedUrls);
    } catch {
      setError("Не вдалося завантажити зображення.");
    } finally {
      setIsUploading(false);
    }
  };

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    await uploadFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const pasteImage = (event: ClipboardEvent<HTMLDivElement>) => {
    const files = Array.from(event.clipboardData.files);
    if (files.some((file) => file.type.startsWith("image/"))) {
      event.preventDefault();
      void uploadFiles(files);
    }
  };

  const dropImage = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    void uploadFiles(Array.from(event.dataTransfer.files));
  };

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      description: form.description.trim(),
      image: firstImage,
      images: uniqueUrls(form.images),
      category: form.category.trim(),
      countInStock: Number(form.countInStock),
    };

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
      } else {
        await api.post("/products", payload);
      }

      resetForm();
      await loadProducts(page);
    } catch {
      setError("Не вдалося зберегти товар. Перевірте всі поля.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await api.delete(`/products/${getProductId(deleteTarget)}`);
      setDeleteTarget(null);
      await loadProducts(page);
    } catch {
      setError("Не вдалося видалити товар.");
    }
  };

  const changeOrderStatus = async (orderId: string, status: OrderStatus) => {
    setStatusSavingId(orderId);
    setError(null);

    try {
      const { data } = await api.put<AdminOrder>(`/orders/${orderId}/status`, {
        status,
      });

      setOrders((current) =>
        current.map((order) => (order.id === orderId ? data : order)),
      );
    } catch {
      setError("Не вдалося оновити статус замовлення.");
    } finally {
      setStatusSavingId(null);
    }
  };

  const confirmOrderDelete = async () => {
    if (!orderDeleteTarget) return;

    try {
      await api.delete(`/orders/${orderDeleteTarget.id}`);
      setOrderDeleteTarget(null);
      setExpandedOrderId(null);
      await loadOrders(ordersPage);
    } catch {
      setError("Не вдалося видалити замовлення.");
    }
  };

  const summary = useMemo(
    () => [
      { label: "Товари", value: total },
      { label: "Сторінка", value: `${page}/${pages}` },
      { label: "Показано", value: products.length },
    ],
    [page, pages, products.length, total],
  );

  return (
    <div className="min-h-screen bg-white text-[#171612]">
      <SiteHeader searchPlaceholder="Пошук в адмін-панелі..." />

      <main className="mx-auto max-w-[1320px] px-4 py-6 lg:px-6 lg:py-8">
        <section className="border-b border-[#eadfd3] pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#ff7a1a]">
            GearCraft admin
          </p>
          <h1 className="mt-2 text-3xl font-black">Адмін-панель магазину</h1>
          <div className="mt-5 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => changeTab(tab.id)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-[#ff7a1a] text-white"
                    : "border border-[#eadfd3] bg-[#fffaf5] text-[#171612] hover:bg-[#ff7a1a]/10"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {error && (
          <div className="mt-5 rounded-xl border border-[#f0c7ad] bg-[#fff4eb] px-4 py-3 text-sm font-semibold text-[#a64e0d]">
            {error}
          </div>
        )}

        {activeTab === "products" ? (
          <section className="mt-6 grid gap-6 lg:grid-cols-[390px_1fr]">
            <form
              onSubmit={saveProduct}
              className="self-start rounded-xl border border-[#eadfd3] bg-[#fffaf5] p-5"
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-xl font-black">
                  {editingId ? "Редагувати товар" : "Створити товар"}
                </h2>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#ff7a1a]/10"
                    aria-label="Скасувати редагування"
                  >
                    <TiTimes className="text-xl" />
                  </button>
                )}
              </div>

              {[
                ["name", "Назва"],
                ["category", "Категорія"],
                ["price", "Ціна"],
                ["countInStock", "Залишок"],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="mt-4 block text-sm font-semibold text-[#6d5c4f]"
                >
                  {label}
                  <input
                    value={form[key as keyof ProductForm] as string}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                    type={
                      key === "price" || key === "countInStock"
                        ? "number"
                        : "text"
                    }
                    min={
                      key === "price" || key === "countInStock" ? 0 : undefined
                    }
                    step={
                      key === "price"
                        ? "0.01"
                        : key === "countInStock"
                          ? "1"
                          : undefined
                    }
                    className="mt-2 w-full rounded-xl border border-[#eadfd3] bg-white px-4 py-3 text-sm text-[#171612] outline-none focus:border-[#ff7a1a]"
                    required
                  />
                </label>
              ))}

              <label className="mt-4 block text-sm font-semibold text-[#6d5c4f]">
                Опис
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="mt-2 min-h-24 w-full resize-y rounded-xl border border-[#eadfd3] bg-white px-4 py-3 text-sm text-[#171612] outline-none focus:border-[#ff7a1a]"
                  required
                />
              </label>

              <div
                className="mt-4 rounded-xl border border-[#eadfd3] bg-white p-3"
                onPaste={pasteImage}
                onDrop={dropImage}
                onDragOver={(event) => event.preventDefault()}
                tabIndex={0}
              >
                <p className="text-sm font-semibold text-[#6d5c4f]">
                  Зображення
                </p>
                <p className="mt-1 text-xs text-[#8a796b]">
                  Оберіть файл, перетягніть фото сюди або вставте з буфера через
                  Ctrl+V.
                </p>
                <div className="mt-3 flex gap-2">
                  <input
                    value={form.imageUrl}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        imageUrl: event.target.value,
                      }))
                    }
                    placeholder="Вставте URL зображення"
                    className="min-w-0 flex-1 rounded-xl border border-[#eadfd3] px-3 py-2 text-sm outline-none focus:border-[#ff7a1a]"
                  />
                  <button
                    type="button"
                    onClick={addImageUrl}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff7a1a] text-white"
                    aria-label="Додати URL зображення"
                  >
                    <TiPlus className="text-xl" />
                  </button>
                </div>
                <input
                  onChange={(event) => void uploadImage(event)}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  multiple
                  disabled={isUploading}
                  className="mt-3 block w-full rounded-xl border border-dashed border-[#eadfd3] px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#ff7a1a] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white disabled:opacity-60"
                />
                {isUploading && (
                  <p className="mt-2 text-xs font-semibold text-[#a64e0d]">
                    Завантаження в Cloudinary...
                  </p>
                )}
                {selectedFileNames.length > 0 && (
                  <div className="mt-2 rounded-lg bg-[#fffaf5] px-3 py-2 text-xs text-[#6d5c4f]">
                    <span className="font-semibold text-[#171612]">
                      Вибрано:
                    </span>{" "}
                    {selectedFileNames.join(", ")}
                  </div>
                )}
                {lastUploadedUrls.length > 0 && (
                  <div className="mt-2 grid gap-1 rounded-lg bg-[#f4fbf6] px-3 py-2 text-xs text-[#24743a]">
                    <span className="font-semibold">Згенерований URL:</span>
                    {lastUploadedUrls.map((url) => (
                      <span key={url} className="truncate" title={url}>
                        {url}
                      </span>
                    ))}
                  </div>
                )}
                {firstImage && (
                  <p className="mt-2 truncate rounded-lg bg-[#f4fbf6] px-3 py-2 text-xs text-[#24743a]">
                    Головне зображення: {firstImage}
                  </p>
                )}
                <div className="mt-3 grid gap-2">
                  {form.images.map((url) => (
                    <div
                      key={url}
                      className="grid grid-cols-[48px_1fr_auto] items-center gap-2 rounded-lg border border-[#eadfd3] p-2"
                    >
                      <img
                        src={url}
                        alt=""
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                      <p className="truncate text-xs text-[#6d5c4f]">{url}</p>
                      <button
                        type="button"
                        onClick={() => removeImageUrl(url)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#a64e0d] hover:bg-[#fff4eb]"
                        aria-label="Видалити зображення"
                      >
                        <TiTrash className="text-lg" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff7a1a] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
              >
                {isSaving
                  ? "Збереження..."
                  : editingId
                    ? "Зберегти зміни"
                    : "Створити"}
              </button>
            </form>

            <div className="min-w-0">
              <div className="mb-4 grid gap-3 sm:grid-cols-3">
                {summary.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-[#eadfd3] bg-[#fffaf5] px-4 py-3"
                  >
                    <p className="text-xs uppercase tracking-[0.16em] text-[#7f6e5f]">
                      {item.label}
                    </p>
                    <p className="mt-1 text-xl font-black">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-xl border border-[#eadfd3] bg-white">
                <div className="flex items-center justify-between gap-3 border-b border-[#eadfd3] p-4">
                  <h2 className="text-lg font-black">Товари</h2>
                  <button
                    type="button"
                    onClick={() => void loadProducts(page)}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#eadfd3] bg-[#fffaf5] px-3 py-2 text-sm font-semibold hover:bg-[#ff7a1a]/10"
                  >
                    <TiRefreshOutline className="text-lg text-[#ff7a1a]" />
                    Оновити
                  </button>
                </div>

                {isLoading ? (
                  <div className="p-8 text-center text-sm text-[#6d5c4f]">
                    Завантажуємо товари...
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-[#fffaf5] text-xs uppercase tracking-[0.16em] text-[#7f6e5f]">
                        <tr>
                          <th className="px-4 py-3">Фото</th>
                          <th className="px-4 py-3">Назва</th>
                          <th className="px-4 py-3">Категорія</th>
                          <th className="px-4 py-3">Ціна</th>
                          <th className="px-4 py-3">Залишок</th>
                          <th className="px-4 py-3 text-right">Дії</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eadfd3]">
                        {products.map((product) => {
                          const id = getProductId(product);
                          const imageSrc = product.image || product.images[0];

                          return (
                            <tr key={id}>
                              <td className="px-4 py-3">
                                {imageSrc ? (
                                  <img
                                    src={imageSrc}
                                    alt={product.name || product.title}
                                    className="h-12 w-12 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="h-12 w-12 rounded-lg bg-[#f8f5ef]" />
                                )}
                              </td>
                              <td className="px-4 py-3 font-semibold">
                                {product.name || product.title}
                              </td>
                              <td className="px-4 py-3 text-[#6d5c4f]">
                                {product.category}
                              </td>
                              <td className="px-4 py-3 font-semibold">
                                ₴{product.price.toLocaleString("uk-UA")}
                              </td>
                              <td className="px-4 py-3">
                                {product.countInStock ?? product.stock}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-end gap-2">
                                  <Link
                                    to={`/products/${id}`}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#ff7a1a]/10"
                                    aria-label="Переглянути товар"
                                  >
                                    <TiEyeOutline className="text-xl" />
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => editProduct(product)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#ff7a1a]/10"
                                    aria-label="Редагувати товар"
                                  >
                                    <TiEdit className="text-xl" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteTarget(product)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#a64e0d] hover:bg-[#fff4eb]"
                                    aria-label="Видалити товар"
                                  >
                                    <TiTrash className="text-xl" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 border-t border-[#eadfd3] p-4">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => void loadProducts(page - 1)}
                    className="rounded-xl border border-[#eadfd3] px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  >
                    Назад
                  </button>
                  <span className="text-sm font-semibold text-[#6d5c4f]">
                    Сторінка {page} з {pages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= pages}
                    onClick={() => void loadProducts(page + 1)}
                    className="rounded-xl border border-[#eadfd3] px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  >
                    Далі
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : activeTab === "orders" ? (
          <section className="mt-6">
            <div className="overflow-hidden rounded-xl border border-[#eadfd3] bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-[#eadfd3] p-4">
                <h2 className="text-lg font-black">Оформлені замовлення</h2>
                <button
                  type="button"
                  onClick={() => void loadOrders(ordersPage)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#eadfd3] bg-[#fffaf5] px-3 py-2 text-sm font-semibold hover:bg-[#ff7a1a]/10"
                >
                  <TiRefreshOutline className="text-lg text-[#ff7a1a]" />
                  Оновити
                </button>
              </div>

              {isLoading ? (
                <div className="p-8 text-center text-sm text-[#6d5c4f]">
                  Завантажуємо замовлення...
                </div>
              ) : orders.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#6d5c4f]">
                  Оформлених замовлень поки немає.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1180px] text-left text-sm">
                    <thead className="bg-[#fffaf5] text-xs font-black uppercase tracking-[0.12em] text-[#7f6e5f]">
                      <tr>
                        <th className="px-4 py-4">Замовлення</th>
                        <th className="px-4 py-4">Клієнт</th>
                        <th className="px-4 py-4">Сума</th>
                        <th className="px-4 py-4">Оплачено</th>
                        <th className="px-4 py-4">Транзакція</th>
                        <th className="px-4 py-4">Доставлено</th>
                        <th className="px-4 py-4">Статус</th>
                        <th className="px-4 py-4 text-right">Дії</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eadfd3]">
                      {orders.map((order) => (
                        <Fragment key={order.id}>
                          <tr className="align-middle">
                            <td className="px-4 py-4">
                              <p className="font-black text-[#171612]">
                                {order.orderNumber}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-[#7f6e5f]">
                                {formatDate(order.createdAt)}
                              </p>
                            </td>
                            <td className="max-w-[300px] px-4 py-4">
                              <p className="font-semibold text-[#171612]">
                                {order.customer.name}
                              </p>
                              <p className="mt-1 break-words text-xs text-[#6d5c4f]">
                                {order.customer.email || order.customer.phone}
                              </p>
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 font-black text-[#171612]">
                              {formatPrice(order.total)}
                            </td>
                            <td className="px-4 py-4 font-semibold text-[#171612]">
                              {paidStatuses.has(order.status) ? "Так" : "Ні"}
                            </td>
                            <td className="px-4 py-4 text-[#6d5c4f]">-</td>
                            <td className="px-4 py-4 font-semibold text-[#171612]">
                              {deliveredStatuses.has(order.status) ? "Так" : "Ні"}
                            </td>
                            <td className="px-4 py-4">
                              <div className="grid w-fit min-w-[170px] gap-2">
                                <span
                                  className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ${getStatusBadgeClass(order.status)}`}
                                >
                                  {statusLabels[order.status]}
                                </span>
                                <select
                                  value={order.status}
                                  disabled={statusSavingId === order.id}
                                  onChange={(event) =>
                                    void changeOrderStatus(
                                      order.id,
                                      event.target.value as OrderStatus,
                                    )
                                  }
                                  className="h-10 w-fit max-w-[210px] rounded-lg border border-[#eadfd3] bg-white px-2 pr-9 text-sm text-[#171612] outline-none transition focus:border-[#ff7a1a] disabled:opacity-60"
                                >
                                  {statusOptions.map((status) => (
                                    <option
                                      key={status.value}
                                      value={status.value}
                                    >
                                      {status.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedOrderId((current) =>
                                      current === order.id ? null : order.id,
                                    )
                                  }
                                  className="rounded-lg border border-[#eadfd3] bg-white px-3 py-2 text-sm font-semibold text-[#171612] transition hover:bg-[#ff7a1a]/10"
                                >
                                  Деталі
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setOrderDeleteTarget(order)}
                                  className="rounded-lg border border-[#ffb3a6] bg-white px-3 py-2 text-sm font-semibold text-[#d22f2f] transition hover:bg-[#ffe8e8]"
                                >
                                  Видалити
                                </button>
                              </div>
                            </td>
                          </tr>

                          {expandedOrderId === order.id && (
                            <tr>
                              <td colSpan={8} className="bg-white px-4 py-5 lg:px-5">
                                <div>
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
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 border-t border-[#eadfd3] p-4">
                <button
                  type="button"
                  disabled={ordersPage <= 1}
                  onClick={() => void loadOrders(ordersPage - 1)}
                  className="rounded-xl border border-[#eadfd3] px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  Назад
                </button>
                <span className="text-sm font-semibold text-[#6d5c4f]">
                  Сторінка {ordersPage} з {ordersPages}
                </span>
                <button
                  type="button"
                  disabled={ordersPage >= ordersPages}
                  onClick={() => void loadOrders(ordersPage + 1)}
                  className="rounded-xl border border-[#eadfd3] px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  Далі
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="mt-6 rounded-xl border border-[#eadfd3] bg-[#fffaf5] p-8 text-center">
            <h2 className="text-2xl font-black">
              {tabs.find((tab) => tab.id === activeTab)?.label}
            </h2>
            <p className="mt-2 text-sm text-[#6d5c4f]">
              Цей розділ готовий до підключення даних магазину.
            </p>
          </section>
        )}
      </main>

      {deleteTarget && (
        <ConfirmModal
          title="Видалити товар"
          message={`Видалити "${deleteTarget.name || deleteTarget.title}"? Цю дію неможливо скасувати.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void confirmDelete()}
        />
      )}

      {orderDeleteTarget && (
        <ConfirmModal
          title="Видалити замовлення"
          message={`Видалити замовлення "${orderDeleteTarget.orderNumber}"? Цю дію неможливо скасувати.`}
          onCancel={() => setOrderDeleteTarget(null)}
          onConfirm={() => void confirmOrderDelete()}
        />
      )}
    </div>
  );
}
