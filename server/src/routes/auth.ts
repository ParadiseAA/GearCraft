import { Router } from "express";
import { register, login, getMe } from "../controllers/authController";
import { protect } from "../middleware/auth";

// Створюємо окремий роутер для auth маршрутів
// В app.ts він буде підключений з префіксом /api/auth
const router = Router();

// POST /api/auth/register — публічний маршрут, доступний всім
router.post("/register", register);

// POST /api/auth/login — публічний маршрут, доступний всім
router.post("/login", login);

// GET /api/auth/me — захищений маршрут
// protect спочатку перевіряє токен, і тільки потім викликає getMe
router.get("/me", protect, getMe);

export default router;
