import { z } from "zod";

const addToCartSchema = z.object({
  productId: z
    .string({ required_error: "Product ID is required" })
    .trim()
    .min(1, { message: "Product ID cannot be empty" }),
  quantity: z
    .number()
    .int()
    .min(1, { message: "Quantity must be at least 1" })
    .default(1),
});

const updateCartItemSchema = z.object({
  productId: z
    .string({ required_error: "Product ID is required" })
    .trim()
    .min(1),
  quantity: z.number().int().min(1, { message: "Quantity must be at least 1" }),
});

export { addToCartSchema, updateCartItemSchema };
