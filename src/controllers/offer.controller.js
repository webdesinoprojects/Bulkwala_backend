import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Offer from "../models/offer.model.js";

/** ----------------- ADMIN: Start 15-Min Flash Offer ----------------- */
export const startOffer = asyncHandler(async (req, res) => {
  const { discountPercent, maxDiscountAmount } = req.body;

  if (!discountPercent || !maxDiscountAmount) {
    throw new ApiError(
      400,
      "Both discount percent and max discount are required"
    );
  }

  const offer = await Offer.findOneAndUpdate(
    {},
    {
      isActive: true,
      discountPercent,
      maxDiscountAmount,
      startedAt: Date.now(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
    { upsert: true, new: true }
  );

  return res.json(new ApiResponse(200, offer, "Flash offer started"));
});

/** ----------------- USER: Get Active Offer ----------------- */
export const getActiveOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findOne({});
  if (!offer || !offer.isActive || offer.expiresAt < Date.now()) {
    if (offer) {
      offer.isActive = false;
      await offer.save();
    }
    return res.json(
      new ApiResponse(200, { isActive: false }, "No active offer")
    );
  }

  return res.json(new ApiResponse(200, offer, "Active offer"));
});

/** ----------------- ADMIN: Delete Offer ----------------- */
export const deleteOffer = asyncHandler(async (req, res) => {
  await Offer.deleteMany({});
  return res.json(new ApiResponse(200, {}, "Offer deleted successfully"));
});
