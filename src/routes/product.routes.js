import express from "express";
import {
  createProduct,
  getProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
} from "../controllers/product.controller.js";

import upload from "../middleware/multer.middleware.js";
import {
  isLoggedIn,
  isAdmin,
  isAdminOrSeller,
} from "../middleware/auth.middleware.js";
import { validateData } from "../middleware/validate.js";
import {
  createProductSchema,
  updateProductSchema,
} from "../validators/product.schema.js";

const router = express.Router();

router.route("/").get(getProducts);

router.route("/:slug").get(getSingleProduct);

router.route("/").post(
  isLoggedIn,
  isAdminOrSeller,
  upload.fields([
    { name: "images", maxCount: 6 },
    { name: "video", maxCount: 1 },
  ]),
  validateData(createProductSchema),
  createProduct
);
router.route("/:slug").put(
  isLoggedIn,
  isAdminOrSeller,
  upload.fields([
    { name: "images", maxCount: 6 },
    { name: "video", maxCount: 1 },
  ]),
  validateData(updateProductSchema),
  updateProduct
);

router.route("/:slug").delete(isLoggedIn, isAdminOrSeller, deleteProduct);

router.route("/:slug/restore").patch(isLoggedIn, isAdmin, restoreProduct);

export default router;
