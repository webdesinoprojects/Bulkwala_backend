import express from "express";
import {
  uploadBanner,
  getActiveBanners,
  toggleBanner,
  getAllBanners,
  deleteBanner,
} from "../controllers/banner.controller.js";
import { validateData } from "../middleware/validate.js";
import { isLoggedIn, isAdmin } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";
import { uploadBannerSchema } from "../validators/banner.schema.js";

const router = express.Router();

router
  .route("/")
  .post(
    isLoggedIn,
    isAdmin,
    upload.array("images", 3),
    validateData(uploadBannerSchema),
    uploadBanner
  );

router.route("/active").get(getActiveBanners);
router.route("/:id").put(isLoggedIn, isAdmin, toggleBanner);
router.route("/").get(isLoggedIn, isAdmin, getAllBanners);
router.route("/:id").delete(isLoggedIn, isAdmin, deleteBanner);

export default router;
