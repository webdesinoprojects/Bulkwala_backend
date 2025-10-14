import { z } from "zod";

const createQuerySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters long" })
    .max(100, { message: "Name too long" }),
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address" }),
  message: z
    .string()
    .trim()
    .min(5, { message: "Message must be at least 5 characters long" })
    .max(1000, { message: "Message too long" }),
});

const updateQueryStatusSchema = z.object({
  status: z
    .enum(["unread", "read", "resolved"], {
      required_error: "Status is required",
    })
    .optional(),
});

export { createQuerySchema, updateQueryStatusSchema };
