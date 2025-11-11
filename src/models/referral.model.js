import mongoose from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    influencer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    discountPercent: { type: Number, default: 10 },
    usageCount: { type: Number, default: 0 },
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    totalSales: { type: Number, default: 0 },
  },
  { timestamps: true }
);
const Referral = mongoose.model("Referral", referralSchema);
export default Referral;
