import axios from "axios";

// Базова адреса API береться з .env, а для локального запуску використовується localhost.
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

// Окремий екземпляр Axios потрібен, щоб усі запити мали спільні налаштування.
const axiosInstance = axios.create({
  baseURL: API_URL,
});

// Interceptor автоматично додає JWT-токен до кожного запиту авторизованого користувача.
// Завдяки цьому не потрібно вручну прописувати заголовок Authorization у кожному файлі.
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
export { axiosInstance };
