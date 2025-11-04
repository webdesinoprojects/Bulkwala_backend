import asyncHandler from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Referral from "../models/Referral.model.js";

/** ----------------- ADMIN: Create Referral ----------------- */
export const createReferral = asyncHandler(async (req, res) => {
  const { influencerId, code, discountPercent } = req.body;

  if (!influencerId || !code)
    throw new ApiError(400, "Influencer and code are required");

  const existing = await Referral.findOne({ code });
  if (existing) throw new ApiError(400, "Referral code already exists");

  const referral = await Referral.create({
    influencer: influencerId,
    code,
    discountPercent,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, referral, "Referral created successfully"));
});

/** ----------------- USER: Validate Referral ----------------- */
export const validateReferral = asyncHandler(async (req, res) => {
  const { code, total } = req.body;
  const referral = await Referral.findOne({ code: code?.toUpperCase() });

  if (!referral) throw new ApiError(404, "Invalid referral code");
  const discount = (total * referral.discountPercent) / 100;

  return res.json(new ApiResponse(200, { discount }, "Referral valid"));
});

/** ----------------- ADMIN: Get All Referrals ----------------- */
export const getAllReferrals = asyncHandler(async (req, res) => {
  const referrals = await Referral.find().populate("influencer", "name email");
  return res.json(new ApiResponse(200, referrals, "All referrals fetched"));
});
