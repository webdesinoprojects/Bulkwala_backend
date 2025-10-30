import express from "express";
import {
  addOrUpdateReview,
  getProductReviews,
  deleteReview,
} from "../controllers/review.controller.js";
import { isLoggedIn } from "../middleware/auth.middleware.js";
import { validateData } from "../middleware/validate.js";
import { reviewSchema } from "../validators/review.schema.js";
import upload from "../middleware/multer.middleware.js";

const router = express.Router();

router
  .route("/:productId")
  .post(
    isLoggedIn,
    upload.fields([{ name: "images", maxCount: 5 }]),
    validateData(reviewSchema),
    addOrUpdateReview
  )
  .get(getProductReviews);

router.route("/:productId/:reviewId").delete(isLoggedIn, deleteReview);

export default router;
