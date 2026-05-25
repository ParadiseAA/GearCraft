import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  TiCogOutline,
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
  const [isAccountOpen, setIsAccountOpen] = useState(false);
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
    setIsAccountOpen(false);
    logout();
    navigate("/", { replace: true });
  };

  const openAdminPanel = () => {
    setIsAccountOpen(false);
    navigate("/admin");
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
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAccountOpen((current) => !current)}
                className="inline-flex items-center gap-2 rounded-full border border-[#eadfd3] bg-[#fffaf5] px-3 py-2 text-sm font-medium text-[#1a1714] transition hover:bg-[#ff7a1a]/10 xl:px-4"
                aria-label="Особистий кабінет"
              >
                <TiUser className="text-[20px] text-[#ff7a1a]" />
                <span className="hidden xl:inline">Особистий кабінет</span>
              </button>

              {isAccountOpen && (
                <div className="absolute right-0 z-[1100] mt-3 w-72 rounded-xl border border-[#eadfd3] bg-white p-3 shadow-[0_18px_40px_rgba(0,0,0,0.14)]">
                  <div className="border-b border-[#eadfd3] px-3 pb-3">
                    <p className="text-sm font-semibold text-[#171612]">
                      {user.name} {user.surname}
                    </p>
                    <p className="mt-1 break-all text-xs text-[#6d5c4f]">
                      {user.email}
                    </p>
                  </div>

                  <div className="mt-3 grid gap-2">
                    {user.role === "admin" && (
                      <button
                        type="button"
                        onClick={openAdminPanel}
                        className="inline-flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#171612] transition hover:bg-[#ff7a1a]/10"
                      >
                        <TiCogOutline className="text-xl text-[#ff7a1a]" />
                        Адмін-панель
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#171612] transition hover:bg-[#ff7a1a]/10"
                    >
                      <TiPowerOutline className="text-xl text-[#ff7a1a]" />
                      Вийти з акаунту
                    </button>
                  </div>
                </div>
              )}
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
