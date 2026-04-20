import { useEffect, useMemo, useState } from "react";
import { TiRefreshOutline, TiZoomOutline } from "react-icons/ti";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import SiteHeader from "../components/SiteHeader";
import type { Product } from "../types/product";

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
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

  const filteredProducts = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return products;
    }

    return products.filter((product) =>
      `${product.title} ${product.description} ${product.category}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [products, search]);

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#171612]">
      <SiteHeader searchPlaceholder="Пошук по каталогу..." />

      <main className="mx-auto max-w-[1320px] px-4 py-6 lg:px-6 lg:py-8">
        <section className="mt-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.03em] text-[#171612]">
                Усі товари
              </h2>
              <p className="mt-1 text-sm text-[#6d5c4f]">
                Знайдено: {filteredProducts.length}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-[24px] border border-[#eadfd3] bg-white p-10 text-center text-[#6d5c4f] shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
              Завантажуємо каталог...
            </div>
          ) : error ? (
            <div className="rounded-[24px] border border-[#f0c7ad] bg-[#fff4eb] p-10 text-center shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
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
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-[24px] border border-[#eadfd3] bg-white p-10 text-center text-[#6d5c4f] shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
              За вашим запитом поки нічого не знайдено.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
