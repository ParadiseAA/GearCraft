import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  TiHeartOutline,
  TiHomeOutline,
  TiPowerOutline,
  TiShoppingCart,
  TiThLargeOutline,
  TiUser,
  TiUserOutline,
  TiZoomOutline,
} from "react-icons/ti";
import { useAuthStore } from "../store/authStore";
import { useShopStore } from "../store/shopStore";
import logo from "../../../images/logo.png";

const navItems = [
  { label: "Головна", to: "/", icon: TiHomeOutline },
  { label: "Каталог", to: "/catalog", icon: TiThLargeOutline },
  { label: "Контакти", to: "/contacts", icon: TiUserOutline },
];

export default function SiteHeader({
  searchPlaceholder = "Пошук товарів...",
}: {
  searchPlaceholder?: string;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuthStore();
  const favoritesCount = useShopStore((state) => state.favorites.length);
  const cartCount = useShopStore((state) =>
    state.cart.reduce((total, item) => total + item.quantity, 0),
  );
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const query = search.trim();
    const timeout = window.setTimeout(() => {
      if (!query && location.pathname !== "/catalog") return;

      const nextParams = new URLSearchParams(location.search);
      if (query) {
        nextParams.set("q", query);
      } else {
        nextParams.delete("q");
      }

      navigate(
        {
          pathname: "/catalog",
          search: nextParams.toString(),
        },
        { replace: location.pathname === "/catalog" },
      );
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [location.pathname, location.search, navigate, search]);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="relative z-[1000] border-b border-[#ece3d8] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1320px] items-center px-4 py-4 lg:px-6">
        <NavLink to="/" className="flex shrink-0 items-center gap-3">
          <img
            src={logo}
            alt="GearCraft"
            className="h-9 w-auto object-contain"
          />
        </NavLink>

        <nav className="ml-10 hidden min-w-0 flex-1 items-center justify-start gap-2 md:flex lg:ml-14">
          {navItems.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-[#ff7a1a]/12 text-[#1a1714]"
                    : "text-[#1a1714] hover:bg-[#ff7a1a]/10"
                }`
              }
            >
              <Icon className="text-xl text-[#ff7a1a]" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <label className="hidden items-center gap-2 rounded-full border border-[#eadfd3] bg-[#fffaf5] px-4 py-2 text-sm text-[#7f6e5f] lg:flex">
            <TiZoomOutline className="order-2 text-xl text-[#ff7a1a]" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-[220px] bg-transparent text-[#1a1714] outline-none placeholder:text-[#9d8e80]"
            />
          </label>

          <button
            type="button"
            onClick={() => navigate("/catalog")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#1a1714] transition hover:bg-[#ff7a1a]/10 lg:hidden"
            aria-label="Пошук"
          >
            <TiZoomOutline className="text-[24px]" />
          </button>

          <button
            type="button"
            onClick={() => navigate("/favorites")}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[#1a1714] transition hover:bg-[#ff7a1a]/10"
            aria-label="Обране"
          >
            <TiHeartOutline className="text-[24px]" />
            {favoritesCount > 0 && (
              <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#ff7a1a] px-1.5 py-0.5 text-center text-[11px] font-bold leading-none text-white">
                {favoritesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate("/cart")}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[#1a1714] transition hover:bg-[#ff7a1a]/10"
            aria-label="Кошик"
          >
            <TiShoppingCart className="text-[24px]" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#ff7a1a] px-1.5 py-0.5 text-center text-[11px] font-bold leading-none text-white">
                {cartCount}
              </span>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => navigate("/account")}
                  className="peer inline-flex h-10 w-10 items-center justify-center rounded-full text-[#1a1714] transition hover:bg-[#ff7a1a]/10"
                  aria-label="Особистий кабінет"
                >
                  <TiUser className="text-[22px] text-current" />
                </button>
                <span className="pointer-events-none absolute right-1/2 top-full z-[1200] mt-2 translate-x-1/2 whitespace-nowrap rounded-lg border border-[#eadfd3] bg-white px-3 py-1.5 text-xs font-semibold text-[#171612] opacity-0 shadow-[0_10px_28px_rgba(0,0,0,0.12)] transition peer-hover:opacity-100">
                  Особистий кабінет
                </span>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="peer inline-flex h-10 w-10 items-center justify-center rounded-full text-[#1a1714] transition hover:bg-[#ff7a1a]/10"
                  aria-label="Вийти з акаунта"
                >
                  <TiPowerOutline className="text-[22px] text-current" />
                </button>
                <span className="pointer-events-none absolute right-0 top-full z-[1200] mt-2 whitespace-nowrap rounded-lg border border-[#eadfd3] bg-white px-3 py-1.5 text-xs font-semibold text-[#171612] opacity-0 shadow-[0_10px_28px_rgba(0,0,0,0.12)] transition peer-hover:opacity-100">
                  Вийти з акаунта
                </span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#1a1714] transition hover:bg-[#ff7a1a]/10"
              aria-label="Увійти"
              title="Увійти"
            >
              <TiUserOutline className="text-[24px]" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
