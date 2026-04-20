import { NavLink, useNavigate } from "react-router-dom";
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
import logo from "../../../images/logo.png";

const navItems = [
  { label: "Головна", to: "/", icon: TiHomeOutline },
  { label: "Каталог", to: "/catalog", icon: TiThLargeOutline },
  { label: "Контакти", to: "/contacts", icon: TiUserOutline },
];

export default function SiteHeader({
  searchPlaceholder = "Пошук виробів...",
}: {
  searchPlaceholder?: string;
}) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="border-b border-[#ece3d8] bg-[#ffffff]/95 backdrop-blur">
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

        <div className="ml-auto flex items-center gap-3">
          <label className="hidden items-center gap-2 rounded-full border border-[#eadfd3] bg-[#fffaf5] px-4 py-2 text-sm text-[#7f6e5f] lg:flex">
            <TiZoomOutline className="order-2 text-xl text-[#ff7a1a]" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="w-[220px] bg-transparent text-[#1a1714] outline-none placeholder:text-[#9d8e80]"
            />
          </label>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#1a1714] transition hover:bg-[#ff7a1a]/10"
            aria-label="Обране"
          >
            <TiHeartOutline className="text-[24px]" />
          </button>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#1a1714] transition hover:bg-[#ff7a1a]/10"
            aria-label="Кошик"
          >
            <TiShoppingCart className="text-[24px]" />
          </button>

          {user ? (
            <>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-[#eadfd3] bg-[#fffaf5] px-4 py-2 text-sm font-medium text-[#1a1714] transition hover:bg-[#ff7a1a]/10"
                aria-label="Особистий кабінет"
              >
                <TiUser className="text-[20px] text-[#ff7a1a]" />
                <span className="hidden xl:inline">Особистий кабінет</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#1a1714] transition hover:bg-[#ff7a1a]/10"
                aria-label="Вийти з акаунту"
                title="Вийти з акаунту"
              >
                <TiPowerOutline className="text-[24px]" />
              </button>
            </>
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
