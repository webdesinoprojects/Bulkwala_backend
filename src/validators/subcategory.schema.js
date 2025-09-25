import { z } from "zod";

const createSubcategorySchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters"),

  slug: z
    .string({ required_error: "Slug is required" })
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),

  img_url: z
    .string({ required_error: "Image URL is required" })
    .url("Invalid image URL"),

  description: z.string().trim().optional(),

  category: z
    .string({ required_error: "Category ID is required" })
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid category ObjectId"),
});

const updateSubcategorySchema = z.object({
  name: z.string().trim().min(2).optional(),
  img_url: z.string().url().optional(),
  category: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  // slug: optional — depends if you allow slug change
});

const deleteSubcategorySchema = z.object({
  slug: z.string().min(2, "Slug is required"),
});


export {
  createSubcategorySchema,
  updateSubcategorySchema,
  deleteSubcategorySchema
}