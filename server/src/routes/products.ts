import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getAdminProducts,
  getProducts,
  getProductById,
  updateProduct,
} from "../controllers/productController";
import {
  createProductReview,
  deleteReview,
  getProductReviews,
} from "../controllers/reviewController";
import { authorizeRoles, protect } from "../middleware/auth";

const router = Router();

// Публічний список активних товарів для каталогу.
router.get("/", getProducts);

// Повний список товарів для адміністратора, зокрема неактивні позиції.
router.get("/admin/all", protect, authorizeRoles("admin"), getAdminProducts);

// Отримання та створення відгуків до конкретного товару.
router.get("/:id/reviews", getProductReviews);
router.post("/:id/reviews", protect, createProductReview);

// Видаляти відгуки може тільки адміністратор.
router.delete(
  "/:id/reviews/:reviewId",
  protect,
  authorizeRoles("admin"),
  deleteReview,
);

// Отримання одного товару за id.
router.get("/:id", getProductById);

// Створення, редагування та видалення товарів доступні тільки адміністратору.
router.post("/", protect, authorizeRoles("admin"), createProduct);
router.put("/:id", protect, authorizeRoles("admin"), updateProduct);
router.delete("/:id", protect, authorizeRoles("admin"), deleteProduct);

export default router;
