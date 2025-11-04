import express from "express";
import {
  uploadBanner,
  getActiveBanners,
  deactivateBanner,
} from "../controllers/banner.controller.js";
import { validateData } from "../middleware/validate.js";
import { isLoggedIn, isAdmin } from "../middleware/auth.middleware.js";
import { uploadBannerSchema } from "../validators/banner.Schema.js";

const router = express.Router();

// 🖼️ Admin: Upload New Banner
router
  .route("/")
  .post(isLoggedIn, isAdmin, validateData(uploadBannerSchema), uploadBanner);

// 🏠 User: Get All Active Banners for Home Page
router.route("/active").get(getActiveBanners);

// 🚫 Admin: Deactivate Banner
router.route("/:id/deactivate").put(isLoggedIn, isAdmin, deactivateBanner);

export default router;
