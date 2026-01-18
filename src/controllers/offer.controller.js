import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Offer from "../models/offer.model.js";

/** ----------------- ADMIN: Start Custom Duration Offer ----------------- */
export const startOffer = asyncHandler(async (req, res) => {
  const { discountPercent, maxDiscountAmount, startDateTime, endDateTime } = req.body;

  if (!discountPercent || !maxDiscountAmount || !startDateTime || !endDateTime) {
    throw new ApiError(
      400,
      "Discount percent, max discount, start date/time, and end date/time are required"
    );
  }

  const startDate = new Date(startDateTime);
  const endDate = new Date(endDateTime);

  // Validate dates
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new ApiError(400, "Invalid date format");
  }

  if (endDate <= startDate) {
    throw new ApiError(400, "End date/time must be after start date/time");
  }

  const offer = await Offer.findOneAndUpdate(
    {},
    {
      isActive: true,
      discountPercent,
      maxDiscountAmount,
      startedAt: startDate,
      expiresAt: endDate,
    },
    { upsert: true, new: true }
  );

  return res.json(new ApiResponse(200, offer, "Offer started successfully"));
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
