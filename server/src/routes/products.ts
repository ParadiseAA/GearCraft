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

router.get("/", getProducts);
router.get("/admin/all", protect, authorizeRoles("admin"), getAdminProducts);
router.get("/:id/reviews", getProductReviews);
router.post("/:id/reviews", protect, createProductReview);
router.delete(
  "/:id/reviews/:reviewId",
  protect,
  authorizeRoles("admin"),
  deleteReview,
);
router.get("/:id", getProductById);
router.post("/", protect, authorizeRoles("admin"), createProduct);
router.put("/:id", protect, authorizeRoles("admin"), updateProduct);
router.delete("/:id", protect, authorizeRoles("admin"), deleteProduct);

export default router;
