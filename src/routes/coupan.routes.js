import express from "express";
import {
  createCoupon,
  getAllCoupons,
  validateCoupon,
} from "../controllers/coupon.controller.js";
import { validateData } from "../middleware/validate.js";
import { isLoggedIn, isAdmin } from "../middleware/auth.middleware.js";
import {
  createCouponSchema,
  validateCouponSchema,
} from "../validators/coupon.Schema.js";

const router = express.Router();

// 🧾 Admin: Create & Get Coupons
router
  .route("/")
  .post(isLoggedIn, isAdmin, validateData(createCouponSchema), createCoupon)
  .get(isLoggedIn, isAdmin, getAllCoupons);

// ✅ User: Validate Coupon During Checkout
router
  .route("/validate")
  .post(validateData(validateCouponSchema), validateCoupon);

export default router;
