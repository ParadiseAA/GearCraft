import { useEffect, useState } from "react";
import type { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

const accentColor = "#ff7a1a";

interface ApiError {
  message: string;
}

const loginSchema = z.object({
  email: z.string().email("Невірний формат email"),
  password: z.string().min(6, "Мінімум 6 символів"),
});

const registerSchema = z
  .object({
    name: z.string().min(2, "Мінімум 2 символи"),
    surname: z.string().min(2, "Мінімум 2 символи"),
    email: z.string().email("Невірний формат email"),
    password: z.string().min(6, "Мінімум 6 символів"),
    confirmPassword: z.string().min(6, "Мінімум 6 символів"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Паролі не співпадають",
    path: ["confirmPassword"],
  });

const forgotSchema = z.object({
  email: z.string().email("Невірний формат email"),
});

const resetSchema = z
  .object({
    code: z.string().regex(/^\d{6}$/, "Введіть 6-значний код"),
    password: z.string().min(6, "Мінімум 6 символів"),
    confirmPassword: z.string().min(6, "Мінімум 6 символів"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Паролі не співпадають",
    path: ["confirmPassword"],
  });

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;
type ForgotData = z.infer<typeof forgotSchema>;
type ResetData = z.infer<typeof resetSchema>;
type AuthTab = "login" | "register" | "forgot";

const fieldClass =
  "w-full rounded-2xl border border-[#bababa] bg-white px-4 py-3 text-sm text-[#000000] outline-none transition placeholder:text-[#7e6c5d] focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20";

function LoginForm({
  onForgot,
  notice,
}: {
  onForgot: () => void;
  notice: string | null;
}) {
  const { login, isLoading, error, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = new URLSearchParams(location.search).get("redirect") || "/";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (user) navigate(redirect);
  }, [user, navigate, redirect]);

  const onSubmit = async (data: LoginData) => {
    await login(data.email, data.password);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-6 flex flex-col gap-4"
    >
      {notice && (
        <p className="rounded-2xl bg-[#e8f7ed] px-4 py-3 text-center text-sm font-semibold text-[#24743a]">
          {notice}
        </p>
      )}
      {error && (
        <p className="rounded-2xl bg-[#ff00008c] px-4 py-3 text-center text-sm text-white">
          {error}
        </p>
      )}

      <div>
        <label className="mb-1 block text-sm text-[#818080]">
          Email адреса
        </label>
        <input
          {...register("email")}
          placeholder="user1234@example.com"
          type="email"
          className={fieldClass}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-[#ff9a4d]">{errors.email.message}</p>
        )}
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between gap-3">
          <label className="block text-sm text-[#818080]">Пароль</label>
          <button
            type="button"
            onClick={onForgot}
            className="text-xs font-semibold text-[#ff7a1a] transition hover:text-[#c95b09]"
          >
            Забули пароль?
          </button>
        </div>
        <input
          {...register("password")}
          placeholder="••••••"
          type="password"
          className={fieldClass}
        />
        {errors.password && (
          <p className="mt-1 text-xs text-[#ff9a4d]">
            {errors.password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
        style={{ backgroundColor: accentColor }}
      >
        {isLoading ? "Завантаження..." : "Увійти"}
      </button>
    </form>
  );
}

function RegisterForm() {
  const { register: registerUser, isLoading, error, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = new URLSearchParams(location.search).get("redirect") || "/";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (user) navigate(redirect);
  }, [user, navigate, redirect]);

  const onSubmit = async (data: RegisterData) => {
    await registerUser(data.name, data.surname, data.email, data.password);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-6 flex flex-col gap-4"
    >
      {error && (
        <p className="rounded-2xl bg-[#ff00008c] px-4 py-3 text-center text-sm text-white">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-[#818080]">Ім'я</label>
          <input
            {...register("name")}
            placeholder="Андрій"
            className={fieldClass}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-[#ff9a4d]">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm text-[#818080]">Прізвище</label>
          <input
            {...register("surname")}
            placeholder="Шевченко"
            className={fieldClass}
          />
          {errors.surname && (
            <p className="mt-1 text-xs text-[#ff9a4d]">
              {errors.surname.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-[#818080]">
          Email адреса
        </label>
        <input
          {...register("email")}
          placeholder="user1234@example.com"
          type="email"
          className={fieldClass}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-[#ff9a4d]">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm text-[#818080]">Пароль</label>
        <input
          {...register("password")}
          placeholder="••••••"
          type="password"
          className={fieldClass}
        />
        {errors.password && (
          <p className="mt-1 text-xs text-[#ff9a4d]">
            {errors.password.message}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm text-[#818080]">
          Підтвердити пароль
        </label>
        <input
          {...register("confirmPassword")}
          placeholder="••••••"
          type="password"
          className={fieldClass}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-[#ff9a4d]">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
        style={{ backgroundColor: accentColor }}
      >
        {isLoading ? "Завантаження..." : "Зареєструватись"}
      </button>
    </form>
  );
}

function ForgotPasswordForm({
  onBack,
  onResetSuccess,
}: {
  onBack: () => void;
  onResetSuccess: () => void;
}) {
  const [step, setStep] = useState<"email" | "reset">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState("");

  const emailForm = useForm<ForgotData>({
    resolver: zodResolver(forgotSchema),
  });
  const resetForm = useForm<ResetData>({
    resolver: zodResolver(resetSchema),
  });

  const requestCode = async (data: ForgotData) => {
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      await api.post("/auth/forgot-password", { email: data.email });
      setResetEmail(data.email);
      setStep("reset");
      setMessage(
        "Код відновлення надіслано. Введіть 6 цифр із листа нижче. Якщо лист не прийшов, перевірте папку «Спам» або спробуйте ще раз через кілька хвилин.",
      );
    } catch (err) {
      const apiError = err as AxiosError<ApiError>;
      setError(apiError.response?.data?.message || "Не вдалося надіслати код");
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (data: ResetData) => {
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      await api.post("/auth/reset-password", {
        code: data.code,
        password: data.password,
      });
      onResetSuccess();
    } catch (err) {
      const apiError = err as AxiosError<ApiError>;
      setError(apiError.response?.data?.message || "Не вдалося змінити пароль");
    } finally {
      setIsLoading(false);
    }
  };

  const closeForgot = () => {
    setStep("email");
    setResetEmail("");
    setMessage(null);
    setError(null);
    emailForm.reset();
    resetForm.reset();
    onBack();
  };

  return (
    <div className="mt-6">
      {message && (
        <p className="mb-4 rounded-2xl bg-[#e8f7ed] px-4 py-3 text-center text-sm font-semibold text-[#24743a]">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-2xl bg-[#ff00008c] px-4 py-3 text-center text-sm text-white">
          {error}
        </p>
      )}

      {step === "email" ? (
        <form
          onSubmit={emailForm.handleSubmit(requestCode)}
          className="grid gap-4"
        >
          <div>
            <label className="mb-1 block text-sm text-[#818080]">
              Email адреса
            </label>
            <input
              {...emailForm.register("email")}
              placeholder="user1234@example.com"
              type="email"
              className={fieldClass}
            />
            {emailForm.formState.errors.email && (
              <p className="mt-1 text-xs text-[#ff9a4d]">
                {emailForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            style={{ backgroundColor: accentColor }}
          >
            {isLoading ? "Надсилання..." : "Надіслати код"}
          </button>
        </form>
      ) : (
        <form
          onSubmit={resetForm.handleSubmit(resetPassword)}
          className="grid gap-4"
        >
          <div className="rounded-2xl border border-[#eadfd3] bg-[#fffaf5] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7f6e5f]">
              Код надіслано для
            </p>
            <p className="mt-1 break-all text-sm font-semibold text-[#171612]">
              {resetEmail}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[#171612]">
              Код підтвердження з листа
            </label>
            <input
              {...resetForm.register("code")}
              placeholder="123456"
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              className={fieldClass}
            />
            {resetForm.formState.errors.code && (
              <p className="mt-1 text-xs text-[#ff9a4d]">
                {resetForm.formState.errors.code.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm text-[#818080]">
              Новий пароль
            </label>
            <input
              {...resetForm.register("password")}
              placeholder="••••••"
              type="password"
              autoComplete="new-password"
              className={fieldClass}
            />
            {resetForm.formState.errors.password && (
              <p className="mt-1 text-xs text-[#ff9a4d]">
                {resetForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm text-[#818080]">
              Підтвердити пароль
            </label>
            <input
              {...resetForm.register("confirmPassword")}
              placeholder="••••••"
              type="password"
              autoComplete="new-password"
              className={fieldClass}
            />
            {resetForm.formState.errors.confirmPassword && (
              <p className="mt-1 text-xs text-[#ff9a4d]">
                {resetForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            style={{ backgroundColor: accentColor }}
          >
            {isLoading ? "Збереження..." : "Змінити пароль"}
          </button>
        </form>
      )}

      <button
        type="button"
        onClick={closeForgot}
        className="mt-5 w-full text-center text-sm font-semibold text-[#ff7a1a] transition hover:text-[#c95b09]"
      >
        Повернутися до входу
      </button>
    </div>
  );
}

export default function AuthPage() {
  const [tab, setTab] = useState<AuthTab>("login");
  const [loginNotice, setLoginNotice] = useState<string | null>(null);

  const openTab = (nextTab: AuthTab) => {
    setLoginNotice(null);
    setTab(nextTab);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fbf9f9] px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,26,0.14),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(255,122,26,0.08),transparent_22%)]" />
      <div className="relative w-full max-w-md rounded-[28px] bg-white p-8 shadow-lg">
        {tab !== "forgot" && (
          <div className="mb-2 flex rounded-2xl border border-[#bababa] bg-[#faf6f6] p-1">
            <button
              type="button"
              onClick={() => openTab("login")}
              className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${
                tab === "login" ? "text-white shadow-lg" : "text-[#8d7c6e]"
              }`}
              style={
                tab === "login" ? { backgroundColor: accentColor } : undefined
              }
            >
              Вхід
            </button>
            <button
              type="button"
              onClick={() => openTab("register")}
              className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${
                tab === "register" ? "text-white shadow-lg" : "text-[#8d7c6e]"
              }`}
              style={
                tab === "register"
                  ? { backgroundColor: accentColor }
                  : undefined
              }
            >
              Реєстрація
            </button>
          </div>
        )}

        <div className="mt-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#ff9a4d]">
            GearCraft
          </p>
          <h1 className="mt-3 text-3xl font-black text-[#323232]">
            {tab === "login" && "Авторизація"}
            {tab === "register" && "Створити акаунт"}
            {tab === "forgot" && "Відновлення пароля"}
          </h1>
          <p className="mt-2 text-sm text-[#818080]">
            {tab === "login" &&
              "Увійдіть, щоб керувати замовленнями та збереженими виробами."}
            {tab === "register" &&
              "Заповніть форму, щоб зберігати обране та оформлювати замовлення."}
            {tab === "forgot" &&
              "Отримайте код на пошту, а потім створіть новий пароль."}
          </p>
        </div>

        {tab === "login" && (
          <LoginForm
            notice={loginNotice}
            onForgot={() => {
              setLoginNotice(null);
              setTab("forgot");
            }}
          />
        )}
        {tab === "register" && <RegisterForm />}
        {tab === "forgot" && (
          <ForgotPasswordForm
            onBack={() => setTab("login")}
            onResetSuccess={() => {
              setLoginNotice(
                "Пароль змінено. Тепер можна увійти з новим паролем.",
              );
              setTab("login");
            }}
          />
        )}

        {tab !== "forgot" && (
          <p className="mt-5 text-center text-sm text-[#9a8c7d]">
            {tab === "login" ? (
              <>
                Ще не маєте акаунта?{" "}
                <button
                  type="button"
                  onClick={() => openTab("register")}
                  className="font-medium text-[#ff9a4d] hover:text-[#ffb067]"
                >
                  Зареєструватися
                </button>
              </>
            ) : (
              <>
                Вже є акаунт?{" "}
                <button
                  type="button"
                  onClick={() => openTab("login")}
                  className="font-medium text-[#ff9a4d] hover:text-[#ffb067]"
                >
                  Увійти
                </button>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
