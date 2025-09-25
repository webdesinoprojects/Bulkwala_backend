import express from "express";
import {
  createSubCategory,
  deleteSubcategory,
  getSingleSubcategory,
  getSubcategories,
  restoreSubcategory,
  updateSubcategory,
} from "../controllers/subcategory.controller.js";
import {validateData} from "../middleware/validate.js";

import {
  isLoggedIn,
  isSeller,
  isAdmin,
} from "../middleware/auth.middleware.js";
import {
  createSubcategorySchema,
  deleteSubcategorySchema,
  updateSubcategorySchema,
} from "../validators/subcategory.schema.js";

const router = express.Router();

router.route("/").get(getSubcategories);
router.route("/:slug").get(getSingleSubcategory);
router
  .route("/")
  .post(
    isLoggedIn,
    isSeller,
    validateData(createSubcategorySchema),
    createSubCategory
  );

router
  .route("/:slug")
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
