import { z } from "zod";

export const createProductSchema = z.object({
  title: z.string({ required_error: "Title is required" }).trim().min(2),

  slug: z
    .string()
    .trim()
    .toLowerCase()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),

  description: z
    .string({ required_error: "Description is required" })
    .trim()
    .min(5),
  images: z.any().transform((val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.map((f) => f.path || f);
    return [val.path || val];
  }),

  video: z.any().optional(), // 🆕 single video file

  price: z.union([z.string(), z.number()]).transform((val) => Number(val)),

  discountPrice: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .optional(),
  stock: z.union([z.string(), z.number()]).transform((val) => Number(val)),

  category: z
    .string({ required_error: "Category ID is required" })
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid category ObjectId"),

  subcategory: z
    .string({ required_error: "Subcategory ID is required" })
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid subcategory ObjectId"),

  tags: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (Array.isArray(val) ? val : val ? [val] : []))
    .optional(),
  isActive: z
    .union([z.string(), z.boolean()])
    .transform((val) => val === "true" || val === true),

  isFeatured: z
    .union([z.string(), z.boolean()])
    .transform((val) => val === "true" || val === true),

  sku: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),

  genericName: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),

  manufacturerName: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),

  color: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return [];
      if (Array.isArray(val)) {
        return val.filter((c) => c && c.trim() !== "");
      }
      return val.trim() === "" ? [] : [val.trim()];
    }),

  countryOfOrigin: z.enum(["India", "China"]).default("India"),
  gstSlab: z
    .union([z.string(), z.number()])
    .transform((val) => Number(String(val).replace("%", "")) || 0)
    .optional(),
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

  imagesToRemove: z
    .union([z.string().url(), z.array(z.string().url())])
    .optional()
    .transform((val) => (typeof val === "string" ? [val] : val || [])),

  existingImages: z
    .union([z.string().url(), z.array(z.string().url())])
    .optional()
    .transform((val) => (typeof val === "string" ? [val] : val || [])),

  discountPrice: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .optional(),
  price: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .optional(),
  stock: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .optional(),

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
  sku: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  countryOfOrigin: z.enum(["India", "China"]).optional(),
  genericName: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),

  manufacturerName: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),

  color: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return []; // no color provided
      if (Array.isArray(val)) {
        return val.filter((c) => c && c.trim() !== ""); // clean array
      }
      if (typeof val === "string") {
        return val.trim() === "" ? [] : [val.trim()];
      }
      return [];
    }),
  gstSlab: z
    .union([z.string(), z.number()])
    .transform((val) => Number(String(val).replace("%", "")) || 0)
    .optional(),
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
  sku: z.string().trim().optional(),
  color: z.string().trim().optional(),
  countryOfOrigin: z.enum(["India", "China"]).optional(),
});
