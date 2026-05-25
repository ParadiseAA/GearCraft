import { Link } from "react-router-dom";
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
            <p className="mt-2 text-sm text-[#6d5c4f]">
              Збережені товари: {favorites.length}
            </p>
          </div>
          <Link
            to="/catalog"
            className="inline-flex self-start rounded-xl border border-[#eadfd3] bg-[#fffaf5] px-4 py-3 text-sm font-semibold text-[#171612] transition hover:bg-[#ff7a1a]/10 sm:self-auto"
          >
            До каталогу
          </Link>
        </div>

        {favorites.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-[#eadfd3] bg-white p-10 text-center text-[#6d5c4f] shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
            У вас поки немає обраних товарів.
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
