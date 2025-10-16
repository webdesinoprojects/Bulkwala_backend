import express from "express";
import {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItem,
  clearCart,
} from "../controllers/cart.controller.js";
import { isLoggedIn } from "../middleware/auth.middleware.js";
import { validateData } from "../middleware/validate.js";
import {
  addToCartSchema,
  updateCartItemSchema,
} from "../validators/cart.schema.js";

const router = express.Router();
router.route("/").post(isLoggedIn, validateData(addToCartSchema), addToCart);
router.route("/clear-cart").delete(isLoggedIn, clearCart);
router.route("/").get(isLoggedIn, getCart);
router.route("/remove").delete(isLoggedIn, removeFromCart);
router
  .route("/")
  .put(isLoggedIn, validateData(updateCartItemSchema), updateCartItem);

export default router;
