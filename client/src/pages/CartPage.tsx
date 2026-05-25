import { Link } from "react-router-dom";
import { TiMinus, TiPlus, TiTrash } from "react-icons/ti";
import SiteHeader from "../components/SiteHeader";
import {
  getProductId,
  getProductStock,
  useShopStore,
} from "../store/shopStore";

function formatPrice(value: number) {
  return `₴${value.toLocaleString("uk-UA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function CartPage() {
  const cart = useShopStore((state) => state.cart);
  const removeFromCart = useShopStore((state) => state.removeFromCart);
  const updateQuantity = useShopStore((state) => state.updateQuantity);
  const clearCart = useShopStore((state) => state.clearCart);
  const itemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  return (
    <div className="min-h-screen bg-white text-[#171612]">
      <SiteHeader searchPlaceholder="Пошук товарів..." />

      <main className="mx-auto max-w-[1320px] px-4 py-8 lg:px-6">
        <h1 className="text-3xl font-black tracking-[-0.03em]">Кошик</h1>

        {cart.length === 0 ? (
          <div className="mt-8 rounded-lg border border-[#ececec] bg-white p-10 text-center text-[#6d5c4f] shadow-[0_1px_5px_rgba(0,0,0,0.12)]">
            Кошик порожній.
            <div className="mt-5">
              <Link
                to="/catalog"
                className="inline-flex rounded-xl bg-[#171612] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black"
              >
                Перейти в каталог
              </Link>
            </div>
          </div>
        ) : (
          <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
            <div>
              <div className="mb-4 flex justify-end">
                <button
                  type="button"
                  onClick={clearCart}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#a64e0d] transition hover:text-[#ff7a1a]"
                >
                  <TiTrash className="text-lg" />
                  Очистити кошик
                </button>
              </div>

              <div className="grid gap-4">
                {cart.map((item) => {
                  const productId = getProductId(item.product);
                  const imageSrc = item.product.image || item.product.images[0];
                  const title = item.product.name || item.product.title;
                  const stock = getProductStock(item.product);
                  const isMaxQuantity = item.quantity >= stock;

                  return (
                    <article
                      key={productId}
                      className="relative grid min-h-[160px] grid-cols-[124px_1fr_auto] rounded-2xl border border-[#eadfd3] bg-white p-4 shadow-[0_8px_24px_rgba(23,22,18,0.06)]"
                    >
                      <Link
                        to={`/products/${productId}`}
                        className="flex h-[124px] w-[124px] items-center justify-center rounded-xl bg-[#faf8f4] p-3"
                      >
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={title}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="h-full w-full bg-white" />
                        )}
                      </Link>

                      <div className="ml-6 flex min-w-0 flex-col justify-between py-1">
                        <Link
                          to={`/products/${productId}`}
                          className="truncate text-[18px] font-semibold leading-6 text-[#171612] hover:text-[#d86b12]"
                        >
                          {title}
                        </Link>

                        <div>
                          <div className="inline-flex h-[38px] items-center overflow-hidden rounded-xl border border-[#eadfd3] bg-[#fffaf5]">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(productId, item.quantity - 1)
                              }
                              disabled={item.quantity <= 1}
                              className="inline-flex h-full w-10 items-center justify-center text-[#6d5c4f] transition hover:bg-[#ff7a1a]/10 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label="Зменшити кількість"
                            >
                              <TiMinus className="text-lg" />
                            </button>
                            <span className="w-12 text-center text-[16px] font-semibold text-[#171612]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(productId, item.quantity + 1)
                              }
                              disabled={isMaxQuantity}
                              className="inline-flex h-full w-10 items-center justify-center text-[#6d5c4f] transition hover:bg-[#ff7a1a]/10 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label="Збільшити кількість"
                            >
                              <TiPlus className="text-lg" />
                            </button>
                          </div>
                          {isMaxQuantity && (
                            <p className="mt-2 text-xs font-semibold text-[#e25666]">
                              Доступна максимальна кількість
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex min-w-[150px] flex-col items-end justify-between py-1">
                        <button
                          type="button"
                          onClick={() => removeFromCart(productId)}
                          className="inline-flex h-8 w-8 items-center justify-center text-[#9f8f80] transition hover:text-[#a64e0d]"
                          aria-label="Видалити з кошика"
                        >
                          <TiTrash className="text-[23px]" />
                        </button>
                        <p className="text-[22px] font-black leading-none text-[#171612]">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <aside className="self-start rounded-2xl border border-[#eadfd3] bg-[#fffaf5] p-6 shadow-[0_8px_24px_rgba(23,22,18,0.06)]">
              <h2 className="text-[22px] font-black">Підсумок замовлення</h2>

              <div className="mt-6 grid gap-4 text-[16px] text-[#6d5c4f]">
                <div className="flex justify-between gap-4">
                  <span>Проміжна сума ({itemsCount} тов.)</span>
                  <span className="text-[#171612]">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Доставка:</span>
                  <span className="text-right">Буде розраховано на оформленні</span>
                </div>
              </div>

              <div className="mt-6 flex justify-between gap-4 border-t border-[#eadfd3] pt-5 text-[18px] font-black">
                <span>Разом</span>
                <span>{formatPrice(total)}</span>
              </div>

              <button
                type="button"
                className="mt-7 inline-flex h-[54px] w-full items-center justify-center rounded-xl bg-[#ff7a1a] px-5 text-[16px] font-semibold text-white transition hover:brightness-110"
              >
                Оформити замовлення
              </button>
            </aside>
          </section>
        )}
      </main>
    </div>
  );
}
