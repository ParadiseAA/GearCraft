import { Router } from "express";
import {
  clearMyCart,
  getMyShopState,
  setMyCartItem,
  syncMyShopState,
  toggleMyFavorite,
} from "../controllers/shopController";
import { protect } from "../middleware/auth";

const router = Router();

router.get("/", protect, getMyShopState);
router.post("/sync", protect, syncMyShopState);
router.post("/favorites/:productId/toggle", protect, toggleMyFavorite);
router.put("/cart/:productId", protect, setMyCartItem);
router.delete("/cart", protect, clearMyCart);

export default router;
