import { z } from "zod";

export const createProductSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .trim()
    .min(2, "Title must be at least 2 characters"),

  slug: z
    .string({ required_error: "Slug is required" })
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),

  description: z
    .string({ required_error: "Description is required" })
    .trim()
    .min(10, "Description must be at least 10 characters"),

  images: z
    .array(z.string().url("Invalid image URL"))
    .min(1, "At least one image is required"),

  videos: z.array(z.string().url("Invalid video URL")).optional(),

  price: z
    .number({ required_error: "Price is required" })
    .min(0, "Price must be greater than or equal to 0"),

  discountPrice: z.number().min(0, "Discount price must be >= 0").optional(),

  stock: z
    .number({ required_error: "Stock is required" })
    .min(0, "Stock must be greater than or equal to 0"),

  category: z
    .string({ required_error: "Category ID is required" })
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid category ObjectId"),

  subcategory: z
    .string({ required_error: "Subcategory ID is required" })
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid subcategory ObjectId"),

  tags: z.array(z.string().trim().toLowerCase()).optional(),

  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export const updateProductSchema = z.object({
  title: z.string().trim().min(2).optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().trim().min(10).optional(),
  images: z.array(z.string().url()).optional(),
  videos: z.array(z.string().url()).optional(),
  price: z.number().min(0).optional(),
  discountPrice: z.number().min(0).optional(),
  stock: z.number().min(0).optional(),
  category: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  subcategory: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  tags: z.array(z.string().trim().toLowerCase()).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export const filterProductSchema = z.object({
  category: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  subcategory: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  search: z.string().trim().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).optional(),
});
