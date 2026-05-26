import { Link } from "react-router-dom";
import { TiArrowRight } from "react-icons/ti";

const currentYear = new Date().getFullYear();

export default function SiteFooter() {
  return (
    <footer className="border-t border-[#3a2a1d] bg-[#171612] text-[#d8cfc4]">
      <div className="mx-auto grid max-w-[1320px] gap-10 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:px-6 lg:py-12">
        <div>
          <h2 className="text-lg font-black text-white">GearCraft</h2>
          <p className="mt-3 max-w-xs text-sm leading-6 text-[#a99b8c]">
            Авторські вироби з металу та автодеталей для дому, декору й
            подарунків.
          </p>
          <form className="mt-5 flex max-w-xs overflow-hidden rounded-xl border border-[#4a3828] bg-[#211d19] focus-within:border-[#ff7a1a]">
            <input
              type="email"
              placeholder="Введіть email"
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-[#8f8173]"
            />
            <button
              type="submit"
              className="inline-flex w-12 items-center justify-center text-[#ff7a1a] transition hover:bg-[#ff7a1a]/10"
              aria-label="Підписатися"
            >
              <TiArrowRight className="text-xl" />
            </button>
          </form>
        </div>

        <div>
          <h3 className="text-sm font-black text-white">Підтримка</h3>
          <div className="mt-4 grid gap-3 text-sm text-[#a99b8c]">
            <p>Україна</p>
            <a
              href="mailto:gearcraft@gmail.com"
              className="transition hover:text-[#ff9a4d]"
            >
              gearcraft@gmail.com
            </a>
            <a
              href="tel:+380441234567"
              className="transition hover:text-[#ff9a4d]"
            >
              +380 44 123 4567
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black text-white">Акаунт</h3>
          <nav className="mt-4 grid gap-3 text-sm text-[#a99b8c]">
            <Link to="/auth" className="transition hover:text-[#ff9a4d]">
              Вхід / Реєстрація
            </Link>
            <Link to="/catalog" className="transition hover:text-[#ff9a4d]">
              Каталог
            </Link>
            <Link to="/cart" className="transition hover:text-[#ff9a4d]">
              Кошик
            </Link>
            <Link
              to="/account/orders"
              className="transition hover:text-[#ff9a4d]"
            >
              Мої замовлення
            </Link>
          </nav>
        </div>

        <div>
          <h3 className="text-sm font-black text-white">Швидкі посилання</h3>
          <nav className="mt-4 grid gap-3 text-sm text-[#a99b8c]">
            <Link to="/" className="transition hover:text-[#ff9a4d]">
              Головна
            </Link>
            <Link to="/catalog" className="transition hover:text-[#ff9a4d]">
              Товари
            </Link>
            <a href="#" className="transition hover:text-[#ff9a4d]">
              Політика конфіденційності
            </a>
            <a href="#" className="transition hover:text-[#ff9a4d]">
              Контакти
            </a>
          </nav>
        </div>
      </div>

      <div className="border-t border-[#2a211a] px-4 py-4 text-center text-xs text-[#7f7164]">
        © Copyright {currentYear} GearCraft
      </div>
    </footer>
  );
}
