import mongoose from "mongoose";
import {
  availablePaymentModes,
  availableOrderStatus,
  orderStatusEnum,
  availablePaymentStatus,
  paymentStatusEnum,
} from "../utils/constant.js";

const orderSchema = new mongoose.Schema(
  {
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
          min: 1,
        },
        priceAtPurchase: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    shippingAddress: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true, default: "India" },
    },

    paymentMode: {
      type: String,
      enum: availablePaymentModes,
      required: true,
    },

    transactionId: {
      type: String,
      default: null,
    },

    paymentStatus: {
      type: String,
      enum: availablePaymentStatus,
      default: paymentStatusEnum.PENDING,
    },

    itemsPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    taxPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: availableOrderStatus,
      default: orderStatusEnum.PENDING,
    },

    deliveredAt: {
      type: Date,
    },

    cancelledAt: {
      type: Date,
    },
  },
  { timestamps: true }
);


const Order = mongoose.model("Order", orderSchema);
export default Order;
