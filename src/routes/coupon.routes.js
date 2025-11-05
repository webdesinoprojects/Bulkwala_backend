import express from "express";
import {
  createCoupon,
  deleteCoupon,
  getAllCoupons,
} from "../controllers/coupon.controller.js";
import { validateData } from "../middleware/validate.js";
import { isLoggedIn, isAdmin } from "../middleware/auth.middleware.js";
import { createCouponSchema } from "../validators/coupon.schema.js";

const router = express.Router();

router
  .route("/")
  .post(isLoggedIn, isAdmin, validateData(createCouponSchema), createCoupon)
  .get(isLoggedIn, isAdmin, getAllCoupons);
router.route("/:couponId").delete(isLoggedIn, isAdmin, deleteCoupon);
export default router;
