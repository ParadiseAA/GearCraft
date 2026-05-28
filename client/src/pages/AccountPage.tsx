import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import SiteHeader from "../components/SiteHeader";
import { useAuthStore } from "../store/authStore";

const profileSchema = z.object({
  name: z.string().min(2, "Мінімум 2 символи").max(80, "Максимум 80 символів"),
  surname: z
    .string()
    .min(2, "Мінімум 2 символи")
    .max(80, "Максимум 80 символів"),
  email: z.string().email("Невірний формат email"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Введіть поточний пароль"),
    newPassword: z.string().min(6, "Мінімум 6 символів"),
    confirmPassword: z.string().min(6, "Мінімум 6 символів"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Паролі не співпадають",
    path: ["confirmPassword"],
  });

type ProfileData = z.infer<typeof profileSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

const fieldClass =
  "mt-2 w-full rounded-xl border border-[#eadfd3] bg-white px-4 py-3 text-sm text-[#171612] outline-none transition focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20";

export default function AccountPage() {
  const navigate = useNavigate();
  const {
    user,
    isLoading,
    error,
    updateProfile,
    changePassword,
  } = useAuthStore();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const isAdmin = user?.role === "admin" || user?.isAdmin;
  const fullName = [user?.name, user?.surname].filter(Boolean).join(" ");
  const roleLabel = isAdmin ? "Адмін" : "Користувач";

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? "",
      surname: user?.surname ?? "",
      email: user?.email ?? "",
    },
  });

  const passwordForm = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    profileForm.reset({
      name: user?.name ?? "",
      surname: user?.surname ?? "",
      email: user?.email ?? "",
    });
  }, [profileForm, user?.email, user?.name, user?.surname]);

  const submitProfile = async (data: ProfileData) => {
    setProfileMessage(null);
    setPasswordMessage(null);
    const ok = await updateProfile(data);

    if (ok) {
      setProfileMessage("Дані профілю оновлено.");
      setIsEditingProfile(false);
    }
  };

  const submitPassword = async (data: PasswordData) => {
    setPasswordMessage(null);
    setProfileMessage(null);
    const ok = await changePassword(data.currentPassword, data.newPassword);

    if (ok) {
      setPasswordMessage("Пароль успішно змінено.");
      setIsChangingPassword(false);
      passwordForm.reset();
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#171612]">
      <SiteHeader searchPlaceholder="Пошук товарів..." />

      <main className="mx-auto max-w-[1320px] px-4 py-8 lg:px-6">
        <div className="mx-auto max-w-[820px]">
          <nav className="flex items-center gap-2 text-sm text-[#7f6e5f]">
            <Link to="/" className="transition hover:text-[#ff7a1a]">
              Головна
            </Link>
            <span className="text-[#d8cabc]">/</span>
            <span className="font-semibold text-[#171612]">Мій кабінет</span>
          </nav>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-[-0.02em]">
                Мій кабінет
              </h1>
              <p className="mt-2 text-sm text-[#6d5c4f]">
                Керуйте профілем, паролем і замовленнями.
              </p>
            </div>
          </div>

          <section className="mt-7 rounded-lg border border-[#eadfd3] bg-white p-6 shadow-[0_8px_24px_rgba(23,22,18,0.06)] sm:p-7">
            {profileMessage && (
              <p className="mb-5 rounded-xl bg-[#e8f7ed] px-4 py-3 text-sm font-semibold text-[#24743a]">
                {profileMessage}
              </p>
            )}
            {passwordMessage && (
              <p className="mb-5 rounded-xl bg-[#e8f7ed] px-4 py-3 text-sm font-semibold text-[#24743a]">
                {passwordMessage}
              </p>
            )}
            {error && (
              <p className="mb-5 rounded-xl border border-[#f0c7ad] bg-[#fff4eb] px-4 py-3 text-sm font-semibold text-[#a64e0d]">
                {error}
              </p>
            )}

            {!isEditingProfile ? (
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
            ) : (
              <form
                onSubmit={profileForm.handleSubmit(submitProfile)}
                className="grid gap-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-[#6d5c4f]">
                    Ім'я
                    <input {...profileForm.register("name")} className={fieldClass} />
                    {profileForm.formState.errors.name && (
                      <span className="mt-1 block text-xs text-[#ff7a1a]">
                        {profileForm.formState.errors.name.message}
                      </span>
                    )}
                  </label>

                  <label className="text-sm font-semibold text-[#6d5c4f]">
                    Прізвище
                    <input
                      {...profileForm.register("surname")}
                      className={fieldClass}
                    />
                    {profileForm.formState.errors.surname && (
                      <span className="mt-1 block text-xs text-[#ff7a1a]">
                        {profileForm.formState.errors.surname.message}
                      </span>
                    )}
                  </label>
                </div>

                <label className="text-sm font-semibold text-[#6d5c4f]">
                  Email
                  <input
                    {...profileForm.register("email")}
                    type="email"
                    className={fieldClass}
                  />
                  {profileForm.formState.errors.email && (
                    <span className="mt-1 block text-xs text-[#ff7a1a]">
                      {profileForm.formState.errors.email.message}
                    </span>
                  )}
                </label>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-[#FF7A1A] px-5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
                  >
                    {isLoading ? "Збереження..." : "Зберегти дані"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingProfile(false);
                      profileForm.reset();
                    }}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-[#eadfd3] bg-[#fffaf5] px-5 text-sm font-semibold text-[#171612] transition hover:bg-[#ff7a1a]/10"
                  >
                    Скасувати
                  </button>
                </div>
              </form>
            )}

            {!isEditingProfile && (
              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(true)}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-[#eadfd3] bg-[#fffaf5] px-5 text-sm font-semibold text-[#171612] transition hover:bg-[#ff7a1a]/10"
                >
                  Змінити дані
                </button>
                <button
                  type="button"
                  onClick={() => setIsChangingPassword((value) => !value)}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-[#eadfd3] bg-[#fffaf5] px-5 text-sm font-semibold text-[#171612] transition hover:bg-[#ff7a1a]/10"
                >
                  Змінити пароль
                </button>
              </div>
            )}

            {isChangingPassword && (
              <form
                onSubmit={passwordForm.handleSubmit(submitPassword)}
                className="mt-7 grid gap-4 rounded-lg border border-[#eadfd3] bg-[#fffaf5] p-4"
              >
                <label className="text-sm font-semibold text-[#6d5c4f]">
                  Поточний пароль
                  <input
                    {...passwordForm.register("currentPassword")}
                    type="password"
                    className={fieldClass}
                  />
                  {passwordForm.formState.errors.currentPassword && (
                    <span className="mt-1 block text-xs text-[#ff7a1a]">
                      {passwordForm.formState.errors.currentPassword.message}
                    </span>
                  )}
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-[#6d5c4f]">
                    Новий пароль
                    <input
                      {...passwordForm.register("newPassword")}
                      type="password"
                      className={fieldClass}
                    />
                    {passwordForm.formState.errors.newPassword && (
                      <span className="mt-1 block text-xs text-[#ff7a1a]">
                        {passwordForm.formState.errors.newPassword.message}
                      </span>
                    )}
                  </label>

                  <label className="text-sm font-semibold text-[#6d5c4f]">
                    Підтвердити пароль
                    <input
                      {...passwordForm.register("confirmPassword")}
                      type="password"
                      className={fieldClass}
                    />
                    {passwordForm.formState.errors.confirmPassword && (
                      <span className="mt-1 block text-xs text-[#ff7a1a]">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </span>
                    )}
                  </label>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-[#FF7A1A] px-5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
                  >
                    {isLoading ? "Збереження..." : "Зберегти пароль"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      passwordForm.reset();
                    }}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-[#eadfd3] bg-white px-5 text-sm font-semibold text-[#171612] transition hover:bg-[#ff7a1a]/10"
                  >
                    Скасувати
                  </button>
                </div>
              </form>
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
