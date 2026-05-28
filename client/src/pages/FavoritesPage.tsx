import { Link } from "react-router-dom";
import { TiHeartOutline } from "react-icons/ti";
import ProductCard from "../components/ProductCard";
import SiteHeader from "../components/SiteHeader";
import { useShopStore } from "../store/shopStore";

export default function FavoritesPage() {
  const favorites = useShopStore((state) => state.favorites);

  return (
    <div className="min-h-screen bg-white text-[#171612]">
      <SiteHeader searchPlaceholder="Пошук товарів..." />

      <main className="mx-auto max-w-[1320px] px-4 py-8 lg:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-[-0.03em]">Обране</h1>
          </div>
          {favorites.length > 0 && (
            <Link
              to="/catalog"
              className="inline-flex self-start rounded-xl border border-[#eadfd3] bg-[#fffaf5] px-4 py-3 text-sm font-semibold text-[#171612] transition hover:bg-[#ff7a1a]/10 sm:self-auto"
            >
              До каталогу
            </Link>
          )}
        </div>

        {favorites.length === 0 ? (
          <div className="mt-8 flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#eadfd3] bg-white px-5 py-10 text-center">
            <TiHeartOutline className="text-[46px] text-[#cdbca9]" />
            <p className="mt-4 text-sm font-medium text-[#6d5c4f]">
              Поки немає обраних товарів.
            </p>
            <Link
              to="/catalog"
              className="mt-5 inline-flex rounded-xl bg-[#ff7a1a] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Переглянути товари
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.map((product) => (
              <ProductCard key={product._id || product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
