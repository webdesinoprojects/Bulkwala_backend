import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }),
  slug: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val === "" ? null : val)),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1).optional(),
  slug: z.string().trim().min(1).optional(),
});
