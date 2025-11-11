import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      required: true,
    },
    discountValue: { type: Number, required: true },
    expiryDate: { type: Date, required: true },
    minOrderValue: { type: Number, default: 0 },
    usageLimit: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
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
