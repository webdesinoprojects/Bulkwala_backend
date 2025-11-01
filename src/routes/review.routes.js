import express from "express";
import {
  getProductReviews,
  deleteReview,
  addReview,
  updateReview,
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
    addReview
  )
  .get(getProductReviews);

router
  .route("/:productId/:reviewId")
  .patch(
    isLoggedIn,
    upload.fields([{ name: "images", maxCount: 5 }]),
    validateData(reviewSchema),
    updateReview
  )
  .delete(isLoggedIn, deleteReview);

export default router;
