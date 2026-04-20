import { Router } from "express";
import {
  createProduct,
  getProducts,
  getProductById,
} from "../controllers/productController";
import { protect } from "../middleware/auth";

const router = Router();

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", protect, createProduct);

export default router;
