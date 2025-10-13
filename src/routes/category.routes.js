import express from "express";
import {
  createCategory,
  getCategories,
  getSingleCategory,
  deleteCategory,
  updateCategory,
  restoreCategory,
} from "../controllers/category.controller.js";
import { isAdmin, isLoggedIn } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validators/category.schema.js";
import { validateData } from "../middleware/validate.js";

const router = express.Router();

router
  .route("/")
  .post(
    isLoggedIn,
    isAdmin,
    upload.fields([
      { name: "image", maxCount: 1 }, // main category image
      { name: "banner", maxCount: 3 }, // allow up to 3 banners
    ]),
    validateData(createCategorySchema),
    createCategory
  )
  .get(getCategories);

router
  .route("/:slug")
  .put(
    isLoggedIn,
    isAdmin,
    upload.fields([
      { name: "image", maxCount: 1 },
      { name: "banner", maxCount: 3 },
    ]),
    validateData(updateCategorySchema),
    updateCategory
  )
  .delete(isLoggedIn, isAdmin, deleteCategory);

router.route("/:slug/restore").post(isLoggedIn, isAdmin, restoreCategory);
export default router;
