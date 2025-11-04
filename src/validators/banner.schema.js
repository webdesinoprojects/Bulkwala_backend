import { z } from "zod";

// ✅ Admin: Upload Banner
export const uploadBannerSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: "Banner title cannot be empty" })
    .optional(),
  image_url: z
    .string({ required_error: "Banner image URL is required" })
    .trim()
    .min(5, { message: "Please provide a valid image URL" }),
  ctaLink: z
    .string()
    .trim()
    .url({ message: "CTA link must be a valid URL" })
    .optional(),
});
