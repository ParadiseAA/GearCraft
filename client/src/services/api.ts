import axios from "axios";

// Базовий URL бекенду — всі запити йдуть сюди
const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api",
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
