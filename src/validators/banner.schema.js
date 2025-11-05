import { z } from "zod";

export const uploadBannerSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: "Banner title cannot be empty" })
    .optional(),
  ctaLink: z
    .string()
    .trim()
    .url({ message: "CTA link must be a valid URL" })
    .optional(),
});
