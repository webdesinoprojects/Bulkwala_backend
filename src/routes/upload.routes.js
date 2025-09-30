import express from "express";
import upload from "../middleware/multer.middleware.js";
import {
  uploadSingleImage,
  uploadMultipleImages,
} from "../controllers/upload.controller.js";
import { isLoggedIn, isAdminOrSeller } from "../middleware/auth.middleware.js";

const router = express.Router();

// single: fieldname 'image'
router.post(
  "/upload",
  isLoggedIn,
  isAdminOrSeller,
  upload.single("image"),
  uploadSingleImage
);

// multiple: fieldname 'images'
router.post(
  "/upload/multiple",
  isLoggedIn,
  isAdminOrSeller,
  upload.array("images", 6),
  uploadMultipleImages
);

export default router;
