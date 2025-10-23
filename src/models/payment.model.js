import mongoose from "mongoose";
import {
  paymentStatusEnum,
  availablePaymentStatus,
} from "../utils/constant.js";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
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
    method: { type: String }, // e.g. card, upi, netbanking
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
