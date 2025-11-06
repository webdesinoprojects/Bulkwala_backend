import { z } from "zod";

export const createReferralSchema = z.object({
  influencerEmail: z
    .string({ required_error: "Influencer email is required" })
    .email({ message: "Please enter a valid email address" }),
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
  referralCode: z
    .string({ required_error: "Referral code is required" })
    .trim()
    .min(2, { message: "Invalid referral code" }),
});
