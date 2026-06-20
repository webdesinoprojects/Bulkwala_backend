import express from "express";
import {
  uploadBanner,
  getActiveBanners,
  getAllBanners,
  toggleBanner,
  deleteBanner,
  updateBannerPriorities,
} from "../controllers/banner.controller.js";

import { isLoggedIn, isAdmin } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";

const router = express.Router();

router.get("/", getAllBanners);
router.get("/active", getActiveBanners);

router.post(
  "/",
  isLoggedIn,
  isAdmin,
  upload.array("images", 3),
  uploadBanner
);

router.patch("/:id/toggle", isLoggedIn, isAdmin, toggleBanner);
router.patch("/priorities", isLoggedIn, isAdmin, updateBannerPriorities);
router.delete("/:id", isLoggedIn, isAdmin, deleteBanner);

export default router;