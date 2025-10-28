import mongoose from "mongoose";
import {
  paymentStatusEnum,
  availablePaymentStatus,
} from "../utils/constant.js";

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Order will be created later (only after successful payment)
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: availablePaymentStatus,
      default: paymentStatusEnum.PENDING,
    },
    paymentMode: { type: String, required: true }, // e.g. card, upi, netbanking

    // Store cart items before creating order
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
        priceAtPurchase: { type: Number, required: true },
      },
    ],

    // Temporarily store address before order creation
    shippingAddress: {
      name: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
  },

  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
