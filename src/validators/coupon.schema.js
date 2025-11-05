import { z } from "zod";

// ✅ Admin: Create Coupon
export const createCouponSchema = z.object({
  code: z
    .string({ required_error: "Coupon code is required" })
    .trim()
    .min(2, { message: "Coupon code must be at least 2 characters long" }),
  discountType: z
    .enum(["percentage", "flat"], {
      required_error: "Discount type is required",
      invalid_type_error: "Discount type must be either 'percentage' or 'flat'", // This matches frontend schema
    })
    .default("percentage"),
  discountValue: z
    .number({ required_error: "Discount value is required" })
    .min(1, { message: "Discount must be greater than 0" }),
  expiryDate: z
    .string({ required_error: "Expiry date is required" })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format", // Make sure to check if this message matches your front-end expectation
    }),
  minOrderValue: z
    .number()
    .min(0, { message: "Minimum order value cannot be negative" })
    .optional(),
  usageLimit: z
    .number()
    .min(1, { message: "Usage limit must be at least 1" })
    .optional(),
});

// ✅ User: Validate Coupon during checkout
export const validateCouponSchema = z.object({
  couponCode: z
    .string({ required_error: "Coupon code is required" })
    .trim()
    .min(2, { message: "Invalid coupon code" }),
});
