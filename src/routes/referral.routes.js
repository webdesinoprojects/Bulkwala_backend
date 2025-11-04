import express from "express";
import {
  createReferral,
  getAllReferrals,
  validateReferral,
} from "../controllers/referral.controller.js";
import { validateData } from "../middleware/validate.js";
import { isLoggedIn, isAdmin } from "../middleware/auth.middleware.js";
import {
  createReferralSchema,
  validateReferralSchema,
} from "../validators/referral.Schema.js";

const router = express.Router();

// 🎯 Admin: Create & Get Referrals
router
  .route("/")
  .post(isLoggedIn, isAdmin, validateData(createReferralSchema), createReferral)
  .get(isLoggedIn, isAdmin, getAllReferrals);

// 👥 User: Validate Referral Code During Checkout
router
  .route("/validate")
  .post(validateData(validateReferralSchema), validateReferral);

export default router;
