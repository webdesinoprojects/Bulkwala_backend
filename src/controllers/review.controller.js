import Review from "../models/review.model.js";
import Product from "../models/product.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import imagekit from "../utils/imagekit.js";
import { v4 as uuidv4 } from "uuid";

// ✅ Helper: recalc product rating after any review change
const updateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: "$product",
        avgRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  await Product.findByIdAndUpdate(productId, {
    averageRating: stats[0]?.avgRating || 0,
    totalReviews: stats[0]?.totalReviews || 0,
  });
};

// ✅ Add or Update a Review
export const addOrUpdateReview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;
  const { rating, text } = req.body;

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  let uploadedImages = [];

  // 🔹 Upload review images to ImageKit
  if (req.files?.images && req.files.images.length > 0) {
    const uploads = await Promise.all(
      req.files.images.map(async (file) => {
        const base64 = file.buffer.toString("base64");
        const fileData = `data:${file.mimetype};base64,${base64}`;
        const fileName = `${Date.now()}_${uuidv4()}_${file.originalname}`;

        const result = await imagekit.upload({
          file: fileData,
          fileName,
          folder: "reviews/images",
        });

        return result.url;
      })
    );
    uploadedImages = uploads;
  }

  try {
    // 🔹 Find existing review
    let review = await Review.findOne({ product: productId, user: userId });

    if (review) {
      // ✅ Update existing review
      review.rating = rating;
      review.text = text;
      if (uploadedImages.length > 0) review.images = uploadedImages;
      await review.save();
    } else {
      // ✅ Create new review
      review = await Review.create({
        product: productId,
        user: userId,
        rating,
        text,
        images: uploadedImages,
      });
    }

    // ✅ Populate user details
    const populatedReview = await review.populate("user", "name email");

    // ✅ Update product rating stats
    await updateProductRating(productId);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          populatedReview,
          review.isNew
            ? "Review added successfully"
            : "Review updated successfully"
        )
      );
  } catch (error) {
    // 🔹 Duplicate review (E11000 index violation)
    if (error.code === 11000) {
      throw new ApiError(
        400,
        "You’ve already reviewed this product. You can update your existing review."
      );
    }

    // 🔹 Other errors
    console.error("❌ Review error:", error);
    throw new ApiError(500, "Failed to submit review");
  }
});

// ✅ Get all reviews for a product
export const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const reviews = await Review.find({ product: productId })
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(200, reviews, "Product reviews fetched successfully")
    );
});

// ✅ Delete a review
export const deleteReview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId, reviewId } = req.params;

  const review = await Review.findById(reviewId);
  if (!review) throw new ApiError(404, "Review not found");

  if (
    req.user.role !== "admin" &&
    review.user.toString() !== userId.toString()
  ) {
    throw new ApiError(403, "You can only delete your own review");
  }

  await Review.findByIdAndDelete(reviewId);
  await updateProductRating(productId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Review deleted successfully"));
});
