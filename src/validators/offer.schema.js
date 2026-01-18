import { z } from "zod";

// ✅ Admin: Start Custom Duration Offer
export const startOfferSchema = z.object({
  discountPercent: z
    .number({ required_error: "Discount percent is required" })
    .min(1, { message: "Discount must be at least 1%" })
    .max(100, { message: "Discount cannot exceed 100%" }),

  maxDiscountAmount: z
    .number({ required_error: "Maximum discount amount is required" })
    .min(1, { message: "Must be at least ₹1" })
    .max(100000, { message: "Too high discount cap" }),

  startDateTime: z
    .string({ required_error: "Start date/time is required" })
    .min(1, { message: "Start date/time cannot be empty" }),

  endDateTime: z
    .string({ required_error: "End date/time is required" })
    .min(1, { message: "End date/time cannot be empty" }),
}).refine((data) => new Date(data.startDateTime) < new Date(data.endDateTime), {
  message: "End date/time must be after start date/time",
  path: ["endDateTime"],
}); 
