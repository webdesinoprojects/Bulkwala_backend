import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Coupon from "../models/coupan.model.js";

export const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    discountType,
    discountValue,
    expiryDate,
    minOrderValue,
    usageLimit,
  } = req.body;

  if (!code || !discountValue || !expiryDate)
    throw new ApiError(400, "Code, discountValue and expiryDate are required");

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

/** ----------------- USER: Validate Coupon ----------------- */
export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, total } = req.body;
  const coupon = await Coupon.findOne({ code: code?.toUpperCase() });
  if (!coupon) throw new ApiError(404, "Invalid coupon code");
  if (coupon.expiryDate < Date.now()) throw new ApiError(400, "Coupon expired");
  if (coupon.usedCount >= coupon.usageLimit)
    throw new ApiError(400, "Coupon usage limit reached");
  if (total < coupon.minOrderValue)
    throw new ApiError(
      400,
      `Minimum order value ₹${coupon.minOrderValue} required`
    );

  const discount =
    coupon.discountType === "percentage"
      ? (total * coupon.discountValue) / 100
      : coupon.discountValue;

  return res.json(
    new ApiResponse(
      200,
      { discount, type: coupon.discountType },
      "Coupon valid"
    )
  );
});

/** ----------------- ADMIN: Get All Coupons ----------------- */
export const getAllCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  return res.json(new ApiResponse(200, coupons, "All coupons fetched"));
});
