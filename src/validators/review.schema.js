import { z } from "zod";

export const reviewSchema = z.object({
  rating: z.preprocess(
    (val) => Number(val),
    z
      .number({
        required_error: "Rating is required",
        invalid_type_error: "Rating must be a number between 1 and 5",
      })
      .min(1, "Rating must be at least 1")
      .max(5, "Rating cannot exceed 5")
  ),

  text: z
    .string({
      required_error: "Review text is required",
    })
    .trim()
    .min(3, "Review must be at least 3 characters")
    .max(500, "Review cannot exceed 500 characters")
    .optional(),

  // ✅ No strict validation for images because they are uploaded via multer
  images: z.any().optional(),
});
