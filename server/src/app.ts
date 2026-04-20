import dns from "node:dns";
// Примусово використовуємо Google DNS замість DNS провайдера
// Потрібно для резолвингу SRV записів MongoDB Atlas
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import express from "express";
import cors from "cors"; // Дозволяє фронтенду на іншому порту робити запити до API
import dotenv from "dotenv"; // Завантажує змінні з .env файлу в process.env
import connectDB from "./config/db";
import authRoutes from "./routes/auth";
import productRoutes from "./routes/products";

// Завантажуємо .env до будь-яких звернень до process.env
dotenv.config();

const app = express();

// Дозволяємо запити тільки з адреси фронтенду (захист від CSRF)
app.use(cors({ origin: process.env.CLIENT_URL }));

// Дозволяємо Express читати JSON з тіла запиту (req.body)
app.use(express.json());

// Підключаємо auth маршрути з префіксом /api/auth
// Всі маршрути з auth.ts будуть доступні як /api/auth/register, /api/auth/login тощо
app.use("/api/auth", authRoutes);

// Тестовий маршрут для перевірки що сервер живий
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Сервер працює!" });
});

app.use("/api/products", productRoutes);

const PORT = process.env.PORT || 5000;

// Спочатку підключаємось до БД, і тільки після успішного підключення запускаємо сервер
// Це гарантує що сервер не прийме запити до того як БД готова
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Сервер запущено на порту ${PORT}`);
  });
};

start();
