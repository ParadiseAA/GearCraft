import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  TiArrowLeft,
  TiHeartOutline,
  TiHeartFullOutline,
  TiShoppingCart,
  TiStarFullOutline,
  TiStarHalfOutline,
  TiStarOutline,
  TiThLargeOutline,
} from "react-icons/ti";
import SiteHeader from "../components/SiteHeader";
import api from "../services/api";
import { getProductId, getProductStock, useShopStore } from "../store/shopStore";
import type { Product } from "../types/product";

function uniqueImages(product: Product) {
  return Array.from(
    new Set(
      [product.image, ...(product.images ?? [])].filter(
        (image): image is string => Boolean(image),
      ),
    ),
  );
}

function RatingRow({ rating, reviews }: { rating: number; reviews: number }) {
  const safeRating = Math.min(Math.max(rating, 0), 5);
  const fullStars = Math.floor(safeRating);
  const hasHalfStar = safeRating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-2 text-[#9f8f80]">
      <div className="flex items-center gap-0.5 text-[20px] text-[#ff9a4d]">
        {Array.from({ length: fullStars }).map((_, index) => (
          <TiStarFullOutline key={`full-${index}`} />
        ))}
        {hasHalfStar && <TiStarHalfOutline key="half" />}
        {Array.from({ length: emptyStars }).map((_, index) => (
          <TiStarOutline key={`empty-${index}`} />
        ))}
      </div>
      <span className="text-sm">({reviews})</span>
    </div>
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const addToCart = useShopStore((state) => state.addToCart);
  const toggleFavorite = useShopStore((state) => state.toggleFavorite);

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) {
        setError("Товар не знайдено.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data } = await api.get<Product>(`/products/${id}`);
        const images = uniqueImages(data);

        setProduct(data);
        setSelectedImage(images[0] ?? "");
      } catch {
        setProduct(null);
        setError("Не вдалося завантажити товар.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadProduct();
  }, [id]);

  const images = useMemo(() => {
    if (!product) return [];
    return uniqueImages(product);
  }, [product]);

  const title = product?.name || product?.title || "";
  const productId = product ? getProductId(product) : "";
  const stock = product ? getProductStock(product) : 0;
  const isInStock = stock > 0;
  const isFavorite = useShopStore((state) =>
    productId ? state.isFavorite(productId) : false,
  );

  return (
    <div className="min-h-screen bg-white text-[#171612]">
      <SiteHeader />

      <main className="mx-auto max-w-[1320px] px-4 py-6 lg:px-6 lg:py-8">
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#ff7a1a] transition hover:underline"
        >
          <TiArrowLeft className="text-lg" />
          Назад до каталогу
        </Link>

        {isLoading ? (
          <div className="mt-8 rounded-2xl border border-[#eadfd3] bg-white p-10 text-center text-sm text-[#6d5c4f] shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
            Завантажуємо товар...
          </div>
        ) : error || !product ? (
          <div className="mt-8 rounded-2xl border border-[#f0c7ad] bg-[#fff4eb] p-10 text-center shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
            <p className="text-base font-semibold text-[#a64e0d]">
              {error ?? "Товар не знайдено."}
            </p>
            <Link
              to="/catalog"
              className="mt-4 inline-flex rounded-xl bg-[#ff7a1a] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <section className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,560px)_1fr]">
            <div className="min-w-0">
              <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-[#eadfd3] bg-[#fffaf5] p-5">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={title}
                    className="max-h-[520px] w-full object-contain"
                  />
                ) : (
                  <div className="flex h-[420px] w-full items-center justify-center rounded-xl bg-white">
                    <TiThLargeOutline className="text-[88px] text-[#cdbca9]" />
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
                  {images.map((image) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setSelectedImage(image)}
                      className={`flex aspect-square items-center justify-center rounded-xl border bg-white p-2 transition ${
                        selectedImage === image
                          ? "border-[#ff7a1a]"
                          : "border-[#eadfd3] hover:border-[#f2c39c]"
                      }`}
                    >
                      <img
                        src={image}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="min-w-0 lg:pt-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ff7a1a]">
                {product.category}
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#171612] sm:text-4xl">
                {title}
              </h1>

              <div className="mt-4">
                <RatingRow
                  rating={product.rating}
                  reviews={product.reviewsCount}
                />
              </div>

              <p className="mt-5 text-3xl font-black text-[#171612]">
                ₴{product.price.toLocaleString("uk-UA")}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    isInStock
                      ? "bg-[#f4fbf6] text-[#24743a]"
                      : "bg-[#fff4eb] text-[#a64e0d]"
                  }`}
                >
                  {isInStock ? `В наявності: ${stock}` : "Немає в наявності"}
                </span>
                <span className="rounded-full bg-[#fffaf5] px-3 py-1 text-sm font-semibold text-[#6d5c4f]">
                  Категорія: {product.category}
                </span>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto]">
                <button
                  type="button"
                  onClick={() => addToCart(product)}
                  disabled={!isInStock}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff7a1a] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <TiShoppingCart className="text-xl" />
                  Додати в кошик
                </button>
                <button
                  type="button"
                  onClick={() => toggleFavorite(product)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#eadfd3] bg-[#fffaf5] px-5 py-3 text-sm font-semibold text-[#171612] transition hover:bg-[#ff7a1a]/10"
                >
                  {isFavorite ? (
                    <TiHeartFullOutline className="text-xl text-[#ff7a1a]" />
                  ) : (
                    <TiHeartOutline className="text-xl text-[#ff7a1a]" />
                  )}
                  {isFavorite ? "В обраному" : "Обране"}
                </button>
              </div>

              <div className="mt-8 border-t border-[#eadfd3] pt-6">
                <h2 className="text-xl font-black text-[#171612]">Опис</h2>
                <p className="mt-3 whitespace-pre-line leading-7 text-[#6d5c4f]">
                  {product.description}
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
