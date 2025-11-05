import express from "express";
import { startOffer, getActiveOffer } from "../controllers/offer.controller.js";
import { validateData } from "../middleware/validate.js";
import { isLoggedIn, isAdmin } from "../middleware/auth.middleware.js";
import { startOfferSchema } from "../validators/offer.schema.js";

const router = express.Router();

// ⚡ Admin: Start Flash Offer (15 Min)
router
  .route("/")
  .post(isLoggedIn, isAdmin, validateData(startOfferSchema), startOffer);

// 🔥 User: Get Active Offer
router.route("/active").get(getActiveOffer);

export default router;
