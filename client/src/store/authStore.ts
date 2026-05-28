import { create } from "zustand";
import type { AxiosError } from "axios";
import api from "../services/api";
import { useShopStore } from "./shopStore";

interface ApiError {
  message: string;
}

interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: "user" | "admin";
  isAdmin?: boolean;
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
  updateProfile: (input: {
    name: string;
    surname: string;
    email: string;
  }) => Promise<boolean>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<boolean>;
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
      await useShopStore.getState().setActiveUser(data.user.id);
      set({ user: data.user, token: data.token, isLoading: false });
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      set({
        error: error.response?.data?.message || "Не вдалося зареєструватися",
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
      await useShopStore.getState().setActiveUser(data.user.id);
      set({ user: data.user, token: data.token, isLoading: false });
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      set({
        error: error.response?.data?.message || "Не вдалося увійти",
        isLoading: false,
      });
    }
  },

  updateProfile: async (input) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await api.put<User>("/auth/me", input);
      set({ user: data, isLoading: false, error: null });
      return true;
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      set({
        error: error.response?.data?.message || "Не вдалося оновити профіль",
        isLoading: false,
      });
      return false;
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    set({ isLoading: true, error: null });

    try {
      await api.put("/auth/me/password", {
        currentPassword,
        newPassword,
      });
      set({ isLoading: false, error: null });
      return true;
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      set({
        error: error.response?.data?.message || "Не вдалося змінити пароль",
        isLoading: false,
      });
      return false;
    }
  },

  initializeAuth: async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      await useShopStore.getState().setActiveUser(null);
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
      await useShopStore.getState().setActiveUser(data.id);
      set({
        user: data,
        token,
        isLoading: false,
        isInitialized: true,
        error: null,
      });
    } catch {
      localStorage.removeItem("token");
      await useShopStore.getState().setActiveUser(null);
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
    void useShopStore.getState().setActiveUser(null);
    set({
      user: null,
      token: null,
      isLoading: false,
      error: null,
    });
  },
}));
