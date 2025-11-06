import express from "express";
import {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItem,
  clearCart,
  removeCoupon,
  applyCoupon,
  applyReferral,
  removeReferral,
} from "../controllers/cart.controller.js";
import { isLoggedIn } from "../middleware/auth.middleware.js";
import { validateData } from "../middleware/validate.js";
import {
  addToCartSchema,
  updateCartItemSchema,
} from "../validators/cart.schema.js";
import { validateCouponSchema } from "../validators/coupon.schema.js";
import { validateReferralSchema } from "../validators/referral.schema.js";

const router = express.Router();
router.route("/").post(isLoggedIn, validateData(addToCartSchema), addToCart);
router.route("/clear-cart").delete(isLoggedIn, clearCart);
router.route("/").get(isLoggedIn, getCart);
router.route("/remove/:productId").delete(isLoggedIn, removeFromCart);
router
  .route("/")
  .put(isLoggedIn, validateData(updateCartItemSchema), updateCartItem);

router
  .route("/apply-coupon")
  .post(isLoggedIn, validateData(validateCouponSchema), applyCoupon);

router.route("/remove-coupon").post(isLoggedIn, removeCoupon);
router
  .route("/apply-referral")
  .post(isLoggedIn, validateData(validateReferralSchema), applyReferral);
router.route("/remove-referral").post(isLoggedIn, removeReferral);
export default router;
