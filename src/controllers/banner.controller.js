import Banner from "../models/banner.model.js";
import imagekit from "../utils/imagekit.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { v4 as uuidv4 } from "uuid";

/** ----------------- ADMIN: Upload Banner Set (1–3 images) ----------------- */
export const uploadBanner = asyncHandler(async (req, res) => {
  const { title, ctaLink } = req.body;

  // Ensure at least one image is uploaded
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, "Please upload at least 1 banner image");
  }

  if (req.files.length > 3) {
    throw new ApiError(400, "A banner set can contain a maximum of 3 images");
  }

  // Upload all images to ImageKit
  const uploadedUrls = await Promise.all(
    req.files.map(async (file) => {
      const base64 = file.buffer.toString("base64");
      const fileData = `data:${file.mimetype};base64,${base64}`;
      const filename = `${Date.now()}_${uuidv4()}_${file.originalname}`;

      const result = await imagekit.upload({
        file: fileData,
        fileName: filename,
        folder: "banners",
      });

      return result.url;
    })
  );

  // Save in DB
  const banner = await Banner.create({
    title,
    images: uploadedUrls,
    ctaLink,
    isActive: true,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, banner, "Banner set uploaded successfully"));
});

/** ----------------- USER: Get Active Banners ----------------- */
export const getActiveBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find({ isActive: true }).sort({ createdAt: -1 });
  return res
    .status(200)
    .json(new ApiResponse(200, banners, "Active banners fetched"));
});

/** ----------------- ADMIN: Get All Banners ----------------- */
export const getAllBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find().sort({ createdAt: -1 });
  return res
    .status(200)
    .json(new ApiResponse(200, banners, "All banners fetched successfully"));
});

/** ----------------- ADMIN: Toggle Banner Active Status ----------------- */
export const toggleBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const banner = await Banner.findById(id);
  if (!banner) throw new ApiError(404, "Banner not found");

  banner.isActive = !banner.isActive; // toggle
  await banner.save();

  const message = banner.isActive
    ? "Banner activated successfully"
    : "Banner deactivated successfully";

  return res.status(200).json(new ApiResponse(200, banner, message));
});

/** ----------------- ADMIN: Hard Delete Banner ----------------- */
export const deleteBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find and remove the banner from the DB
  const banner = await Banner.findByIdAndDelete(id);

  if (!banner) throw new ApiError(404, "Banner not found");

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Banner deleted successfully"));
});
