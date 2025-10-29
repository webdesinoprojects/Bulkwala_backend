import Wishlist from "../models/wishlist.model.js";
import Product from "../models/product.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// ✅ Add product to wishlist
export const addToWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.body;

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  let wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, products: [productId] });
  } else {
    // Toggle behavior: if already added, remove; else add
    const index = wishlist.products.findIndex(
      (p) => p.toString() === productId
    );
    if (index > -1) {
      wishlist.products.splice(index, 1); // remove if exists
    } else {
      wishlist.products.push(productId);
    }
    await wishlist.save();
  }
  await wishlist.populate("products", "title price images slug");

  return res
    .status(200)
    .json(new ApiResponse(200, wishlist, "Wishlist updated successfully"));
});

// ✅ Get user wishlist
export const getWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const wishlist = await Wishlist.findOne({ user: userId })
    .populate("products", "title price images slug")
    .lean();

  if (!wishlist || wishlist.products.length === 0)
    return res
      .status(200)
      .json(new ApiResponse(200, { products: [] }, "Wishlist is empty"));

  return res
    .status(200)
    .json(new ApiResponse(200, wishlist, "Wishlist fetched successfully"));
});

// ✅ Remove specific product
export const removeFromWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;

  const wishlist = await Wishlist.findOneAndUpdate(
    { user: userId },
    { $pull: { products: productId } },
    { new: true }
  ).populate("products", "title price images slug");

  return res
    .status(200)
    .json(new ApiResponse(200, wishlist, "Product removed from wishlist"));
});

// ✅ Clear entire wishlist
export const clearWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  await Wishlist.findOneAndUpdate(
    { user: userId },
    { $set: { products: [] } },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Wishlist cleared successfully"));
});
