import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TiArrowRight, TiRefreshOutline, TiSpannerOutline } from "react-icons/ti";
import ProductCard from "../components/ProductCard";
import SiteHeader from "../components/SiteHeader";
import api from "../services/api";
import type { Product } from "../types/product";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
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
        setError("Не вдалося завантажити товари.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadProducts();
  }, []);

  const visibleProducts = products.slice(0, 8);

  return (
    <div className="min-h-screen bg-white text-[#171612]">
      <SiteHeader searchPlaceholder="Пошук товарів..." />

      <main className="mx-auto max-w-[1320px] px-4 py-6 lg:px-6 lg:py-8">
        <section className="relative overflow-hidden rounded-[28px] border border-[#2f241b] bg-[#232222] px-7 py-10 text-white sm:px-10 sm:py-14 lg:px-14 lg:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,26,0.28),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,122,26,0.16),transparent_22%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.02),transparent_36%,rgba(255,122,26,0.06)_100%)]" />
          <div className="absolute inset-y-0 right-0 hidden w-[44%] lg:block">
            <div className="absolute right-8 top-8 h-44 w-44 rounded-full border border-[#ff7a1a]/15" />
            <div className="absolute right-24 top-24 h-56 w-56 rounded-full border border-[#ff7a1a]/10" />
            <div className="absolute bottom-10 right-10 h-52 w-52 rounded-[34px] border border-[#ff7a1a]/15 bg-[linear-gradient(145deg,rgba(255,122,26,0.12),rgba(255,255,255,0.01))] shadow-[0_30px_70px_rgba(0,0,0,0.45)]" />
            <div className="absolute bottom-20 right-28 flex h-36 w-36 items-center justify-center rounded-[28px] border border-[#3a2a1d] bg-[#232222]">
              <TiSpannerOutline className="text-[74px] text-[#ffb067]" />
            </div>
          </div>

          <div className="relative max-w-[560px]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#ff9a4d]">
              GearreCraft handmade metal art
            </p>
            <h1 className="mt-5 text-4xl font-black leading-[0.95] sm:text-5xl lg:text-6xl">
              Авторські вироби
              <span className="mt-2 block text-[#ff7a1a]">
                з автодеталей і металу
              </span>
            </h1>
            <p className="mt-5 max-w-[470px] text-sm leading-6 text-[#c8bfb3] sm:text-base">
              Ручна робота, де металеві деталі перетворюються на декор,
              світильники та функціональні речі для дому.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 rounded-xl bg-[#ff7a1a] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Переглянути каталог
                <TiArrowRight className="text-xl" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.03em] text-[#171612]">
                Товари
              </h2>
              <p className="mt-2 text-sm text-[#6d5c4f]">
                Актуальні товари з каталогу.
              </p>
            </div>

            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 self-start rounded-xl border border-[#eadfd3] bg-[#fffaf5] px-4 py-3 text-sm font-semibold text-[#171612] transition hover:bg-[#ff7a1a]/10 md:self-auto"
            >
              Усі товари
              <TiArrowRight className="text-xl text-[#ff7a1a]" />
            </Link>
          </div>

          {isLoading ? (
            <div className="mt-6 rounded-2xl border border-[#eadfd3] bg-white p-10 text-center text-[#6d5c4f] shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
              Завантажуємо товари...
            </div>
          ) : error ? (
            <div className="mt-6 rounded-2xl border border-[#f0c7ad] bg-[#fff4eb] p-10 text-center shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
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
          ) : visibleProducts.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-[#eadfd3] bg-white p-10 text-center text-[#6d5c4f] shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
              У каталозі поки немає товарів.
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {visibleProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
