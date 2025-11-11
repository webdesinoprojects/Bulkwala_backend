import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Coupon from "../models/coupon.model.js";

export const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    discountType,
    discountValue,
    expiryDate,
    minOrderValue,
    usageLimit,
  } = req.body;

  const existing = await Coupon.findOne({ code });
  if (existing) throw new ApiError(400, "Coupon already exists");

  const coupon = await Coupon.create({
    code,
    discountType,
    discountValue,
    expiryDate,
    minOrderValue,
    usageLimit,
    createdBy: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, coupon, "Coupon created successfully"));
});

export const getAllCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find()
    .populate("usedBy", "name email")
    .sort({ createdAt: -1 });

  return res.json(
    new ApiResponse(200, coupons, "All coupons fetched with usage stats")
  );
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const { couponId } = req.params;

  const coupon = await Coupon.findByIdAndDelete(couponId);
  if (!coupon) throw new ApiError(400, "Coupon not found");

  return res
    .status(200)
    .json(new ApiResponse(200, coupon, "Coupon deleted successfully"));
});
