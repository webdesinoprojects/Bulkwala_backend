import asyncHandler from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Banner from "../models/Banner.model.js";

/** ----------------- ADMIN: Upload Banner ----------------- */
export const uploadBanner = asyncHandler(async (req, res) => {
  const { title, image_url, ctaLink } = req.body;
  if (!image_url) throw new ApiError(400, "Image URL is required");

  const banner = await Banner.create({
    title,
    image_url,
    ctaLink,
    uploadedBy: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, banner, "Banner uploaded"));
});

/** ----------------- USER: Get Active Banners ----------------- */
export const getActiveBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find({ isActive: true }).sort({ createdAt: -1 });
  return res.json(new ApiResponse(200, banners, "Active banners"));
});

/** ----------------- ADMIN: Deactivate Banner ----------------- */
export const deactivateBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const banner = await Banner.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
  if (!banner) throw new ApiError(404, "Banner not found");

  return res.json(new ApiResponse(200, banner, "Banner deactivated"));
});
