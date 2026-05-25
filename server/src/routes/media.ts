import { Router } from "express";
import { uploadImage } from "../controllers/mediaController";
import { authorizeRoles, protect } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = Router();

router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  upload.single("image"),
  uploadImage,
);

router.post(
  "/upload",
  protect,
  authorizeRoles("admin"),
  upload.single("image"),
  uploadImage,
);

export default router;
