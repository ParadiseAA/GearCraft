import {
  TiAdjustBrightness,
  TiArrowRight,
  TiCogOutline,
  TiFlashOutline,
  TiShoppingCart,
  TiSpannerOutline,
  TiStarFullOutline,
  TiStarHalfOutline,
  TiStarOutline,
  TiZoomOutline,
} from "react-icons/ti";
import SiteHeader from "../components/SiteHeader";

const accentColor = "#ff7a1a";

const featuredProducts = [
  {
    id: 1,
    name: "Годинник з гальмівного диска",
    price: "₴7 900.00",
    accent: "Інтер'єр",
    icon: TiAdjustBrightness,
    tone: "from-[#f8f5ef] via-white to-[#ece6dc]",
    rating: 4,
    reviews: 18,
  },
  {
    id: 2,
    name: "Лампа з поршня",
    price: "₴6 400.00",
    accent: "Світло",
    icon: TiCogOutline,
    tone: "from-[#f4efe8] via-white to-[#e7dfd3]",
    rating: 5,
    reviews: 9,
  },
  {
    id: 3,
    name: "Колібрі з гайок і прутів",
    price: "₴4 500.00",
    accent: "Скульптура",
    icon: TiSpannerOutline,
    tone: "from-[#f7f3ed] via-white to-[#ece4d9]",
    rating: 4.5,
    reviews: 12,
  },
  {
    id: 4,
    name: "Підставка з шатуна",
    price: "₴3 700.00",
    accent: "Декор",
    icon: TiFlashOutline,
    tone: "from-[#f5f0e9] via-white to-[#e8e0d4]",
    rating: 5,
    reviews: 21,
  },
];

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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#ffffff] text-[#171612]">
      <SiteHeader searchPlaceholder="Пошук виробів..." />

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
              GearCraft handmade metal art
            </p>
            <h1 className="mt-5 text-4xl font-black leading-[0.95] sm:text-5xl lg:text-6xl">
              Авторські вироби
              <span className="mt-2 block text-[#ff7a1a]">
                з автодеталей і металу
              </span>
            </h1>
            <p className="mt-5 max-w-[470px] text-sm leading-6 text-[#c8bfb3] sm:text-base">
              Ручна робота, де гальмівні диски стають годинниками, поршні
              перетворюються на лампи, а гайки й прути оживають у вигляді
              декоративних птахів та скульптур.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                style={{ backgroundColor: accentColor }}
              >
                Переглянути вироби
                <TiArrowRight className="text-xl" />
              </button>
              <div className="rounded-xl border border-[#ff7a1a]/15 bg-white/[0.03] px-4 py-3 text-sm text-[#e0d7cd]">
                Унікальні handmade-роботи з металу та автозапчастин
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.03em] text-[#171612]">
                Популярні вироби
              </h2>
              <p className="mt-2 text-sm text-[#6d5c4f]">
                Декор, світильники й арт-об'єкти, створені вручну з характерних
                металевих елементів.
              </p>
            </div>

            <label className="inline-flex items-center gap-2 self-start rounded-xl border border-[#eadfd3] bg-[#fffaf5] px-4 py-3 text-sm text-[#7d6d5f] shadow-[0_10px_24px_rgba(0,0,0,0.06)] md:self-auto">
              <input
                type="text"
                placeholder="Пошук товарів..."
                className="w-[180px] bg-transparent text-[#1a1714] outline-none placeholder:text-[#9d8e80] sm:w-[220px]"
              />
              <TiZoomOutline className="text-xl text-[#ff7a1a]" />
            </label>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {featuredProducts.map((product) => {
              const ProductIcon = product.icon;

              return (
                <article
                  key={product.id}
                  className="group overflow-hidden rounded-[22px] border border-[#eadfd3] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,0,0,0.12)]"
                >
                  <div
                    className={`relative flex h-[250px] items-center justify-center overflow-hidden bg-gradient-to-br ${product.tone}`}
                  >
                    <div className="absolute inset-4 rounded-[26px] border border-[#ff7a1a]/10" />
                    <div className="absolute -right-8 top-6 h-24 w-24 rounded-full border border-[#ff7a1a]/10" />
                    <div className="absolute bottom-4 left-4 rounded-full border border-[#ff7a1a]/12 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d86b12]">
                      {product.accent}
                    </div>
                    <div className="relative flex h-32 w-32 items-center justify-center rounded-[32px] bg-[linear-gradient(145deg,rgba(255,122,26,0.14),rgba(255,255,255,0.92))] shadow-[0_18px_35px_rgba(0,0,0,0.12)]">
                      <ProductIcon className="text-[68px] text-[#1b1a16]" />
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-[#171612]">
                      {product.name}
                    </h3>
                    <p className="mt-2 text-lg font-semibold tracking-[-0.01em] text-[#171612]">
                      {product.price}
                    </p>
                    <div className="mt-3">
                      <RatingRow
                        rating={product.rating}
                        reviews={product.reviews}
                      />
                    </div>

                    <button
                      type="button"
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                      style={{ backgroundColor: accentColor }}
                    >
                      <TiShoppingCart className="text-xl" />
                      Додати в кошик
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
