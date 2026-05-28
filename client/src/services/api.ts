import axios from "axios";

// URL бекенду береться з .env, а для локальної розробки є запасний localhost.
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL: API_URL,
});

// Interceptor — автоматично додає токен до кожного запиту
// Не потрібно вручну писати headers в кожному запиті
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
export { axiosInstance };
