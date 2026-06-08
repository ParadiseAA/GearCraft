import { Router } from "express";
import {
  createOrder,
  deleteOrder,
  getAdminOrders,
  getMyOrders,
  updateOrderStatus,
} from "../controllers/orderController";
import { authorizeRoles, optionalAuth, protect } from "../middleware/auth";

const router = Router();

// Створити замовлення може і гість, і авторизований користувач.
router.post("/", optionalAuth, createOrder);

// Історія замовлень поточного користувача.
router.get("/my", protect, getMyOrders);

// Перегляд усіх замовлень доступний тільки адміністратору.
router.get("/admin/all", protect, authorizeRoles("admin"), getAdminOrders);

// Адміністратор може змінювати статус і видаляти замовлення.
router.put("/:id/status", protect, authorizeRoles("admin"), updateOrderStatus);
router.delete("/:id", protect, authorizeRoles("admin"), deleteOrder);

export default router;
