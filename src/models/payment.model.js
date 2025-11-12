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

    // Link to Order
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },

    // Razorpay fields
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    // Amount info
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },

    // Payment status
    status: {
      type: String,
      enum: availablePaymentStatus,
      default: paymentStatusEnum.PENDING,
    },

    paymentMode: { type: String, required: true },

    // Base pricing details
    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, required: true },

    // ✅ Discount fields (NEW)
    prepaidDiscount: { type: Number, default: 0 },
    couponDiscount: { type: Number, default: 0 },
    referralDiscount: { type: Number, default: 0 },
    flashDiscount: { type: Number, default: 0 },
    flashDiscountPercent: { type: Number, default: 0 },

    // Product info
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

    // Shipping info
    shippingAddress: {
      name: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: { type: String, default: "India" },
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
