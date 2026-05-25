import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
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
        params: { page: nextPage, limit: 15, noCache: true },
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
  }, [activeTab, loadProducts]);

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
    </div>
  );
}
