import express from "express";
import {
  createCategory,
  getCategories,
  getSingleCategory,
  deleteCategory,
  updateCategory,
  restoreCategory,
} from "../controllers/category.controller.js";

const router = express.Router();

router.route("/").post(isLoggedIn, isAdmin, createCategory).get(getCategories);

router
  .route("/:slug")
  .get(getSingleCategory)
  .put(isLoggedIn, isAdmin, updateCategory)
  .delete(isLoggedIn, isAdmin, deleteCategory);

router.route("/:slug/restore").post(isLoggedIn, isAdmin, restoreCategory);
export default router;
