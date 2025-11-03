import Review from "../models/review.model.js";
import Product from "../models/product.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import imagekit from "../utils/imagekit.js";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";

// ✅ Helper: recalc product rating after any review change
const updateProductRating = async (productId) => {
  const objectId = new mongoose.Types.ObjectId(productId); // convert string to ObjectId

  const stats = await Review.aggregate([
    { $match: { product: objectId } },
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

//  Add or Update a Review
export const addReview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;
  const { rating, text } = req.body;

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  const existing = await Review.findOne({ product: productId, user: userId });
  if (existing) throw new ApiError(400, "You already reviewed this product");

  let uploadedImages = [];
  if (req.files?.images && req.files.images.length > 0) {
    const uploads = await Promise.all(
      req.files.images.map(async (file) => {
        const base64 = file.buffer.toString("base64");
        const fileData = `data:${file.mimetype};base64,${base64}`;
        const result = await imagekit.upload({
          file: fileData,
          fileName: `${Date.now()}_${uuidv4()}_${file.originalname}`,
          folder: "reviews/images",
        });
        return result.url;
      })
    );
    uploadedImages = uploads;
  }

  const review = await Review.create({
    product: productId,
    user: userId,
    rating,
    text,
    images: uploadedImages,
  });
  await updateProductRating(productId);
  const updatedProduct = await Product.findById(productId);
  const populatedReview = await review.populate("user", "name email");

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { review: populatedReview, product: updatedProduct },
        "Review added successfully"
      )
    );
});

// UPDATE an existing Review
export const updateReview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId, reviewId } = req.params;
  const { rating, text } = req.body;

  const review = await Review.findById(reviewId);
  if (!review) throw new ApiError(404, "Review not found");
  if (review.user.toString() !== userId.toString())
    throw new ApiError(403, "You can only edit your own review");

  let uploadedImages = [];
  if (req.files?.images && req.files.images.length > 0) {
    const uploads = await Promise.all(
      req.files.images.map(async (file) => {
        const base64 = file.buffer.toString("base64");
        const fileData = `data:${file.mimetype};base64,${base64}`;
        const result = await imagekit.upload({
          file: fileData,
          fileName: `${Date.now()}_${uuidv4()}_${file.originalname}`,
          folder: "reviews/images",
        });
        return result.url;
      })
    );
    uploadedImages = uploads;
  }

  review.rating = rating;
  review.text = text;
  if (uploadedImages.length > 0) review.images = uploadedImages;
  await review.save();

  await updateProductRating(productId);
  const updatedProduct = await Product.findById(productId);
  const populatedReview = await review.populate("user", "name email");

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { review: populatedReview, product: updatedProduct },
        "Review updated successfully"
      )
    );
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
