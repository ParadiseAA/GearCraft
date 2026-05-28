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

router.post("/", optionalAuth, createOrder);
router.get("/my", protect, getMyOrders);
router.get("/admin/all", protect, authorizeRoles("admin"), getAdminOrders);
router.put("/:id/status", protect, authorizeRoles("admin"), updateOrderStatus);
router.delete("/:id", protect, authorizeRoles("admin"), deleteOrder);

export default router;
