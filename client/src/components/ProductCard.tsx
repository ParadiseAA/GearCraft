import { Link } from "react-router-dom";
import {
  TiHeartFullOutline,
  TiHeartOutline,
  TiShoppingCart,
  TiStarFullOutline,
  TiStarHalfOutline,
  TiStarOutline,
  TiThLargeOutline,
} from "react-icons/ti";
import { getProductId, getProductStock, useShopStore } from "../store/shopStore";
import type { Product } from "../types/product";

function RatingRow({ rating, reviews }: { rating: number; reviews: number }) {
  const safeRating = Math.min(Math.max(rating, 0), 5);
  const fullStars = Math.floor(safeRating);
  const hasHalfStar = safeRating % 1 !== 0;
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

export default function ProductCard({ product }: { product: Product }) {
  const imageSrc = product.image || product.images[0];
  const title = product.name || product.title;
  const productId = getProductId(product);
  const productUrl = `/products/${productId}`;
  const addToCart = useShopStore((state) => state.addToCart);
  const toggleFavorite = useShopStore((state) => state.toggleFavorite);
  const isFavorite = useShopStore((state) => state.isFavorite(productId));
  const quantityInCart = useShopStore(
    (state) =>
      state.cart.find((item) => getProductId(item.product) === productId)
        ?.quantity ?? 0,
  );
  const stock = getProductStock(product);
  const isAvailable = stock > 0;
  const isMaxInCart = quantityInCart >= stock;

  return (
    <article className="group overflow-hidden rounded-2xl border border-[#eadfd3] bg-white shadow-[0_10px_28px_rgba(0,0,0,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#f2c39c] hover:shadow-[0_16px_36px_rgba(0,0,0,0.1)]">
      <div className="relative">
        <Link to={productUrl} className="block">
          <div className="flex h-[260px] items-center justify-center bg-[#faf8f4] p-5">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={title}
                className={`h-full w-full object-contain transition duration-300 group-hover:scale-[1.03] ${
                  isAvailable ? "" : "opacity-45 grayscale"
                }`}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-xl bg-white">
                <TiThLargeOutline className="text-[72px] text-[#cdbca9]" />
              </div>
            )}
          </div>
        </Link>

        {!isAvailable && (
          <span className="absolute left-3 top-3 rounded-full bg-[#fff4eb] px-3 py-1 text-xs font-semibold text-[#a64e0d] shadow-[0_8px_22px_rgba(0,0,0,0.08)]">
            Немає в наявності
          </span>
        )}

        <button
          type="button"
          onClick={() => toggleFavorite(product)}
          className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#eadfd3] bg-white/95 text-[#ff7a1a] shadow-[0_8px_22px_rgba(0,0,0,0.1)] transition hover:bg-[#fff4eb]"
          aria-label={isFavorite ? "Прибрати з обраного" : "Додати в обране"}
        >
          {isFavorite ? (
            <TiHeartFullOutline className="text-[24px]" />
          ) : (
            <TiHeartOutline className="text-[24px]" />
          )}
        </button>
      </div>

      <div className="p-5">
        <Link to={productUrl} className="block">
          <p className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-[#d86b12]">
            {product.category}
          </p>
          <h3 className="mt-2 text-xl font-semibold leading-6 text-[#171612] transition group-hover:text-[#d86b12]">
            {title}
          </h3>
        </Link>

        <p className="mt-3 text-lg font-semibold tracking-[-0.01em] text-[#171612]">
          ₴{product.price.toLocaleString("uk-UA")}
        </p>
        <div className="mt-3">
          <RatingRow rating={product.rating} reviews={product.reviewsCount} />
        </div>
        <button
          type="button"
          onClick={() => addToCart(product)}
          disabled={!isAvailable || isMaxInCart}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff7a1a] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-[#cdbca9] disabled:hover:brightness-100"
        >
          <TiShoppingCart className="text-xl" />
          {!isAvailable
            ? "Немає в наявності"
            : quantityInCart > 0
              ? `У кошику: ${quantityInCart}`
              : "Додати в кошик"}
        </button>
      </div>
    </article>
  );
}
