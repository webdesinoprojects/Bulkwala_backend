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
