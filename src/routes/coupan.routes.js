import express from "express";
import {
  createCoupon,
  getAllCoupons,
  validateCoupon,
} from "../controllers/coupan.controller.js";
import { validateData } from "../middleware/validate.js";
import { isLoggedIn, isAdmin } from "../middleware/auth.middleware.js";
import {
  createCouponSchema,
  validateCouponSchema,
} from "../validators/coupan.schema.js";

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
