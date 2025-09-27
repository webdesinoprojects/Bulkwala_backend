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