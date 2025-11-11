import express from "express";
import {
  createReferral,
  deleteReferral,
  getAllReferrals,
} from "../controllers/referral.controller.js";
import { validateData } from "../middleware/validate.js";
import { isLoggedIn, isAdmin } from "../middleware/auth.middleware.js";
import { createReferralSchema } from "../validators/referral.schema.js";

const router = express.Router();

// 🎯 Admin: Create & Get Referrals
router
  .route("/")
  .post(isLoggedIn, isAdmin, validateData(createReferralSchema), createReferral)
  .get(isLoggedIn, isAdmin, getAllReferrals);
router.route("/:referralId").delete(isLoggedIn, isAdmin, deleteReferral);

export default router;
