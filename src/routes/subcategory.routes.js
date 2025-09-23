import express from "express";
import {
  createSubCategory,
  deleteSubcategory,
  getSingleSubcategory,
  getSubcategories,
  restoreSubcategory,
  updateSubcategory,
} from "../controllers/subcategory.controller.js";
import validateData from "../middleware/validate.js";
import createSubCategorySchema, {
  deleteSubcategorySchema,
  updateSubcategorySchema,
} from "../validators/subcategory.schema.js";

import { isLoggedIn, isSeller, isAdmin } from "../middleware/auth.middlware.js";

const router = express.Router();

router.route("/").get(getSubcategories);
router.route("/:slug").get(getSingleSubcategory);
router
  .route("/")
  .post(
    isLoggedIn,
    isSeller,
    validateData(createSubCategorySchema),
    createSubCategory
  );

router
  .route(":/slug")
  .delete(
    isLoggedIn,
    isSeller,
    validateData(deleteSubcategorySchema),
    deleteSubcategory
  )
  .put(
    isLoggedIn,
    isSeller,
    validateData(updateSubcategorySchema),
    updateSubcategory
  );

router.route("/:slug/restore").patch(isLoggedIn, isAdmin, restoreSubcategory);

export default router;
