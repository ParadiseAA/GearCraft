import { create } from "zustand";
import type { AxiosError } from "axios";
import api from "../services/api";

interface ApiError {
  message: string;
}

interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: "user" | "admin";
}

interface AuthResponse {
  token: string;
  user: User;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  register: (
    name: string,
    surname: string,
    email: string,
    password: string,
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  initializeAuth: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem("token"),
  isLoading: false,
  isInitialized: false,
  error: null,

  register: async (name, surname, email, password) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await api.post<AuthResponse>("/auth/register", {
        name,
        surname,
        email,
        password,
      });

      localStorage.setItem("token", data.token);
      set({ user: data.user, token: data.token, isLoading: false });
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      set({
        error: error.response?.data?.message || "Registration failed",
        isLoading: false,
      });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await api.post<AuthResponse>("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", data.token);
      set({ user: data.user, token: data.token, isLoading: false });
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      set({
        error: error.response?.data?.message || "Login failed",
        isLoading: false,
      });
    }
  },

  initializeAuth: async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      set({
        user: null,
        token: null,
        isLoading: false,
        isInitialized: true,
        error: null,
      });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const { data } = await api.get<User>("/auth/me");
      set({
        user: data,
        token,
        isLoading: false,
        isInitialized: true,
        error: null,
      });
    } catch {
      localStorage.removeItem("token");
      set({
        user: null,
        token: null,
        isLoading: false,
        isInitialized: true,
        error: null,
      });
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({
      user: null,
      token: null,
      isLoading: false,
      error: null,
    });
  },
}));
