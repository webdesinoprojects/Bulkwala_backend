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
    .min(1, "Password is required")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[\W_]/, "Password must contain at least one special character"),

  phone: z
    .string()
    .regex(/^[0-9]{10}$/, "Phone number must be 10 digits")
    .optional(),
});

export const updateuserSchema = z.object({
  name: z.string().trim().min(1).optional(),

  phone: z
    .string()
    .regex(/^[0-9]{10}$/, "Phone number must be 10 digits")
    .optional(),
});

export const singleAddressSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone must be 10 digits"),
  street: z.string().min(3, "Street is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().regex(/^[0-9]{6}$/, "Postal Code must be 6 digits"),
  country: z.string().optional().default("India"),
});

export const updateAddressSchema = z.object({
  address: singleAddressSchema,
  index: z.number().optional(),
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

export const sellerRegistrationSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }),

  email: z
    .string()
    .trim()
    .email({ message: "Invalid email format" })
    .toLowerCase(),

  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" })
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[\W_]/, "Password must contain at least one special character"),

  phone: z
    .string()
    .regex(/^[0-9]{10}$/, "Phone number must be 10 digits")
    .optional(),

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
