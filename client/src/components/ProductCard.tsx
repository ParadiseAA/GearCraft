import {
  TiAdjustBrightness,
  TiCogOutline,
  TiFlashOutline,
  TiShoppingCart,
  TiSpannerOutline,
  TiStarFullOutline,
  TiStarHalfOutline,
  TiStarOutline,
  TiThLargeOutline,
} from "react-icons/ti";
import type { Product } from "../types/product";

function RatingRow({ rating, reviews }: { rating: number; reviews: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-2 text-[#9f8f80]">
      <div className="flex items-center gap-0.5 text-[16px] text-[#ff9a4d]">
        {Array.from({ length: fullStars }).map((_, index) => (
          <TiStarFullOutline key={`full-${index}`} />
        ))}
        {hasHalfStar && <TiStarHalfOutline key="half" />}
        {Array.from({ length: emptyStars }).map((_, index) => (
          <TiStarOutline key={`empty-${index}`} />
        ))}
      </div>
      <span className="text-xs">({reviews})</span>
    </div>
  );
}

function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    phones: "Телефони",
    laptops: "Ноутбуки",
    tablets: "Планшети",
    accessories: "Аксесуари",
    audio: "Аудіо",
    cameras: "Камери",
    other: "Інше",
  };

  return labels[category] ?? category;
}

function getCategoryIcon(category: string) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    phones: TiFlashOutline,
    laptops: TiCogOutline,
    tablets: TiThLargeOutline,
    accessories: TiSpannerOutline,
    audio: TiAdjustBrightness,
    cameras: TiAdjustBrightness,
    other: TiThLargeOutline,
  };

  return icons[category] ?? TiThLargeOutline;
}

export default function ProductCard({ product }: { product: Product }) {
  const CategoryIcon = getCategoryIcon(product.category);

  return (
    <article className="group overflow-hidden rounded-[22px] border border-[#eadfd3] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
      <div className="relative flex h-[250px] items-center justify-center overflow-hidden bg-gradient-to-br from-[#f8f5ef] via-white to-[#ece6dc]">
        <div className="absolute inset-4 rounded-[26px] border border-[#ff7a1a]/10" />
        <div className="absolute -right-8 top-6 h-24 w-24 rounded-full border border-[#ff7a1a]/10" />
        <div className="absolute bottom-4 left-4 rounded-full border border-[#ff7a1a]/12 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d86b12]">
          {getCategoryLabel(product.category)}
        </div>

        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="relative h-[190px] w-[190px] object-contain"
          />
        ) : (
          <div className="relative flex h-32 w-32 items-center justify-center rounded-[32px] bg-[linear-gradient(145deg,rgba(255,122,26,0.14),rgba(255,255,255,0.92))] shadow-[0_18px_35px_rgba(0,0,0,0.12)]">
            <CategoryIcon className="text-[68px] text-[#1b1a16]" />
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-lg font-semibold text-[#171612]">{product.title}</h3>
        <p className="mt-2 line-clamp-2 min-h-[40px] text-sm leading-5 text-[#6d5c4f]">
          {product.description}
        </p>
        <p className="mt-3 text-lg font-semibold tracking-[-0.01em] text-[#171612]">
          ₴{product.price.toLocaleString("uk-UA")}
        </p>
        <div className="mt-3">
          <RatingRow rating={product.rating} reviews={product.reviewsCount} />
        </div>

        <button
          type="button"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff7a1a] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110"
        >
          <TiShoppingCart className="text-xl" />
          Додати в кошик
        </button>
      </div>
    </article>
  );
}
