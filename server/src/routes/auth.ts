import { Router } from "express";
import {
  changePassword,
  forgotPassword,
  getMe,
  login,
  register,
  resetPassword,
  updateMe,
} from "../controllers/authController";
import { protect } from "../middleware/auth";

// Створюємо окремий роутер для auth маршрутів
// В app.ts він буде підключений з префіксом /api/auth
const router = Router();

// POST /api/auth/register — публічний маршрут, доступний всім
router.post("/register", register);

// POST /api/auth/login — публічний маршрут, доступний всім
router.post("/login", login);

// POST /api/auth/forgot-password — генерує код і надсилає його на email через Mailtrap
router.post("/forgot-password", forgotPassword);

// POST /api/auth/reset-password — перевіряє код і встановлює новий пароль
router.post("/reset-password", resetPassword);

// GET /api/auth/me — захищений маршрут
// protect спочатку перевіряє токен, і тільки потім викликає getMe
router.get("/me", protect, getMe);

router.put("/me", protect, updateMe);

router.put("/me/password", protect, changePassword);

export default router;
