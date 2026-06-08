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

// Окремий router групує всі маршрути, пов'язані з авторизацією.
// У server/src/app.ts він підключається з префіксом /api/auth.
const router = Router();

// Реєстрація нового користувача.
router.post("/register", register);

// Вхід користувача в систему.
router.post("/login", login);

// Створення коду для відновлення пароля та надсилання його на email.
router.post("/forgot-password", forgotPassword);

// Перевірка коду відновлення і встановлення нового пароля.
router.post("/reset-password", resetPassword);

// Отримання даних поточного користувача. Middleware protect спочатку перевіряє JWT-токен.
router.get("/me", protect, getMe);

// Оновлення профілю авторизованого користувача.
router.put("/me", protect, updateMe);

// Зміна пароля авторизованого користувача.
router.put("/me/password", protect, changePassword);

export default router;
