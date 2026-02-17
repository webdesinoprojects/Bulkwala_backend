import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    couponType: {
      type: String,
      enum: ["standard", "flashOffer"],
      default: "standard",
    },
    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      required: true,
    },
    discountValue: { type: Number, required: true },
    expiryDate: { type: Date, required: true },
    flashOfferExpiryTime: {
      type: String,
      default: null,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^\d{2}:\d{2}$/.test(v);
        },
        message: "Flash offer expiry time must be in HH:MM format",
      },
    },
    minOrderValue: { type: Number, default: 0 },
    usageLimit: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    usedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    totalSales: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Coupan = mongoose.model("Coupon", couponSchema);
export default Coupan;
