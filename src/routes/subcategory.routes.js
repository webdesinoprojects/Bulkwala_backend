import express from "express";
import {
  createSubCategory,
  deleteSubcategory,
  getSingleSubcategory,
  getSubcategories,
  restoreSubcategory,
  updateSubcategory,
} from "../controllers/subcategory.controller.js";
import { validateData } from "../middleware/validate.js";
import upload from "../middleware/multer.middleware.js";

import {
  isLoggedIn,
  isSeller,
  isAdminOrSeller,
  isAdmin,
} from "../middleware/auth.middleware.js";
import {
  createSubcategorySchema,
  updateSubcategorySchema,
} from "../validators/subcategory.schema.js";

const router = express.Router();

router.route("/").get(getSubcategories);
router.route("/:slug").get(getSingleSubcategory);
router
  .route("/")
  .post(
    isLoggedIn,
    isAdminOrSeller,
    upload.single("image"),
    validateData(createSubcategorySchema),
    createSubCategory
  );

router
  .route("/:slug")
  .delete(isLoggedIn, isAdminOrSeller, deleteSubcategory)
  .put(
    isLoggedIn,
    isAdminOrSeller,
    upload.single("image"),
    validateData(updateSubcategorySchema),
    updateSubcategory
  );

router.route("/:slug/restore").patch(isLoggedIn, isAdmin, restoreSubcategory);

export default router;
