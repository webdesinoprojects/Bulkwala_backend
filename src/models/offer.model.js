import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    isActive: { type: Boolean, default: false },
    discountPercent: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number, default: 0 },
    startedAt: { type: Date },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

const Offer = mongoose.model("Offer", offerSchema);
export default Offer;
