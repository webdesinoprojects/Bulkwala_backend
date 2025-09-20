import { z } from "zod";

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
