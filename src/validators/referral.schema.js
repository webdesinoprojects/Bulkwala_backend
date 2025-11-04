import { z } from "zod";

// ✅ Admin: Create Referral Code
export const createReferralSchema = z.object({
  influencerId: z
    .string({ required_error: "Influencer ID is required" })
    .trim()
    .min(1, { message: "Influencer ID cannot be empty" }),
  code: z
    .string({ required_error: "Referral code is required" })
    .trim()
    .min(2, { message: "Referral code must be at least 2 characters long" }),
  discountPercent: z
    .number({ required_error: "Discount percent is required" })
    .min(1, { message: "Discount must be at least 1%" })
    .max(100, { message: "Discount cannot exceed 100%" })
    .default(10),
});

// ✅ User: Validate Referral during checkout
export const validateReferralSchema = z.object({
  code: z
    .string({ required_error: "Referral code is required" })
    .trim()
    .min(2, { message: "Invalid referral code" }),
  total: z
    .number({ required_error: "Cart total is required" })
    .min(1, { message: "Total must be greater than 0" }),
});
