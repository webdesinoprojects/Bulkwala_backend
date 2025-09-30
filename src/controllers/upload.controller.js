import imagekit from "../utils/imagekit.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { v4 as uuidv4 } from "uuid";

export const uploadSingleImage = async (req, res, next) => {
  try {
    if (!req.file) return next(new ApiError(400, "No file uploaded"));

    // convert buffer to base64 data url
    const base64 = req.file.buffer.toString("base64");
    const file = `data:${req.file.mimetype};base64,${base64}`;

    const filename = `${Date.now()}_${uuidv4()}_${req.file.originalname}`;

    const result = await imagekit.upload({
      file,
      fileName: filename,
      folder: "", // optional: set folder in ImageKit
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { url: result.url, fileId: result.fileId },
          "Upload successful"
        )
      );
  } catch (error) {
    next(new ApiError(500, error.message || "Upload failed"));
  }
};
export const uploadMultipleImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0)
      return next(new ApiError(400, "No files uploaded"));

    const uploads = await Promise.all(
      req.files.map(async (file) => {
        const base64 = file.buffer.toString("base64");
        const fileData = `data:${file.mimetype};base64,${base64}`;
        const filename = `${Date.now()}_${uuidv4()}_${file.originalname}`;

        const result = await imagekit.upload({
          file: fileData,
          fileName: filename,
          folder: "",
        });

        return {
          url: result.url,
          fileId: result.fileId,
          filePath: result.filePath,
        };
      })
    );

    return res
      .status(200)
      .json(new ApiResponse(200, { uploads }, "Uploads successful"));
  } catch (err) {
    next(new ApiError(500, err.message || "Multi upload failed"));
  }
};
