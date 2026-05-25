import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const accentColor = "#ff7a1a";

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

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

function LoginForm() {
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
      {error && (
        <p className="rounded-2xl bg-[#ff00008c] px-4 py-3 text-center text-sm text-[#ffffff]">
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
          className="w-full rounded-2xl border border-[#bababa] bg-[#ffffff] px-4 py-3 text-sm text-[#000000] outline-none transition placeholder:text-[#7e6c5d] focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
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
          className="w-full rounded-2xl border border-[#bababa] bg-[#ffffff] px-4 py-3 text-sm text-[#000000] outline-none transition placeholder:text-[#bababa] focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
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
        <p className="rounded-2xl bg-[#ff00008c] px-4 py-3 text-center text-sm text-[#ffffff]">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-[#818080]">Ім'я</label>
          <input
            {...register("name")}
            placeholder="Андрій"
            className="w-full rounded-2xl border border-[#bababa] bg-[#ffffff] px-4 py-3 text-sm text-[#000000] outline-none transition placeholder:text-[#7e6c5d] focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
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
            className="w-full rounded-2xl border border-[#bababa] bg-[#ffffff] px-4 py-3 text-sm text-[#000000] outline-none transition placeholder:text-[#7e6c5d] focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
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
          className="w-full rounded-2xl border border-[#bababa] bg-[#ffffff] px-4 py-3 text-sm text-[#000000] outline-none transition placeholder:text-[#7e6c5d] focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
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
          className="w-full rounded-2xl border border-[#bababa] bg-[#ffffff] px-4 py-3 text-sm text-[#000000] outline-none transition placeholder:text-[#7e6c5d] focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
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
          className="w-full rounded-2xl border border-[#bababa] bg-[#ffffff] px-4 py-3 text-sm text-[#000000] outline-none transition placeholder:text-[#7e6c5d] focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
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

export default function AuthPage() {
  const [tab, setTab] = useState<"login" | "register">("login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fbf9f9] px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,26,0.14),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(255,122,26,0.08),transparent_22%)]" />
      <div className="relative w-full max-w-md rounded-[28px] bg-[#ffffff] p-8 shadow-lg">
        <div className="mb-2 flex rounded-2xl border border-[#bababa] bg-[#faf6f6] p-1">
          <button
            onClick={() => setTab("login")}
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
            onClick={() => setTab("register")}
            className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${
              tab === "register" ? "text-white shadow-lg" : "text-[#8d7c6e]"
            }`}
            style={
              tab === "register" ? { backgroundColor: accentColor } : undefined
            }
          >
            Реєстрація
          </button>
        </div>

        <div className="mt-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#ff9a4d]">
            GearCraft
          </p>
          <h1 className="mt-3 text-3xl font-black text-[#323232]">
            {tab === "login" ? "Авторизація" : "Створити акаунт"}
          </h1>
          <p className="mt-2 text-sm text-[#818080]">
            {tab === "login"
              ? "Увійдіть, щоб керувати замовленнями та збереженими виробами."
              : "Заповніть форму, щоб зберігати обране та оформлювати замовлення."}
          </p>
        </div>

        {tab === "login" ? <LoginForm /> : <RegisterForm />}

        <p className="mt-5 text-center text-sm text-[#9a8c7d]">
          {tab === "login" ? (
            <>
              Ще не маєте акаунта?{" "}
              <button
                onClick={() => setTab("register")}
                className="font-medium text-[#ff9a4d] hover:text-[#ffb067]"
              >
                Зареєструватися
              </button>
            </>
          ) : (
            <>
              Вже є акаунт?{" "}
              <button
                onClick={() => setTab("login")}
                className="font-medium text-[#ff9a4d] hover:text-[#ffb067]"
              >
                Увійти
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
