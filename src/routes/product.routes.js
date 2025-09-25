import express from "express";
import {
  createProduct,
  getProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
} from "../controllers/product.controller.js";

import {
  isLoggedIn,
  isSeller,
  isAdmin,
} from "../middleware/auth.middleware.js";
import { validateData } from "../middleware/validate.js";
import {
  createProductSchema,
  updateProductSchema,
} from "../validators/product.schema.js";

const router = express.Router();

router.route("/").get(getProducts);

router.route("/:slug").get(getSingleProduct);

router
  .route("/")
  .post(isLoggedIn, isSeller, validateData(createProductSchema), createProduct);

router
  .route("/:slug")
  .put(isLoggedIn, isSeller, validateData(updateProductSchema), updateProduct);

router.route("/:slug").delete(isLoggedIn, isSeller, deleteProduct);

router.route("/:slug/restore").patch(isLoggedIn, isAdmin, restoreProduct);

export default router;
