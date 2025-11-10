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
    paymentMode: { type: String, required: true },

    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, required: true },
    taxPrice: { type: Number, required: true },
    prepaidDiscount: { type: Number, default: 0 },

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
