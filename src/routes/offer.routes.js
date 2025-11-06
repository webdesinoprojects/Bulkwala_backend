import express from "express";
import {
  startOffer,
  getActiveOffer,
  deleteOffer,
} from "../controllers/offer.controller.js";
import { validateData } from "../middleware/validate.js";
import { isLoggedIn, isAdmin } from "../middleware/auth.middleware.js";
import { startOfferSchema } from "../validators/offer.schema.js";

const router = express.Router();

router
  .route("/")
  .post(isLoggedIn, isAdmin, validateData(startOfferSchema), startOffer)
  .delete(isLoggedIn, isAdmin, deleteOffer);

router.route("/active").get(getActiveOffer);

export default router;
