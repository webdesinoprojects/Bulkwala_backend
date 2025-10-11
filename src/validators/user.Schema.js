import { z } from "zod";

export const createuserSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }),

  email: z
    .string()
    .trim()
    .email({ message: "Invalid email format" })
    .toLowerCase(),

  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),

  phone: z.number().optional(),

  role: z.string().trim().optional(),
});

export const updateuserSchema = z.object({
  name: z.string().trim().min(1).optional(),

  email: z
    .string()
    .trim()
    .email({ message: "Invalid email format" })
    .toLowerCase()
    .optional(),

  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" })
    .optional(),

  phone: z.number().optional(),

  role: z.string().trim().optional(),
});

export const loginuserSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Invalid email format" })
    .toLowerCase(),

  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
});

export const forgetPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters long"),
});

export const changePasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const sellerApplicationSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, { message: "Business name is required" }),

  gstNumber: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^[0-9A-Z]{15}$/.test(val), {
      message: "Invalid GST number format",
    }),

  pickupAddress: z
    .string()
    .trim()
    .min(5, { message: "Pickup address is required" }),

  bankName: z.string().trim().min(2, { message: "Bank name is required" }),

  accountNumber: z
    .string()
    .trim()
    .min(6, { message: "Account number is required" }),

  ifsc: z
    .string()
    .trim()
    .refine((val) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(val), {
      message: "Invalid IFSC code format",
    }),
});
