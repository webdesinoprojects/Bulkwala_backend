import { z } from "zod";

const createSubcategorySchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),

  description: z.string().trim().optional(),
  category: z
    .string()
    .min(1, "Category ID is required")
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid category ObjectId"),
});

const updateSubcategorySchema = z.object({
  name: z.string().trim().min(2).optional(),
  category: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
});



export {
  createSubcategorySchema,
  updateSubcategorySchema,

};
