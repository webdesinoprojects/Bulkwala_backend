import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Referral from "../models/referral.model.js";
import User from "../models/user.model.js";

/** ----------------- ADMIN: Create Referral ----------------- */
export const createReferral = asyncHandler(async (req, res) => {
  const { influencerEmail, code, discountPercent } = req.body;

  // ✅ Check influencer by email
  const influencer = await User.findOne({
    email: influencerEmail.toLowerCase(),
  });
  if (!influencer) throw new ApiError(404, "Influencer not found");

  const existing = await Referral.findOne({ code: code.toUpperCase() });
  if (existing) throw new ApiError(400, "Referral code already exists");

  const referral = await Referral.create({
    influencer: influencer._id,
    code: code.toUpperCase(),
    discountPercent,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, referral, "Referral created successfully"));
});

/** ----------------- ADMIN: Get All Referrals ----------------- */
export const getAllReferrals = asyncHandler(async (req, res) => {
  const referrals = await Referral.find()
    .populate("influencer", "name email")
    .populate("usedBy", "name email")
    .sort({ createdAt: -1 });

  return res.json(
    new ApiResponse(200, referrals, "All referrals fetched with usage stats")
  );
});

/** ----------------- ADMIN: Delete Referral ----------------- */
export const deleteReferral = asyncHandler(async (req, res) => {
  const { referralId } = req.params;

  const referral = await Referral.findByIdAndDelete(referralId);
  if (!referral) throw new ApiError(404, "Referral not found");

  return res
    .status(200)
    .json(new ApiResponse(200, referral, "Referral deleted successfully"));
});
