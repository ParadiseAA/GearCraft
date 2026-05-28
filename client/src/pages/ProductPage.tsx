import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  TiArrowLeft,
  TiChevronLeft,
  TiChevronRight,
  TiHeartOutline,
  TiHeartFullOutline,
  TiShoppingCart,
  TiStarFullOutline,
  TiStarHalfOutline,
  TiStarOutline,
  TiThLargeOutline,
  TiTrash,
} from "react-icons/ti";
import SiteHeader from "../components/SiteHeader";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import {
  getProductId,
  getProductStock,
  useShopStore,
} from "../store/shopStore";
import type { Product, Review } from "../types/product";

interface ReviewResponse {
  review: Review;
  productRating: number;
  reviewsCount: number;
}

interface ReviewDeleteResponse {
  productRating: number;
  reviewsCount: number;
}

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

function Stars({
  rating,
  size = "text-[18px]",
}: {
  rating: number;
  size?: string;
}) {
  const safeRating = Math.min(Math.max(rating, 0), 5);

  return (
    <div className={`flex items-center gap-0.5 text-[#ff9a4d] ${size}`}>
      {Array.from({ length: 5 }).map((_, index) =>
        index < safeRating ? (
          <TiStarFullOutline key={index} />
        ) : (
          <TiStarOutline key={index} />
        ),
      )}
    </div>
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);
  const addToCart = useShopStore((state) => state.addToCart);
  const toggleFavorite = useShopStore((state) => state.toggleFavorite);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [id]);

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
        const [{ data }, { data: reviewData }] = await Promise.all([
          api.get<Product>(`/products/${id}`),
          api.get<Review[]>(`/products/${id}/reviews`),
        ]);
        const images = uniqueImages(data);

        setProduct(data);
        setReviews(reviewData);
        setSelectedImage(images[0] ?? "");
      } catch {
        setProduct(null);
        setReviews([]);
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
  const selectedImageIndex = Math.max(images.indexOf(selectedImage), 0);
  const canNavigateGallery = images.length > 1;
  const ownReview = useMemo(
    () => reviews.find((review) => review.userId === user?.id) ?? null,
    [reviews, user?.id],
  );

  const showImageAt = (index: number) => {
    if (images.length === 0) return;

    const nextIndex = (index + images.length) % images.length;
    setSelectedImage(images[nextIndex]);
  };

  useEffect(() => {
    if (!ownReview) {
      setReviewRating("5");
      setReviewComment("");
      return;
    }

    setReviewRating(String(ownReview.rating));
    setReviewComment(ownReview.comment);
  }, [ownReview]);

  const handleReviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!productId) return;

    setReviewError(null);
    setReviewSuccess(null);
    setIsSubmittingReview(true);

    try {
      const { data } = await api.post<ReviewResponse>(
        `/products/${productId}/reviews`,
        {
          rating: Number(reviewRating),
          comment: reviewComment,
        },
      );

      setReviews((currentReviews) => [
        data.review,
        ...currentReviews.filter((review) => review.id !== data.review.id),
      ]);
      setProduct((currentProduct) =>
        currentProduct
          ? {
              ...currentProduct,
              rating: data.productRating,
              reviewsCount: data.reviewsCount,
            }
          : currentProduct,
      );
      setReviewSuccess(
        ownReview ? "Ваш відгук оновлено." : "Дякуємо, ваш відгук збережено.",
      );
    } catch {
      setReviewError("Не вдалося надіслати відгук. Спробуйте ще раз.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!productId) return;

    setDeletingReviewId(reviewId);
    setReviewError(null);
    setReviewSuccess(null);

    try {
      const { data } = await api.delete<ReviewDeleteResponse>(
        `/products/${productId}/reviews/${reviewId}`,
      );

      setReviews((currentReviews) =>
        currentReviews.filter((review) => review.id !== reviewId),
      );
      setProduct((currentProduct) =>
        currentProduct
          ? {
              ...currentProduct,
              rating: data.productRating,
              reviewsCount: data.reviewsCount,
            }
          : currentProduct,
      );
    } catch {
      setReviewError("Не вдалося видалити відгук. Спробуйте ще раз.");
    } finally {
      setDeletingReviewId(null);
    }
  };

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
          <>
            <section className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,560px)_1fr]">
            <div className="min-w-0">
              <div className="relative flex min-h-[430px] items-center justify-center overflow-hidden rounded-2xl border border-[#eadfd3] bg-[#faf8f4] p-8 shadow-[0_12px_32px_rgba(0,0,0,0.05)] sm:min-h-[520px]">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={title}
                    className="max-h-[420px] w-full object-contain sm:max-h-[470px]"
                  />
                ) : (
                  <div className="flex h-[420px] w-full items-center justify-center rounded-xl bg-white">
                    <TiThLargeOutline className="text-[88px] text-[#cdbca9]" />
                  </div>
                )}

                {canNavigateGallery && (
                  <>
                    <button
                      type="button"
                      onClick={() => showImageAt(selectedImageIndex - 1)}
                      className="absolute left-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#eadfd3] bg-white/95 text-[#6d5c4f] shadow-[0_8px_22px_rgba(0,0,0,0.08)] transition hover:border-[#ff7a1a] hover:text-[#ff7a1a]"
                      aria-label="Попереднє фото"
                    >
                      <TiChevronLeft className="text-[26px]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => showImageAt(selectedImageIndex + 1)}
                      className="absolute right-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#eadfd3] bg-white/95 text-[#6d5c4f] shadow-[0_8px_22px_rgba(0,0,0,0.08)] transition hover:border-[#ff7a1a] hover:text-[#ff7a1a]"
                      aria-label="Наступне фото"
                    >
                      <TiChevronRight className="text-[26px]" />
                    </button>
                    <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-[#eadfd3] bg-white/95 px-3 py-2 shadow-[0_8px_22px_rgba(0,0,0,0.08)]">
                      {images.map((image, index) => (
                        <button
                          key={image}
                          type="button"
                          onClick={() => setSelectedImage(image)}
                          className={`h-2.5 rounded-full transition ${
                            index === selectedImageIndex
                              ? "w-5 bg-[#ff7a1a]"
                              : "w-2.5 bg-[#eadfd3] hover:bg-[#f2c39c]"
                          }`}
                          aria-label={`Фото ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                  {images.map((image) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setSelectedImage(image)}
                      className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border bg-white p-2 transition sm:h-24 sm:w-24 ${
                        selectedImage === image
                          ? "border-[#ff7a1a] shadow-[0_8px_20px_rgba(255,122,26,0.18)]"
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

            <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-h-[260px] rounded-2xl border border-[#eadfd3] bg-white p-5 shadow-[0_12px_32px_rgba(0,0,0,0.05)] sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-black tracking-[-0.02em] text-[#171612]">
                      Відгуки
                    </h2>
                    <p className="mt-1 text-sm text-[#6d5c4f]">
                      {reviews.length > 0
                        ? `Оцінка товару: ${product.rating.toFixed(1)} з 5`
                        : "Поки немає відгуків."}
                    </p>
                  </div>
                  <RatingRow
                    rating={product.rating}
                    reviews={product.reviewsCount}
                  />
                </div>

                {reviews.length === 0 ? (
                  <div className="mt-8 rounded-xl bg-[#fffaf5] p-6 text-sm text-[#6d5c4f]">
                    Будьте першим, хто залишить відгук про цей товар.
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    {reviews.map((review) => (
                      <article
                        key={review.id}
                        className="rounded-xl border border-[#eadfd3] bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-base font-black text-[#171612]">
                              {review.userName}
                            </h3>
                          </div>
                          <Stars rating={review.rating} />
                        </div>
                        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#6d5c4f]">
                          {review.comment}
                        </p>
                        <div className="mt-3 flex items-end justify-between gap-3">
                          <p className="text-xs font-medium text-[#9f8f80]">
                            {new Date(review.createdAt).toLocaleDateString(
                              "uk-UA",
                            )}
                          </p>
                          {user?.role === "admin" && (
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Видалити цей відгук назавжди?",
                                  )
                                ) {
                                  void handleDeleteReview(review.id);
                                }
                              }}
                              disabled={deletingReviewId === review.id}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-[#a64e0d] transition hover:bg-[#fff4eb] disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label="Видалити відгук"
                            >
                              <TiTrash className="text-[15px]" />
                              Видалити
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[#eadfd3] bg-[#fffaf5] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.05)] sm:p-6">
                <h2 className="text-2xl font-black tracking-[-0.02em] text-[#171612]">
                  {ownReview ? "Ваш відгук" : "Залишити відгук"}
                </h2>
                {ownReview && (
                  <p className="mt-2 rounded-xl border border-[#eadfd3] bg-white px-3 py-2 text-sm text-[#6d5c4f]">
                    Ви вже залишили відгук. Змініть оцінку або текст і збережіть
                    оновлення.
                  </p>
                )}

                {user ? (
                  <form
                    onSubmit={handleReviewSubmit}
                    className="mt-5 space-y-4"
                  >
                    <label className="block">
                      <span className="text-sm font-semibold text-[#6d5c4f]">
                        Оцінка
                      </span>
                      <select
                        value={reviewRating}
                        onChange={(event) =>
                          setReviewRating(event.target.value)
                        }
                        className="mt-2 w-full rounded-xl border border-[#eadfd3] bg-white px-3 py-3 text-sm font-semibold text-[#171612] outline-none transition focus:border-[#ff7a1a] focus:ring-4 focus:ring-[#ff7a1a]/10"
                      >
                        <option value="5">5 - Відмінно</option>
                        <option value="4">4 - Добре</option>
                        <option value="3">3 - Нормально</option>
                        <option value="2">2 - Погано</option>
                        <option value="1">1 - Дуже погано</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-[#6d5c4f]">
                        Коментар
                      </span>
                      <textarea
                        value={reviewComment}
                        onChange={(event) =>
                          setReviewComment(event.target.value)
                        }
                        required
                        maxLength={1000}
                        rows={6}
                        className="mt-2 w-full resize-y rounded-xl border border-[#eadfd3] bg-white px-3 py-3 text-sm text-[#171612] outline-none transition focus:border-[#ff7a1a] focus:ring-4 focus:ring-[#ff7a1a]/10"
                      />
                    </label>

                    {reviewError && (
                      <p className="rounded-xl bg-[#fff4eb] px-3 py-2 text-sm font-semibold text-[#a64e0d]">
                        {reviewError}
                      </p>
                    )}
                    {reviewSuccess && (
                      <p className="rounded-xl bg-[#f4fbf6] px-3 py-2 text-sm font-semibold text-[#24743a]">
                        {reviewSuccess}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="inline-flex w-full items-center justify-center rounded-xl bg-[#ff7a1a] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmittingReview
                        ? "Зберігаємо..."
                        : ownReview
                          ? "Змінити відгук"
                          : "Надіслати відгук"}
                    </button>
                  </form>
                ) : (
                  <div className="mt-5 rounded-xl border border-[#eadfd3] bg-white p-4 text-sm leading-6 text-[#6d5c4f]">
                    Щоб залишити відгук, увійдіть у свій акаунт.
                    <Link
                      to="/login"
                      className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[#ff7a1a] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                    >
                      Увійти
                    </Link>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
