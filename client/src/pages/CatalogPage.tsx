import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { TiRefreshOutline, TiTrash } from "react-icons/ti";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import SiteHeader from "../components/SiteHeader";
import type { Product } from "../types/product";

type SortOption =
  | "newest"
  | "price-asc"
  | "price-desc"
  | "rating-desc"
  | "name-asc";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Новинки" },
  { value: "price-asc", label: "Ціна: від низької до високої" },
  { value: "price-desc", label: "Ціна: від високої до низької" },
  { value: "rating-desc", label: "Найкращі за рейтингом" },
  { value: "name-asc", label: "Назва: від А до Я" },
];

const getProductDate = (product: Product) => {
  const timestamp = new Date(product.createdAt).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const getProductTitle = (product: Product) =>
  product.name || product.title || "";

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") ?? "";
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data } = await api.get<Product[]>("/products");
        setProducts(data);
      } catch {
        setError("Не вдалося завантажити каталог. Спробуйте ще раз.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadProducts();
  }, []);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((product) => product.category.trim())
            .filter((category) => category.length > 0),
        ),
      ).sort((first, second) => first.localeCompare(second, "uk")),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const min = minPrice === "" ? null : Number(minPrice);
    const max = maxPrice === "" ? null : Number(maxPrice);

    return products.filter((product) => {
      const matchesSearch =
        !normalized ||
        `${product.title} ${product.name ?? ""} ${product.description} ${product.category}`
          .toLowerCase()
          .includes(normalized);
      const matchesCategory =
        !selectedCategory || product.category === selectedCategory;
      const matchesMin = min === null || product.price >= min;
      const matchesMax = max === null || product.price <= max;

      return matchesSearch && matchesCategory && matchesMin && matchesMax;
    });
  }, [maxPrice, minPrice, products, search, selectedCategory]);

  const visibleProducts = useMemo(() => {
    return [...filteredProducts].sort((first, second) => {
      switch (sortBy) {
        case "price-asc":
          return first.price - second.price;
        case "price-desc":
          return second.price - first.price;
        case "rating-desc":
          return (
            second.rating - first.rating ||
            second.reviewsCount - first.reviewsCount
          );
        case "name-asc":
          return getProductTitle(first).localeCompare(
            getProductTitle(second),
            "uk",
          );
        case "newest":
        default:
          return getProductDate(second) - getProductDate(first);
      }
    });
  }, [filteredProducts, sortBy]);

  const hasActiveFilters = Boolean(
    search || selectedCategory || minPrice || maxPrice,
  );

  const clearFilters = () => {
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-white text-[#171612]">
      <SiteHeader searchPlaceholder="Пошук по каталогу..." />

      <main className="mx-auto max-w-[1320px] px-4 py-6 lg:px-6 lg:pt-0 lg:pb-12">
        <section className="mt-8">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.03em] text-[#171612]">
                Усі товари
              </h2>
              <p className="mt-1 text-sm text-[#6d5c4f]">
                Знайдено: {visibleProducts.length}
              </p>
              {search && (
                <p className="mt-1 text-sm text-[#6d5c4f]">
                  Пошук: <span className="font-semibold">{search}</span>
                </p>
              )}
            </div>

            <label className="w-full text-sm font-semibold text-[#6d5c4f] sm:w-[290px]">
              Сортування
              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as SortOption)
                }
                className="mt-2 h-11 w-full rounded-xl border border-[#eadfd3] bg-[#fffaf5] px-3 text-sm font-semibold text-[#171612] outline-none transition hover:border-[#ff7a1a] focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-[#eadfd3] bg-white p-10 text-center text-[#6d5c4f] shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
              Завантажуємо каталог...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-[#f0c7ad] bg-[#fff4eb] p-10 text-center shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
              <p className="text-base font-semibold text-[#a64e0d]">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#ff7a1a] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                <TiRefreshOutline className="text-xl" />
                Спробувати ще раз
              </button>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
              <aside className="self-start rounded-2xl border border-[#eadfd3] bg-[#fffaf5] p-4 lg:sticky lg:top-6">
                <h3 className="text-lg font-black">Фільтри</h3>

                {search && (
                  <div className="mt-4 rounded-xl border border-[#eadfd3] bg-white px-3 py-2 text-sm text-[#6d5c4f]">
                    Пошук:{" "}
                    <span className="font-semibold text-[#171612]">
                      {search}
                    </span>
                  </div>
                )}

                <div className="mt-5">
                  <p className="text-sm font-semibold text-[#6d5c4f]">
                    Категорія
                  </p>
                  <div className="mt-3 grid gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("")}
                      className={`rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                        selectedCategory === ""
                          ? "bg-[#ff7a1a] text-white"
                          : "border border-[#eadfd3] bg-white text-[#171612] hover:bg-[#ff7a1a]/10"
                      }`}
                    >
                      Усі категорії
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setSelectedCategory(category)}
                        className={`rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                          selectedCategory === category
                            ? "bg-[#ff7a1a] text-white"
                            : "border border-[#eadfd3] bg-white text-[#171612] hover:bg-[#ff7a1a]/10"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm font-semibold text-[#6d5c4f]">
                    Ціна, грн
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <label className="text-xs font-semibold text-[#7f6e5f]">
                      Від
                      <input
                        value={minPrice}
                        onChange={(event) => setMinPrice(event.target.value)}
                        type="number"
                        min={0}
                        placeholder="0"
                        className="mt-2 w-full rounded-xl border border-[#eadfd3] bg-white px-3 py-2 text-sm text-[#171612] outline-none focus:border-[#ff7a1a]"
                      />
                    </label>
                    <label className="text-xs font-semibold text-[#7f6e5f]">
                      До
                      <input
                        value={maxPrice}
                        onChange={(event) => setMaxPrice(event.target.value)}
                        type="number"
                        min={0}
                        placeholder="9999"
                        className="mt-2 w-full rounded-xl border border-[#eadfd3] bg-white px-3 py-2 text-sm text-[#171612] outline-none focus:border-[#ff7a1a]"
                      />
                    </label>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#eadfd3] bg-white px-4 text-sm font-semibold text-[#171612] transition hover:border-[#ff7a1a] hover:bg-[#fff4eb] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[#eadfd3] disabled:hover:bg-white"
                >
                  <TiTrash className="text-lg text-[#ff7a1a]" />
                  Очистити фільтри
                </button>
              </aside>

              {visibleProducts.length === 0 ? (
                <div className="rounded-2xl border border-[#eadfd3] bg-white p-10 text-center text-[#6d5c4f] shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
                  За вашим запитом поки нічого не знайдено.
                </div>
              ) : (
                <div className="grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleProducts.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
