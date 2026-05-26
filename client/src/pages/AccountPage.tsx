import { Link, useNavigate } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import { useAuthStore } from "../store/authStore";

export default function AccountPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "admin" || user?.isAdmin;
  const fullName = [user?.name, user?.surname].filter(Boolean).join(" ");
  const roleLabel = isAdmin ? "Адмін" : "Користувач";

  return (
    <div className="min-h-screen bg-white text-[#171612]">
      <SiteHeader searchPlaceholder="Пошук товарів..." />

      <main className="mx-auto max-w-[1320px] px-4 py-8 lg:px-6">
        <div className="mx-auto max-w-[760px]">
          <nav className="flex items-center gap-2 text-sm text-[#7f6e5f]">
            <Link to="/" className="transition hover:text-[#ff7a1a]">
              Головна
            </Link>
            <span className="text-[#d8cabc]">/</span>
            <span className="font-semibold text-[#171612]">Мій кабінет</span>
          </nav>

          <h1 className="mt-8 text-3xl font-black tracking-[-0.02em]">
            Мій кабінет
          </h1>

          <section className="mt-7 rounded-lg border border-[#eadfd3] bg-white p-6 shadow-[0_8px_24px_rgba(23,22,18,0.06)] sm:p-7">
            <div className="grid gap-4 text-[16px] leading-6">
              <p>
                <span className="font-black">Ім'я:</span>{" "}
                {fullName || "Користувач"}
              </p>
              <p>
                <span className="font-black">Email:</span>{" "}
                <span className="break-all">{user?.email}</span>
              </p>
              <p>
                <span className="font-black">Роль:</span> {roleLabel}
              </p>
            </div>

            {isAdmin && (
              <button
                type="button"
                className="mt-7 inline-flex h-10 items-center justify-center rounded-xl border border-[#eadfd3] bg-[#fffaf5] px-5 text-sm font-semibold text-[#171612] transition hover:bg-[#ff7a1a]/10"
              >
                Змінити дані
              </button>
            )}

            <div className="my-6 h-px bg-[#eadfd3]" />

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/account/orders")}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#FF7A1A] px-5 text-sm font-bold text-white transition hover:brightness-110"
              >
                Мої замовлення
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => navigate("/admin")}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-[#eadfd3] bg-[#fffaf5] px-5 text-sm font-semibold text-[#171612] transition hover:bg-[#ff7a1a]/10"
                >
                  Адмін панель
                </button>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
