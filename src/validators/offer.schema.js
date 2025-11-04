import { z } from "zod";

// ✅ Admin: Start 15-Min Flash Offer
export const startOfferSchema = z.object({
  discountPercent: z
    .number({ required_error: "Discount percent is required" })
    .min(1, { message: "Discount must be at least 1%" })
    .max(100, { message: "Discount cannot exceed 100%" }),
});
