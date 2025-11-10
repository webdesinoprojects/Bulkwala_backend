import { z } from "zod";
import {
  availablePaymentModes,
  availableOrderStatus,
  availablePaymentStatus,
} from "../utils/constant.js";

const shippingAddressSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  street: z.string().min(3, "Street is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().min(4, "Postal Code is required"),
  country: z.string().default("India"),
});

export const createOrderSchema = z
  .object({
    products: z
      .array(
        z.object({
          product: z.string().min(1, "Product ID is required"),
          quantity: z.number().min(1, "Quantity must be at least 1"),
        })
      )
      .nonempty("At least one product is required"),

    shippingAddress: shippingAddressSchema.optional(), // ✅ make optional

    paymentMode: z.enum([...availablePaymentModes]),
  })
  .refine(
    (data) => {
      if (data.paymentMode === "pickup") return true; // skip validation
      return !!data.shippingAddress; // must exist for others
    },
    {
      message: "Shipping address is required for delivery orders",
      path: ["shippingAddress"],
    }
  );

export const updateOrderStatusSchema = z.object({
  status: z.enum([...availableOrderStatus]),
});

export const updatePaymentStatusSchema = z.object({
  body: z.object({
    paymentStatus: z.enum([...availablePaymentStatus]),
  }),
});

export const verifyPaymentStatusSchema = z.object({
  razorpay_order_id: z.string().min(1, "Razorpay Order ID is required"),
  razorpay_payment_id: z.string().min(1, "Razorpay Payment ID is required"),
  razorpay_signature: z.string().min(1, "Razorpay Signature is required"),
});
