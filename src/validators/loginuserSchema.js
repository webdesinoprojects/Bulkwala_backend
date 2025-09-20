import { z } from "zod";

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
