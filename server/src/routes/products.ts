import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getAdminProducts,
  getProducts,
  getProductById,
  updateProduct,
} from "../controllers/productController";
import { authorizeRoles, protect } from "../middleware/auth";

const router = Router();

router.get("/", getProducts);
router.get("/admin/all", protect, authorizeRoles("admin"), getAdminProducts);
router.get("/:id", getProductById);
router.post("/", protect, authorizeRoles("admin"), createProduct);
router.put("/:id", protect, authorizeRoles("admin"), updateProduct);
router.delete("/:id", protect, authorizeRoles("admin"), deleteProduct);

export default router;
